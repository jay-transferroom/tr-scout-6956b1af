import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, UserPlus, CheckCircle, FileText } from "lucide-react";
import { ClubBadge } from "@/components/ui/club-badge";

interface TableViewProps {
  kanbanData: {
    shortlisted: any[];
    assigned: any[];
    completed: any[];
  };
  onAssignScout?: (player: any) => void;
  onViewReport?: (player: any) => void;
  onMarkAsReviewed?: (player: any) => void;
}

const ScoutManagementTableView = ({ 
  kanbanData, 
  onAssignScout, 
  onViewReport, 
  onMarkAsReviewed 
}: TableViewProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Combine all assignments from different columns
  const allAssignments = [
    ...kanbanData.shortlisted.map(p => ({ ...p, status: 'shortlisted' })),
    ...kanbanData.assigned.map(p => ({ ...p, status: 'assigned' })),
    ...kanbanData.completed.map(p => ({ ...p, status: 'completed' }))
  ];

  const PlayerRow = ({ assignment }: { assignment: any }) => {
    // No need to fetch scouts here since each row represents one assignment
    
    return (
      <tr key={`${assignment.playerId}-${assignment.scoutId || 'unassigned'}`} className="border-b hover:bg-muted/30">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage 
                src={assignment.avatar} 
                alt={assignment.playerName}
                loading="lazy"
                className="object-cover"
              />
              <AvatarFallback>
                {assignment.playerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{assignment.playerName}</div>
              {assignment.rating && assignment.rating !== 'N/A' && (
                <div className="text-sm text-muted-foreground">
                  Rating: {assignment.rating}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="p-4">
          <ClubBadge clubName={assignment.club} size="sm" />
        </td>
        <td className="p-4">{assignment.position}</td>
        <td className="p-4">
          <div className="flex items-center">
            {getStatusBadge(assignment.status)}
            {getPriorityBadge(assignment.priority)}
          </div>
        </td>
        <td className="p-4">
          {assignment.assignedTo !== 'Unassigned' ? (
            <span className="text-sm font-medium">{assignment.assignedTo}</span>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </td>
        <td className="p-4">
          <div className="text-sm">
            <div>{assignment.updatedAt}</div>
            {assignment.lastStatusChange && (
              <div className="text-muted-foreground">
                {assignment.status === 'completed' && assignment.templateName
                  ? `${assignment.templateName} ${assignment.lastStatusChange.replace(/^Completed/, 'completed')}`
                  : assignment.lastStatusChange}
              </div>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex gap-2">
            {assignment.status === 'shortlisted' && onAssignScout && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignScout(assignment)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            
            {assignment.status === 'completed' && onViewReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReport(assignment)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            {assignment.status === 'completed' && onMarkAsReviewed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsReviewed(assignment)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Apply filters
  const filteredAssignments = allAssignments.filter(assignment => {
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      assignment.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      shortlisted: { label: "Marked for Scouting", variant: "secondary" as const },
      assigned: { label: "Assigned", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    
    const priorityConfig = {
      high: { label: "High", variant: "destructive" as const },
      medium: { label: "Medium", variant: "default" as const },
      low: { label: "Low", variant: "secondary" as const }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;
    
    return <Badge variant={config.variant} className="ml-2">{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="shortlisted">Marked for Scouting</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        <Input
          placeholder="Search players, clubs, or scouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Player</th>
                <th className="text-left p-4 font-medium">Club</th>
                <th className="text-left p-4 font-medium">Position</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Scout</th>
                <th className="text-left p-4 font-medium">Last Update</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <PlayerRow key={`${assignment.playerId}-${assignment.scoutId || 'unassigned'}`} assignment={assignment} />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAssignments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assignments found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoutManagementTableView;