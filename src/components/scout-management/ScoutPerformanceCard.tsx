
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Clock, Target } from "lucide-react";
import { ScoutUser } from "@/hooks/useScoutUsers";
import { ScoutingAssignmentWithDetails } from "@/hooks/useScoutingAssignments";
import { useReports } from "@/hooks/useReports";

interface ScoutPerformanceCardProps {
  scout: ScoutUser;
  assignments: ScoutingAssignmentWithDetails[];
  selectedScout: string;
  onScoutClick: (scoutId: string) => void;
}

const ScoutPerformanceCard = ({
  scout,
  assignments,
  selectedScout,
  onScoutClick
}: ScoutPerformanceCardProps) => {
  const { reports = [] } = useReports();
  
  // Create a map of player reports for quick lookup
  const playerReportsMap = new Map();
  reports.forEach(report => {
    if (report.playerId) {
      playerReportsMap.set(report.playerId, report);
    }
  });

  const scoutAssignments = assignments.filter(a => a.assigned_to_scout_id === scout.id);
  
  // Count completed assignments based on whether reports exist
  const completedCount = scoutAssignments.filter(assignment => {
    const hasReport = playerReportsMap.has(assignment.player_id);
    return hasReport || assignment.status === 'completed';
  }).length;
  
  const completionRate = scoutAssignments.length > 0 ? Math.round((completedCount / scoutAssignments.length) * 100) : 0;
  
  // Calculate average completion time based on actual completed assignments
  const completedAssignments = scoutAssignments.filter(assignment => {
    const hasReport = playerReportsMap.has(assignment.player_id);
    return hasReport || assignment.status === 'completed';
  });
  
  const avgCompletionDays = completedAssignments.length > 0 
    ? Math.round(completedAssignments.reduce((acc, assignment) => {
        // Calculate days between created_at and updated_at for completed assignments
        const createdDate = new Date(assignment.created_at);
        const completedDate = new Date(assignment.updated_at);
        const daysDiff = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        return acc + Math.max(daysDiff, 1); // Minimum 1 day
      }, 0) / completedAssignments.length)
    : 0;

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        selectedScout === scout.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onScoutClick(scout.id)}
    >
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarFallback className="text-xs">
                {scout.first_name?.[0]}{scout.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-xs sm:text-sm truncate">{scout.first_name} {scout.last_name}</div>
              <div className="text-xs text-muted-foreground font-normal">Scout</div>
            </div>
          </div>
          <TrendingUp className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${getPerformanceColor(completionRate)}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3 flex-shrink-0" />
              Total tasks:
            </span>
            <span className="font-semibold text-xs sm:text-sm">{scoutAssignments.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Completed:</span>
            <span className="font-semibold text-xs sm:text-sm text-green-600">{completedCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Success rate:</span>
            <span className={`font-semibold text-xs sm:text-sm ${getPerformanceColor(completionRate)}`}>
              {completionRate}%
            </span>
          </div>
          {completedCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                Avg. time:
              </span>
              <span className="font-semibold text-xs sm:text-sm text-blue-600">
                {avgCompletionDays}d
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoutPerformanceCard;
