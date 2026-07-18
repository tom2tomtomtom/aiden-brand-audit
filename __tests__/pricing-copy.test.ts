import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Brand Audit pricing copy", () => {
  it("matches the live 50-token AIDEN welcome grant", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/pricing/page.tsx"),
      "utf8",
    );

    expect(source).toContain("const FREE_TOKEN_GRANT = 50;");
    expect(source).not.toMatch(/FREE_TOKEN_GRANT\s*=\s*200/);
    expect(source).toContain("welcome credit toward your first audit");
    expect(source).not.toContain("Math.floor(FREE_TOKEN_GRANT");
  });
});
