import {
  PDFDocument,
  type Color,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  concatTransformationMatrix,
  grayscale,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} from "pdf-lib";
import qrcode from "qr.js";

import { normalizeHexColor } from "@/lib/colors";
import { type PrintLayout, type ShareDestination } from "@/lib/share-kit";

const POINTS_PER_INCH = 72;
const LETTER_WIDTH = 8.5 * POINTS_PER_INCH;
const LETTER_HEIGHT = 11 * POINTS_PER_INCH;

type InsertPlacement = {
  height: number;
  rotate: boolean;
  width: number;
  x: number;
  y: number;
};

export type SharePrintPdfLayout = {
  insertHeight: number;
  insertWidth: number;
  layout: PrintLayout;
  pageHeight: number;
  pageWidth: number;
  placements: InsertPlacement[];
  qrSize: number;
};

type PdfFonts = {
  bold: PDFFont;
  regular: PDFFont;
};

export function getSharePrintPdfLayout(layout: PrintLayout): SharePrintPdfLayout {
  switch (layout) {
    case "half-letter":
      return {
        insertHeight: 8.5 * POINTS_PER_INCH,
        insertWidth: 5.5 * POINTS_PER_INCH,
        layout,
        pageHeight: LETTER_HEIGHT,
        pageWidth: LETTER_WIDTH,
        placements: [
          {
            height: 5.5 * POINTS_PER_INCH,
            rotate: true,
            width: LETTER_WIDTH,
            x: 0,
            y: 5.5 * POINTS_PER_INCH,
          },
          {
            height: 5.5 * POINTS_PER_INCH,
            rotate: true,
            width: LETTER_WIDTH,
            x: 0,
            y: 0,
          },
        ],
        qrSize: 212,
      };
    case "photo-4x6": {
      const width = 4 * POINTS_PER_INCH;
      const height = 6 * POINTS_PER_INCH;
      const gap = 0.18 * POINTS_PER_INCH;
      const startX = (LETTER_WIDTH - width * 2 - gap) / 2;
      const y = (LETTER_HEIGHT - height) / 2;

      return {
        insertHeight: height,
        insertWidth: width,
        layout,
        pageHeight: LETTER_HEIGHT,
        pageWidth: LETTER_WIDTH,
        placements: [
          { height, rotate: false, width, x: startX, y },
          { height, rotate: false, width, x: startX + width + gap, y },
        ],
        qrSize: 168,
      };
    }
    case "letter":
      return {
        insertHeight: LETTER_HEIGHT,
        insertWidth: LETTER_WIDTH,
        layout,
        pageHeight: LETTER_HEIGHT,
        pageWidth: LETTER_WIDTH,
        placements: [{ height: LETTER_HEIGHT, rotate: false, width: LETTER_WIDTH, x: 0, y: 0 }],
        qrSize: 270,
      };
  }
}

export async function createSharePrintPdf({
  accentColor,
  destination,
  layout,
  venueName,
}: {
  accentColor: string;
  destination: ShareDestination;
  layout: PrintLayout;
  venueName: string;
}) {
  const pdf = await PDFDocument.create();
  const pageLayout = getSharePrintPdfLayout(layout);
  const page = pdf.addPage([pageLayout.pageWidth, pageLayout.pageHeight]);
  const fonts = {
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    regular: await pdf.embedFont(StandardFonts.Helvetica),
  };
  const accent = toPdfColor(accentColor);

  page.drawRectangle({
    color: rgb(1, 1, 1),
    height: pageLayout.pageHeight,
    width: pageLayout.pageWidth,
    x: 0,
    y: 0,
  });

  drawCutGuides(page, pageLayout);

  for (const placement of pageLayout.placements) {
    drawInsert(page, {
      accent,
      destination,
      fonts,
      layout: pageLayout,
      placement,
      venueName,
    });
  }

  return pdf.save();
}

function drawCutGuides(page: PDFPage, layout: SharePrintPdfLayout) {
  if (layout.layout === "letter") {
    return;
  }

  const guideColor = grayscale(0.72);

  for (const placement of layout.placements) {
    page.drawRectangle({
      borderColor: guideColor,
      borderDashArray: [4, 4],
      borderWidth: 0.6,
      height: placement.height,
      width: placement.width,
      x: placement.x,
      y: placement.y,
    });
  }

  if (layout.layout === "half-letter") {
    page.drawLine({
      color: guideColor,
      dashArray: [4, 4],
      end: { x: LETTER_WIDTH, y: LETTER_HEIGHT / 2 },
      start: { x: 0, y: LETTER_HEIGHT / 2 },
      thickness: 0.7,
    });
  }
}

function drawInsert(
  page: PDFPage,
  {
    accent,
    destination,
    fonts,
    layout,
    placement,
    venueName,
  }: {
    accent: Color;
    destination: ShareDestination;
    fonts: PdfFonts;
    layout: SharePrintPdfLayout;
    placement: InsertPlacement;
    venueName: string;
  },
) {
  page.pushOperators(pushGraphicsState(), ...getInsertTransform(placement));

  const width = layout.insertWidth;
  const height = layout.insertHeight;
  const compact = layout.layout === "photo-4x6";
  const titleSize = compact ? 20 : layout.layout === "half-letter" ? 28 : 36;
  const venueSize = compact ? 9 : 12;
  const calloutSize = compact ? 12 : 15;
  const urlSize = compact ? 6.5 : layout.layout === "half-letter" ? 8.5 : 9.5;
  const footerSize = compact ? 7 : 9;
  const topY = height - (compact ? 42 : 62);
  const title = fitText(destination.label, fonts.bold, titleSize, width - 52);
  const venue = fitText(venueName.toUpperCase(), fonts.bold, venueSize, width - 42);
  const callout = fitText(getPrintCallout(destination.kind), fonts.regular, calloutSize, width - 42);
  const qrY = compact ? 114 : layout.layout === "half-letter" ? 158 : 228;
  const urlY = qrY - (compact ? 20 : 26);

  drawCenteredText(page, venue, fonts.bold, {
    color: accent,
    size: venueSize,
    width,
    y: topY,
  });
  drawCenteredText(page, title, fonts.bold, {
    color: rgb(0.09, 0.07, 0.05),
    size: titleSize,
    width,
    y: topY - (compact ? 32 : 48),
  });
  drawCenteredText(page, callout, fonts.regular, {
    color: rgb(0.37, 0.33, 0.3),
    size: calloutSize,
    width,
    y: topY - (compact ? 54 : 74),
  });

  drawQrCode(page, destination.url, {
    size: layout.qrSize,
    x: (width - layout.qrSize) / 2,
    y: qrY,
  });

  drawCenteredText(page, fitText(destination.url, fonts.regular, urlSize, width - 32), fonts.regular, {
    color: rgb(0.37, 0.33, 0.3),
    size: urlSize,
    width,
    y: urlY,
  });
  drawCenteredText(page, "Powered by TaproomOS", fonts.bold, {
    color: grayscale(0.56),
    size: footerSize,
    width,
    y: compact ? 34 : 48,
  });

  page.pushOperators(popGraphicsState());
}

function getInsertTransform(placement: InsertPlacement) {
  if (placement.rotate) {
    return [concatTransformationMatrix(0, 1, -1, 0, placement.x + placement.width, placement.y)];
  }

  return [concatTransformationMatrix(1, 0, 0, 1, placement.x, placement.y)];
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  {
    color,
    size,
    width,
    y,
  }: {
    color: Color;
    size: number;
    width: number;
    y: number;
  },
) {
  const safeText = toPdfText(text);
  const textWidth = font.widthOfTextAtSize(safeText, size);
  page.drawText(safeText, {
    color,
    font,
    size,
    x: Math.max(0, (width - textWidth) / 2),
    y,
  });
}

function drawQrCode(
  page: PDFPage,
  value: string,
  {
    size,
    x,
    y,
  }: {
    size: number;
    x: number;
    y: number;
  },
) {
  const quietZoneModules = 4;
  const code = qrcode(value, { errorCorrectLevel: qrcode.ErrorCorrectLevel.Q });
  const moduleCount = code.getModuleCount();
  const totalModules = moduleCount + quietZoneModules * 2;
  const moduleSize = size / totalModules;

  page.drawRectangle({
    color: rgb(1, 1, 1),
    height: size,
    width: size,
    x,
    y,
  });
  page.drawRectangle({
    borderColor: rgb(0.91, 0.87, 0.82),
    borderWidth: 0.8,
    height: size,
    width: size,
    x,
    y,
  });

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (code.isDark(row, col)) {
        page.drawRectangle({
          color: rgb(0, 0, 0),
          height: moduleSize,
          width: moduleSize,
          x: x + (col + quietZoneModules) * moduleSize,
          y: y + size - (row + quietZoneModules + 1) * moduleSize,
        });
      }
    }
  }
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const safeText = toPdfText(text);

  if (font.widthOfTextAtSize(safeText, size) <= maxWidth) {
    return safeText;
  }

  const ellipsis = "...";
  let trimmed = safeText;

  while (trimmed.length > 0 && font.widthOfTextAtSize(`${trimmed}${ellipsis}`, size) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return `${trimmed.trimEnd()}${ellipsis}`;
}

function toPdfColor(value: string) {
  const normalized = normalizeHexColor(value) ?? "#C96B2C";

  return rgb(
    Number.parseInt(normalized.slice(1, 3), 16) / 255,
    Number.parseInt(normalized.slice(3, 5), 16) / 255,
    Number.parseInt(normalized.slice(5, 7), 16) / 255,
  );
}

function toPdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "?");
}

function getPrintCallout(kind: ShareDestination["kind"]) {
  switch (kind) {
    case "events":
      return "Scan for upcoming events.";
    case "event":
      return "Scan for event details and RSVP.";
    case "follow":
      return "Scan for taproom updates.";
    case "memberships":
      return "Scan to join the club.";
    case "menu":
      return "Scan for today's menu.";
  }
}
