
import { ScoutUser } from "@/hooks/useScoutUsers";
import { ScoutingAssignmentWithDetails } from "@/hooks/useScoutingAssignments";
import ScoutPerformanceCard from "./ScoutPerformanceCard";

interface ScoutPerformanceGridProps {
  scouts: ScoutUser[];
  assignments: ScoutingAssignmentWithDetails[];
  selectedScout: string;
  onScoutClick: (scoutId: string) => void;
}

const ScoutPerformanceGrid = ({
  scouts,
  assignments,
  selectedScout,
  onScoutClick
}: ScoutPerformanceGridProps) => {
  if (scouts.length === 0) return null;

  // Calculate performance metrics for each scout and sort by best performers
  const scoutsWithMetrics = scouts.map((scout) => {
    const scoutAssignments = assignments.filter(a => a.assigned_to_scout_id === scout.id);
    const completedCount = scoutAssignments.filter(a => a.status === 'completed').length;
    const completionRate = scoutAssignments.length > 0 ? (completedCount / scoutAssignments.length) * 100 : 0;
    
    // Calculate average completion time (mock calculation for now)
    const avgCompletionDays = scoutAssignments.length > 0 
      ? Math.round(Math.random() * 10 + 3) // Mock: 3-13 days
      : 0;

    return {
      scout,
      totalAssignments: scoutAssignments.length,
      completedCount,
      completionRate,
      avgCompletionDays
    };
  });

  // Sort by completion rate (descending), then by total assignments (descending)
  const sortedScouts = scoutsWithMetrics
    .sort((a, b) => {
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      return b.totalAssignments - a.totalAssignments;
    })
    .slice(0, 4); // Show top 4 performers

  return (
    <div className="mb-6">
      <h3 className="text-base md:text-lg font-semibold mb-3">Scout Performance Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {sortedScouts.map(({ scout }) => (
          <ScoutPerformanceCard
            key={scout.id}
            scout={scout}
            assignments={assignments}
            selectedScout={selectedScout}
            onScoutClick={onScoutClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoutPerformanceGrid;
