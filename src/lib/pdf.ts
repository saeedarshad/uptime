import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "./prisma";
import { formatMoney, formatDate } from "./format";
import { formatWoNumber } from "./workorders";

const GRAPHITE = rgb(0.14, 0.17, 0.2);
const MUTED = rgb(0.45, 0.47, 0.5);
const LINE = rgb(0.85, 0.85, 0.83);
const SAFETY = rgb(0.882, 0.384, 0.184);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const BOTTOM = 60;

interface Ctx {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  orgName: string;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < BOTTOM) newPage(ctx);
}

function text(
  ctx: Ctx,
  s: string,
  x: number,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
): void {
  ctx.page.drawText(s, {
    x,
    y: ctx.y,
    size: opts.size ?? 10,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? GRAPHITE,
  });
}

function hr(ctx: Ctx): void {
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.75,
    color: LINE,
  });
}

function sectionTitle(ctx: Ctx, title: string): void {
  ensureSpace(ctx, 30);
  ctx.y -= 22;
  text(ctx, title.toUpperCase(), MARGIN, { size: 11, bold: true, color: SAFETY });
  ctx.y -= 6;
  hr(ctx);
  ctx.y -= 12;
}

/** Build the inspection-ready asset history PDF. Returns PDF bytes. */
export async function generateAssetHistoryPdf(
  orgId: string,
  assetId: string,
): Promise<Uint8Array> {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, orgId },
    include: { org: true },
  });
  if (!asset) throw new Error("Asset not found");

  const [workOrders, pmDone, documents] = await Promise.all([
    prisma.workOrder.findMany({
      where: { orgId, assetId },
      orderBy: { openedAt: "asc" },
    }),
    prisma.pMTask.findMany({
      where: { schedule: { assetId }, status: "done" },
      include: { schedule: { select: { taskName: true } } },
      orderBy: { completedAt: "asc" },
    }),
    prisma.assetDocument.findMany({
      where: { assetId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tz = asset.org.timezone;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = {
    doc,
    font,
    bold,
    page: doc.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN,
    orgName: asset.org.name,
  };

  // --- Header ---
  text(ctx, asset.org.name, MARGIN, { size: 16, bold: true });
  ctx.y -= 18;
  text(ctx, "Maintenance History Report", MARGIN, { size: 11, color: MUTED });
  ctx.y -= 24;
  text(ctx, asset.name, MARGIN, { size: 20, bold: true });
  ctx.y -= 16;
  const gen = formatDate(new Date(), tz);
  text(ctx, `Generated ${gen}`, MARGIN, { size: 9, color: MUTED });
  ctx.y -= 12;
  hr(ctx);

  // --- Asset details ---
  sectionTitle(ctx, "Asset details");
  const details: [string, string][] = [
    ["Category", asset.category ?? "—"],
    ["Location", asset.location ?? "—"],
    ["Status", asset.status],
    [
      "Purchase cost",
      asset.purchaseCostCents ? formatMoney(asset.purchaseCostCents) : "—",
    ],
    [
      "Purchase date",
      asset.purchaseDate ? formatDate(asset.purchaseDate, tz) : "—",
    ],
    ["Compliance-tracked", asset.isComplianceTracked ? "Yes" : "No"],
  ];
  for (const [label, value] of details) {
    ensureSpace(ctx, 16);
    text(ctx, label, MARGIN, { size: 10, color: MUTED });
    text(ctx, value, MARGIN + 130, { size: 10 });
    ctx.y -= 15;
  }

  // --- Work orders table ---
  sectionTitle(ctx, "Work orders");
  const woCols = { date: MARGIN, issue: MARGIN + 70, by: MARGIN + 250, parts: MARGIN + 350, labor: MARGIN + 420, down: MARGIN + 490 };
  const drawWoHeader = () => {
    text(ctx, "Date", woCols.date, { size: 8, bold: true, color: MUTED });
    text(ctx, "Issue", woCols.issue, { size: 8, bold: true, color: MUTED });
    text(ctx, "By", woCols.by, { size: 8, bold: true, color: MUTED });
    text(ctx, "Parts", woCols.parts, { size: 8, bold: true, color: MUTED });
    text(ctx, "Labor", woCols.labor, { size: 8, bold: true, color: MUTED });
    text(ctx, "Down", woCols.down, { size: 8, bold: true, color: MUTED });
    ctx.y -= 4;
    hr(ctx);
    ctx.y -= 12;
  };
  if (workOrders.length === 0) {
    text(ctx, "No work orders on record.", MARGIN, { size: 10, color: MUTED });
    ctx.y -= 14;
  } else {
    drawWoHeader();
    let totalParts = 0;
    let totalLabor = 0;
    let totalDown = 0;
    for (const wo of workOrders) {
      ensureSpace(ctx, 16);
      if (ctx.y === PAGE_H - MARGIN) drawWoHeader();
      totalParts += wo.partsCostCents;
      totalLabor += wo.laborCostCents;
      totalDown += Number(wo.downtimeHours);
      text(ctx, formatDate(wo.openedAt, tz), woCols.date, { size: 8 });
      text(ctx, truncate(`${formatWoNumber(wo.number)} ${wo.title}`, 34), woCols.issue, { size: 8 });
      text(ctx, truncate(wo.reportedByName, 16), woCols.by, { size: 8 });
      text(ctx, formatMoney(wo.partsCostCents), woCols.parts, { size: 8 });
      text(ctx, formatMoney(wo.laborCostCents), woCols.labor, { size: 8 });
      text(ctx, `${Number(wo.downtimeHours)}h`, woCols.down, { size: 8 });
      ctx.y -= 14;
    }
    ctx.y -= 2;
    hr(ctx);
    ctx.y -= 12;
    text(ctx, "Totals", woCols.issue, { size: 8, bold: true });
    text(ctx, formatMoney(totalParts), woCols.parts, { size: 8, bold: true });
    text(ctx, formatMoney(totalLabor), woCols.labor, { size: 8, bold: true });
    text(ctx, `${totalDown}h`, woCols.down, { size: 8, bold: true });
    ctx.y -= 14;
  }

  // --- PM completions ---
  sectionTitle(ctx, "Preventive maintenance completed");
  if (pmDone.length === 0) {
    text(ctx, "No completed PM tasks on record.", MARGIN, { size: 10, color: MUTED });
    ctx.y -= 14;
  } else {
    for (const pm of pmDone) {
      ensureSpace(ctx, 16);
      const when = pm.completedAt ? formatDate(pm.completedAt, tz) : "—";
      text(ctx, when, MARGIN, { size: 8 });
      text(ctx, truncate(pm.schedule.taskName, 40), MARGIN + 70, { size: 8 });
      text(ctx, truncate(pm.completedByName ?? "—", 20), MARGIN + 320, { size: 8 });
      ctx.y -= 14;
    }
  }

  // --- Documents ---
  sectionTitle(ctx, "Documents");
  if (documents.length === 0) {
    text(ctx, "No documents on file.", MARGIN, { size: 10, color: MUTED });
    ctx.y -= 14;
  } else {
    for (const d of documents) {
      ensureSpace(ctx, 16);
      text(ctx, truncate(d.title, 44), MARGIN, { size: 8 });
      text(ctx, d.kind, MARGIN + 300, { size: 8, color: MUTED });
      text(
        ctx,
        d.expiresAt ? `expires ${formatDate(d.expiresAt, tz)}` : "no expiry",
        MARGIN + 400,
        { size: 8, color: MUTED },
      );
      ctx.y -= 14;
    }
  }

  // --- Footer on every page ---
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `${asset.org.name} · ${asset.name} · page ${i + 1} of ${pages.length}`,
      { x: MARGIN, y: 30, size: 8, font, color: MUTED },
    );
  });

  return doc.save();
}
