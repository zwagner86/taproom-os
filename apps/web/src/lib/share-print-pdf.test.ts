import { describe, expect, it } from "vitest";

import { resolvePrintLayout } from "./share-kit";
import { getSharePrintPdfLayout } from "./share-print-pdf";

describe("share print PDF layouts", () => {
  it("uses letter paper for every PDF layout", () => {
    for (const layout of ["letter", "half-letter", "photo-4x6"] as const) {
      const metadata = getSharePrintPdfLayout(layout);

      expect(metadata.pageWidth).toBe(612);
      expect(metadata.pageHeight).toBe(792);
    }
  });

  it("describes the full letter insert", () => {
    const metadata = getSharePrintPdfLayout("letter");

    expect(metadata.insertWidth).toBe(612);
    expect(metadata.insertHeight).toBe(792);
    expect(metadata.placements).toEqual([{ height: 792, rotate: false, width: 612, x: 0, y: 0 }]);
  });

  it("describes two half-letter slots with rotated inserts", () => {
    const metadata = getSharePrintPdfLayout("half-letter");

    expect(metadata.insertWidth).toBe(396);
    expect(metadata.insertHeight).toBe(612);
    expect(metadata.placements).toEqual([
      { height: 396, rotate: true, width: 612, x: 0, y: 396 },
      { height: 396, rotate: true, width: 612, x: 0, y: 0 },
    ]);
  });

  it("describes two centered 4 x 6 inserts", () => {
    const metadata = getSharePrintPdfLayout("photo-4x6");

    expect(metadata.insertWidth).toBe(288);
    expect(metadata.insertHeight).toBe(432);
    expect(metadata.placements).toHaveLength(2);
    expect(metadata.placements.every((placement) => placement.rotate === false)).toBe(true);
    expect(metadata.placements.every((placement) => placement.width === 288 && placement.height === 432)).toBe(true);
  });

  it("keeps legacy layouts on the letter PDF", () => {
    expect(getSharePrintPdfLayout(resolvePrintLayout("poster")).layout).toBe("letter");
    expect(getSharePrintPdfLayout(resolvePrintLayout("tent")).layout).toBe("letter");
  });
});
