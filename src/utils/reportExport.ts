import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportWithPlayer } from "@/types/report";
import { extractReportDataForDisplay } from "@/utils/reportDataExtraction";

const safe = (s: string) => (s || "report").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);

async function urlToDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number; format: "PNG" | "JPEG" } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
    });
    const format = blob.type.includes("png") ? "PNG" : "JPEG";
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight, format };
  } catch (e) {
    console.warn("Failed to load image for export", e);
    return null;
  }
}

async function captureVideoFrame(url: string): Promise<{ dataUrl: string; width: number; height: number; format: "PNG" } | null> {
  try {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject();
    });
    // Seek to 1s (or 10% in) for a representative frame
    const seekTo = Math.min(1, (video.duration || 2) * 0.1);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = seekTo;
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, format: "PNG" };
  } catch (e) {
    console.warn("Failed to capture video frame", e);
    return null;
  }
}

export async function exportReportPdf(
  report: ReportWithPlayer,
  template: any,
  opts?: { templateName?: string }
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const player = report.player;
  const templateName = opts?.templateName || template?.name || "Report";

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(player?.name || "Scouting Report", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const headerBits = [
    player?.club,
    player?.positions?.join(", "),
    player?.age ? `${player.age} yrs` : null,
  ].filter(Boolean).join("   •   ");
  if (headerBits) {
    pdf.text(headerBits, margin, y);
    y += 14;
  }

  const meta = [
    templateName,
    report.scoutProfile ? `Scout: ${report.scoutProfile.first_name ?? ""} ${report.scoutProfile.last_name ?? ""}`.trim() : null,
    `Generated: ${new Date().toLocaleDateString()}`,
    `Status: ${report.status}`,
  ].filter(Boolean).join("   •   ");
  pdf.text(meta, margin, y);
  y += 16;
  pdf.setTextColor(0);

  // Match context
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
        margin: { left: margin, right: margin },
      });
      y = (pdf as any).lastAutoTable.finalY + 14;
    }
  }

  // Sections
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
      margin: { left: margin, right: margin },
    });
    y = (pdf as any).lastAutoTable.finalY + 12;
  });


  pdf.save(`${safe(player?.name || "report")}-report-${today()}.pdf`);
}
