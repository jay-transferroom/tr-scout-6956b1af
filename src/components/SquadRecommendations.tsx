import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Target, TrendingUp, TrendingDown, AlertTriangle, Star, Users, ArrowRight, Lightbulb, Eye, ListPlus, UserPlus } from "lucide-react";
import { Player } from "@/types/player";
import { useNavigate } from "react-router-dom";
import { useShortlists } from "@/hooks/useShortlists";
import { useSquadRecommendations } from "@/hooks/useSquadRecommendations";
import { usePlayerScouts } from "@/hooks/usePlayerScouts";

interface SquadRecommendationsProps {
  players: Player[];
  selectedPosition: string | null;
  onPositionSelect: (position: string) => void;
  allPlayers?: Player[];
  onAddToShortlist?: (player: Player, e: React.MouseEvent) => void;
  onAssignScout?: (player: Player, e: React.MouseEvent) => void;
  onViewProfile?: (player: Player) => void;
}

interface PositionAnalysis {
  name: string;
  displayName: string;
  requiredPositions: string[];
  current: number;
  needed: number;
  averageRating: number;
  topRating: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strong';
  recommendation: string;
  players: Player[];
  contractRisks: number;
  ageRisks: number;
  strengthDescription: string;
  recruitmentSuggestion: string;
}

const SquadRecommendations = ({
  players,
  selectedPosition,
  onPositionSelect,
  allPlayers = [],
  onAddToShortlist,
  onAssignScout,
  onViewProfile
}: SquadRecommendationsProps) => {
  const navigate = useNavigate();
  const { shortlists } = useShortlists();
  const { data: dbRecommendations } = useSquadRecommendations();
  
  // Helper to get database recommendation for a position
  const getDbRecommendation = (positionName: string) => {
    const positionMap: Record<string, string> = {
      'GK': 'Goalkeeper',
      'CB': 'Centre Back',
      'FB': 'Full Back',
      'CM': 'Central Midfield',
      'W': 'Winger',
      'ST': 'Striker'
    };
    
    const displayName = positionMap[positionName];
    return dbRecommendations?.find(rec => rec.Position === displayName);
  };
  
  const analyzeSquadPositions = (): PositionAnalysis[] => {
    const positions = [
      { name: 'GK', displayName: 'Goalkeeper', requiredPositions: ['GK'], needed: 2 },
      { name: 'CB', displayName: 'Centre Back', requiredPositions: ['CB'], needed: 4 },
      { name: 'FB', displayName: 'Full Back', requiredPositions: ['LB', 'RB', 'LWB', 'RWB'], needed: 4 },
      { name: 'CM', displayName: 'Central Midfield', requiredPositions: ['CM', 'CDM', 'CAM'], needed: 6 },
      { name: 'W', displayName: 'Winger', requiredPositions: ['LW', 'RW', 'LM', 'RM', 'W'], needed: 4 },
      { name: 'ST', displayName: 'Striker', requiredPositions: ['ST', 'CF', 'F', 'FW'], needed: 3 }
    ];

    return positions.map(pos => {
      const positionPlayers = players.filter(p => 
        p.positions.some(playerPos => pos.requiredPositions.includes(playerPos))
      );

      const current = positionPlayers.length;
      const ratings = positionPlayers.map(p => p.transferroomRating || p.xtvScore || 0);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const topRating = ratings.length > 0 ? Math.max(...ratings) : 0;

      // Contract and age risk analysis
      const contractRisks = positionPlayers.filter(p => {
        if (!p.contractExpiry) return false;
        const expiryDate = new Date(p.contractExpiry);
        const now = new Date();
        const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        return monthsUntilExpiry <= 12;
      }).length;

      const ageRisks = positionPlayers.filter(p => p.age >= 30).length;

      // Determine priority and recommendations
      let priority: PositionAnalysis['priority'];
      let recommendation: string;
      let strengthDescription: string;
      let recruitmentSuggestion: string;

      if (current === 0) {
        priority = 'Critical';
        recommendation = `URGENT: No players available for ${pos.displayName}`;
        strengthDescription = 'Critical gap';
        recruitmentSuggestion = 'Immediate recruitment required - consider multiple targets';
      } else if (current < pos.needed / 2) {
        priority = 'Critical';
        recommendation = `Severely understaffed - need ${pos.needed - current} more players`;
        strengthDescription = 'Major weakness';
        recruitmentSuggestion = 'Priority recruitment target - focus on proven quality';
      } else if (current < pos.needed) {
        if (averageRating < 65) {
          priority = 'High';
          recommendation = `Need ${pos.needed - current} more players and quality improvement`;
          strengthDescription = 'Below average quality';
          recruitmentSuggestion = 'Target higher-rated players to improve squad depth and quality';
        } else {
          priority = 'Medium';
          recommendation = `Need ${pos.needed - current} more players for adequate depth`;
          strengthDescription = 'Adequate quality, limited depth';
          recruitmentSuggestion = 'Add depth with promising young players or experienced squad players';
        }
      } else if (averageRating >= 75 && topRating >= 80) {
        priority = 'Strong';
        recommendation = `Excellent depth and quality in ${pos.displayName}`;
        strengthDescription = 'Squad strength';
        recruitmentSuggestion = 'Consider selling surplus players or focus on youth development';
      } else if (contractRisks > current / 2 || ageRisks > current / 2) {
        priority = 'Medium';
        recommendation = `Good numbers but contract/age concerns need attention`;
        strengthDescription = 'Risk management needed';
        recruitmentSuggestion = 'Plan for contract renewals or identify younger replacements';
      } else {
        priority = 'Low';
        recommendation = `Adequate depth and quality`;
        strengthDescription = 'Satisfactory';
        recruitmentSuggestion = 'Monitor for opportunities to upgrade quality';
      }

      return {
        name: pos.name,
        displayName: pos.displayName,
        requiredPositions: pos.requiredPositions,
        current,
        needed: pos.needed,
        averageRating: Math.round(averageRating),
        topRating: Math.round(topRating),
        priority,
        recommendation,
        players: positionPlayers.sort((a, b) => 
          (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0)
        ),
        contractRisks,
        ageRisks,
        strengthDescription,
        recruitmentSuggestion
      };
    });
  };

  const positionAnalysis = analyzeSquadPositions();
  
  // Sort by priority for display
  const sortedAnalysis = positionAnalysis.sort((a, b) => {
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Strong': 4 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getPriorityIcon = (priority: PositionAnalysis['priority']) => {
    switch (priority) {
      case 'Critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'High': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'Medium': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'Strong': return <Star className="h-4 w-4 text-green-500" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: PositionAnalysis['priority']) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Strong': return 'default';
      default: return 'outline';
    }
  };

  // Get recruitment recommendations for selected position
  const getRecruitmentRecommendations = (positionName: string) => {
    const analysis = positionAnalysis.find(a => a.name === positionName);
    if (!analysis) return [];

    // Get players from all database that could fill this position
    const eligiblePlayers = allPlayers.filter(p => 
      p.positions.some(pos => analysis.requiredPositions.includes(pos)) &&
      !players.some(squadPlayer => squadPlayer.id === p.id) // Exclude current squad players
    );

    // Sort by rating and return top recommendations
    return eligiblePlayers
      .sort((a, b) => (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0))
      .slice(0, 10);
  };

  const handlePlayerClick = (player: Player) => {
    if (onViewProfile) {
      onViewProfile(player);
    } else if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  // Get shortlist recommendations for selected position
  const getShortlistRecommendations = (positionName: string) => {
    const analysis = positionAnalysis.find(a => a.name === positionName);
    if (!analysis) return [];

    // Get all player IDs from shortlists
    const shortlistPlayerIds = shortlists.flatMap(s => s.playerIds || []);
    
    // Filter players from all database that are in shortlists and match this position
    const eligiblePlayers = allPlayers.filter(p => 
      shortlistPlayerIds.includes(p.id) &&
      p.positions.some(pos => analysis.requiredPositions.includes(pos)) &&
      !players.some(squadPlayer => squadPlayer.id === p.id) // Exclude current squad players
    );

    // Sort by rating and return recommendations
    return eligiblePlayers
      .sort((a, b) => (b.transferroomRating || b.xtvScore || 0) - (a.transferroomRating || a.xtvScore || 0));
  };

  // If a position is selected, show detailed view with DB recommendation
  if (selectedPosition) {
    const analysis = positionAnalysis.find(a => a.name === selectedPosition);
    const dbRec = getDbRecommendation(selectedPosition);
    
    if (!analysis) return null;
    
    return (
      <div className="space-y-4">
        <CardContent className="space-y-4 p-0">
          {/* Recommended Players */}
          {(() => {
            const recommendations = getRecruitmentRecommendations(selectedPosition);
            
            if (recommendations.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recommendations available</p>
                </div>
              );
            }
            
            return (
              <div>
                <h4 className="font-medium mb-2 text-sm">Recommended Players</h4>
                <div className="space-y-1">
                  {recommendations.map((player) => {
                    const { data: scouts = [] } = usePlayerScouts(player.id);
                    const hasScout = scouts.length > 0;
                    
                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-all group"
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0 cursor-pointer" onClick={() => handlePlayerClick(player)}>
                          <AvatarImage src={player.image} alt={player.name} />
                          <AvatarFallback className="text-sm">
                            {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayerClick(player)}>
                          <div className="font-medium truncate text-base">{player.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {player.club} • {player.age}y • {player.nationality}
                          </div>
                          {hasScout && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <UserPlus className="h-3 w-3 mr-1" />
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
                            onClick={(e) => handlePlayerClick(player)}
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onAddToShortlist && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => onAddToShortlist(player, e)}
                              title="Add to Shortlist"
                            >
                              <ListPlus className="h-4 w-4" />
                            </Button>
                          )}
                          {onAssignScout && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => onAssignScout(player, e)}
                              title="Assign Scout"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </div>
    );
  }

  // Default view: Show all positions
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Squad Analysis & Recruitment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {sortedAnalysis.map((analysis) => (
            <div
              key={analysis.name}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedPosition === analysis.name 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : 'hover:border-muted-foreground/20'
              }`}
              onClick={() => onPositionSelect(analysis.name)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(analysis.priority)}
                  <h3 className="font-semibold">{analysis.displayName}</h3>
                  <Badge variant={getPriorityColor(analysis.priority) as any} className="text-xs">
                    {analysis.priority}
                  </Badge>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {analysis.current}/{analysis.needed} players
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quality:</span>
                  <div className="flex items-center gap-2">
                    <span>Avg: {analysis.averageRating || 'N/A'}</span>
                    <span>•</span>
                    <span>Top: {analysis.topRating || 'N/A'}</span>
                  </div>
                </div>
                
                {(analysis.contractRisks > 0 || analysis.ageRisks > 0) && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      {analysis.contractRisks > 0 && `${analysis.contractRisks} contract risk${analysis.contractRisks > 1 ? 's' : ''}`}
                      {analysis.contractRisks > 0 && analysis.ageRisks > 0 && ', '}
                      {analysis.ageRisks > 0 && `${analysis.ageRisks} aging player${analysis.ageRisks > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  <strong>Recruitment:</strong> {analysis.recruitmentSuggestion}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Squad Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Critical Positions:</span>
              <span className="ml-2 font-medium">
                {sortedAnalysis.filter(a => a.priority === 'Critical').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Strong Positions:</span>
              <span className="ml-2 font-medium">
                {sortedAnalysis.filter(a => a.priority === 'Strong').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Players:</span>
              <span className="ml-2 font-medium">{players.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Squad Rating:</span>
              <span className="ml-2 font-medium">
                {players.length > 0 
                  ? Math.round(players.reduce((sum, p) => sum + (p.transferroomRating || p.xtvScore || 0), 0) / players.length)
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default SquadRecommendations;