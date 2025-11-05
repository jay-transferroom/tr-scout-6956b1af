import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ClubBadge } from "@/components/ui/club-badge";
import { Eye, FileText, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ScoutingAssignmentWithDetails } from "@/hooks/useScoutingAssignments";

interface AssignmentsTableViewProps {
  assignments: ScoutingAssignmentWithDetails[];
}

const AssignmentsTableView = ({ assignments }: AssignmentsTableViewProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: "Pending", variant: "secondary" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
      reviewed: { label: "Reviewed", variant: "default" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };

  const getPriorityTag = (priority?: string) => {
    if (!priority) return null;
    
    return (
      <Tag priority={priority.toLowerCase() as "high" | "medium" | "low"}>
        {priority}
      </Tag>
    );
  };

  const handleViewPlayer = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  const handleCreateReport = (assignment: ScoutingAssignmentWithDetails) => {
    navigate('/report-builder', { 
      state: { 
        selectedPlayerId: assignment.player_id,
        assignmentId: assignment.id 
      } 
    });
  };

  const handleStartReport = (assignment: ScoutingAssignmentWithDetails) => {
    // TODO: Update assignment status to 'in_progress' and navigate to report builder
    handleCreateReport(assignment);
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Club</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={assignment.players?.imageUrl} 
                      alt={assignment.players?.name}
                    />
                    <AvatarFallback>
                      {assignment.players?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{assignment.players?.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ClubBadge clubName={assignment.players?.club || ''} size="sm" />
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {assignment.players?.positions?.join(", ")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {getStatusBadge(assignment.status)}
                </div>
              </TableCell>
              <TableCell>
                {getPriorityTag(assignment.priority)}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {assignment.deadline ? format(new Date(assignment.deadline), 'MMM dd, yyyy') : '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{format(new Date(assignment.created_at), 'MMM dd, yyyy')}</div>
                  {assignment.assigned_by_manager && (
                    <div className="text-muted-foreground">
                      by {assignment.assigned_by_manager.first_name} {assignment.assigned_by_manager.last_name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPlayer(assignment.player_id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {assignment.status === 'assigned' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartReport(assignment)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {(assignment.status === 'in_progress' || assignment.status === 'assigned') && (
                    <Button
                      size="sm"
                      onClick={() => handleCreateReport(assignment)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {assignments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No assignments found matching your filters.
        </div>
      )}
    </div>
  );
};

export default AssignmentsTableView;