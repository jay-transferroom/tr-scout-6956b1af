
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubBadge } from "@/components/ui/club-badge";
import { 
  ArrowLeft, 
  Sparkles, 
  Info, 
} from "lucide-react";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { calculateAge } from "@/utils/playerProfileUtils";
import { computeMyRating, DEFAULT_POSITION_WEIGHTS, PositionKey } from "@/data/myRatingWeights";
import { PlayerCareerTab } from "@/components/player-profile/PlayerCareerTab";
import { PlayerFinancialsTab } from "@/components/player-profile/PlayerFinancialsTab";
import { PlayerImpactTab } from "@/components/player-profile/PlayerImpactTab";
import { PlayerPlayingStyleTab } from "@/components/player-profile/PlayerPlayingStyleTab";
import { PlayerInjuriesTab } from "@/components/player-profile/PlayerInjuriesTab";
import { PlayerMatchHistoryTab } from "@/components/player-profile/PlayerMatchHistoryTab";
import { PlayerAlternativesTab } from "@/components/player-profile/PlayerAlternativesTab";
import { PlayerRecentResults } from "@/components/player-profile/PlayerRecentResults";
import { PlayerUpcomingFixtures } from "@/components/player-profile/PlayerUpcomingFixtures";
import PlayerStatusActions from "@/components/PlayerStatusActions";

const POSITION_MAP: Record<string, PositionKey> = {
  'Goalkeeper': 'GK', 'Keeper': 'GK',
  'Centre-Back': 'CB', 'Central Defender': 'CB',
  'Right-Back': 'RB', 'Right Back': 'RB',
  'Left-Back': 'LB', 'Left Back': 'LB',
  'Defensive Midfield': 'DM', 'Defensive Midfielder': 'DM',
  'Central Midfield': 'CM', 'Centre-Midfield': 'CM', 'Central Midfielder': 'CM',
  'Attacking Midfield': 'AM', 'Attacking Midfielder': 'AM',
  'Left Winger': 'W', 'Right Winger': 'W', 'Left Midfield': 'W', 'Right Midfield': 'W', 'Winger': 'W',
  'Centre-Forward': 'F', 'Striker': 'F', 'Second Striker': 'F', 'Forward': 'F',
};

const getPositionKey = (positions: string[]): PositionKey => {
  for (const pos of positions) {
    const key = POSITION_MAP[pos];
    if (key) return key;
  }
  return 'CM'; // fallback
};

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("career");

  const { player, isLoading, error, playerReports } = usePlayerProfile(id);

  const clubRating = player ? computeMyRating(
    player,
    DEFAULT_POSITION_WEIGHTS[getPositionKey(player.positions || [])]
  ) : null;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Player not found</p>
          <p className="text-muted-foreground mb-4">The player you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Player Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          {/* Player Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* Player Avatar with Club Badge Overlay */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-muted overflow-hidden">
                {player.image ? (
                  <img 
                    src={player.image} 
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              {/* Club Badge Overlay - positioned outside the overflow container */}
              <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
                <ClubBadge clubName={player.club} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>
            </div>

            {/* Player Details */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">{player.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground">{player.club}</span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {player.positions?.map((position) => (
                        <Badge key={position} variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                          {position}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">Club Rating</span>
                      <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                      {clubRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">Rating (Pot)</span>
                      <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                        {player.transferroomRating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-base sm:text-lg md:text-xl text-muted-foreground">
                        ({player.futureRating?.toFixed(1) || 'N/A'})
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">xTV</span>
                      <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                      {player.xtvScore ? `€${player.xtvScore.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Status and Actions Bar */}
          <PlayerStatusActions 
            playerId={player.id}
            playerName={player.name}
            playerReports={playerReports}
          />


          {/* Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Player Summary */}
            <Card className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Player summary</CardTitle>
                <button 
                  className="absolute top-4 right-4 text-xs font-medium underline-offset-4 hover:underline flex items-center gap-1"
                  style={{ color: '#600E96' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate AI Summary
                </button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Contracted until</span>
                    <span className="text-xs font-medium">June 2027</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Nationality</span>
                    <span className="text-xs font-medium">{player.nationality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">International caps</span>
                    <span className="text-xs font-medium">90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Age</span>
                    <span className="text-xs font-medium">{calculateAge(player.dateOfBirth)} (15/06/1992)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Height</span>
                    <span className="text-xs font-medium">175cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Foot</span>
                    <span className="text-xs font-medium">{player.dominantFoot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">GBE Status</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Auto-Pass</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Performance summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Available minutes played</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Squad Role</span>
                    <span className="text-xs font-medium">Key Player</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Playing style</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium">Inverted Winger</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Goals + assists / 90</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium">1.1</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">NEW</Badge>
                      <span className="text-xs text-muted-foreground">Max speed</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">34.2 km/h</span>
                      <div className="w-12 h-2 bg-emerald-500 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">NEW</Badge>
                      <span className="text-xs text-muted-foreground">Distance covered / 90</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">8.9 km</span>
                      <div className="w-12 h-2 bg-red-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <span>Physical data provided in partnership with</span>
                    <span className="font-bold">EA FC</span>
                    <Info className="w-3 h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <PlayerRecentResults player={player} />

            {/* Upcoming Fixtures */}
            <PlayerUpcomingFixtures player={player} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6 md:mb-8">
            <TabsTrigger value="career" className="text-xs sm:text-sm">Career</TabsTrigger>
            <TabsTrigger value="financials" className="text-xs sm:text-sm">Financials</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs sm:text-sm">Impact</TabsTrigger>
            <TabsTrigger value="playing-style" className="text-xs sm:text-sm">Playing Style</TabsTrigger>
            <TabsTrigger value="injuries" className="text-xs sm:text-sm">Injuries</TabsTrigger>
            <TabsTrigger value="match-history" className="text-xs sm:text-sm">Match History</TabsTrigger>
            <TabsTrigger value="alternatives" className="text-xs sm:text-sm">Alternatives</TabsTrigger>
          </TabsList>

          <TabsContent value="career">
            <PlayerCareerTab player={player} />
          </TabsContent>
          
          <TabsContent value="financials">
            <PlayerFinancialsTab player={player} />
          </TabsContent>
          
          <TabsContent value="impact">
            <PlayerImpactTab player={player} />
          </TabsContent>
          
          <TabsContent value="playing-style">
            <PlayerPlayingStyleTab player={player} />
          </TabsContent>
          
          <TabsContent value="injuries">
            <PlayerInjuriesTab player={player} />
          </TabsContent>
          
          <TabsContent value="match-history">
            <PlayerMatchHistoryTab player={player} />
          </TabsContent>
          
          <TabsContent value="alternatives">
            <PlayerAlternativesTab player={player} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerProfile;
