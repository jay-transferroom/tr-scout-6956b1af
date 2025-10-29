import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, UserPlus, User, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { ClubBadge } from "@/components/ui/club-badge";

interface PlayerCardProps {
  player: any;
  onAssignScout?: (player: any) => void;
  onViewReport?: (player: any) => void;
  onMarkAsReviewed?: (player: any) => void;
}

const PlayerCard = ({ player, onAssignScout, onViewReport, onMarkAsReviewed }: PlayerCardProps) => {
  const getStatusColor = (status: string) => {
    console.log(status);
    switch (status) {
      case "shortlisted":
        return "shadow-[0_0_0_2px_hsl(var(--grey-200))]";
      case "assigned":
        return "shadow-[0_0_0_2px_hsl(var(--warning-500))]";
      case "in_progress":
        return "shadow-[0_0_0_2px_hsl(var(--warning-500))]";
      case "completed":
        return "shadow-[0_0_0_2px_hsl(var(--success-500))]";
      default:
        return "shadow-[0_0_0_2px_hsl(var(--grey-200))]";
    }
  };

  // Determine if this is a private player based on the playerId format
  const isPrivatePlayer = player.playerId && player.playerId.startsWith("private-");
  const profilePath = isPrivatePlayer
    ? `/private-player/${player.playerId.replace("private-", "")}`
    : `/player/${player.playerId}`;

  // Debug: log completed cards to verify template presence
  if (player?.status === "completed") {
    console.log("PlayerCard completed debug", {
      playerId: player.playerId,
      templateName: player.templateName,
      lastStatusChange: player.lastStatusChange,
    });
  }
  return (
    <Card className={`mb-2 hover:shadow-md transition-all duration-200 ${getStatusColor(player.status)}`}>
      <CardContent className="p-3">
        {/* Compact horizontal player info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={player.avatar} alt={player.playerName} className="object-cover" loading="lazy" />
            <AvatarFallback className="h-8 w-8 flex items-center justify-center text-xs">
              {player.playerName
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{player.playerName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <ClubBadge clubName={player.club} size="sm" />
              <span className="text-xs text-muted-foreground">{player.position}</span>
            </div>
          </div>

          {player.rating && player.rating !== "N/A" && (
            <Badge variant="rating" className="text-sm shrink-0">
              {player.rating}
            </Badge>
          )}
        </div>

        {/* Status and metadata */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {player.status === "shortlisted"
                ? "Available for assignment"
                : player.assignedTo === "Unassigned"
                  ? "Unassigned"
                  : `Assigned to ${player.assignedTo}`}
            </span>
            {player.priority && (
              <Badge
                variant={player.priority === "High" ? "error" : player.priority === "Medium" ? "warning" : "neutral"}
                className="text-xs"
              >
                {player.priority}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {player.status === "completed" && player.templateName
                ? `${player.templateName} ${player.lastStatusChange.replace(/^Completed/, "completed")}`
                : player.lastStatusChange}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          {player.status === "shortlisted" && onAssignScout && (
            <Button size="sm" className="w-full" onClick={() => onAssignScout(player)}>
              <UserPlus className="h-3 w-3 mr-1" />
              Assign Scout
            </Button>
          )}

          {player.status === "completed" && (
            <div className="space-y-1.5">
              {onViewReport && (
                <Button size="sm" className="w-full" onClick={() => onViewReport(player)}>
                  <FileText className="h-3 w-3 mr-1" />
                  View Report
                </Button>
              )}

              {onMarkAsReviewed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full hover:bg-accent"
                  onClick={() => onMarkAsReviewed(player)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as Reviewed
                </Button>
              )}
            </div>
          )}

          {player.playerId && (
            <Link to={profilePath} className="block">
              <Button variant="outline" size="sm" className="w-full hover:bg-accent">
                <User className="h-3 w-3 mr-1" />
                View Profile
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
