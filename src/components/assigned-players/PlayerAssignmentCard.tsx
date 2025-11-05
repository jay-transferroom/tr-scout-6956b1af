
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Assignment {
  id: string;
  player_id: string;
  status: string;
  priority: string;
  deadline?: string;
  assignment_notes?: string;
  created_at: string;
  players?: {
    name: string;
    club: string;
    positions: string[];
    age: number;
    imageUrl?: string;
  };
}

interface PlayerAssignmentCardProps {
  assignment: Assignment;
}

const PlayerAssignmentCard = ({ assignment }: PlayerAssignmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'reviewed': return 'Reviewed';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return '1 day ago';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return `${Math.floor(diffInDays / 30)} months ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
          <AvatarImage src={assignment.players?.imageUrl || undefined} />
          <AvatarFallback>
            {assignment.players?.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg">{assignment.players?.name}</h3>
          <p className="text-sm text-muted-foreground">{assignment.players?.club}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {assignment.players?.positions.join(', ')}
            </p>
            {assignment.players?.age && (
              <>
                <span className="text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">{assignment.players.age} yrs</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Priority:</span>
          <Tag priority={assignment.priority?.toLowerCase() as "high" | "medium" | "low"}>
            {assignment.priority}
          </Tag>
        </div>
        
        {assignment.deadline && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deadline:</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(assignment.deadline)}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Assigned:</span>
          <span>{getTimeAgo(assignment.created_at)}</span>
        </div>

        {assignment.assignment_notes && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Notes:</p>
            <p className="text-gray-700 text-xs bg-gray-50 p-2 rounded">
              {assignment.assignment_notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {assignment.status !== 'completed' && assignment.status !== 'reviewed' ? (
          <Link to={`/report-builder?playerId=${assignment.player_id}&assignmentId=${assignment.id}`} className="flex-1">
            <Button className="w-full" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Write Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </Link>
        ) : (
          <Button variant="default" className="flex-1" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Report</span>
            <span className="sm:hidden">View</span>
          </Button>
        )}
        <Link to={`/player/${assignment.player_id}`} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full" size="sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default PlayerAssignmentCard;
