import React, { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubBadge } from "@/components/ui/club-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePlayersData } from "@/hooks/usePlayersData";
import { getMatchIdentifier, useMatchScoutingReports } from "@/hooks/useMatchScoutingReports";
import { cn } from "@/lib/utils";
import { Player } from "@/types/player";
import {
  buildMatchScoutingPageUrl,
  loadMatchScoutingDraft,
  saveMatchScoutingDraft,
} from "@/utils/matchScoutingDrafts";
import { getMatchGradient } from "@/components/fixtures/FixtureCard";
import PlayerReportTemplateDialog from "./PlayerReportTemplateDialog";
import { createDefaultMatchReportConfig, MatchReportConfig, MatchReportRating } from "@/components/club-settings/MatchReportConfigTab";
import { createDefaultNamedSystems } from "@/components/club-settings/RatingSystemsTab";
import { NamedRatingSystem } from "@/types/report";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Maximize2,
  ShieldBan,
} from "lucide-react";

type PlayerStatus = "available" | "injured" | "suspended";

interface MatchScoutingPanelProps {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore?: number | null;
  awayScore?: number | null;
  onClose?: () => void;
  onExpand?: () => void;
}

interface PlayerScoutingRowProps {
  player: Player;
  savedNotes: string;
  savedRating: number | null;
  draftNotes?: string;
  draftRating?: number | null;
  onDraftChange: (playerId: string, notes: string, rating: number | null) => void;
  onSave: (playerId: string, notes: string, rating: number | null) => void;
  onCreateFullReport: (player: Player) => void;
  isSaving: boolean;
  onDragStart: (e: React.DragEvent, playerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, playerId: string) => void;
  isDragTarget: boolean;
}

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
  "afc bournemouth": ["bournemouth"],
  "arsenal fc": ["arsenal"],
  "liverpool fc": ["liverpool"],
  "chelsea fc": ["chelsea"],
  "fulham fc": ["fulham"],
  "brentford fc": ["brentford"],
  "burnley fc": ["burnley"],
  "everton fc": ["everton"],
  "sunderland afc": ["sunderland"],
};

const normalizeTeamName = (name?: string) => {
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\bf\.?c\.?\b/gi, "")
    .replace(/\bafc\b/gi, "")
    .replace(/football club/g, "")
    .replace(/[^a-z0-9&'\s-]/g, "")
    .replace(/'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveCanonical = (normalized: string): string => {
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    if (normalized === canonical || aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))) {
      return canonical;
    }
  }

  return normalized;
};

const clubsMatch = (a?: string, b?: string) => {
  const normalizedA = normalizeTeamName(a);
  const normalizedB = normalizeTeamName(b);

  if (normalizedA === normalizedB) return true;

  const canonicalA = resolveCanonical(normalizedA);
  const canonicalB = resolveCanonical(normalizedB);

  return canonicalA === canonicalB || canonicalA.includes(canonicalB) || canonicalB.includes(canonicalA);
};

const getPlayerStatus = (playerId: string): { status: PlayerStatus; description?: string } => {
  const hash = playerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mod = hash % 10;

  if (mod === 3) {
    return { status: "injured", description: "Hamstring injury — expected return in 2 weeks" };
  }

  if (mod === 7) {
    return { status: "suspended", description: "Suspended — accumulation of yellow cards" };
  }

  return { status: "available" };
};

const PlayerScoutingRow: React.FC<PlayerScoutingRowProps> = ({
  player,
  savedNotes,
  savedRating,
  draftNotes,
  draftRating,
  onDraftChange,
  onSave,
  onCreateFullReport,
  isSaving,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}) => {
  const [expanded, setExpanded] = useState((draftNotes ?? savedNotes).length > 0 || (draftRating ?? savedRating) !== null);
  const [notes, setNotes] = useState(draftNotes ?? savedNotes);
  const [rating, setRating] = useState<number | null>(draftRating ?? savedRating);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { status, description } = getPlayerStatus(player.id);

  useEffect(() => {
    setNotes(draftNotes ?? savedNotes);
  }, [draftNotes, savedNotes]);

  useEffect(() => {
    setRating(draftRating ?? savedRating);
  }, [draftRating, savedRating]);

  useEffect(() => {
    if ((draftNotes ?? savedNotes).length > 0 || (draftRating ?? savedRating) !== null) {
      setExpanded(true);
    }
  }, [draftNotes, savedNotes, draftRating, savedRating]);

  useEffect(() => {
    setIsDirty(notes !== savedNotes || rating !== savedRating);
  }, [notes, rating, savedNotes, savedRating]);

  useEffect(() => {
    onDraftChange(player.id, notes, rating);
  }, [notes, rating, onDraftChange, player.id]);

  useEffect(() => {
    if (!isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (notes.trim() || rating !== null) {
        onSave(player.id, notes, rating);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, notes, onSave, player.id, rating]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    onSave(player.id, notes, rating);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border transition-all",
        status === "injured" && "border-amber-400/50 bg-amber-500/5",
        status === "suspended" && "border-red-400/50 bg-red-500/5",
        status === "available" && "border-border",
        isDragTarget && "border-primary ring-1 ring-primary/30"
      )}
      draggable
      onDragStart={(event) => onDragStart(event, player.id)}
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, player.id)}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={cn(
          "flex w-full items-center gap-2 p-3 text-left transition-colors",
          status === "injured" && "hover:bg-amber-500/10",
          status === "suspended" && "hover:bg-red-500/10",
          status === "available" && "hover:bg-muted/50"
        )}
      >
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
        <PlayerAvatar playerName={player.name} avatarUrl={player.image} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{player.name}</span>
            {status === "injured" && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
            {status === "suspended" && <ShieldBan className="h-3.5 w-3.5 shrink-0 text-red-400" />}
          </div>
          <div className="text-xs text-muted-foreground">
            {player.positions?.join(", ")} • {player.age}y • {player.nationality}
          </div>
          {status !== "available" && description && (
            <div
              className={cn(
                "mt-0.5 text-[10px] font-medium",
                status === "injured" && "text-amber-600 dark:text-amber-400",
                status === "suspended" && "text-red-500 dark:text-red-400"
              )}
            >
              {description}
            </div>
          )}
        </div>
        {rating !== null && (
          <Badge variant="default" className="shrink-0 text-xs font-semibold">
            {rating.toFixed(1)}
          </Badge>
        )}
        {player.transferroomRating && (
          <Badge variant="secondary" className="shrink-0 border-blue-800 bg-blue-900 text-xs text-white">
            {player.transferroomRating}
          </Badge>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border bg-muted/20 px-3 pb-3 pt-1">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Rating</label>
            <div className="grid grid-cols-10 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                const isSelected = rating === value;
                let selectedColor = "bg-primary";

                if (isSelected) {
                  if (value <= 3) selectedColor = "bg-destructive";
                  else if (value <= 5) selectedColor = "bg-yellow-500";
                  else if (value <= 7) selectedColor = "bg-green-500";
                  else selectedColor = "bg-emerald-500";
                }

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(isSelected ? null : value)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border text-xs font-medium transition-colors",
                      isSelected ? `${selectedColor} border-transparent text-white` : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write a short scouting report…"
              className="min-h-[80px] resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button size="sm" variant="outline" onClick={() => onCreateFullReport(player)} className="h-7 text-xs">
              Create full report
            </Button>

            <span className="flex-1 text-center text-[10px] text-muted-foreground">
              {isDirty ? "Unsaved changes — auto-saves in 2s" : ""}
            </span>

            <Button
              size="sm"
              variant={isDirty ? "default" : "outline"}
              onClick={handleManualSave}
              disabled={isSaving || (!notes.trim() && rating === null)}
              className="h-7 text-xs"
            >
              {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchScoutingPanel: React.FC<MatchScoutingPanelProps> = ({
  homeTeam,
  awayTeam,
  matchDate,
  homeScore,
  awayScore,
  onClose,
  onExpand,
}) => {
  const { toast } = useToast();
  const { data: allPlayers = [] } = usePlayersData();
  const [homeOrder, setHomeOrder] = useState<string[]>([]);
  const [awayOrder, setAwayOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [selectedPlayerForFullReport, setSelectedPlayerForFullReport] = useState<Player | null>(null);
  const [playerDrafts, setPlayerDrafts] = useState<Record<string, { notes: string; rating: number | null }>>({});
  const [draftHydrated, setDraftHydrated] = useState(false);
  const dragSourceRef = useRef<string | null>(null);
  const dragTeamRef = useRef<"home" | "away" | null>(null);
  const prevMatchRef = useRef<string | null>(null);
  const matchIdentifier = getMatchIdentifier(homeTeam, awayTeam, matchDate);
  const { reports, isLoading, upsertReport, getReportForPlayer } = useMatchScoutingReports(matchIdentifier);
  const gradient = getMatchGradient(homeTeam, awayTeam);

  const homePlayers = allPlayers.filter((player) => clubsMatch(player.club, homeTeam));
  const awayPlayers = allPlayers.filter((player) => clubsMatch(player.club, awayTeam));
  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  useEffect(() => {
    const savedDraft = loadMatchScoutingDraft(matchIdentifier);

    setHomeOrder(savedDraft?.homeOrder ?? []);
    setAwayOrder(savedDraft?.awayOrder ?? []);
    setPlayerDrafts(savedDraft?.playerDrafts ?? {});
    setDraftHydrated(true);
  }, [matchIdentifier]);

  useEffect(() => {
    if (!draftHydrated) return;

    saveMatchScoutingDraft(matchIdentifier, {
      homeOrder,
      awayOrder,
      playerDrafts,
    });
  }, [awayOrder, draftHydrated, homeOrder, matchIdentifier, playerDrafts]);

  useEffect(() => {
    const matchKey = `${homeTeam}-${awayTeam}-${matchDate}`;

    if (prevMatchRef.current !== matchKey) {
      prevMatchRef.current = matchKey;
      setDragOverId(null);
      dragSourceRef.current = null;
      dragTeamRef.current = null;
    }
  }, [homeTeam, awayTeam, matchDate]);

  useEffect(() => {
    if (homePlayers.length > 0 && homeOrder.length === 0) {
      setHomeOrder(homePlayers.map((player) => player.id));
    }
  }, [homeOrder.length, homePlayers]);

  useEffect(() => {
    if (awayPlayers.length > 0 && awayOrder.length === 0) {
      setAwayOrder(awayPlayers.map((player) => player.id));
    }
  }, [awayOrder.length, awayPlayers]);

  const handleDraftChange = useCallback((playerId: string, notes: string, rating: number | null) => {
    setPlayerDrafts((currentDrafts) => ({
      ...currentDrafts,
      [playerId]: {
        notes,
        rating,
      },
    }));
  }, []);

  const clearPlayerDraft = useCallback((playerId: string) => {
    setPlayerDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[playerId];
      return nextDrafts;
    });
  }, []);

  const handleSave = useCallback(
    (playerId: string, notes: string, rating: number | null) => {
      upsertReport.mutate(
        { playerId, notes: notes || null, rating },
        {
          onSuccess: () => {
            clearPlayerDraft(playerId);
          },
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
    [clearPlayerDraft, toast, upsertReport]
  );

  const orderedHome = (homeOrder.length > 0 ? homeOrder : homePlayers.map((player) => player.id))
    .map((playerId) => homePlayers.find((player) => player.id === playerId))
    .filter(Boolean) as Player[];

  const orderedAway = (awayOrder.length > 0 ? awayOrder : awayPlayers.map((player) => player.id))
    .map((playerId) => awayPlayers.find((player) => player.id === playerId))
    .filter(Boolean) as Player[];

  const handleDragStart = useCallback((team: "home" | "away") => (event: React.DragEvent, playerId: string) => {
    dragSourceRef.current = playerId;
    dragTeamRef.current = team;
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((team: "home" | "away") => (event: React.DragEvent, targetId: string) => {
    event.preventDefault();

    const sourceId = dragSourceRef.current;
    if (!sourceId || sourceId === targetId || dragTeamRef.current !== team) {
      setDragOverId(null);
      return;
    }

    const [order, setOrder] = team === "home" ? [homeOrder, setHomeOrder] as const : [awayOrder, setAwayOrder] as const;
    const nextOrder = [...order];
    const sourceIndex = nextOrder.indexOf(sourceId);
    const targetIndex = nextOrder.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, sourceId);
    setOrder(nextOrder);
    dragSourceRef.current = null;
    dragTeamRef.current = null;
    setDragOverId(null);
  }, [awayOrder, homeOrder]);

  const handleExpandToPage = useCallback(() => {
    const reportPageUrl = buildMatchScoutingPageUrl({
      homeTeam,
      awayTeam,
      matchDate,
      homeScore,
      awayScore,
    });

    window.open(reportPageUrl, "_blank", "noopener,noreferrer");
    onExpand?.();
  }, [awayScore, awayTeam, homeScore, homeTeam, matchDate, onExpand]);

  const renderTeamSection = (teamName: string, players: Player[], team: "home" | "away") => {
    return (
      <div>
        <div className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-background py-2">
          <ClubBadge clubName={teamName} size="sm" />
          <h3 className="text-base font-semibold">{teamName}</h3>
          <Badge variant="secondary" className="border-blue-800 bg-blue-900 text-xs text-white">
            {players.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {players.length > 0 ? (
            players.map((player) => {
              const existingReport = getReportForPlayer(player.id);
              const draft = playerDrafts[player.id];

              return (
                <PlayerScoutingRow
                  key={player.id}
                  player={player}
                  savedNotes={existingReport?.notes || ""}
                  savedRating={existingReport?.rating ?? null}
                  draftNotes={draft?.notes}
                  draftRating={draft?.rating ?? null}
                  onDraftChange={handleDraftChange}
                  onSave={handleSave}
                  onCreateFullReport={setSelectedPlayerForFullReport}
                  isSaving={upsertReport.isPending}
                  onDragStart={handleDragStart(team)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(team)}
                  isDragTarget={dragOverId === player.id}
                />
              );
            })
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No players found for {teamName}</p>
          )}
        </div>
      </div>
    );
  };

  const selectedPlayerOpposition = selectedPlayerForFullReport
    ? clubsMatch(selectedPlayerForFullReport.club, homeTeam)
      ? awayTeam
      : homeTeam
    : "";

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
        <div
          className="shrink-0 px-6 py-4 text-white"
          style={{
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-1 items-center justify-end gap-2">
                  <ClubBadge clubName={homeTeam} size="sm" className="rounded-full bg-white/20 p-0.5" />
                  <span className="truncate text-sm font-semibold sm:text-base">{homeTeam}</span>
                </div>
                <div className="shrink-0 px-2">
                  {hasScore ? (
                    <span className="text-lg font-bold">
                      {homeScore} - {awayScore}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-white/80">vs</span>
                  )}
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span className="truncate text-sm font-semibold sm:text-base">{awayTeam}</span>
                  <ClubBadge clubName={awayTeam} size="sm" className="rounded-full bg-white/20 p-0.5" />
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-white/70">
                Match Scouting — drag to reorder players, click to add notes &amp; rating
              </p>
            </div>

            <Button
              variant="secondary"
              size="icon"
              className="shrink-0 border border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={handleExpandToPage}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-4 sm:grid-cols-2">
              {renderTeamSection(homeTeam, orderedHome, "home")}
              {renderTeamSection(awayTeam, orderedAway, "away")}
            </div>
          )}
        </ScrollArea>

        {onClose && (
          <div className="shrink-0 border-t border-border bg-background px-4 py-3">
            <Button className="w-full" onClick={onClose}>
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      <PlayerReportTemplateDialog
        open={!!selectedPlayerForFullReport}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlayerForFullReport(null);
          }
        }}
        player={selectedPlayerForFullReport}
        matchDate={matchDate}
        opposition={selectedPlayerOpposition}
      />
    </>
  );
};

export default MatchScoutingPanel;
