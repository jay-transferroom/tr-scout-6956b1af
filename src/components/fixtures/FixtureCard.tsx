import React from "react";
import { Card } from "@/components/ui/card";
import { ClubBadge } from "@/components/ui/club-badge";
import { MapPin, Calendar, Star, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Color palette for fixture card headers - rotates based on index
const FIXTURE_COLORS = [
  "bg-[#6B4E71]", // Purple/mauve (like Liverpool example)
  "bg-[#D4A84B]", // Gold/mustard (like Leeds example)  
  "bg-[#4A5568]", // Slate gray
  "bg-[#2D5A7B]", // Steel blue
  "bg-[#8B5A2B]", // Saddle brown
  "bg-[#4A6741]", // Forest green
];

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
  colorIndex = 0,
  onClick,
  className,
  variant = "default",
}) => {
  const hasScore = homeScore !== null && awayScore !== null;
  const headerColor = FIXTURE_COLORS[colorIndex % FIXTURE_COLORS.length];
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
      {/* Colored Header with Teams */}
      <div className={cn("px-4 py-3 text-white", headerColor)}>
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
