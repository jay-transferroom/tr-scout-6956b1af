import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare, Calendar, MapPin } from "lucide-react";
import { GroupedMatchReport, MatchScoutingReportWithDetails } from "@/hooks/useAllMatchScoutingReports";
import { supabase } from "@/integrations/supabase/client";
import { PlayerAvatar } from "@/components/ui/player-avatar";

interface PlayerInfo {
  id: number;
  name: string;
  firstposition: string | null;
  currentteam: string | null;
  imageurl: string | null;
}

interface MatchReportDetailDialogProps {
  match: GroupedMatchReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getRatingColor = (rating: number): string => {
  if (rating >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (rating >= 6) return "text-blue-600 bg-blue-50 border-blue-200";
  if (rating >= 4) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
};

const MatchReportDetailDialog = ({ match, open, onOpenChange }: MatchReportDetailDialogProps) => {
  const [playerInfoMap, setPlayerInfoMap] = useState<Map<string, PlayerInfo>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match || !open) return;

    const playerIds = [...new Set(match.reports.map((r) => r.player_id))];
    if (playerIds.length === 0) return;

    setLoading(true);
    const numericIds = playerIds.map(Number).filter((n) => !isNaN(n));

    supabase
      .from("players_new")
      .select("id, name, firstposition, currentteam, imageurl")
      .in("id", numericIds)
      .then(({ data }) => {
        const map = new Map<string, PlayerInfo>();
        (data || []).forEach((p) => map.set(String(p.id), p as PlayerInfo));
        setPlayerInfoMap(map);
        setLoading(false);
      });
  }, [match, open]);

  if (!match) return null;

  // Group reports by player
  const byPlayer = new Map<string, MatchScoutingReportWithDetails[]>();
  match.reports.forEach((r) => {
    const existing = byPlayer.get(r.player_id) || [];
    existing.push(r);
    byPlayer.set(r.player_id, existing);
  });

  const sortedPlayers = [...byPlayer.entries()].sort((a, b) => {
    const aRating = Math.max(...a[1].map((r) => r.rating ?? 0));
    const bRating = Math.max(...b[1].map((r) => r.rating ?? 0));
    return bRating - aRating;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {match.homeTeam} vs {match.awayTeam}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap">
            {match.matchDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(match.matchDate), "dd MMM yyyy")}
              </span>
            )}
            {match.competition && (
              <Badge variant="secondary">{match.competition}</Badge>
            )}
            <span className="text-muted-foreground">
              {match.totalRatings} player{match.totalRatings !== 1 ? "s" : ""} rated
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading player details...</div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No player assessments found.</div>
          ) : (
            sortedPlayers.map(([playerId, reports]) => {
              const player = playerInfoMap.get(playerId);
              const playerName = player?.name || `Player #${playerId}`;

              return (
                <div key={playerId} className="border rounded-lg p-4 space-y-3">
                  {/* Player header */}
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      avatarUrl={player?.imageurl || undefined}
                      playerName={playerName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{playerName}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {player?.firstposition && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {player.firstposition}
                          </Badge>
                        )}
                        {player?.currentteam && <span>{player.currentteam}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Scout assessments */}
                  {reports.map((report) => {
                    const scoutName = report.scout_profile
                      ? `${report.scout_profile.first_name || ""} ${report.scout_profile.last_name || ""}`.trim() || "Scout"
                      : "Scout";

                    return (
                      <div key={report.id} className="pl-4 border-l-2 border-muted space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>{scoutName}</span>
                            <span className="text-xs">
                              {format(new Date(report.updated_at), "dd MMM yyyy")}
                            </span>
                          </div>
                          {report.rating !== null && (
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-sm font-semibold ${getRatingColor(report.rating)}`}
                            >
                              <Star className="h-3.5 w-3.5" />
                              {report.rating}
                            </div>
                          )}
                        </div>
                        {report.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <p className="text-foreground">{report.notes}</p>
                          </div>
                        )}
                        {!report.notes && report.rating !== null && (
                          <p className="text-xs text-muted-foreground italic pl-5">No notes provided</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchReportDetailDialog;
