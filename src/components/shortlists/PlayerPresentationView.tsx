
import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Star, FileText, Shield, Footprints } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubBadge } from "@/components/ui/club-badge";
import { ScoutingGrade } from "@/components/ui/scouting-grade";
import { useReports } from "@/hooks/useReports";
import { groupReportsByPlayer } from "@/utils/reportGrouping";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import { cn } from "@/lib/utils";

interface PlayerPresentationViewProps {
  players: any[];
  initialIndex: number;
  onClose: () => void;
  formatXtvScore: (score: number) => string;
}

export const PlayerPresentationView = ({
  players,
  initialIndex,
  onClose,
  formatXtvScore,
}: PlayerPresentationViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { reports } = useReports();

  const player = players[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, players.length - 1));
  }, [players.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Get reports for this player
  const playerReports = reports.filter(
    (r) => r.playerId === player?.id?.toString()
  );
  const latestReport = playerReports[0];
  const overallRating = latestReport ? getOverallRating(latestReport) : null;
  const recommendation = latestReport ? getRecommendation(latestReport) : null;

  // Extract text excerpts from report sections
  const reportExcerpts = playerReports.flatMap((report) => {
    const sections = Array.isArray(report.sections) ? report.sections : [];
    return sections.flatMap((section: any) => {
      const fields = Array.isArray(section.fields) ? section.fields : [];
      return fields
        .filter(
          (f: any) =>
            typeof f.value === "string" &&
            f.value.length > 20 &&
            !f.fieldId?.includes("rating") &&
            !f.fieldId?.includes("recommendation")
        )
        .map((f: any) => ({
          label: f.fieldId?.replace(/-/g, " ").replace(/_/g, " ") || "Notes",
          value: f.value as string,
          reportDate: report.createdAt,
          scoutName: report.scoutProfile
            ? `${report.scoutProfile.first_name || ""} ${report.scoutProfile.last_name || ""}`.trim() || report.scoutProfile.email
            : "Unknown Scout",
        }));
    });
  }).slice(0, 4);

  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {players.length}
          </span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm font-semibold">{player.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center relative overflow-hidden">
        {/* Left arrow */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-4 z-10 h-12 w-12 rounded-full border bg-card shadow-md flex items-center justify-center transition-opacity",
            currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-accent cursor-pointer"
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Right arrow */}
        <button
          onClick={goNext}
          disabled={currentIndex === players.length - 1}
          className={cn(
            "absolute right-4 z-10 h-12 w-12 rounded-full border bg-card shadow-md flex items-center justify-center transition-opacity",
            currentIndex === players.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-accent cursor-pointer"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Player slide */}
        <div className="flex-1 max-w-5xl mx-auto px-16 py-8 overflow-y-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - identity */}
            <div className="flex flex-col items-center lg:items-start gap-5">
              <Avatar className="h-32 w-32 border-4 border-border shadow-lg">
                <AvatarImage src={player.image} alt={player.name} />
                <AvatarFallback className="text-3xl font-bold bg-muted">
                  {player.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="text-center lg:text-left">
                <h1 className="text-2xl font-bold">{player.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <ClubBadge clubName={player.club} size="sm" />
                  <span className="text-sm font-medium">{player.club}</span>
                </div>
              </div>

              {/* Key info pills */}
              <div className="flex flex-wrap gap-2">
                {player.positions?.map((pos: string) => (
                  <Badge key={pos} variant="secondary">{pos}</Badge>
                ))}
                {player.nationality && (
                  <Badge variant="outline">{player.nationality}</Badge>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {player.age && (
                  <StatCard label="Age" value={`${player.age}`} />
                )}
                {player.dominantFoot && (
                  <StatCard label="Foot" value={player.dominantFoot} />
                )}
                {player.contractExpiry && (
                  <StatCard
                    label="Contract"
                    value={new Date(player.contractExpiry).getFullYear().toString()}
                  />
                )}
                {player.contractStatus && (
                  <StatCard label="Status" value={player.contractStatus} />
                )}
              </div>

              {/* EU/GBE status */}
              {player.euGbeStatus && !player.isPrivate && (
                <div className="w-full">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">EU/GBE</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 border-0",
                      player.euGbeStatus === "Pass" && "bg-green-100 text-green-800",
                      player.euGbeStatus === "Fail" && "bg-red-100 text-red-800",
                      player.euGbeStatus === "Pending" && "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {player.euGbeStatus}
                  </Badge>
                </div>
              )}
            </div>

            {/* Right column - data & scouting */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Ratings row */}
              {!player.isPrivate && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {player.transferroomRating != null && (
                    <MetricCard
                      label="Rating"
                      value={player.transferroomRating.toFixed(1)}
                      icon={<Star className="h-4 w-4 text-yellow-500" />}
                    />
                  )}
                  {player.futureRating != null && (
                    <MetricCard
                      label="Potential"
                      value={player.futureRating.toFixed(1)}
                      icon={<Star className="h-4 w-4 text-green-500" />}
                    />
                  )}
                  {player.xtvScore != null && (
                    <MetricCard
                      label="xTV"
                      value={`£${formatXtvScore(player.xtvScore)}M`}
                      icon={<Shield className="h-4 w-4 text-blue-500" />}
                    />
                  )}
                  {player.recentForm && (
                    <MetricCard
                      label="Form"
                      value={`${player.recentForm.goals}G ${player.recentForm.assists}A`}
                      icon={<Footprints className="h-4 w-4 text-primary" />}
                    />
                  )}
                </div>
              )}

              {/* Scouting summary */}
              {playerReports.length > 0 && (
                <div className="rounded-lg border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Scouting Summary
                    </h2>
                    <Badge variant="secondary">
                      {playerReports.length} report{playerReports.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {overallRating != null && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall Rating</span>
                        <div className="mt-1">
                          <ScoutingGrade grade={overallRating} />
                        </div>
                      </div>
                    )}
                    {recommendation && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Recommendation</span>
                        <p className="mt-1 font-medium">{recommendation}</p>
                      </div>
                    )}
                  </div>

                  {latestReport?.matchContext && (
                    <div className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium">Latest match context:</span>{" "}
                      {latestReport.matchContext.opposition && `vs ${latestReport.matchContext.opposition}`}
                      {latestReport.matchContext.competition && ` · ${latestReport.matchContext.competition}`}
                      {latestReport.matchContext.date && ` · ${new Date(latestReport.matchContext.date).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              )}

              {/* Report excerpts */}
              {reportExcerpts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Report Excerpts
                  </h2>
                  {reportExcerpts.map((excerpt, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-muted/30 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium capitalize text-muted-foreground">
                          {excerpt.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {excerpt.scoutName} · {new Date(excerpt.reportDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-4">
                        {excerpt.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* No scouting data message */}
              {playerReports.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No scouting reports yet</p>
                  <p className="text-sm mt-1">This player has not been scouted.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-card p-3">
    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    <p className="text-sm font-semibold mt-0.5">{value}</p>
  </div>
);

const MetricCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg border bg-card p-4 flex flex-col items-center text-center">
    {icon}
    <span className="text-lg font-bold mt-1">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
