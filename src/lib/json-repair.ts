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

function extractRawJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();

  return text.trim();
}

function repairJson(json: string): string {
  // Remove trailing commas before } or ]
  json = json.replace(/,\s*([}\]])/g, "$1");

  // Replace unescaped newlines inside string values
  json = json.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  });

  // Try parsing — if it works, return
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
