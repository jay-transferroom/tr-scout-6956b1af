import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Player } from "@/types/player";
import type { PositionPlayerSlot } from "@/hooks/useMultiPlayerPositions";
import { getClubRating } from "@/utils/clubRating";

interface ExportContext {
  formation: string;
  clubName: string;
  coachName?: string | null;
  slots: PositionPlayerSlot[];
  players: Player[];
  clubWeights?: any;
  playerReportRatings?: Map<string, { rating: number | string; raw: any }>;
}

const today = () => new Date().toISOString().slice(0, 10);
const safe = (s: string) => s.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();

const exportFilter = (n: HTMLElement) =>
  !(n instanceof HTMLElement && n.dataset && n.dataset.exportHidden === "true");

export async function exportDepthPng(node: HTMLElement, ctx: ExportContext) {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#3A9D5C", filter: exportFilter });
  const link = document.createElement("a");
  link.download = `${safe(ctx.clubName)}-depth-${safe(ctx.formation)}-${today()}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportDepthPdf(node: HTMLElement, ctx: ExportContext) {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#3A9D5C", filter: exportFilter });


  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 32;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`${ctx.clubName} — Depth Chart`, margin, margin);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const sub = [
    `Formation: ${ctx.formation}`,
    ctx.coachName ? `Coach: ${ctx.coachName}` : null,
    `Generated: ${new Date().toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join("   •   ");
  pdf.text(sub, margin, margin + 16);
  pdf.setTextColor(0);

  // Pitch snapshot — fit into available width, preserve aspect
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((res) => {
    img.onload = () => res();
  });

  const availW = pageW - margin * 2;
  const availH = pageH - margin - 60;
  const ratio = img.width / img.height;
  let drawW = availW;
  let drawH = drawW / ratio;
  if (drawH > availH) {
    drawH = availH;
    drawW = drawH * ratio;
  }
  pdf.addImage(dataUrl, "PNG", margin + (availW - drawW) / 2, margin + 36, drawW, drawH);

  // Depth tables — one section per position
  const findPlayer = (id: string) => ctx.players.find((p) => p.id === id);
  const ratingFor = (p: Player) => {
    const r = ctx.playerReportRatings?.get(p.id)?.rating;
    if (r !== undefined && r !== null) return String(r);
    const cr = getClubRating(p, ctx.clubWeights) ?? p.xtvScore;
    return cr != null ? String(cr) : "-";
  };

  ctx.slots.forEach((slot, idx) => {
    pdf.addPage();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(`${slot.position} — Depth (${idx + 1}/${ctx.slots.length})`, margin, margin);

    const ordered = [slot.activePlayerId, ...slot.alternatePlayerIds]
      .map(findPlayer)
      .filter((p): p is Player => !!p);

    autoTable(pdf, {
      startY: margin + 12,
      head: [["#", "Player", "Age", "Club", "Rating", "Contract"]],
      body: ordered.map((p, i) => [
        i === 0 ? "1 (starter)" : String(i + 1),
        p.name,
        p.age ?? "-",
        p.club ?? "-",
        ratingFor(p),
        p.contractExpiry ?? "-",
      ]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [58, 157, 92] },
      alternateRowStyles: { fillColor: [245, 247, 245] },
      margin: { left: margin, right: margin },
    });
  });

  pdf.save(`${safe(ctx.clubName)}-depth-${safe(ctx.formation)}-${today()}.pdf`);
}
