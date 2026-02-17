import React, { useState, useCallback, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Loader2, AlertTriangle, ShieldBan, GripVertical } from "lucide-react";
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

type PlayerStatus = 'available' | 'injured' | 'suspended';

// Mock function to simulate player availability status
// In production, this would come from the database
const getPlayerStatus = (playerId: string): { status: PlayerStatus; description?: string } => {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mod = hash % 10;
  if (mod === 3) return { status: 'injured', description: 'Hamstring injury — expected return in 2 weeks' };
  if (mod === 7) return { status: 'suspended', description: 'Suspended — accumulation of yellow cards' };
  return { status: 'available' };
};

interface PlayerScoutingRowProps {
  player: Player;
  existingNotes: string;
  existingRating: number | null;
  onSave: (playerId: string, notes: string, rating: number | null) => void;
  isSaving: boolean;
  onDragStart: (e: React.DragEvent, playerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, playerId: string) => void;
  isDragTarget: boolean;
}

const PlayerScoutingRow: React.FC<PlayerScoutingRowProps> = ({
  player,
  existingNotes,
  existingRating,
  onSave,
  isSaving,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}) => {
  const [expanded, setExpanded] = useState(existingNotes.length > 0 || existingRating !== null);
  const [notes, setNotes] = useState(existingNotes);
  const [rating, setRating] = useState<number | null>(existingRating);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { status, description } = getPlayerStatus(player.id);

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
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        status === 'injured' && "border-amber-400/50 bg-amber-500/5",
        status === 'suspended' && "border-red-400/50 bg-red-500/5",
        status === 'available' && "border-border",
        isDragTarget && "border-primary ring-1 ring-primary/30"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, player.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, player.id)}
    >
        {/* Player header row - always visible */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center gap-2 p-3 transition-colors text-left",
            status === 'injured' && "hover:bg-amber-500/10",
            status === 'suspended' && "hover:bg-red-500/10",
            status === 'available' && "hover:bg-muted/50"
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />
          <PlayerAvatar
            playerName={player.name}
            avatarUrl={player.image}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">{player.name}</span>
              {status === 'injured' && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              {status === 'suspended' && (
                <ShieldBan className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {player.positions?.join(", ")} • {player.age}y • {player.nationality}
            </div>
            {status !== 'available' && description && (
              <div className={cn(
                "text-[10px] mt-0.5 font-medium",
                status === 'injured' && "text-amber-600 dark:text-amber-400",
                status === 'suspended' && "text-red-500 dark:text-red-400"
              )}>
                {description}
              </div>
            )}
          </div>
          {existingRating !== null && (
            <Badge variant="default" className="text-xs shrink-0 font-semibold">
              {existingRating.toFixed(1)}
            </Badge>
          )}
          {player.transferroomRating && (
            <Badge variant="secondary" className="text-xs shrink-0 bg-blue-900 text-white border-blue-800">
              {player.transferroomRating}
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Rating
            </label>
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
                      "aspect-square rounded-md border flex items-center justify-center text-xs font-medium transition-colors",
                      isSelected
                        ? `${selectedColor} text-white border-transparent`
                        : "bg-background hover:bg-muted/50 border-border"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
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

  // Debug logging for team matching
  if (open && allPlayers.length > 0) {
    console.log('Match Scouting Drawer debug:', {
      homeTeam,
      awayTeam,
      totalPlayers: allPlayers.length,
      homePlayersFound: homePlayers.length,
      awayPlayersFound: awayPlayers.length,
      sampleClubs: [...new Set(allPlayers.slice(0, 20).map(p => p.club))],
      homeNormalized: normalizeTeamName(homeTeam),
      awayNormalized: normalizeTeamName(awayTeam),
    });
  }

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

  // Reorder state per team
  const [homeOrder, setHomeOrder] = useState<string[]>([]);
  const [awayOrder, setAwayOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceRef = useRef<string | null>(null);
  const dragTeamRef = useRef<'home' | 'away' | null>(null);
  const prevMatchRef = useRef<string | null>(null);

  // Reset order when match changes or drawer opens with new teams
  useEffect(() => {
    const matchKey = `${homeTeam}-${awayTeam}-${matchDate}`;
    if (prevMatchRef.current !== matchKey) {
      prevMatchRef.current = matchKey;
      setHomeOrder([]);
      setAwayOrder([]);
    }
  }, [homeTeam, awayTeam, matchDate]);

  useEffect(() => {
    if (homePlayers.length > 0 && homeOrder.length === 0) {
      setHomeOrder(homePlayers.map(p => p.id));
    }
  }, [homePlayers.length, homeOrder.length]);

  useEffect(() => {
    if (awayPlayers.length > 0 && awayOrder.length === 0) {
      setAwayOrder(awayPlayers.map(p => p.id));
    }
  }, [awayPlayers.length, awayOrder.length]);

  const mappedHome = homeOrder.length ? homeOrder.map(id => homePlayers.find(p => p.id === id)).filter(Boolean) as Player[] : [];
  const mappedAway = awayOrder.length ? awayOrder.map(id => awayPlayers.find(p => p.id === id)).filter(Boolean) as Player[] : [];
  const orderedHome = mappedHome.length > 0 ? mappedHome : homePlayers;
  const orderedAway = mappedAway.length > 0 ? mappedAway : awayPlayers;

  const handleDragStart = useCallback((team: 'home' | 'away') => (e: React.DragEvent, playerId: string) => {
    dragSourceRef.current = playerId;
    dragTeamRef.current = team;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((team: 'home' | 'away') => (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragSourceRef.current;
    if (!sourceId || sourceId === targetId || dragTeamRef.current !== team) {
      setDragOverId(null);
      return;
    }
    const [order, setOrder] = team === 'home' ? [homeOrder, setHomeOrder] as const : [awayOrder, setAwayOrder] as const;
    const newOrder = [...order];
    const srcIdx = newOrder.indexOf(sourceId);
    const tgtIdx = newOrder.indexOf(targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, sourceId);
    setOrder(newOrder);
    dragSourceRef.current = null;
    dragTeamRef.current = null;
    setDragOverId(null);
  }, [homeOrder, awayOrder]);

  const renderTeamSection = (teamName: string, players: Player[], team: 'home' | 'away') => {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background z-10 py-2">
          <ClubBadge clubName={teamName} size="sm" />
          <h3 className="font-semibold text-base">{teamName}</h3>
          <Badge variant="secondary" className="text-xs bg-blue-900 text-white border-blue-800">
            {players.length}
          </Badge>
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
                  onDragStart={handleDragStart(team)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(team)}
                  isDragTarget={dragOverId === player.id}
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
            Match Scouting — drag to reorder players, click to add notes &amp; rating
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
              {renderTeamSection(homeTeam, orderedHome, 'home')}
              {renderTeamSection(awayTeam, orderedAway, 'away')}
            </div>
          )}
        </ScrollArea>

        {/* Footer Save Button */}
        <div className="shrink-0 border-t border-border px-4 py-3 bg-background">
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MatchScoutingDrawer;
