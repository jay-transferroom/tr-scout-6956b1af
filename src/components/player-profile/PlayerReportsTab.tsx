import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import VerdictBadge from "@/components/VerdictBadge";
import ReportDetailSheet from "@/components/reports/ReportDetailSheet";
import { ReportWithPlayer } from "@/types/report";
import { Player } from "@/types/player";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";

interface PlayerReportsTabProps {
  player: Player;
  playerReports: ReportWithPlayer[];
}

const getRatingDotClass = (rating: number) => {
  if (rating >= 8) return "bg-success";
  if (rating >= 6) return "bg-info";
  if (rating >= 4) return "bg-warning";
  return "bg-destructive";
};

const buildDemoReport = (player: Player): ReportWithPlayer => ({
  id: "demo-report-madueke-profile",
  playerId: player.id,
  templateId: "default",
  scoutId: "demo-oliver-smith",
  createdAt: new Date("2025-10-07T15:00:00.000Z"),
  updatedAt: new Date("2025-10-07T15:00:00.000Z"),
  status: "submitted",
  sections: [
    {
      sectionId: "overall",
      fields: [
        { fieldId: "overall-rating", value: 10 },
        { fieldId: "recommendation", value: "recommend-signing" },
      ],
    },
  ],
  matchContext: {
    date: "2025-10-07T15:00:00.000Z",
    opposition: "Manchester United",
    competition: "Premier League",
    minutesPlayed: 90,
    isManual: true,
    homeTeam: "Brighton & Hove Albion",
    awayTeam: "Manchester United",
  } as any,
  watchMethod: "Live",
  player,
  scoutProfile: {
    id: "demo-oliver-smith",
    first_name: "Oliver",
    last_name: "Smith",
    email: "oliver@demo.com",
    role: "scout",
  } as any,
});

export const PlayerReportsTab = ({ player, playerReports }: PlayerReportsTabProps) => {
  const navigate = useNavigate();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const isMadueke = player.name?.toLowerCase().includes("noni madueke");
  const reports: ReportWithPlayer[] =
    playerReports && playerReports.length > 0
      ? playerReports
      : isMadueke
      ? [buildDemoReport(player)]
      : [];

  const selectedReport =
    reports.find((r) => r.id === selectedReportId) ?? null;

  const handleCreateReport = () => {
    navigate("/report-builder", {
      state: { selectedPlayer: { id: player.id, name: player.name } },
    });
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const getMatchLabel = (report: ReportWithPlayer) => {
    const ctx: any = report.matchContext;
    if (!ctx) return null;
    if (ctx.isManual && ctx.homeTeam && ctx.awayTeam) {
      return `${ctx.homeTeam} vs ${ctx.awayTeam}`;
    }
    if (ctx.opposition) {
      return `vs ${ctx.opposition}`;
    }
    return null;
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-medium text-foreground mb-1">
              No scouting reports yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Create the first scouting report for this player.
            </p>
            <Button size="sm" onClick={handleCreateReport} className="gap-2">
              <Plus className="h-4 w-4" />
              Create report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scout</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const rating = getOverallRating(report);
              const verdict = getRecommendation(report);
              const matchLabel = getMatchLabel(report);
              const scoutName = report.scoutProfile
                ? `${report.scoutProfile.first_name ?? ""} ${
                    report.scoutProfile.last_name ?? ""
                  }`.trim() || "Scout"
                : "Scout";

              return (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlayerAvatar playerName={scoutName} size="sm" />
                      <span className="text-sm font-medium">{scoutName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {matchLabel ? (
                      <span className="text-sm">{matchLabel}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(report.createdAt), "dd MMM yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {rating !== null && rating !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getRatingDotClass(
                            Number(rating)
                          )}`}
                        />
                        <span className="text-sm font-medium">{rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {verdict ? (
                      <VerdictBadge verdict={verdict} />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report.id)}
                    >
                      View report
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlayerReportsTab;
