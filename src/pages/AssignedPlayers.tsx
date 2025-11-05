
import { useState } from "react";
import { useMyScoutingTasks } from "@/hooks/useMyScoutingTasks";
import AssignedPlayersHeader from "@/components/assigned-players/AssignedPlayersHeader";
import AssignmentStatsCards from "@/components/assigned-players/AssignmentStatsCards";
import AssignmentFilters from "@/components/assigned-players/AssignmentFilters";
import PlayerAssignmentCard from "@/components/assigned-players/PlayerAssignmentCard";
import AssignmentsTableView from "@/components/assigned-players/AssignmentsTableView";
import ViewToggle from "@/components/ViewToggle";

const AssignedPlayers = () => {
  const { data: assignments = [], isLoading } = useMyScoutingTasks();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.players?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.players?.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'assigned').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => ['completed', 'reviewed'].includes(a.status)).length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading your assignments...</div>
        </div>
      </div>
    );
  }

  const viewToggle = (
    <ViewToggle 
      currentView={currentView} 
      onViewChange={setCurrentView} 
    />
  );

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-7xl px-2 sm:px-4">
      <AssignedPlayersHeader />
      
      <AssignmentStatsCards stats={stats} />

      <AssignmentFilters 
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        viewToggle={viewToggle}
      />

      {/* Conditional View Rendering */}
      {currentView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => (
              <PlayerAssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No assignments found matching your filters
            </div>
          )}
        </div>
      ) : (
        <AssignmentsTableView assignments={filteredAssignments} />
      )}
    </div>
  );
};

export default AssignedPlayers;
