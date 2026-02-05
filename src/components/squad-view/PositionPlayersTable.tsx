import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/player";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Plus, ArrowRight, AlertTriangle, Star, TrendingDown, Target, TrendingUp, ListPlus, UserPlus, Sparkles, Users, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShortlists } from "@/hooks/useShortlists";
import { ScrollArea } from "@/components/ui/scroll-area";
import AssignScoutDialog from "@/components/AssignScoutDialog";
import { toast } from "@/hooks/use-toast";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import { cn } from "@/lib/utils";
interface PositionPlayersTableProps {
  squadPlayers: Player[];
  allPlayers?: Player[];
  selectedPosition: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  onAddPlayerToPosition?: (position: string, playerId: string) => void;
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

const _getPositionLabel = (position: string): string => {
  const labels: Record<string, string> = {
    'GK': 'Goalkeeper',
    'LB': 'Left Back',
    'CB1': 'Centre Back',
    'CB2': 'Centre Back',
    'RB': 'Right Back',
    'CDM': 'Defensive Mid',
    'CDM1': 'Defensive Mid',
    'CDM2': 'Defensive Mid',
    'CM1': 'Central Mid',
    'CM2': 'Central Mid',
    'CAM': 'Attacking Mid',
    'LW': 'Left Wing',
    'RW': 'Right Wing',
    'LM': 'Left Mid',
    'RM': 'Right Mid',
    'ST': 'Striker',
    'ST1': 'Striker',
    'ST2': 'Striker',
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

const PositionPlayersTable = ({
  squadPlayers,
  allPlayers = [],
  selectedPosition,
  onPlayerChange,
  onAddPlayerToPosition,
}: PositionPlayersTableProps) => {
  const navigate = useNavigate();
  const { shortlists, addPlayerToShortlist } = useShortlists();
  const [playerToAssign, setPlayerToAssign] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<string>("squad");
  const { data: recommendations = [] } = useSquadRecommendations();
  
  const eligiblePlayers = useMemo(() => {
    if (!selectedPosition) return [];
    
    const allowedPositions = getPositionMapping(selectedPosition);
    return squadPlayers
      .filter(player => player.positions.some(pos => allowedPositions.includes(pos)))
      .sort((a, b) => {
        const ratingA = a.transferroomRating || a.xtvScore || 0;
        const ratingB = b.transferroomRating || b.xtvScore || 0;
        return ratingB - ratingA;
      });
  }, [selectedPosition, squadPlayers]);

  // Get shortlisted players for the selected position
  const shortlistedPlayers = useMemo(() => {
    if (!selectedPosition) return [];
    
    const category = mapPositionToCategory(selectedPosition);
    
    const positionConfig: Record<string, string[]> = {
      'GK': ['GK'],
      'CB': ['CB'],
      'FB': ['LB', 'RB', 'LWB', 'RWB'],
      'CM': ['CM', 'CDM', 'CAM'],
      'W': ['LW', 'RW', 'LM', 'RM', 'W'],
      'ST': ['ST', 'CF', 'F', 'FW']
    };

    const requiredPositions = positionConfig[category] || [];
    const shortlistPlayerIds = shortlists.flatMap(s => s.playerIds || []);
    
    return allPlayers.filter(p => 
      shortlistPlayerIds.includes(p.id) &&
      p.positions.some(pos => requiredPositions.includes(pos)) &&
      !squadPlayers.some(squadPlayer => squadPlayer.id === p.id)
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  }, [selectedPosition, shortlists, allPlayers, squadPlayers]);

  // Get recommended players for the selected position
  // Get recommended players for the selected position
  const recommendedPlayers = useMemo(() => {
    if (!selectedPosition) return [];
    
    const category = mapPositionToCategory(selectedPosition);
    
    // Map categories to recommendation keywords
    const categoryToKeywords: Record<string, string[]> = {
      'GK': ['goalkeeper', 'gk', 'keeper'],
      'CB': ['centre back', 'center back', 'cb', 'defender'],
      'FB': ['right back', 'left back', 'rb', 'lb', 'full back', 'fullback', 'wing back'],
      'CM': ['midfielder', 'midfield', 'cm', 'cdm', 'cam', 'central mid'],
      'W': ['winger', 'wing', 'lw', 'rw', 'wide'],
      'ST': ['striker', 'forward', 'st', 'cf', 'attacker']
    };

    const keywords = categoryToKeywords[category] || [];
    
    // Check if this position has recommendations - more flexible matching
    const hasRecommendation = recommendations.some(r => {
      const posLower = r.Position?.toLowerCase() || '';
      return keywords.some(kw => posLower.includes(kw));
    });

    if (!hasRecommendation) return [];

    const positionConfig: Record<string, string[]> = {
      'GK': ['GK'],
      'CB': ['CB'],
      'FB': ['LB', 'RB', 'LWB', 'RWB'],
      'CM': ['CM', 'CDM', 'CAM'],
      'W': ['LW', 'RW', 'LM', 'RM', 'W'],
      'ST': ['ST', 'CF', 'F', 'FW']
    };

    const requiredPositions = positionConfig[category] || [];
    const squadPlayerIds = squadPlayers.map(p => p.id);
    
    // Get players that match the position but aren't in squad and have high ratings
    return allPlayers
      .filter(p => 
        !squadPlayerIds.includes(p.id) &&
        p.positions.some(pos => requiredPositions.includes(pos)) &&
        (p.transferroomRating || 0) >= 70
      )
      .sort((a, b) => {
        const ratingA = a.transferroomRating || a.xtvScore || 0;
        const ratingB = b.transferroomRating || b.xtvScore || 0;
        return ratingB - ratingA;
      })
      .slice(0, 10);
  }, [selectedPosition, recommendations, allPlayers, squadPlayers]);

  // Position analysis
  const analysis = useMemo(() => {
    if (!selectedPosition) return null;
    
    const category = mapPositionToCategory(selectedPosition);
    
    const positionConfig: Record<string, { displayName: string; requiredPositions: string[]; needed: number }> = {
      'GK': { displayName: 'Goalkeeper', requiredPositions: ['GK'], needed: 2 },
      'CB': { displayName: 'Centre Back', requiredPositions: ['CB'], needed: 4 },
      'FB': { displayName: 'Full Back', requiredPositions: ['LB', 'RB', 'LWB', 'RWB'], needed: 4 },
      'CM': { displayName: 'Central Midfield', requiredPositions: ['CM', 'CDM', 'CAM'], needed: 6 },
      'W': { displayName: 'Winger', requiredPositions: ['LW', 'RW', 'LM', 'RM', 'W'], needed: 4 },
      'ST': { displayName: 'Striker', requiredPositions: ['ST', 'CF', 'F', 'FW'], needed: 3 }
    };

    const config = positionConfig[category] || { displayName: selectedPosition, requiredPositions: [], needed: 1 };
    
    const positionPlayers = squadPlayers.filter(p => 
      p.positions.some(playerPos => config.requiredPositions.includes(playerPos))
    );

    const current = positionPlayers.length;
    const ratings = positionPlayers.map(p => p.transferroomRating || p.xtvScore || 0);
    const averageRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    const topRating = ratings.length > 0 ? Math.max(...ratings).toFixed(1) : 'N/A';

    const contractRisks = positionPlayers.filter(p => {
      if (!p.contractExpiry) return false;
      const expiryDate = new Date(p.contractExpiry);
      const now = new Date();
      const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsUntilExpiry <= 12;
    }).length;

    const ageRisks = positionPlayers.filter(p => p.age >= 30).length;

    let priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong';
    if (current === 0) {
      priority = 'Critical';
    } else if (current < config.needed / 2) {
      priority = 'Critical';
    } else if (current < config.needed) {
      priority = parseFloat(averageRating as string) < 65 ? 'High' : 'Medium';
    } else if (current === config.needed && (contractRisks > 0 || ageRisks > 0)) {
      priority = 'Medium';
    } else {
      priority = 'Strong';
    }

    return {
      displayName: config.displayName,
      current,
      needed: config.needed,
      averageRating,
      topRating,
      contractRisks,
      ageRisks,
      priority
    };
  }, [selectedPosition, squadPlayers]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'High': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'Medium': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'Strong': return <Star className="h-4 w-4 text-green-500" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Critical': 
        return 'text-destructive bg-destructive/10';
      case 'High': 
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30';
      case 'Medium': 
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
      case 'Strong':
        return 'text-green-600 bg-green-50 dark:bg-green-950/30';
      default: 
        return 'text-muted-foreground bg-muted/50';
    }
  };

  const handleAddToShortlist = async (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    const userShortlist = shortlists.find(s => !s.is_scouting_assignment_list);
    
    if (!userShortlist) {
      toast({
        title: "No shortlist available",
        description: "Please create a shortlist first",
        variant: "destructive"
      });
      return;
    }

    try {
      await addPlayerToShortlist(userShortlist.id, player.id);
      toast({
        title: "Added to shortlist",
        description: `${player.name} has been added to ${userShortlist.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player to shortlist",
        variant: "destructive"
      });
    }
  };

  const handleAssignScout = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayerToAssign(player);
  };

  const renderPlayerRow = (player: Player, showShortlistActions = false) => (
    <div
      key={player.id}
      className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => navigate(player.isPrivatePlayer ? `/private-player/${player.id}` : `/player/${player.id}`)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <PlayerAvatar 
          playerName={player.name} 
          avatarUrl={player.image} 
          size="sm" 
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{player.name}</p>
          <p className="text-xs text-muted-foreground">
            {player.positions.join(', ')} • Age {player.age}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">
        {player.transferroomRating && (
          <Badge variant="outline" className="text-xs">
            {player.transferroomRating}
          </Badge>
        )}
        {showShortlistActions ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => handleAddToShortlist(player, e)}
            >
              <ListPlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => handleAssignScout(player, e)}
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onPlayerChange?.(selectedPosition!, player.id);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(player.isPrivatePlayer ? `/private-player/${player.id}` : `/player/${player.id}`);
          }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  if (!selectedPosition) {
    return (
      <div className="bg-card border rounded-lg p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a position on the pitch to see eligible players
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Position Analysis Header */}
      {analysis && (
        <div className="px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getPriorityIcon(analysis.priority)}
              <span className="font-medium">{analysis.displayName}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded",
                getPriorityStyles(analysis.priority)
              )}>
                {analysis.priority}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {analysis.current}/{analysis.needed} players
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Avg Rating:</span>
              <span className="ml-2 font-medium">{analysis.averageRating}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Top Rating:</span>
              <span className="ml-2 font-medium">{analysis.topRating}</span>
            </div>
          </div>

          {(analysis.contractRisks > 0 || analysis.ageRisks > 0) && (
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 dark:bg-orange-950/20 p-2 rounded mt-2">
              <AlertTriangle className="h-3 w-3" />
              <span>
                {analysis.contractRisks > 0 && `${analysis.contractRisks} contract risk${analysis.contractRisks > 1 ? 's' : ''}`}
                {analysis.contractRisks > 0 && analysis.ageRisks > 0 && ' • '}
                {analysis.ageRisks > 0 && `${analysis.ageRisks} age concern${analysis.ageRisks > 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab Filter Buttons */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("squad")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === "squad" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Squad
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-xs",
              activeTab === "squad" ? "bg-primary-foreground/20" : "bg-background"
            )}>
              {eligiblePlayers.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("shortlisted")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === "shortlisted" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Heart className="h-3.5 w-3.5" />
            Shortlisted
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-xs",
              activeTab === "shortlisted" ? "bg-primary-foreground/20" : "bg-background"
            )}>
              {shortlistedPlayers.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("recommended")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === "recommended" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Recommended
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-xs",
              activeTab === "recommended" ? "bg-primary-foreground/20" : "bg-background"
            )}>
              {recommendedPlayers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "squad" && (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {eligiblePlayers.length > 0 ? (
                eligiblePlayers.map((player) => renderPlayerRow(player))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No eligible players for this position
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        
        {activeTab === "shortlisted" && (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {shortlistedPlayers.length > 0 ? (
                shortlistedPlayers.map((player) => renderPlayerRow(player, true))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No shortlisted players for this position
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {activeTab === "recommended" && (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {recommendedPlayers.length > 0 ? (
                recommendedPlayers.map((player) => renderPlayerRow(player, true))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No recommended players for this position
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Assign Scout Dialog */}
      {playerToAssign && (
        <AssignScoutDialog
          player={playerToAssign}
          isOpen={!!playerToAssign}
          onClose={() => setPlayerToAssign(null)}
        />
      )}
    </div>
  );
};

export default PositionPlayersTable;