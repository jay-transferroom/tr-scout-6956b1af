import { useMemo, useState } from "react";
import { useUnifiedAssignments } from "@/hooks/useUnifiedAssignments";
import AssignedPlayersHeader from "@/components/assigned-players/AssignedPlayersHeader";
import AssignmentStatsCards from "@/components/assigned-players/AssignmentStatsCards";
import AssignmentFilters from "@/components/assigned-players/AssignmentFilters";
import PlayerAssignmentCard from "@/components/assigned-players/PlayerAssignmentCard";
import FixtureAssignmentCard from "@/components/assigned-players/FixtureAssignmentCard";
import AssignmentsTableView from "@/components/assigned-players/AssignmentsTableView";
import ViewToggle from "@/components/ViewToggle";
import { useIsMobile } from "@/hooks/use-mobile";

const AssignedPlayers = () => {
  const { items, stats, isLoading } = useUnifiedAssignments();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentView, setCurrentView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((i) => {
      if (typeFilter !== "all" && i.kind !== typeFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      if (i.kind === "player") {
        return (
          i.player?.players?.name.toLowerCase().includes(q) ||
          i.player?.players?.club.toLowerCase().includes(q)
        );
      }
      const f = i.fixture;
      const home = f?.home_team?.toLowerCase() ?? "";
      const away = f?.away_team?.toLowerCase() ?? "";
      return home.includes(q) || away.includes(q);
    });
  }, [items, searchTerm, statusFilter, typeFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading your assignments...</div>
        </div>
      </div>
    );
  }

  const viewToggle = !isMobile ? (
    <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
  ) : null;

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-7xl px-2 sm:px-4">
      <AssignedPlayersHeader />
      <AssignmentStatsCards stats={stats} />
      <AssignmentFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        viewToggle={viewToggle}
      />

      {isMobile || currentView === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length > 0 ? (
            filtered.map((item) =>
              item.kind === "player" ? (
                <PlayerAssignmentCard key={item.id} assignment={item.player as any} />
              ) : (
                <FixtureAssignmentCard key={item.id} item={item} />
              )
            )
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No assignments found matching your filters
            </div>
          )}
        </div>
      ) : (
        <AssignmentsTableView assignments={filtered} />
      )}
    </div>
  );
};

export default AssignedPlayers;
