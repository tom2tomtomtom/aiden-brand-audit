import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Guard against SSRF via user-supplied URLs.
 *
 * The primary attack surface in this app is the brand `website` field
 * which gets fetched server-side to scrape OG images / favicons / meta.
 * Without validation an attacker can point it at:
 *   - loopback (127.0.0.0/8, ::1) → hit other services on the box
 *   - link-local (169.254.0.0/16, fe80::/10) → cloud metadata
 *     (AWS/GCP both use 169.254.169.254)
 *   - RFC1918 private (10/8, 172.16/12, 192.168/16) → internal admin
 *   - non-http(s) schemes → file://, gopher://, etc.
 *
 * We also resolve DNS ourselves and reject if ANY A/AAAA record lands
 * in a blocked range. This defeats attacker-controlled DNS that
 * resolves `example.com` → `127.0.0.1` (DNS rebinding class).
 *
 * `fetch()` callers must additionally pass `redirect: 'manual'` and
 * re-validate each hop, since a permitted host can 302 to a blocked
 * one. See `safeFetchHtml` below for the full pattern.
 */
export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ["10.0.0.0", 8],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["100.64.0.0", 10],
  ["0.0.0.0", 8],
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return -1;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isBlockedV4(ip: string): boolean {
  const addr = ipv4ToInt(ip);
  if (addr < 0) return true;
  for (const [base, bits] of BLOCKED_V4_RANGES) {
    const baseInt = ipv4ToInt(base);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if ((addr & mask) === (baseInt & mask)) return true;
  }
  return false;
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::" || lower === "::0") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice("::ffff:".length);
    if (net.isIPv4(v4)) return isBlockedV4(v4);
  }
  return false;
}

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedV4(ip);
  if (net.isIPv6(ip)) return isBlockedV6(ip);
  return true;
}

/**
 * Validate a URL string for outbound fetch. Throws BlockedUrlError
 * if the URL should not be requested.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    throw new BlockedUrlError("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError(`Blocked scheme: ${url.protocol}`);
  }

  const host = url.hostname;
  if (!host) throw new BlockedUrlError("Missing host");

  // If hostname is already an IP literal, reject straight away on hit.
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new BlockedUrlError(`Blocked IP: ${host}`);
    return url;
  }

  // Resolve both A and AAAA; reject on first blocked hit.
  const [v4, v6] = await Promise.all([
    dns.resolve4(host).catch(() => [] as string[]),
    dns.resolve6(host).catch(() => [] as string[]),
  ]);

  if (v4.length === 0 && v6.length === 0) {
    throw new BlockedUrlError(`Host does not resolve: ${host}`);
  }

  for (const ip of [...v4, ...v6]) {
    if (isBlockedIp(ip)) {
      throw new BlockedUrlError(`Host resolves to blocked IP: ${host} -> ${ip}`);
    }
  }

  return url;
}

/**
 * Fetch a URL with SSRF guards. Handles redirects manually so each hop
 * is validated against the public-address policy, and caps total bytes
 * read to prevent slow-drip DoS.
 */
export async function safeFetchHtml(
  raw: string,
  {
    timeoutMs = 8000,
    maxBytes = 2 * 1024 * 1024,
    maxRedirects = 3,
    userAgent = "BrandAuditBot/1.0 (+https://brandaudit.aiden.services)",
  }: {
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    userAgent?: string;
  } = {},
): Promise<{ url: string; text: string } | null> {
  let current = raw;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertPublicUrl(current).catch(() => null);
    if (!url) return null;

    const res = await fetch(url.href, {
      redirect: "manual",
      headers: { "User-Agent": userAgent, Accept: "text/html,*/*;q=0.1" },
      signal: AbortSignal.timeout(timeoutMs),
    }).catch(() => null);

    if (!res) return null;

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      current = new URL(loc, url.href).href;
      continue;
    }

    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return { url: url.href, text: "" };

    const decoder = new TextDecoder();
    let read = 0;
    let text = "";
    while (read < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      text += decoder.decode(value, { stream: !done });
      if (read >= maxBytes) break;
    }
    await reader.cancel().catch(() => undefined);
    return { url: url.href, text };
  }

  return null;
}
