import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSquadAverageRatings, SquadAverageRating } from "@/hooks/useSquadAverageRatings";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SquadComparisonChart = ({ clubName = "Chelsea FC" }: { clubName?: string }) => {
  const { data: squads, isLoading } = useSquadAverageRatings("Premier League");

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
    { key: 'KeeperRating', label: 'Goalkeeper', short: 'GK' },
    { key: 'DefenderRating', label: 'Defenders', short: 'DEF' },
    { key: 'CentreBackRating', label: 'Centre Backs', short: 'CB' },
    { key: 'MidfielderRating', label: 'Midfielders', short: 'MID' },
    { key: 'AttackerRating', label: 'Attackers', short: 'ATT' },
    { key: 'ForwardRating', label: 'Forwards', short: 'FWD' },
  ];

  const getPositionRank = (position: keyof SquadAverageRating) => {
    const sorted = [...squads].sort((a, b) => 
      (b[position] as number || 0) - (a[position] as number || 0)
    );
    return sorted.findIndex(s => s.squadid === chelseaSquad.squadid) + 1;
  };

  const getPositionComparison = (position: keyof SquadAverageRating) => {
    const chelseaValue = chelseaSquad[position] as number || 0;
    const leagueAvg = squads.reduce((sum, s) => sum + ((s[position] as number) || 0), 0) / squads.length;
    const diff = chelseaValue - leagueAvg;
    return { value: chelseaValue, avg: leagueAvg, diff };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>League Position Comparison</CardTitle>
            <CardDescription>How your squad compares to the Premier League</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg">
            #{chelseaRank} of {squads.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="p-4 bg-primary/5 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Overall Squad Rating</h3>
            <Badge variant="default" className="text-lg px-3 py-1">
              {chelseaSquad.average_starter_rating?.toFixed(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>League Average: {(squads.reduce((sum, s) => sum + (s.average_starter_rating || 0), 0) / squads.length).toFixed(1)}</span>
            {chelseaSquad.average_starter_rating > (squads.reduce((sum, s) => sum + (s.average_starter_rating || 0), 0) / squads.length) ? (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Above average</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600">
                <TrendingDown className="h-3 w-3" />
                <span>Below average</span>
              </div>
            )}
          </div>
        </div>

        {/* Position Breakdown */}
        <div>
          <h3 className="font-semibold mb-3">Position-by-Position Breakdown</h3>
          <div className="space-y-3">
            {positionCategories.map(({ key, label, short }) => {
              const comparison = getPositionComparison(key as keyof SquadAverageRating);
              const rank = getPositionRank(key as keyof SquadAverageRating);
              const isAboveAvg = comparison.diff > 0;
              const isEqual = Math.abs(comparison.diff) < 0.5;

              return (
                <div key={key} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {short}
                      </Badge>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        #{rank}
                      </Badge>
                      <span className="font-semibold">{comparison.value.toFixed(1)}</span>
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
                  
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>League avg: {comparison.avg.toFixed(1)}</span>
                    <div className="flex items-center gap-1">
                      {isEqual ? (
                        <>
                          <Minus className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-600">Equal</span>
                        </>
                      ) : isAboveAvg ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">+{comparison.diff.toFixed(1)}</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500" />
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
  );
};

export default SquadComparisonChart;
