import { format } from "date-fns";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubBadge } from "@/components/ui/club-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import VerdictBadge from "@/components/VerdictBadge";
import { ReportWithPlayer } from "@/types/report";
import {
  getOverallRating,
  getRecommendation,
} from "@/utils/reportDataExtraction";

interface ReportDetailSheetProps {
  report: ReportWithPlayer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditReport?: (reportId: string) => void;
}

const parseSections = (sections: any): any[] => {
  if (typeof sections === "string") {
    try {
      return JSON.parse(sections);
    } catch {
      return [];
    }
  }
  return Array.isArray(sections) ? sections : [];
};

const findField = (
  report: ReportWithPlayer,
  keywords: string[]
): { value: any; notes?: string } | null => {
  const sections = parseSections(report.sections);
  for (const section of sections) {
    if (!Array.isArray(section.fields)) continue;
    for (const f of section.fields) {
      const id = String(f.fieldId || "").toLowerCase();
      if (
        keywords.some((k) => id.includes(k)) &&
        f.value !== null &&
        f.value !== undefined &&
        f.value !== ""
      ) {
        return { value: f.value, notes: f.notes };
      }
    }
  }
  return null;
};

const collectNotes = (report: ReportWithPlayer): string => {
  const sections = parseSections(report.sections);
  const parts: string[] = [];
  for (const section of sections) {
    if (!Array.isArray(section.fields)) continue;
    for (const f of section.fields) {
      const id = String(f.fieldId || "").toLowerCase();
      if (
        (id.includes("note") || id.includes("comment") || id.includes("summary")) &&
        typeof f.value === "string" &&
        f.value.trim()
      ) {
        parts.push(f.value.trim());
      } else if (f.notes && typeof f.notes === "string" && f.notes.trim()) {
        parts.push(f.notes.trim());
      }
    }
  }
  return parts.join("\n\n");
};

const LabelledValue = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

const ReportDetailSheet = ({
  report,
  open,
  onOpenChange,
  onEditReport,
}: ReportDetailSheetProps) => {
  if (!report) return null;

  const player = report.player;
  const isCustomPlayer =
    typeof report.playerId === "string" && report.playerId.startsWith("custom-");

  const overall = getOverallRating(report);
  const verdict = getRecommendation(report);
  const potential = findField(report, ["potential"]);
  const positionPlayed = findField(report, ["position"]);
  const leadership = findField(report, ["leadership"]);
  const notes = collectNotes(report);

  const ctx: any = report.matchContext;
  const fixtureName = ctx
    ? ctx.isManual && ctx.homeTeam && ctx.awayTeam
      ? `${ctx.homeTeam} vs ${ctx.awayTeam}`
      : ctx.opposition
      ? `vs ${ctx.opposition}`
      : null
    : null;
  const fixtureDate = ctx?.date ? new Date(ctx.date) : null;
  const stadium = ctx?.stadium || ctx?.venue || null;

  const scoutName = report.scoutProfile
    ? `${report.scoutProfile.first_name ?? ""} ${
        report.scoutProfile.last_name ?? ""
      }`.trim() || "Scout"
    : "Scout";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {player?.name || "Unknown player"}
              </h2>
              {isCustomPlayer && (
                <Badge
                  variant="outline"
                  className="border-info/30 bg-info/10 text-info text-[10px] px-1.5 py-0 h-4 font-medium"
                >
                  Custom
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {player?.club && !isCustomPlayer && (
                <div className="flex items-center gap-1.5">
                  <ClubBadge clubName={player.club} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {player.club}
                  </span>
                </div>
              )}
              {player?.positions?.map((p, i) => (
                <Badge key={i} variant="neutral" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Match section */}
          {(fixtureName || fixtureDate || stadium) && (
            <section>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                Match
              </h3>
              <div className="space-y-2 text-sm">
                {fixtureName && (
                  <div className="font-medium text-foreground">{fixtureName}</div>
                )}
                <div className="text-muted-foreground text-xs space-y-0.5">
                  {fixtureDate && (
                    <div>{format(fixtureDate, "EEE d MMM yyyy")}</div>
                  )}
                  {stadium && <div>{stadium}</div>}
                  {ctx?.competition && ctx.competition !== "Unknown" && (
                    <div>{ctx.competition}</div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Scout */}
          <section>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Scout
            </h3>
            <div className="flex items-center gap-2">
              <PlayerAvatar playerName={scoutName} size="sm" />
              <span className="text-sm font-medium">{scoutName}</span>
            </div>
          </section>

          {/* Ratings */}
          <section>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Ratings
            </h3>
            <div className="rounded-md border bg-muted/30 p-4 space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Overall rating
                </span>
                <div className="text-3xl font-bold text-foreground mt-1">
                  {overall !== null && overall !== undefined ? overall : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <LabelledValue
                  label="Potential"
                  value={potential?.value ?? "—"}
                />
                <LabelledValue
                  label="Position"
                  value={positionPlayed?.value ?? "—"}
                />
                <LabelledValue
                  label="Leadership"
                  value={leadership?.value ?? "—"}
                />
              </div>
            </div>
          </section>

          {/* Verdict */}
          {verdict && (
            <section>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                Verdict
              </h3>
              <VerdictBadge verdict={verdict} />
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Notes
            </h3>
            {notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No scouting notes provided.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEditReport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditReport(report.id)}
            >
              Edit report
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportDetailSheet;
