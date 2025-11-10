import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, UserPlus, CheckCircle, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const [sortColumn, setSortColumn] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Combine all assignments from different columns
  // Keep the original status and add a kanbanColumn property for filtering
  const allAssignments = [
    ...kanbanData.shortlisted.map(p => ({ ...p, kanbanColumn: 'shortlisted' })),
    ...kanbanData.assigned.map(p => ({ ...p, kanbanColumn: 'assigned' })),
    ...kanbanData.completed.map(p => ({ ...p, kanbanColumn: 'completed' }))
  ];

  const PlayerRow = ({ assignment }: { assignment: any }) => {
    // No need to fetch scouts here since each row represents one assignment
    if (assignment?.kanbanColumn === 'completed') {
      console.log('TableView completed debug', { playerId: assignment.playerId, templateName: assignment.templateName, lastStatusChange: assignment.lastStatusChange });
    }
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
            {getStatusBadge(assignment.kanbanColumn)}
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
                {assignment.kanbanColumn === 'completed' && assignment.templateName
                  ? `${assignment.templateName} ${assignment.lastStatusChange.replace(/^Completed/, 'completed')}`
                  : assignment.lastStatusChange}
              </div>
            )}
            {assignment.matchContext && assignment.matchContext.opposition && (
              <div className="text-muted-foreground mt-1">
                vs {assignment.matchContext.opposition} • {assignment.matchContext.competition}
              </div>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex gap-2">
            {assignment.kanbanColumn === 'shortlisted' && onAssignScout && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignScout(assignment)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            
            {assignment.kanbanColumn === 'completed' && onViewReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReport(assignment)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            {assignment.kanbanColumn === 'completed' && onMarkAsReviewed && (
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

  // Apply filters and sorting
  const filteredAndSortedAssignments = useMemo(() => {
    // Choose the source list by status first to avoid any mismatch
    let source: any[] = [];
    if (statusFilter === "all") {
      source = allAssignments;
    } else if (statusFilter === "shortlisted") {
      source = kanbanData.shortlisted.map(p => ({ ...p, kanbanColumn: 'shortlisted' }));
    } else if (statusFilter === "assigned") {
      source = kanbanData.assigned.map(p => ({ ...p, kanbanColumn: 'assigned' }));
    } else if (statusFilter === "completed") {
      source = kanbanData.completed.map(p => ({ ...p, kanbanColumn: 'completed' }));
    }

    const filtered = source.filter(assignment => {
      const matchesSearch = searchTerm === "" || 
        assignment.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort the filtered results
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "player":
          aValue = a.playerName.toLowerCase();
          bValue = b.playerName.toLowerCase();
          break;
        case "club":
          aValue = a.club.toLowerCase();
          bValue = b.club.toLowerCase();
          break;
        case "position":
          aValue = a.position.toLowerCase();
          bValue = b.position.toLowerCase();
          break;
        case "status":
          aValue = a.kanbanColumn;
          bValue = b.kanbanColumn;
          break;
        case "scout":
          aValue = a.assignedTo.toLowerCase();
          bValue = b.assignedTo.toLowerCase();
          break;
        case "rating":
          aValue = a.rating === 'N/A' ? 0 : parseFloat(a.rating);
          bValue = b.rating === 'N/A' ? 0 : parseFloat(b.rating);
          break;
        case "updatedAt":
        default:
          // Parse the time ago strings to get actual time values for proper sorting
          const parseTimeAgo = (timeStr: string) => {
            if (!timeStr || timeStr === 'N/A' || timeStr === 'Just now') return 0;
            const match = timeStr.match(/(\d+)\s+(day|hour)/);
            if (!match) return 0;
            const value = parseInt(match[1]);
            const unit = match[2];
            return unit === 'day' ? value * 24 : value;
          };
          aValue = parseTimeAgo(a.updatedAt);
          bValue = parseTimeAgo(b.updatedAt);
          break;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [kanbanData, allAssignments, statusFilter, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const getStatusBadge = (kanbanColumn: string) => {
    const statusConfig = {
      shortlisted: { label: "Marked for Scouting", variant: "secondary" as const },
      assigned: { label: "Assigned", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const }
    };
    
    const config = statusConfig[kanbanColumn as keyof typeof statusConfig];
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
          className="w-full sm:max-w-sm"
        />
      </div>

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("player")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Player
                    <SortIcon column="player" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("club")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Club
                    <SortIcon column="club" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("position")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Position
                    <SortIcon column="position" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("status")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Status
                    <SortIcon column="status" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("scout")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Scout
                    <SortIcon column="scout" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button 
                    onClick={() => handleSort("updatedAt")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Last Update
                    <SortIcon column="updatedAt" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAssignments.map((assignment) => (
                <PlayerRow key={`${assignment.playerId}-${assignment.scoutId || 'unassigned'}`} assignment={assignment} />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedAssignments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assignments found matching the current filters.
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedAssignments.length > 0 ? (
          filteredAndSortedAssignments.map((assignment) => (
            <div key={`${assignment.playerId}-${assignment.scoutId || 'unassigned'}`} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
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
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{assignment.playerName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <ClubBadge clubName={assignment.club} size="sm" />
                    <span className="text-sm text-muted-foreground">{assignment.position}</span>
                  </div>
                  {assignment.rating && assignment.rating !== 'N/A' && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Rating: {assignment.rating}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusBadge(assignment.kanbanColumn)}
                  {getPriorityBadge(assignment.priority)}
                </div>
                
                <div>
                  <span className="text-muted-foreground">Scout: </span>
                  {assignment.assignedTo !== 'Unassigned' ? (
                    <span className="font-medium">{assignment.assignedTo}</span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </div>
                
                {assignment.lastStatusChange && (
                  <div className="text-muted-foreground text-xs">
                    {assignment.kanbanColumn === 'completed' && assignment.templateName
                      ? `${assignment.templateName} ${assignment.lastStatusChange.replace(/^Completed/, 'completed')}`
                      : assignment.lastStatusChange}
                  </div>
                )}
                
                {assignment.matchContext && assignment.matchContext.opposition && (
                  <div className="text-muted-foreground text-xs">
                    Match: vs {assignment.matchContext.opposition} • {assignment.matchContext.competition}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                {assignment.kanbanColumn === 'shortlisted' && onAssignScout && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAssignScout(assignment)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                )}
                
                {assignment.kanbanColumn === 'completed' && onViewReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewReport(assignment)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                
                {assignment.kanbanColumn === 'completed' && onMarkAsReviewed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onMarkAsReviewed(assignment)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No assignments found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoutManagementTableView;