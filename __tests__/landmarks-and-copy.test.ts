import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("landing free-token copy", () => {
  it("states the real 50-token grant, not a nonexistent free-audit allowance", () => {
    const source = read("src/app/page.tsx");
    // 50 one-time tokens is less than one 60-token audit, so "free audits per
    // month" was false. Copy must reflect the token grant instead.
    expect(source).not.toMatch(/free audits? per month/i);
    expect(source).toContain("50 free tokens on sign-up");
  });
});

describe("single main landmark", () => {
  it("keeps the one <main> in the root layout", () => {
    expect(read("src/app/layout.tsx")).toContain('<main id="main-content">');
  });

  it.each([
    "src/app/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/report/page.tsx",
    "src/app/report/[id]/page.tsx",
  ])("does not nest a second <main> in %s", (path) => {
    expect(read(path)).not.toMatch(/<main[\s>]/);
  });
});

describe("AppNav navigation landmark and signed-out state", () => {
  it("wraps controls in a nav landmark and hides authed actions when signed out", () => {
    const source = read("src/components/AppNav.tsx");
    expect(source).toContain('<nav className="aiden-nav-actions"');
    // Signed-out visitors (public share links) see a Sign in link, never the
    // Sign out / Back to Hub / Apps chrome.
    expect(source).toContain("setSignedIn(false)");
    expect(source).toContain("signedIn === false");
    expect(source).toContain("signedIn === true");
  });
});
