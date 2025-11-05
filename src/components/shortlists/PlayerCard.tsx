
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScoutAvatars } from "@/components/ui/scout-avatars";
import { MapPin, Calendar, Star, UserPlus, Eye, FileText, MoreHorizontal, Bookmark, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePlayerScouts } from "@/hooks/usePlayerScouts";

interface PlayerCardProps {
  player: any;
  getAssignmentBadge: (playerId: string) => { variant: any; className?: string; children: string; };
  getEuGbeBadge: (status: string) => { variant: any; className?: string; children: string; };
  formatXtvScore: (score: number) => string;
  onAssignScout: (player: any) => void;
  onRemovePlayer: (playerId: string) => void;
}

export const PlayerCard = ({
  player,
  getAssignmentBadge,
  getEuGbeBadge,
  formatXtvScore,
  onAssignScout,
  onRemovePlayer
}: PlayerCardProps) => {
  const navigate = useNavigate();
  const { data: scouts = [] } = usePlayerScouts(player.id.toString());

  const handleCreateReport = () => {
    if (player.isPrivate) {
      // For private players, navigate with the private player data
      navigate('/report-builder', { 
        state: { selectedPrivatePlayer: player } 
      });
    } else {
      // For public players, navigate with the public player data
      navigate('/report-builder', { 
        state: { selectedPlayer: player } 
      });
    }
  };

  const assignmentBadgeProps = getAssignmentBadge(player.id.toString());
  const euGbeBadgeProps = getEuGbeBadge(player.euGbeStatus || 'Pass');

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Player Avatar */}
        <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
          <AvatarImage src={player.image} alt={player.name} />
          <AvatarFallback>
            {player.name.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-semibold text-base sm:text-lg">{player.name}</h3>
                {player.isPrivate && (
                  <Badge variant="secondary">Private Player</Badge>
                )}
                {!player.isPrivate && <Badge {...assignmentBadgeProps} />}
                {!player.isPrivate && <Badge {...euGbeBadgeProps} />}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {player.club}
                </span>
                <span>{player.positions.join(', ')}</span>
                {player.age && <span>{player.age} years</span>}
                <span className="hidden sm:inline">{player.nationality}</span>
              </div>
              {!player.isPrivate && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  {player.transferroomRating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="hidden sm:inline">Rating: </span>{player.transferroomRating}
                    </span>
                  )}
                  {player.futureRating && (
                    <span className="text-green-600">
                      <span className="hidden sm:inline">Potential: </span>{player.futureRating}
                    </span>
                  )}
                  {player.xtvScore && (
                    <span className="text-blue-600">
                      xTV: £{formatXtvScore(player.xtvScore)}M
                    </span>
                  )}
                  {player.contractExpiry && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="hidden sm:inline">Contract: </span>{new Date(player.contractExpiry).getFullYear()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scout Assignment Display */}
          {!player.isPrivate && scouts.length > 0 && (
            <div className="mb-3">
              <ScoutAvatars scouts={scouts} size="sm" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!player.isPrivate && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAssignScout(player)}
                className="text-xs sm:text-sm"
              >
                <UserPlus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{scouts.length > 0 ? "Assign Another Scout" : "Assign Scout"}</span>
              </Button>
            )}
            <Link to={player.profilePath}>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs sm:text-sm"
              >
                <Eye className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">View Profile</span>
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCreateReport}
              className="text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Report</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Move to list
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onRemovePlayer(player.id.toString())}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
