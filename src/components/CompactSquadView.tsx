import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, LayoutGrid, List, Eye, Minimize2, Maximize2, X, ChevronUp, AlertTriangle, TrendingDown, Target, Star, TrendingUp, ArrowRight, UserPlus, ListPlus, UserCheck } from "lucide-react";
import { Player } from "@/types/player";
import CompactFootballPitch from "./CompactFootballPitch";
import SquadListView from "./SquadListView";
import SquadRecommendations from "./SquadRecommendations";
import SquadPitchLegend from "./SquadPitchLegend";
import { useNavigate } from "react-router-dom";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import { useShortlists } from "@/hooks/useShortlists";
import AssignScoutDialog from "./AssignScoutDialog";
import { usePlayerScouts } from "@/hooks/usePlayerScouts";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CompactSquadViewProps {
  squadPlayers: Player[];
  selectedSquad: string;
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  onPositionClick?: (position: string) => void;
  selectedPosition?: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
}

const CompactSquadView = ({ 
  squadPlayers, 
  selectedSquad, 
  formation,
  positionAssignments = [],
  onPositionClick, 
  selectedPosition,
  onPlayerChange 
}: CompactSquadViewProps) => {
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<Player | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [playerToAssign, setPlayerToAssign] = useState<Player | null>(null);
  const navigate = useNavigate();
  
  // Fetch all players for recommendations
  const { data: allPlayers = [] } = usePlayersData();
  
  // Fetch squad recommendations
  const { data: recommendations = [] } = useSquadRecommendations();
  
  // Fetch shortlists
  const { shortlists, addPlayerToShortlist, getPlayerShortlists } = useShortlists();

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayerForDetails(player);
  };

  const handlePositionClick = (position: string) => {
    onPositionClick?.(position);
  };

  const handleViewFullPitch = () => {
    // You could navigate to a full pitch view or open a modal
    // For now, we'll just clear selections
    onPositionClick?.('');
  };

  const handleViewPlayerProfile = (player: Player) => {
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  const handleShortlistPlayerClick = (playerId: string, isPrivate: boolean = false) => {
    if (isPrivate) {
      navigate(`/private-player/${playerId}`);
    } else {
      navigate(`/player/${playerId}`);
    }
  };

  const handleAddToShortlist = async (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find first non-scouting shortlist or create one
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

  // Map specific pitch positions to general position categories
  const mapPositionToCategory = (position: string): string => {
    if (position === 'GK') return 'GK';
    if (['CB', 'CB1', 'CB2', 'CB3'].includes(position)) return 'CB';
    if (['LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'FB';
    if (['CDM', 'CDM1', 'CDM2', 'CM', 'CM1', 'CM2', 'CM3', 'CAM'].includes(position)) return 'CM';
    if (['LW', 'RW', 'LM', 'RM'].includes(position)) return 'W';
    if (['ST', 'ST1', 'ST2', 'CF'].includes(position)) return 'ST';
    return position;
  };

  // Get position-specific eligible players
  const getPositionEligiblePlayers = (position: string): Player[] => {
    const positionMapping: Record<string, string[]> = {
      'GK': ['GK'],
      'LB': ['LB', 'LWB'],
      'CB': ['CB'],
      'CB1': ['CB'],
      'CB2': ['CB'],
      'CB3': ['CB'],
      'RB': ['RB', 'RWB'],
      'CDM': ['CM', 'CDM'],
      'CDM1': ['CM', 'CDM'],
      'CDM2': ['CM', 'CDM'],
      'CM': ['CM', 'CAM'],
      'CM1': ['CM', 'CAM'],
      'CM2': ['CM', 'CAM'],
      'CM3': ['CM', 'CAM'],
      'CAM': ['CAM', 'CM'],
      'LM': ['LM', 'W', 'LW'],
      'RM': ['RM', 'W', 'RW'],
      'LW': ['W', 'LW', 'LM'],
      'RW': ['W', 'RW', 'RM'],
      'ST': ['F', 'FW', 'ST', 'CF'],
      'ST1': ['F', 'FW', 'ST', 'CF'],
      'ST2': ['F', 'FW', 'ST', 'CF'],
    };

    const allowedPositions = positionMapping[position] || [];
    
    return squadPlayers.filter(player =>
      player.positions.some(pos => allowedPositions.includes(pos))
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  };

  // Filter players based on selected position
  const positionEligiblePlayers = useMemo(() => {
    if (!selectedPosition) return [];
    return getPositionEligiblePlayers(selectedPosition);
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
    
    // Get all player IDs from shortlists
    const shortlistPlayerIds = shortlists.flatMap(s => s.playerIds || []);
    
    // Filter players from all database that are in shortlists and match this position
    return allPlayers.filter(p => 
      shortlistPlayerIds.includes(p.id) &&
      p.positions.some(pos => requiredPositions.includes(pos)) &&
      !squadPlayers.some(squadPlayer => squadPlayer.id === p.id) // Exclude current squad players
    ).sort((a, b) => {
      const ratingA = a.transferroomRating || a.xtvScore || 0;
      const ratingB = b.transferroomRating || b.xtvScore || 0;
      return ratingB - ratingA;
    });
  }, [selectedPosition, shortlists, allPlayers, squadPlayers]);

  // Get position analysis for header
  const getPositionAnalysis = (position: string) => {
    const category = mapPositionToCategory(position);
    
    const positionConfig: Record<string, { displayName: string; requiredPositions: string[]; needed: number }> = {
      'GK': { displayName: 'Goalkeeper', requiredPositions: ['GK'], needed: 2 },
      'CB': { displayName: 'Centre Back', requiredPositions: ['CB'], needed: 4 },
      'FB': { displayName: 'Full Back', requiredPositions: ['LB', 'RB', 'LWB', 'RWB'], needed: 4 },
      'CM': { displayName: 'Central Midfield', requiredPositions: ['CM', 'CDM', 'CAM'], needed: 6 },
      'W': { displayName: 'Winger', requiredPositions: ['LW', 'RW', 'LM', 'RM', 'W'], needed: 4 },
      'ST': { displayName: 'Striker', requiredPositions: ['ST', 'CF', 'F', 'FW'], needed: 3 }
    };

    const config = positionConfig[category] || { displayName: position, requiredPositions: [], needed: 1 };
    
    const positionPlayers = squadPlayers.filter(p => 
      p.positions.some(playerPos => config.requiredPositions.includes(playerPos))
    );

    const current = positionPlayers.length;
    const ratings = positionPlayers.map(p => p.transferroomRating || p.xtvScore || 0);
    const averageRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    const topRating = ratings.length > 0 ? Math.max(...ratings).toFixed(1) : 'N/A';

    // Contract and age risk analysis
    const contractRisks = positionPlayers.filter(p => {
      if (!p.contractExpiry) return false;
      const expiryDate = new Date(p.contractExpiry);
      const now = new Date();
      const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsUntilExpiry <= 12;
    }).length;

    const ageRisks = positionPlayers.filter(p => p.age >= 30).length;

    // Determine priority
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong';
    let recruitmentSuggestion: string;

    if (current === 0) {
      priority = 'Critical';
      recruitmentSuggestion = 'Immediate recruitment required - consider multiple targets';
    } else if (current < config.needed / 2) {
      priority = 'Critical';
      recruitmentSuggestion = 'Priority recruitment target - focus on proven quality';
    } else if (current < config.needed) {
      if (parseFloat(averageRating as string) < 65) {
        priority = 'High';
        recruitmentSuggestion = 'Target higher-rated players to improve squad depth and quality';
      } else {
        priority = 'Medium';
        recruitmentSuggestion = 'Add depth with promising young players or experienced squad players';
      }
    } else if (current === config.needed) {
      if (contractRisks > 0 || ageRisks > 0) {
        priority = 'Medium';
        recruitmentSuggestion = 'Monitor contract and age situations - consider succession planning';
      } else if (parseFloat(averageRating as string) < 70) {
        priority = 'Low';
        recruitmentSuggestion = 'Adequate depth - consider quality upgrades opportunistically';
      } else {
        priority = 'Strong';
        recruitmentSuggestion = 'Strong position - maintain quality through targeted additions';
      }
    } else {
      priority = 'Strong';
      recruitmentSuggestion = 'Excellent depth and quality';
    }

    return {
      displayName: config.displayName,
      current,
      needed: config.needed,
      averageRating,
      topRating,
      contractRisks,
      ageRisks,
      priority,
      recruitmentSuggestion
    };
  };

  const getPriorityIcon = (priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong') => {
    switch (priority) {
      case 'Critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'High': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'Medium': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'Strong': return <Star className="h-4 w-4 text-green-500" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong') => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Strong': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="h-full w-full">
      
      {!isMinimized ? (
        <div className="flex gap-4 w-full px-0">
          {/* Left Side - Pitch View */}
          <div className="w-1/2">
            <div className="space-y-2 sticky top-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Formation View</h3>
                  {formation && (
                    <Badge variant="outline" className="text-xs">
                      {formation}
                    </Badge>
                  )}
                </div>
                <SquadPitchLegend />
              </div>
              
              <div className="aspect-[392/541] w-full max-w-2xl mx-auto relative overflow-visible">
                <CompactFootballPitch 
                  players={squadPlayers}
                  squadType={selectedSquad}
                  formation={formation}
                  positionAssignments={positionAssignments}
                  onPositionClick={handlePositionClick}
                  selectedPosition={selectedPosition}
                  onPlayerChange={onPlayerChange}
                  priorityPositions={recommendations.map(rec => rec.Position)}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Squad List (Scrollable) */}
          <div className="w-1/2 overflow-y-auto">
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Squad List</h3>
              </div>
              
              <div>
                <SquadListView 
                  players={squadPlayers}
                  squadType={selectedSquad}
                  formation={formation}
                  positionAssignments={positionAssignments}
                  onPlayerClick={handlePlayerClick}
                  selectedPlayer={selectedPlayerForDetails}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Squad view minimized - {squadPlayers.length} players available</p>
        </div>
      )}

      {/* Position Selection Slide-out */}
      <Sheet open={!!selectedPosition} onOpenChange={(open) => !open && handlePositionClick('')}>
        <SheetContent side="right" className="w-[50vw] overflow-y-auto">
          {selectedPosition && (() => {
            const analysis = getPositionAnalysis(selectedPosition);
            
            return (
              <>
                <SheetHeader className="space-y-4">
                  {/* Position Analysis Summary as Header */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(analysis.priority)}
                        <span className="font-medium text-lg">{analysis.displayName}</span>
                        <Badge variant={getPriorityColor(analysis.priority) as any}>
                          {analysis.priority}
                        </Badge>
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
                      <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                          {analysis.contractRisks > 0 && `${analysis.contractRisks} contract risk${analysis.contractRisks > 1 ? 's' : ''}`}
                          {analysis.contractRisks > 0 && analysis.ageRisks > 0 && ', '}
                          {analysis.ageRisks > 0 && `${analysis.ageRisks} aging player${analysis.ageRisks > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                    
                    {/* Database Recommendation - Replaces Recruitment Strategy */}
                    {(() => {
                      const category = mapPositionToCategory(selectedPosition);
                      const positionMap: Record<string, string> = {
                        'GK': 'Goalkeeper',
                        'CB': 'Centre Back',
                        'FB': 'Full Back',
                        'CM': 'Central Midfield',
                        'W': 'Winger',
                        'ST': 'Striker'
                      };
                      const displayName = positionMap[category];
                      
                      // Find database recommendation with case-insensitive matching and specific position handling
                      const dbRec = recommendations.find(rec => {
                        const recPosition = rec.Position.toLowerCase();
                        const expectedPosition = displayName?.toLowerCase();
                        
                        // Handle specific position names
                        if (recPosition === 'right back' || recPosition === 'left back') {
                          return expectedPosition === 'full back';
                        }
                        
                        return recPosition === expectedPosition;
                      });
                      
                      if (dbRec) {
                        return (
                          <div className="pt-2 border-t">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-full flex-shrink-0">
                                  <Target className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-blue-900 mb-1 text-sm">
                                    Recruitment Priority Identified
                                  </h4>
                                  <p className="text-xs text-blue-700">
                                    {dbRec.Reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Recruitment Strategy:</p>
                          <p className="text-sm text-muted-foreground">{analysis.recruitmentSuggestion}</p>
                        </div>
                      );
                    })()}
                  </div>
                </SheetHeader>

                <Tabs defaultValue="select" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="select">Select Player</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    <TabsTrigger value="shortlists">Shortlists</TabsTrigger>
                  </TabsList>

                  <TabsContent value="select" className="mt-6">
                    <div className="space-y-3">
                      <SquadListView 
                        players={positionEligiblePlayers}
                        squadType={selectedSquad}
                        formation={formation}
                        positionAssignments={positionAssignments}
                        onPlayerClick={(player) => {
                          if (onPlayerChange && selectedPosition) {
                            onPlayerChange(selectedPosition, player.id);
                          }
                          handlePositionClick('');
                        }}
                        selectedPlayer={positionEligiblePlayers.find(p => p.id === (positionAssignments.find(a => a.position === selectedPosition)?.player_id)) || null}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="mt-6">
                    <div className="space-y-3">
                      <SquadRecommendations 
                        players={squadPlayers}
                        selectedPosition={mapPositionToCategory(selectedPosition)}
                        onPositionSelect={(pos) => handlePositionClick(pos)}
                        allPlayers={allPlayers}
                        onAddToShortlist={handleAddToShortlist}
                        onAssignScout={handleAssignScout}
                        onViewProfile={handleViewPlayerProfile}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="shortlists" className="mt-6">
                    <div className="space-y-3">
                      {shortlistedPlayers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">From Shortlists</h3>
                            <Badge variant="outline" className="text-xs">
                              {shortlistedPlayers.length} player{shortlistedPlayers.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            {shortlistedPlayers.map((player) => {
                              const PlayerScoutsComponent = () => {
                                const { data: scouts = [] } = usePlayerScouts(player.id);
                                const hasScout = scouts.length > 0;
                                
                                return (
                                  <div
                                    key={player.id}
                                    className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-all group"
                                  >
                                    <Avatar className="h-12 w-12 cursor-pointer" onClick={() => handleShortlistPlayerClick(player.id, player.isPrivatePlayer)}>
                                      <AvatarImage src={player.image} alt={player.name} />
                                      <AvatarFallback className="text-sm">
                                        {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleShortlistPlayerClick(player.id, player.isPrivatePlayer)}>
                                      <div className="font-medium truncate text-base">{player.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {player.club} • {player.age}y • {player.nationality}
                                      </div>
                                      {hasScout && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            <UserCheck className="h-3 w-3 mr-1" />
                                            Scout assigned
                                          </Badge>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {player.positions.slice(0, 2).map((pos, idx) => (
                                        <Badge key={idx} variant="outline" className="text-sm">
                                          {pos}
                                        </Badge>
                                      ))}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-base">
                                        {Math.round(player.transferroomRating || player.xtvScore || 0)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleShortlistPlayerClick(player.id, player.isPrivatePlayer)}
                                        title="View Profile"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleAssignScout(player, e)}
                                        title="Assign Scout"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              };
                              
                              return <PlayerScoutsComponent key={player.id} />;
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No shortlisted players available for {selectedPosition} position
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Player Details Slide-out */}
      <Sheet open={!!selectedPlayerForDetails} onOpenChange={(open) => !open && setSelectedPlayerForDetails(null)}>
        <SheetContent side="right" className="w-[50vw]">
          {selectedPlayerForDetails && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPlayerForDetails.name}</SheetTitle>
                <SheetDescription>
                  {selectedPlayerForDetails.positions.join(", ")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Player Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Age</div>
                      <div className="font-medium">{selectedPlayerForDetails.age}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Nationality</div>
                      <div className="font-medium">{selectedPlayerForDetails.nationality}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Club</div>
                      <div className="font-medium">{selectedPlayerForDetails.club}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Contract Expiry</div>
                      <div className="font-medium">
                        {selectedPlayerForDetails.contractExpiry || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Ratings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPlayerForDetails.transferroomRating && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Overall</span>
                        <Badge variant="secondary" className="text-base">
                          {Math.round(selectedPlayerForDetails.transferroomRating)}
                        </Badge>
                      </div>
                    )}
                    {selectedPlayerForDetails.xtvScore && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">XTV</span>
                        <Badge variant="secondary" className="text-base">
                          {Math.round(selectedPlayerForDetails.xtvScore)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Positions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Positions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayerForDetails.positions.map((pos) => (
                      <Badge key={pos} variant="outline">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => handleViewPlayerProfile(selectedPlayerForDetails)}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Scout Dialog */}
      {playerToAssign && (
        <AssignScoutDialog
          isOpen={!!playerToAssign}
          onClose={() => setPlayerToAssign(null)}
          player={playerToAssign}
        />
      )}
    </div>
  );
};

export default CompactSquadView;