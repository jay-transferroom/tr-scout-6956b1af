
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
    switch (status) {
      case 'shortlisted': return 'bg-white border-gray-200';
      case 'assigned': return 'bg-orange-100 border-orange-200';
      case 'in_progress': return 'bg-orange-100 border-orange-200';
      case 'completed': return 'bg-green-100 border-green-200';
      default: return 'bg-white border-gray-200';
    }
  };

  // Determine if this is a private player based on the playerId format
  const isPrivatePlayer = player.playerId && player.playerId.startsWith('private-');
  const profilePath = isPrivatePlayer 
    ? `/private-player/${player.playerId.replace('private-', '')}`
    : `/player/${player.playerId}`;

  return (
    <Card className={`mb-2 hover:shadow-md transition-all duration-200 border-2 ${getStatusColor(player.status)}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage 
              src={player.avatar} 
              alt={player.playerName}
              className="object-cover"
              loading="lazy"
            />
            <AvatarFallback className="h-10 w-10 flex items-center justify-center">
              {player.playerName.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{player.playerName}</h4>
            <div className="mt-1">
              <ClubBadge clubName={player.club} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{player.position}</p>
            
            {player.rating && player.rating !== 'N/A' && (
              <div className="flex items-center justify-end mt-1">
                <span className="text-lg font-bold text-primary">{player.rating}</span>
              </div>
            )}
            
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                {player.status === 'shortlisted' ? 'Available for assignment' : `Assigned to ${player.assignedTo}`}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{player.lastStatusChange}</span>
              </div>
              {player.priority && (
                <Badge 
                  variant={player.priority === 'High' ? 'destructive' : player.priority === 'Medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {player.priority}
                </Badge>
              )}
            </div>

            <div className="mt-2 space-y-1">
              {player.status === 'shortlisted' && onAssignScout && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => onAssignScout(player)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign Scout
                </Button>
              )}
              
              {player.status === 'completed' && (
                <div className="space-y-2">
                  {onViewReport && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onViewReport(player)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Report
                    </Button>
                  )}
                  
                  {onMarkAsReviewed && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full bg-white hover:bg-accent"
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-white hover:bg-accent"
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
