import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportWithPlayer } from "@/types/report";
import { extractReportDataForDisplay } from "@/utils/reportDataExtraction";

const safe = (s: string) => (s || "report").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);
const MARGIN = 40;

function proxied(url: string): string {
  const stripped = url.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&output=png`;
}

async function tryLoadDataUrl(src: string, useCrossOrigin: boolean) {
  const img = await loadImage(src, useCrossOrigin ? "anonymous" : undefined);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  return { dataUrl, width: canvas.width, height: canvas.height, format: "PNG" as const };
}

async function urlToDataUrl(url: string) {
  try { return await tryLoadDataUrl(url, true); } catch {}
  try { return await tryLoadDataUrl(proxied(url), true); } catch (e) {
    console.warn("Failed to load image for export", e);
    return null;
  }
}

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

async function addPlayerHeader(
  pdf: jsPDF,
  report: ReportWithPlayer,
  y: number,
  opts?: { subtitle?: string }
): Promise<number> {
  const pageW = pdf.internal.pageSize.getWidth();
  const player = report.player;
  const photoSize = 64;
  let textX = MARGIN;
  const photoUrl = (player as any)?.image || (player as any)?.photo || null;
  if (photoUrl) {
    const photo = await urlToDataUrl(photoUrl);
    if (photo) {
      try {
        pdf.addImage(photo.dataUrl, photo.format, MARGIN, y, photoSize, photoSize);
        textX = MARGIN + photoSize + 12;
      } catch (e) { console.warn("Could not embed player photo", e); }
    }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(player?.name || "Scouting Report", textX, y + 16);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const headerBits = [
    player?.club,
    player?.positions?.join(", "),
    player?.age ? `${player.age} yrs` : null,
  ].filter(Boolean).join("   •   ");
  const availTextW = pageW - textX - MARGIN;
  let cursorY = y + 32;
  if (headerBits) {
    const wrapped = pdf.splitTextToSize(headerBits, availTextW);
    pdf.text(wrapped, textX, cursorY);
    cursorY += wrapped.length * 12;
  }

  const meta = [
    opts?.subtitle,
    `Generated: ${new Date().toLocaleDateString()}`,
  ].filter(Boolean).join("   •   ");
  if (meta) {
    const wrappedMeta = pdf.splitTextToSize(meta, availTextW);
    pdf.text(wrappedMeta, textX, cursorY + 4);
    cursorY += 4 + wrappedMeta.length * 12;
  }
  pdf.setTextColor(0);
  return Math.max(y + photoSize, cursorY) + 12;
}

function addReportBody(
  pdf: jsPDF,
  report: ReportWithPlayer,
  template: any,
  y: number,
  opts?: { title?: string; templateName?: string }
): number {
  const pageW = pdf.internal.pageSize.getWidth();
  const templateName = opts?.templateName || template?.name || "Report";

  if (opts?.title) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(opts.title, MARGIN, y);
    y += 6;
    pdf.setDrawColor(58, 157, 92);
    pdf.setLineWidth(1);
    pdf.line(MARGIN, y, pageW - MARGIN, y);
    y += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    const sub = [
      templateName,
      report.scoutProfile ? `Scout: ${report.scoutProfile.first_name ?? ""} ${report.scoutProfile.last_name ?? ""}`.trim() : null,
      report.createdAt ? `Date: ${new Date(report.createdAt).toLocaleDateString()}` : null,
      `Status: ${report.status}`,
    ].filter(Boolean).join("   •   ");
    const wrappedSub = pdf.splitTextToSize(sub, pageW - MARGIN * 2);
    pdf.text(wrappedSub, MARGIN, y);
    y += wrappedSub.length * 11 + 6;
    pdf.setTextColor(0);
  }

  if (report.matchContext) {
    const mc = report.matchContext as any;
    const rows: [string, string][] = [];
    if (mc.isManual) {
      if (mc.homeTeam || mc.awayTeam) rows.push(["Match", `${mc.homeTeam ?? ""} vs ${mc.awayTeam ?? ""}`]);
      if (mc.date) rows.push(["Date", mc.date]);
      if (mc.competition && mc.competition !== "Unknown") rows.push(["Competition", mc.competition]);
    } else {
      if (mc.date) rows.push(["Date", mc.date]);
      if (mc.opposition) rows.push(["Opposition", mc.opposition]);
      if (mc.competition) rows.push(["Competition", mc.competition]);
      if (mc.minutesPlayed != null) rows.push(["Minutes", `${mc.minutesPlayed}'`]);
    }
    if (report.watchMethod) rows.push(["Watch Method", report.watchMethod]);
    if (rows.length) {
      autoTable(pdf, {
        startY: y,
        head: [["Match Context", ""]],
        body: rows,
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [58, 157, 92] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 120 } },
        margin: { left: MARGIN, right: MARGIN },
      });
      y = (pdf as any).lastAutoTable.finalY + 14;
    }
  }

  const sections = extractReportDataForDisplay(report, template);
  sections.forEach((section: any) => {
    const body = section.fields.map((f: any) => [
      f.label,
      f.value !== null && f.value !== undefined && f.value !== "" ? String(f.displayValue ?? f.value) : "—",
      f.notes ?? "",
    ]);
    if (!body.length) return;
    autoTable(pdf, {
      startY: y,
      head: [[section.title, "Value", "Notes"]],
      body,
      styles: { fontSize: 10, cellPadding: 5, valign: "top" },
      headStyles: { fillColor: [58, 157, 92] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 150 },
        1: { cellWidth: 120 },
      },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = (pdf as any).lastAutoTable.finalY + 12;
  });

  return y;
}

export async function exportReportPdf(
  report: ReportWithPlayer,
  template: any,
  opts?: { templateName?: string }
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const templateName = opts?.templateName || template?.name || "Report";
  const subtitle = [
    templateName,
    report.scoutProfile ? `Scout: ${report.scoutProfile.first_name ?? ""} ${report.scoutProfile.last_name ?? ""}`.trim() : null,
    `Status: ${report.status}`,
  ].filter(Boolean).join("   •   ");
  let y = await addPlayerHeader(pdf, report, MARGIN, { subtitle });
  addReportBody(pdf, report, template, y, { templateName });
  pdf.save(`${safe(report.player?.name || "report")}-report-${today()}.pdf`);
}

export async function exportPlayerReportsPdf(
  reports: ReportWithPlayer[],
  templatesById: Record<string, any>,
  opts?: { playerName?: string }
) {
  if (!reports.length) return;
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageH = pdf.internal.pageSize.getHeight();
  const sorted = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const first = sorted[0];
  const playerName = opts?.playerName || first.player?.name || "Player";

  let y = await addPlayerHeader(pdf, first, MARGIN, {
    subtitle: `${reports.length} report${reports.length === 1 ? "" : "s"}`,
  });

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const template = templatesById[r.templateId];
    const title = `Report ${i + 1} of ${sorted.length}`;
    // Ensure room for section title
    if (y > pageH - 120) {
      pdf.addPage();
      y = MARGIN;
    } else if (i > 0) {
      y += 6;
    }
    y = addReportBody(pdf, r, template, y, { title, templateName: template?.name });
  }

  pdf.save(`${safe(playerName)}-reports-${today()}.pdf`);
}
