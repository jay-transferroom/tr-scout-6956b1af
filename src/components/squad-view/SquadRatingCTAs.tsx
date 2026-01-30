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

        {/* Shared Sheets */}
        {renderSheets()}
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

      <SheetsContent />
    </>
  );
}
