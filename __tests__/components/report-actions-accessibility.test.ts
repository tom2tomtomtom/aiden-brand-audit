import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("report actions accessibility", () => {
  it.each([
    "src/app/report/page.tsx",
    "src/app/report/[id]/page.tsx",
  ])("keeps icon-only mobile actions named in %s", (path) => {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");

    expect(source).toContain('aria-label="Back to Brand Audit"');
    expect(source).not.toContain('aria-label="Back to dashboard"');
    expect(source).toContain('aria-label="Copy share link"');
  });

  it("keeps the mobile PDF action named while idle and busy", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/report/ExportPdfButton.tsx"),
      "utf8",
    );

    expect(source).toContain('aria-label={exporting ? "Generating PDF" : "Export PDF"}');
  });
});
