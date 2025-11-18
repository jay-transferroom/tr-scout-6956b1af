import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSquadAverageRatings, SquadAverageRating } from "@/hooks/useSquadAverageRatings";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTeamLogoUrl } from "@/utils/teamLogos";

interface SquadComparisonChartProps {
  clubName?: string;
  currentSquadRating?: number;
  shadowSquadRating?: number;
}

const SquadComparisonChart = ({ 
  clubName = "Chelsea FC",
  currentSquadRating,
  shadowSquadRating 
}: SquadComparisonChartProps) => {
  const { data: squads, isLoading } = useSquadAverageRatings("Premier League");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Squad Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!squads || squads.length === 0) {
    return null;
  }

  // Find Chelsea's squad
  const chelseaSquad = squads.find(s => s.IsChelsea === "Yes" || s.Squad?.toLowerCase().includes("chelsea"));
  
  if (!chelseaSquad) {
    return null;
  }

  const currentRating = currentSquadRating || chelseaSquad.average_starter_rating || 0;
  const shadowRating = shadowSquadRating || currentRating;

  // Calculate rankings for current and shadow squads
  const getCurrentRank = (rating: number) => {
    const sorted = [...squads].sort((a, b) => 
      (b.average_starter_rating || 0) - (a.average_starter_rating || 0)
    );
    return sorted.findIndex(s => (s.average_starter_rating || 0) <= rating) + 1 || squads.length;
  };

  const currentRank = getCurrentRank(currentRating);
  const shadowRank = getCurrentRank(shadowRating);

  // Get top 5 and bottom 2 teams for comparison
  const sortedSquads = [...squads].sort((a, b) => 
    (b.average_starter_rating || 0) - (a.average_starter_rating || 0)
  );
  const topTeams = sortedSquads.slice(0, 5);
  const bottomTeams = sortedSquads.slice(-2);

  return (
    <div className="space-y-3">
      {/* League Position Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">League Ratings</CardTitle>
          <CardDescription className="text-xs">Current vs Shadow Squad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Squad</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{currentRating.toFixed(1)}</p>
                <Badge variant="secondary" className="text-xs">#{currentRank}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Shadow Squad</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{shadowRating.toFixed(1)}</p>
                <Badge variant={shadowRank < currentRank ? "default" : "secondary"} className="text-xs">
                  #{shadowRank}
                </Badge>
              </div>
            </div>
          </div>
          
          {shadowRating !== currentRating && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Change</span>
                <span className={shadowRating > currentRating ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {shadowRating > currentRating ? "+" : ""}{(shadowRating - currentRating).toFixed(1)}
                  {shadowRank !== currentRank && ` (${currentRank - shadowRank > 0 ? "+" : ""}${currentRank - shadowRank} positions)`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Rating Rankings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Premier League Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-12 py-2">#</TableHead>
                <TableHead className="py-2">Team</TableHead>
                <TableHead className="text-right py-2">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topTeams.map((squad, idx) => {
                const isChelsea = squad.IsChelsea === "Yes" || squad.Squad?.toLowerCase().includes("chelsea");
                return (
                  <TableRow key={squad.squadid} className={isChelsea ? "bg-primary/5" : ""}>
                    <TableCell className="py-2 text-xs font-medium">{idx + 1}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <img 
                          src={getTeamLogoUrl(squad.Squad || '')} 
                          alt={squad.Squad || ''} 
                          className="h-4 w-4 object-contain"
                        />
                        <span className="text-xs truncate">{squad.Squad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 text-xs font-medium">
                      {(squad.average_starter_rating || 0).toFixed(1)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedSquads.length > 7 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-1 text-center text-xs text-muted-foreground">
                    ...
                  </TableCell>
                </TableRow>
              )}
              {bottomTeams.map((squad, idx) => (
                <TableRow key={squad.squadid}>
                  <TableCell className="py-2 text-xs font-medium">{sortedSquads.length - 1 + idx}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={getTeamLogoUrl(squad.Squad || '')} 
                        alt={squad.Squad || ''} 
                        className="h-4 w-4 object-contain"
                      />
                      <span className="text-xs truncate">{squad.Squad}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 text-xs font-medium">
                    {(squad.average_starter_rating || 0).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadComparisonChart;
