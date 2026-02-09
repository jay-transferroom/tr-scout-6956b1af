import { useMemo, useState } from "react";
import { Player } from "@/types/player";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, ArrowRight, GripVertical, Star, AlertTriangle, Users, Heart, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShortlists } from "@/hooks/useShortlists";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import { cn } from "@/lib/utils";
import { PositionPlayerSlot } from "@/hooks/useMultiPlayerPositions";

interface DepthPositionSidebarProps {
  selectedPosition: string | null;
  squadPlayers: Player[];
  allPlayers: Player[];
  positionSlots: PositionPlayerSlot[];
  onAddPlayerToPosition: (position: string, playerId: string) => void;
  onRemovePlayerFromPosition: (position: string, playerId: string) => void;
  onSetActivePlayer: (position: string, playerId: string) => void;
  onReorderPlayer: (position: string, playerId: string, direction: 'up' | 'down') => void;
}

const getPositionMapping = (pos: string): string[] => {
  switch (pos) {
    case 'GK': return ['GK'];
    case 'LB': return ['LB', 'LWB'];
    case 'CB1': case 'CB2': case 'CB3': return ['CB'];
    case 'RB': return ['RB', 'RWB'];
    case 'CDM': case 'CDM1': case 'CDM2': return ['CM', 'CDM'];
    case 'CM1': case 'CM2': case 'CM3': return ['CM', 'CAM'];
    case 'CAM': return ['CAM', 'CM'];
    case 'LM': return ['LM', 'W', 'LW'];
    case 'RM': return ['RM', 'W', 'RW'];
    case 'LW': return ['W', 'LW', 'LM'];
    case 'ST': case 'ST1': case 'ST2': return ['F', 'FW', 'ST', 'CF'];
    case 'RW': return ['W', 'RW', 'RM'];
    default: return [];
  }
};

const getPositionLabel = (position: string): string => {
  const labels: Record<string, string> = {
    'GK': 'Goalkeeper', 'LB': 'Left Back', 'CB1': 'Centre Back', 'CB2': 'Centre Back',
    'RB': 'Right Back', 'CDM': 'Defensive Mid', 'CDM1': 'Defensive Mid', 'CDM2': 'Defensive Mid',
    'CM1': 'Central Mid', 'CM2': 'Central Mid', 'CAM': 'Attacking Mid',
    'LW': 'Left Wing', 'RW': 'Right Wing', 'LM': 'Left Mid', 'RM': 'Right Mid',
    'ST': 'Striker', 'ST1': 'Striker', 'ST2': 'Striker',
  };
  return labels[position] || position;
};

const mapPositionToCategory = (position: string): string => {
  if (position === 'GK') return 'GK';
  if (['CB', 'CB1', 'CB2', 'CB3'].includes(position)) return 'CB';
  if (['LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'FB';
  if (['CDM', 'CDM1', 'CDM2', 'CM', 'CM1', 'CM2', 'CM3', 'CAM'].includes(position)) return 'CM';
  if (['LW', 'RW', 'LM', 'RM'].includes(position)) return 'W';
  if (['ST', 'ST1', 'ST2', 'CF'].includes(position)) return 'ST';
  return position;
};

const DepthPositionSidebar = ({
  selectedPosition,
  squadPlayers,
  allPlayers,
  positionSlots,
  onAddPlayerToPosition,
  onRemovePlayerFromPosition,
  onSetActivePlayer,
  onReorderPlayer,
}: DepthPositionSidebarProps) => {
  const navigate = useNavigate();
  const { shortlists } = useShortlists();
  const { data: recommendations = [] } = useSquadRecommendations();
  const [availableTab, setAvailableTab] = useState<'squad' | 'shortlisted' | 'recommended'>('squad');

  // Get assigned player IDs for this position
  const assignedPlayerIds = useMemo(() => {
    if (!selectedPosition) return [];
    const slot = positionSlots.find(s => s.position === selectedPosition);
    if (!slot) return [];
    return [slot.activePlayerId, ...slot.alternatePlayerIds].filter(Boolean);
  }, [selectedPosition, positionSlots]);

  // Resolve assigned players in order
  const assignedPlayers = useMemo(() => {
    return assignedPlayerIds
      .map(id => allPlayers.find(p => p.id === id) || squadPlayers.find(p => p.id === id))
      .filter((p): p is Player => !!p);
  }, [assignedPlayerIds, allPlayers, squadPlayers]);

  // Get the active player ID
  const activePlayerId = useMemo(() => {
    if (!selectedPosition) return null;
    const slot = positionSlots.find(s => s.position === selectedPosition);
    return slot?.activePlayerId || null;
  }, [selectedPosition, positionSlots]);

  // Available squad players (eligible for position, not already assigned)
  const availableSquadPlayers = useMemo(() => {
    if (!selectedPosition) return [];
    const allowedPositions = getPositionMapping(selectedPosition);
    return squadPlayers
      .filter(p =>
        p.positions.some(pos => allowedPositions.includes(pos)) &&
        !assignedPlayerIds.includes(p.id)
      )
      .sort((a, b) => (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0));
  }, [selectedPosition, squadPlayers, assignedPlayerIds]);

  // Available shortlisted players
  const availableShortlistedPlayers = useMemo(() => {
    if (!selectedPosition) return [];
    const category = mapPositionToCategory(selectedPosition);
    const positionConfig: Record<string, string[]> = {
      'GK': ['GK'], 'CB': ['CB'], 'FB': ['LB', 'RB', 'LWB', 'RWB'],
      'CM': ['CM', 'CDM', 'CAM'], 'W': ['LW', 'RW', 'LM', 'RM', 'W'],
      'ST': ['ST', 'CF', 'F', 'FW']
    };
    const requiredPositions = positionConfig[category] || [];
    const shortlistPlayerIds = shortlists.flatMap(s => s.playerIds || []);
    return allPlayers.filter(p =>
      shortlistPlayerIds.includes(p.id) &&
      p.positions.some(pos => requiredPositions.includes(pos)) &&
      !assignedPlayerIds.includes(p.id)
    ).sort((a, b) => (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0));
  }, [selectedPosition, shortlists, allPlayers, assignedPlayerIds]);

  // Available recommended players
  const availableRecommendedPlayers = useMemo(() => {
    if (!selectedPosition) return [];
    const category = mapPositionToCategory(selectedPosition);
    const categoryToKeywords: Record<string, string[]> = {
      'GK': ['goalkeeper', 'gk', 'keeper'], 'CB': ['centre back', 'center back', 'cb', 'defender'],
      'FB': ['right back', 'left back', 'rb', 'lb', 'full back', 'fullback', 'wing back'],
      'CM': ['midfielder', 'midfield', 'cm', 'cdm', 'cam', 'central mid'],
      'W': ['winger', 'wing', 'lw', 'rw', 'wide'],
      'ST': ['striker', 'forward', 'st', 'cf', 'attacker']
    };
    const keywords = categoryToKeywords[category] || [];
    const hasRecommendation = recommendations.some(r => {
      const posLower = r.Position?.toLowerCase() || '';
      return keywords.some(kw => posLower.includes(kw));
    });
    if (!hasRecommendation) return [];
    const positionConfig: Record<string, string[]> = {
      'GK': ['GK'], 'CB': ['CB'], 'FB': ['LB', 'RB', 'LWB', 'RWB'],
      'CM': ['CM', 'CDM', 'CAM'], 'W': ['LW', 'RW', 'LM', 'RM', 'W'],
      'ST': ['ST', 'CF', 'F', 'FW']
    };
    const requiredPositions = positionConfig[category] || [];
    const squadPlayerIds = squadPlayers.map(p => p.id);
    return allPlayers
      .filter(p =>
        !assignedPlayerIds.includes(p.id) &&
        !squadPlayerIds.includes(p.id) &&
        p.positions.some(pos => requiredPositions.includes(pos)) &&
        (p.transferroomRating || 0) >= 70
      )
      .sort((a, b) => (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0))
      .slice(0, 10);
  }, [selectedPosition, recommendations, allPlayers, squadPlayers, assignedPlayerIds]);

  if (!selectedPosition) return null;

  const currentAvailablePlayers = availableTab === 'squad' ? availableSquadPlayers
    : availableTab === 'shortlisted' ? availableShortlistedPlayers
    : availableRecommendedPlayers;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b">
        <h3 className="text-lg font-semibold">{getPositionLabel(selectedPosition)}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Manage players for this position</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-6">
          {/* SECTION 1: Assigned / In Shadow Squad */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">In Shadow Squad</span>
              <Badge variant="secondary" className="text-xs">{assignedPlayers.length}</Badge>
            </div>

            {assignedPlayers.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">
                No players assigned to this position yet
              </div>
            ) : (
              <div className="space-y-1.5">
                {assignedPlayers.map((player, index) => {
                  const isActive = player.id === activePlayerId;
                  const rating = player.transferroomRating || player.xtvScore;
                  const isClub = player.club?.toLowerCase().includes('chelsea');

                  return (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:bg-muted/30"
                      )}
                    >
                      {/* Reorder controls */}
                      <div className="flex flex-col shrink-0">
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={index === 0}
                          onClick={() => onReorderPlayer(selectedPosition, player.id, 'up')}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={index === assignedPlayers.length - 1}
                          onClick={() => onReorderPlayer(selectedPosition, player.id, 'down')}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>

                      <PlayerAvatar playerName={player.name} avatarUrl={player.image} size="sm" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{player.name}</span>
                          {isActive && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-0">
                              Starter
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {player.positions.join(', ')} • {player.age}y
                          {!isClub && <span className="text-amber-600 ml-1">• External</span>}
                        </p>
                      </div>

                      {rating && (
                        <Badge variant="outline" className="text-xs shrink-0 tabular-nums">{rating}</Badge>
                      )}

                      {/* Make starter */}
                      {!isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => onSetActivePlayer(selectedPosition, player.id)}
                          title="Make starter"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemovePlayerFromPosition(selectedPosition, player.id)}
                        title="Remove from position"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* SECTION 2: Available Players */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Add Players</span>
            </div>

            {/* Tab pills */}
            <div className="flex items-center gap-1.5 mb-3">
              <button
                onClick={() => setAvailableTab('squad')}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  availableTab === 'squad'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Users className="h-3 w-3" />
                Squad
                <span className={cn("ml-0.5 px-1 rounded-full text-[10px]", availableTab === 'squad' ? "bg-primary-foreground/20" : "bg-background")}>
                  {availableSquadPlayers.length}
                </span>
              </button>
              <button
                onClick={() => setAvailableTab('shortlisted')}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  availableTab === 'shortlisted'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Heart className="h-3 w-3" />
                Shortlisted
                <span className={cn("ml-0.5 px-1 rounded-full text-[10px]", availableTab === 'shortlisted' ? "bg-primary-foreground/20" : "bg-background")}>
                  {availableShortlistedPlayers.length}
                </span>
              </button>
              <button
                onClick={() => setAvailableTab('recommended')}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  availableTab === 'recommended'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Sparkles className="h-3 w-3" />
                Recommended
                <span className={cn("ml-0.5 px-1 rounded-full text-[10px]", availableTab === 'recommended' ? "bg-primary-foreground/20" : "bg-background")}>
                  {availableRecommendedPlayers.length}
                </span>
              </button>
            </div>

            {/* Available player list */}
            <div className="space-y-1">
              {currentAvailablePlayers.length > 0 ? (
                currentAvailablePlayers.map(player => {
                  const rating = player.transferroomRating || player.xtvScore;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(player.isPrivatePlayer ? `/private-player/${player.id}` : `/player/${player.id}`)}
                    >
                      <PlayerAvatar playerName={player.name} avatarUrl={player.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.positions.join(', ')} • {player.age}y • {player.nationality}
                        </p>
                      </div>
                      {rating && (
                        <Badge variant="outline" className="text-xs shrink-0 tabular-nums">{rating}</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddPlayerToPosition(selectedPosition, player.id);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">
                  No available players in this category
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DepthPositionSidebar;
