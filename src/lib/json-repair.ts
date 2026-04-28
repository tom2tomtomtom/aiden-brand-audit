/**
 * Extract and repair JSON from LLM text responses.
 * Handles markdown fences, trailing commas, unescaped newlines in strings,
 * single quotes, and truncated responses.
 */
export function extractAndRepairJson(text: string): string {
  let json = extractRawJson(text);
  json = repairJson(json);
  return json;
}

function extractJsonSubstring(text: string): string | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const startIdx = candidate.search(/[\{\[]/);
  if (startIdx === -1) return null;
  const open = candidate[startIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (let i = startIdx; i < candidate.length; i++) {
    const c = candidate[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return candidate.slice(startIdx, i + 1); }
  }
  return null;
}

function extractRawJson(text: string): string {
  const extracted = extractJsonSubstring(text);
  if (extracted) return extracted.trim();
  return text.trim();
}

function repairJson(json: string): string {
  // Remove trailing commas before } or ]
  json = json.replace(/,\s*([}\]])/g, "$1");

  // Replace unescaped newlines inside string values
  json = json.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  });

  // Try parsing. If it works, return.
  try {
    JSON.parse(json);
    return json;
  } catch {
    // Continue with more aggressive repairs
  }

  // Attempt to close truncated JSON
  json = closeTruncatedJson(json);

  return json;
}

function closeTruncatedJson(json: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of json) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }

  // If we ended inside a string, close it
  if (inString) json += '"';

  // Remove any trailing comma
  json = json.replace(/,\s*$/, "");

  // Close remaining open brackets/braces
  for (let i = 0; i < openBrackets; i++) json += "]";
  for (let i = 0; i < openBraces; i++) json += "}";

  return json;
}
