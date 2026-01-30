import React from "react";
import { Card } from "@/components/ui/card";
import { ClubBadge } from "@/components/ui/club-badge";
import { MapPin, Calendar, Star, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Club primary colors for gradient headers - based on actual club colors
const CLUB_COLORS: Record<string, { from: string; to: string }> = {
  // Premier League
  "Liverpool": { from: "#C8102E", to: "#8B0A1E" },
  "Liverpool FC": { from: "#C8102E", to: "#8B0A1E" },
  "Manchester City": { from: "#6CABDD", to: "#1C2C5B" },
  "Manchester City FC": { from: "#6CABDD", to: "#1C2C5B" },
  "Man City": { from: "#6CABDD", to: "#1C2C5B" },
  "Arsenal": { from: "#EF0107", to: "#9C0004" },
  "Arsenal FC": { from: "#EF0107", to: "#9C0004" },
  "Chelsea": { from: "#034694", to: "#001F3F" },
  "Chelsea FC": { from: "#034694", to: "#001F3F" },
  "Chelsea F.C.": { from: "#034694", to: "#001F3F" },
  "Manchester United": { from: "#DA291C", to: "#8B0000" },
  "Manchester United FC": { from: "#DA291C", to: "#8B0000" },
  "Man United": { from: "#DA291C", to: "#8B0000" },
  "Tottenham": { from: "#132257", to: "#0A1433" },
  "Tottenham Hotspur": { from: "#132257", to: "#0A1433" },
  "Tottenham Hotspur FC": { from: "#132257", to: "#0A1433" },
  "Newcastle": { from: "#241F20", to: "#000000" },
  "Newcastle United": { from: "#241F20", to: "#000000" },
  "Newcastle Utd": { from: "#241F20", to: "#000000" },
  "Aston Villa": { from: "#670E36", to: "#420921" },
  "Aston Villa FC": { from: "#670E36", to: "#420921" },
  "Brighton": { from: "#0057B8", to: "#003C7A" },
  "Brighton & Hove Albion": { from: "#0057B8", to: "#003C7A" },
  "West Ham": { from: "#7A263A", to: "#4A1623" },
  "West Ham United": { from: "#7A263A", to: "#4A1623" },
  "West Ham Utd": { from: "#7A263A", to: "#4A1623" },
  "Bournemouth": { from: "#DA291C", to: "#8B0000" },
  "AFC Bournemouth": { from: "#DA291C", to: "#8B0000" },
  "Fulham": { from: "#000000", to: "#1A1A1A" },
  "Fulham FC": { from: "#000000", to: "#1A1A1A" },
  "Brentford": { from: "#E30613", to: "#9B040D" },
  "Brentford FC": { from: "#E30613", to: "#9B040D" },
  "Crystal Palace": { from: "#1B458F", to: "#0E2A5C" },
  "Crystal Palace FC": { from: "#1B458F", to: "#0E2A5C" },
  "Wolves": { from: "#FDB913", to: "#B8860B" },
  "Wolverhampton": { from: "#FDB913", to: "#B8860B" },
  "Wolverhampton Wanderers": { from: "#FDB913", to: "#B8860B" },
  "Nottingham Forest": { from: "#DD0000", to: "#8B0000" },
  "Nottm Forest": { from: "#DD0000", to: "#8B0000" },
  "Everton": { from: "#003399", to: "#001F5C" },
  "Everton FC": { from: "#003399", to: "#001F5C" },
  "Leicester": { from: "#003090", to: "#001F5C" },
  "Leicester City": { from: "#003090", to: "#001F5C" },
  "Ipswich": { from: "#0033A0", to: "#001F5C" },
  "Ipswich Town": { from: "#0033A0", to: "#001F5C" },
  "Southampton": { from: "#D71920", to: "#8B0000" },
  "Southampton FC": { from: "#D71920", to: "#8B0000" },
  // Championship
  "Leeds": { from: "#FFCD00", to: "#B8960B" },
  "Leeds United": { from: "#FFCD00", to: "#B8960B" },
  "Burnley": { from: "#6C1D45", to: "#3D1027" },
  "Burnley FC": { from: "#6C1D45", to: "#3D1027" },
  "Sunderland": { from: "#EB172B", to: "#9B0D1B" },
  "Sunderland AFC": { from: "#EB172B", to: "#9B0D1B" },
  // European
  "Barcelona": { from: "#A50044", to: "#004D98" },
  "FC Barcelona": { from: "#A50044", to: "#004D98" },
  "Real Madrid": { from: "#FEBE10", to: "#00529F" },
  "Real Madrid CF": { from: "#FEBE10", to: "#00529F" },
  "Bayern Munich": { from: "#DC052D", to: "#8B0000" },
  "FC Bayern Munich": { from: "#DC052D", to: "#8B0000" },
  "Juventus": { from: "#000000", to: "#1A1A1A" },
  "Juventus FC": { from: "#000000", to: "#1A1A1A" },
  "PSG": { from: "#004170", to: "#002040" },
  "Paris Saint-Germain": { from: "#004170", to: "#002040" },
  "Inter Milan": { from: "#010E80", to: "#000850" },
  "Internazionale": { from: "#010E80", to: "#000850" },
  "AC Milan": { from: "#AC1A2F", to: "#6B1020" },
  "Dortmund": { from: "#FDE100", to: "#B8A000" },
  "Borussia Dortmund": { from: "#FDE100", to: "#B8A000" },
  "Atletico Madrid": { from: "#CB3524", to: "#272E61" },
  "Atletico de Madrid": { from: "#CB3524", to: "#272E61" },
};

// Default gradient for unknown clubs
const DEFAULT_GRADIENT = { from: "#4A5568", to: "#2D3748" };

function getClubGradient(clubName: string): { from: string; to: string } {
  // Try exact match first
  if (CLUB_COLORS[clubName]) {
    return CLUB_COLORS[clubName];
  }
  
  // Try partial match
  const lowerName = clubName.toLowerCase();
  for (const [key, value] of Object.entries(CLUB_COLORS)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  return DEFAULT_GRADIENT;
}

interface FixtureCardProps {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue?: string | null;
  competition?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  shortlistedPlayersCount?: number;
  scoutsAssignedCount?: number;
  colorIndex?: number;
  onClick?: () => void;
  className?: string;
  variant?: "compact" | "default";
}

export const FixtureCard: React.FC<FixtureCardProps> = ({
  homeTeam,
  awayTeam,
  matchDate,
  venue,
  competition,
  homeScore,
  awayScore,
  shortlistedPlayersCount = 0,
  scoutsAssignedCount = 0,
  onClick,
  className,
  variant = "default",
}) => {
  const hasScore = homeScore !== null && awayScore !== null;
  const gradient = getClubGradient(homeTeam);
  const formattedDate = format(new Date(matchDate), "d MMM yyyy, HH:mm");
  
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200",
        onClick && "hover:ring-2 hover:ring-primary/20",
        className
      )}
      onClick={onClick}
    >
      {/* Gradient Header with Teams */}
      <div 
        className="px-4 py-3 text-white"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
        }}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Home Team */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <ClubBadge 
              clubName={homeTeam} 
              size="sm" 
              className="bg-white/20 rounded-full p-0.5"
            />
            <span className={cn(
              "font-semibold truncate",
              variant === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            )}>
              {homeTeam}
            </span>
          </div>
          
          {/* VS / Score */}
          <div className="shrink-0 px-2 sm:px-3">
            {hasScore ? (
              <span className={cn(
                "font-bold",
                variant === "compact" ? "text-sm" : "text-lg"
              )}>
                {homeScore} - {awayScore}
              </span>
            ) : (
              <span className={cn(
                "text-white/80 font-medium",
                variant === "compact" ? "text-xs" : "text-sm"
              )}>
                vs
              </span>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex items-center gap-2 flex-1">
            <span className={cn(
              "font-semibold truncate",
              variant === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            )}>
              {awayTeam}
            </span>
            <ClubBadge 
              clubName={awayTeam} 
              size="sm" 
              className="bg-white/20 rounded-full p-0.5"
            />
          </div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className={cn(
        "bg-card",
        variant === "compact" ? "px-3 py-2" : "px-4 py-3"
      )}>
        {/* Venue and Date */}
        <div className={cn(
          "flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground mb-2",
          variant === "compact" ? "text-xs" : "text-sm"
        )}>
          {venue && (
            <div className="flex items-center gap-1">
              <MapPin className={cn(
                variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
              <span className="truncate max-w-[120px]">{venue}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className={cn(
              variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
            )} />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className={cn(
          "flex flex-wrap gap-x-4 gap-y-1",
          variant === "compact" ? "text-xs" : "text-sm"
        )}>
          {shortlistedPlayersCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className={cn(
                "text-amber-500",
                variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
              <span>Shortlisted Players ({shortlistedPlayersCount})</span>
            </div>
          )}
          {scoutsAssignedCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className={cn(
                variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
              <span>Scouts Assigned ({scoutsAssignedCount})</span>
            </div>
          )}
          {shortlistedPlayersCount === 0 && scoutsAssignedCount === 0 && competition && (
            <div className="text-muted-foreground">
              {competition}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FixtureCard;
