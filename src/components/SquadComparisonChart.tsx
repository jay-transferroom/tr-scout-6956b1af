import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSquadAverageRatings, SquadAverageRating } from "@/hooks/useSquadAverageRatings";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTeamLogoUrl } from "@/utils/teamLogos";
import { useState } from "react";

interface SquadComparisonChartProps {
  clubName?: string;
  currentSquadRating?: {
    average_starter_rating: number;
    KeeperRating: number;
    DefenderRating: number;
    CentreBackRating: number;
    LeftBackRating: number;
    RightBackRating: number;
    MidfielderRating: number;
    CentreMidfielderRating: number;
    AttackerRating: number;
    ForwardRating: number;
    WingerRating: number;
  } | null;
}

const SquadComparisonChart = ({ clubName = "Chelsea FC", currentSquadRating }: SquadComparisonChartProps) => {
  const { data: squads, isLoading } = useSquadAverageRatings("Premier League");
  const [selectedPosition, setSelectedPosition] = useState<keyof SquadAverageRating>('average_starter_rating');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Position Comparison</CardTitle>
          <CardDescription>How your squad compares to the competition</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!squads || squads.length === 0) {
    return null;
  }

  // Find Chelsea's squad
  const chelseaSquad = squads.find(s => s.IsChelsea === "Yes" || s.Squad?.toLowerCase().includes("chelsea"));
  const chelseaRank = squads.findIndex(s => s.IsChelsea === "Yes" || s.Squad?.toLowerCase().includes("chelsea")) + 1;

  if (!chelseaSquad) {
    return null;
  }

  const positionCategories = [
    { key: 'average_starter_rating', label: 'Overall Rating', short: 'AVG' },
    { key: 'KeeperRating', label: 'Goalkeeper', short: 'GK' },
    { key: 'DefenderRating', label: 'Defenders', short: 'DEF' },
    { key: 'CentreBackRating', label: 'Centre Backs', short: 'CB' },
    { key: 'MidfielderRating', label: 'Midfielders', short: 'MID' },
    { key: 'AttackerRating', label: 'Attackers', short: 'ATT' },
    { key: 'ForwardRating', label: 'Forwards', short: 'FWD' },
  ];

  const getRankedTeams = () => {
    const sorted = [...squads].sort((a, b) => 
      ((b[selectedPosition] as number) || 0) - ((a[selectedPosition] as number) || 0)
    );
    return sorted.map((squad, index) => ({
      position: index + 1,
      squad: squad.Squad || '',
      rating: (squad[selectedPosition] as number) || 0,
      isChelsea: squad.IsChelsea === "Yes" || squad.Squad?.toLowerCase().includes("chelsea")
    }));
  };

  const rankedTeams = getRankedTeams();
  const selectedPositionLabel = positionCategories.find(p => p.key === selectedPosition)?.label || "Overall";

  const getPositionRank = (position: keyof SquadAverageRating) => {
    const sorted = [...squads].sort((a, b) => 
      (b[position] as number || 0) - (a[position] as number || 0)
    );
    
    // If using current rating, calculate hypothetical rank
    if (hasCurrentRating) {
      const currentValue = displayRating[position] as number || 0;
      return sorted.filter(s => ((s[position] as number) || 0) > currentValue).length + 1;
    }
    
    return sorted.findIndex(s => s.squadid === chelseaSquad.squadid) + 1;
  };

  const getPositionComparison = (position: keyof SquadAverageRating) => {
    const currentValue = displayRating[position] as number || 0;
    const leagueAvg = squads.reduce((sum, s) => sum + ((s[position] as number) || 0), 0) / squads.length;
    const diff = currentValue - leagueAvg;
    return { value: currentValue, avg: leagueAvg, diff };
  };

  // Use current squad rating if available, otherwise use Chelsea's DB rating
  const displayRating = currentSquadRating || chelseaSquad;
  const hasCurrentRating = !!currentSquadRating;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left side - Position comparison */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">League Position Comparison</CardTitle>
              <CardDescription className="text-xs mt-1">How your squad compares to the Premier League</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              #{chelseaRank} of {squads.length}
            </Badge>
          </div>
          {hasCurrentRating && (
            <Badge variant="outline" className="text-xs mt-2 w-fit">
              Live Preview
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Position Breakdown */}
          <div>
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Position-by-Position Breakdown</h3>
            <div className="space-y-2 sm:space-y-3">
              {positionCategories.map(({ key, label, short }) => {
                const comparison = getPositionComparison(key as keyof SquadAverageRating);
                const rank = getPositionRank(key as keyof SquadAverageRating);
                const isAboveAvg = comparison.diff > 0;
                const isEqual = Math.abs(comparison.diff) < 0.5;

                return (
                  <div 
                    key={key} 
                    className={`border rounded-lg p-2 sm:p-3 cursor-pointer transition-all ${
                      selectedPosition === key ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'hover:bg-grey-50'
                    }`}
                    onClick={() => setSelectedPosition(key as keyof SquadAverageRating)}
                  >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {short}
                      </Badge>
                      <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        #{rank}
                      </Badge>
                      <span className="font-semibold text-xs sm:text-base">{comparison.value.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full ${
                        isAboveAvg ? 'bg-green-500' : isEqual ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (comparison.value / 100) * 100)}%` 
                      }}
                    />
                    {/* League average marker */}
                    <div 
                      className="absolute h-full w-0.5 bg-foreground/40"
                      style={{ 
                        left: `${Math.min(100, (comparison.avg / 100) * 100)}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="truncate">League avg: {comparison.avg.toFixed(1)}</span>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {isEqual ? (
                        <>
                          <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                          <span className="text-amber-600">Equal</span>
                        </>
                      ) : isAboveAvg ? (
                        <>
                          <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                          <span className="text-green-600">+{comparison.diff.toFixed(1)}</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" />
                          <span className="text-red-600">{comparison.diff.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right side - League table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{selectedPositionLabel} Rankings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Premier League standings by position rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs sm:text-sm">#</TableHead>
                      <TableHead className="text-xs sm:text-sm">Team</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedTeams.map((team) => (
                      <TableRow 
                        key={team.squad}
                        className={team.isChelsea ? 'bg-primary/10 font-medium' : ''}
                      >
                        <TableCell className="font-medium text-xs sm:text-sm">{team.position}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 flex items-center justify-center">
                              <img 
                                src={getTeamLogoUrl(team.squad)} 
                                alt={team.squad}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm truncate">{team.squad}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{team.rating.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadComparisonChart;
