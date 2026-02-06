import React, { useState, useCallback, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayersData } from "@/hooks/usePlayersData";
import {
  useMatchScoutingReports,
  getMatchIdentifier,
} from "@/hooks/useMatchScoutingReports";
import { useToast } from "@/hooks/use-toast";
import { getMatchGradient } from "@/components/fixtures/FixtureCard";
import { Player } from "@/types/player";

interface MatchScoutingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

// Normalize team names for matching players to fixtures
const TEAM_ALIASES: Record<string, string[]> = {
  "nottingham forest": ["nottm forest", "nott'm forest", "notts forest"],
  "manchester united": ["man utd", "man united"],
  "manchester city": ["man city"],
  "tottenham hotspur": ["spurs", "tottenham"],
  "wolverhampton wanderers": ["wolves", "wolverhampton"],
  "newcastle united": ["newcastle"],
  "west ham united": ["west ham"],
  "brighton & hove albion": ["brighton"],
  "crystal palace": ["crystal palace"],
  "aston villa": ["aston villa"],
  "leeds united": ["leeds"],
};

const normalizeTeamName = (name?: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\bf\.?c\.?\b/g, "")
    .replace(/football club/g, "")
    .replace(/[^a-z0-9&'\s-]/g, "")
    .replace(/'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveCanonical = (normalized: string): string => {
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    if (normalized === canonical || aliases.some(a => normalized === a || normalized.includes(a) || a.includes(normalized))) {
      return canonical;
    }
  }
  return normalized;
};

const clubsMatch = (a?: string, b?: string) => {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (na === nb) return true;
  const ca = resolveCanonical(na);
  const cb = resolveCanonical(nb);
  return ca === cb || ca.includes(cb) || cb.includes(ca);
};

interface PlayerScoutingRowProps {
  player: Player;
  existingNotes: string;
  existingRating: number | null;
  onSave: (playerId: string, notes: string, rating: number | null) => void;
  isSaving: boolean;
}

const PlayerScoutingRow: React.FC<PlayerScoutingRowProps> = ({
  player,
  existingNotes,
  existingRating,
  onSave,
  isSaving,
}) => {
  const [expanded, setExpanded] = useState(existingNotes.length > 0 || existingRating !== null);
  const [notes, setNotes] = useState(existingNotes);
  const [rating, setRating] = useState<number | null>(existingRating);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track changes
  useEffect(() => {
    const notesChanged = notes !== existingNotes;
    const ratingChanged = rating !== existingRating;
    setIsDirty(notesChanged || ratingChanged);
  }, [notes, rating, existingNotes, existingRating]);

  // Auto-save after 2s of inactivity
  useEffect(() => {
    if (!isDirty) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (notes.trim() || rating !== null) {
        onSave(player.id, notes, rating);
        setIsDirty(false);
      }
    }, 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [notes, rating, isDirty, player.id, onSave]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    onSave(player.id, notes, rating);
    setIsDirty(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Player header row - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <PlayerAvatar
          playerName={player.name}
          avatarUrl={player.image}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{player.name}</div>
          <div className="text-xs text-muted-foreground">
            {player.positions?.join(", ")} • {player.age}y • {player.nationality}
          </div>
        </div>
        {player.transferroomRating && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {player.transferroomRating}
          </Badge>
        )}
        {(existingNotes || existingRating !== null) && (
          <Badge variant="outline" className="text-xs shrink-0 border-primary/30 text-primary">
            <Check className="h-3 w-3 mr-1" />
            Noted
          </Badge>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded scouting form */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-muted/20">
          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Rating</span>
              <span className="text-sm font-semibold text-foreground">
                {rating !== null ? rating.toFixed(1) : "—"}
              </span>
            </label>
            <Slider
              value={rating !== null ? [rating] : [5]}
              onValueChange={(values) => setRating(values[0])}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a short scouting report…"
              className="min-h-[80px] text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {isDirty ? "Unsaved changes — auto-saves in 2s" : ""}
            </span>
            <Button
              size="sm"
              variant={isDirty ? "default" : "outline"}
              onClick={handleManualSave}
              disabled={isSaving || (!notes.trim() && rating === null)}
              className="h-7 text-xs"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MatchScoutingDrawer: React.FC<MatchScoutingDrawerProps> = ({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  matchDate,
  homeScore,
  awayScore,
}) => {
  const { toast } = useToast();
  const { data: allPlayers = [] } = usePlayersData();
  const matchIdentifier = open ? getMatchIdentifier(homeTeam, awayTeam, matchDate) : null;
  const { reports, isLoading, upsertReport, getReportForPlayer } = useMatchScoutingReports(matchIdentifier);

  const gradient = getMatchGradient(homeTeam, awayTeam);

  // Split players by team
  const homePlayers = allPlayers.filter((p) => clubsMatch(p.club, homeTeam));
  const awayPlayers = allPlayers.filter((p) => clubsMatch(p.club, awayTeam));

  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  const handleSave = useCallback(
    (playerId: string, notes: string, rating: number | null) => {
      upsertReport.mutate(
        { playerId, notes: notes || null, rating },
        {
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to save scouting report. Please try again.",
              variant: "destructive",
            });
          },
        }
      );
    },
    [upsertReport, toast]
  );

  const renderTeamSection = (teamName: string, players: Player[]) => {
    const notedCount = players.filter((p) => {
      const report = getReportForPlayer(p.id);
      return report && (report.notes || report.rating !== null);
    }).length;

    return (
      <div>
        <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background z-10 py-2">
          <ClubBadge clubName={teamName} size="sm" />
          <h3 className="font-semibold text-base">{teamName}</h3>
          <Badge variant="secondary" className="text-xs">
            {players.length}
          </Badge>
          {notedCount > 0 && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {notedCount} noted
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {players.length > 0 ? (
            players.map((player) => {
              const existing = getReportForPlayer(player.id);
              return (
                <PlayerScoutingRow
                  key={player.id}
                  player={player}
                  existingNotes={existing?.notes || ""}
                  existingRating={existing?.rating ?? null}
                  onSave={handleSave}
                  isSaving={upsertReport.isPending}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No players found for {teamName}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
        {/* Gradient Header */}
        <div
          className="px-6 py-4 text-white shrink-0"
          style={{
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
          }}
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-white">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <ClubBadge clubName={homeTeam} size="sm" className="bg-white/20 rounded-full p-0.5" />
                  <span className="font-semibold text-sm sm:text-base truncate">{homeTeam}</span>
                </div>
                <div className="shrink-0 px-2">
                  {hasScore ? (
                    <span className="text-lg font-bold">
                      {homeScore} - {awayScore}
                    </span>
                  ) : (
                    <span className="text-white/80 font-medium text-sm">vs</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm sm:text-base truncate">{awayTeam}</span>
                  <ClubBadge clubName={awayTeam} size="sm" className="bg-white/20 rounded-full p-0.5" />
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          <p className="text-white/70 text-xs text-center mt-2">
            Match Scouting — click a player to add notes &amp; rating
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
              {renderTeamSection(homeTeam, homePlayers)}
              {renderTeamSection(awayTeam, awayPlayers)}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MatchScoutingDrawer;
