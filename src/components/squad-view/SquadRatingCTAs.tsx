import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSquadAverageRatings, SquadAverageRating } from "@/hooks/useSquadAverageRatings";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, Star } from "lucide-react";
import { getTeamLogoUrl } from "@/utils/teamLogos";

interface SquadRatingCTAsProps {
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
  variant?: 'default' | 'compact';
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

export function SquadRatingCTAs({ currentSquadRating, variant = 'default' }: SquadRatingCTAsProps) {
  const { data: squads, isLoading } = useSquadAverageRatings("Premier League");
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [showRankingSheet, setShowRankingSheet] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<keyof SquadAverageRating>('average_starter_rating');

  if (isLoading) {
    return (
      <div className="flex gap-3">
        <Skeleton className="h-16 w-40" />
        <Skeleton className="h-16 w-40" />
      </div>
    );
  }

  if (!squads || squads.length === 0) {
    return null;
  }

  const chelseaSquad = squads.find(s => s.IsChelsea === "Yes" || s.Squad?.toLowerCase().includes("chelsea"));
  
  if (!chelseaSquad) {
    return null;
  }

  const displayRating = currentSquadRating || chelseaSquad;
  const hasCurrentRating = !!currentSquadRating;

  const getPositionRank = (position: keyof SquadAverageRating) => {
    const currentValue = displayRating[position] as number || 0;
    const sorted = [...squads].sort((a, b) => 
      (b[position] as number || 0) - (a[position] as number || 0)
    );
    
    if (hasCurrentRating) {
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

  const getRankedTeams = () => {
    let teamsToRank = [...squads];
    
    if (hasCurrentRating && currentSquadRating) {
      teamsToRank = squads.map(squad => {
        if (squad.IsChelsea === "Yes" || squad.Squad?.toLowerCase().includes("chelsea")) {
          return {
            ...squad,
            [selectedPosition]: displayRating[selectedPosition]
          };
        }
        return squad;
      });
    }
    
    const sorted = teamsToRank.sort((a, b) => 
      ((b[selectedPosition] as number) || 0) - ((a[selectedPosition] as number) || 0)
    );
    
    return sorted.map((squad, index) => ({
      position: index + 1,
      squad: squad.Squad || '',
      rating: (squad[selectedPosition] as number) || 0,
      isChelsea: squad.IsChelsea === "Yes" || squad.Squad?.toLowerCase().includes("chelsea")
    }));
  };

  const overallRating = (displayRating.average_starter_rating as number) || 0;
  const overallRank = getPositionRank('average_starter_rating');
  const selectedPositionLabel = positionCategories.find(p => p.key === selectedPosition)?.label || "Overall";
  const rankedTeams = getRankedTeams();

  // Shared sheets content
  const sheetsContent = (
    <>
      {/* Position Breakdown Sheet */}
      <Sheet open={showRatingSheet} onOpenChange={setShowRatingSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Position-by-Position Breakdown</SheetTitle>
            <SheetDescription>How your squad compares to the Premier League</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            {positionCategories.map(({ key, label, short }) => {
              const comparison = getPositionComparison(key as keyof SquadAverageRating);
              const rank = getPositionRank(key as keyof SquadAverageRating);
              const isAboveAvg = comparison.diff > 0;
              const isEqual = Math.abs(comparison.diff) < 0.5;

              return (
                <div 
                  key={key} 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedPosition === key ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setSelectedPosition(key as keyof SquadAverageRating);
                    setShowRatingSheet(false);
                    setShowRankingSheet(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{short}</Badge>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">#{rank}</Badge>
                      <span className="font-semibold">{comparison.value.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full ${isAboveAvg ? 'bg-green-500' : isEqual ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (comparison.value / 100) * 100)}%` }}
                    />
                    <div 
                      className="absolute h-full w-0.5 bg-foreground/40"
                      style={{ left: `${Math.min(100, (comparison.avg / 100) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>League avg: {comparison.avg.toFixed(1)}</span>
                    <div className="flex items-center gap-1">
                      {isEqual ? (
                        <><Minus className="h-3 w-3 text-amber-500" /><span className="text-amber-600">Equal</span></>
                      ) : isAboveAvg ? (
                        <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-green-600">+{comparison.diff.toFixed(1)}</span></>
                      ) : (
                        <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-red-600">{comparison.diff.toFixed(1)}</span></>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* League Rankings Sheet */}
      <Sheet open={showRankingSheet} onOpenChange={setShowRankingSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedPositionLabel} Rankings</SheetTitle>
            <SheetDescription>Premier League standings by position rating</SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-wrap gap-2 mt-4 pb-4 border-b">
            {positionCategories.map(({ key, short }) => (
              <Button
                key={key}
                variant={selectedPosition === key ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedPosition(key as keyof SquadAverageRating)}
              >
                {short}
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-xs">#</TableHead>
                  <TableHead className="text-xs">Team</TableHead>
                  <TableHead className="text-right text-xs">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedTeams.map((team) => (
                  <TableRow key={team.squad} className={team.isChelsea ? 'bg-primary/10 font-medium' : ''}>
                    <TableCell className="font-medium text-sm">{team.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={getTeamLogoUrl(team.squad)} 
                            alt={team.squad}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <span className="text-sm truncate">{team.squad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">{team.rating.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );

  // Compact variant for header integration
  if (variant === 'compact') {
    return (
      <>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setShowRatingSheet(true)}
        >
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Rating</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{overallRating.toFixed(1)}</Badge>
        </div>
        
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setShowRankingSheet(true)}
        >
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Position</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">#{overallRank}</Badge>
        </div>

        {sheetsContent}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {/* Overall Rating CTA */}
        <Card 
          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors border"
          onClick={() => setShowRatingSheet(true)}
        >
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Star className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">Rating</p>
            <span className="text-sm font-bold">{overallRating.toFixed(1)}</span>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        </Card>

        {/* League Position CTA */}
        <Card 
          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors border"
          onClick={() => setShowRankingSheet(true)}
        >
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">Position</p>
            <span className="text-sm font-bold">#{overallRank}</span>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        </Card>
      </div>

      {sheetsContent}
    </>
  );
}
