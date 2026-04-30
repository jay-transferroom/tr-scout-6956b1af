import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScoutingAssignments } from "@/hooks/useScoutingAssignments";
import { useScoutUsers } from "@/hooks/useScoutUsers";
import { useShortlists } from "@/hooks/useShortlists";
import { useUnifiedPlayersData } from "@/hooks/useUnifiedPlayersData";
import { useReports } from "@/hooks/useReports";
import { useClubRatingWeights } from "@/hooks/useClubRatingWeights";
import { usePipelineColumns } from "@/hooks/usePipelineColumns";
import { MOCK_REPORT_SUBMITTED_EVENT, type MockReportSubmittedDetail } from "@/lib/mockReportEvents";
import { toast as sonnerToast } from "sonner";
import AssignScoutDialog from "@/components/AssignScoutDialog";
import { Button } from "@/components/ui/button";
import ScoutManagementHeader from "@/components/scout-management/ScoutManagementHeader";
import ScoutManagementFilters from "@/components/scout-management/ScoutManagementFilters";
import ScoutPerformanceGrid from "@/components/scout-management/ScoutPerformanceGrid";
import KanbanColumn from "@/components/scout-management/KanbanColumn";
import ReviewedAssignmentsModal from "@/components/scout-management/ReviewedAssignmentsModal";
import ScoutManagementViewToggle from "@/components/scout-management/ScoutManagementViewToggle";
import ScoutManagementTableView from "@/components/scout-management/ScoutManagementTableView";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { transformToAssignmentBased } from "@/utils/assignmentStatusUtils";

const ScoutManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScout, setSelectedScout] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReviewedModalOpen, setIsReviewedModalOpen] = useState(false);
  const [reviewedAssignments, setReviewedAssignments] = useState<any[]>([]);
  const [kanbanData, setKanbanData] = useState({
    shortlisted: [] as any[],
    assigned: [] as any[],
    completed: [] as any[]
  });

  // View toggle with localStorage persistence
  const [currentView, setCurrentView] = useState<'kanban' | 'table'>(() => {
    const saved = localStorage.getItem('scoutManagementView');
    return (saved === 'table' || saved === 'kanban') ? saved : 'kanban';
  });

  const handleViewChange = (view: 'kanban' | 'table') => {
    setCurrentView(view);
    localStorage.setItem('scoutManagementView', view);
  };

  // Using the consolidated data source
  const { data: assignments = [], refetch: refetchAssignments, isLoading: assignmentsLoading } = useScoutingAssignments();
  const { data: scouts = [] } = useScoutUsers();
  const { data: allPlayers = [], isLoading: playersLoading } = useUnifiedPlayersData();
  const { reports = [], loading: reportsLoading } = useReports();
  const { shortlists, loading: shortlistsLoading } = useShortlists();
  const { data: clubRatingData } = useClubRatingWeights();

  const isLoading = assignmentsLoading || playersLoading || reportsLoading || shortlistsLoading;

  // Fetch reviewed assignments
  useEffect(() => {
    const fetchReviewedAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('scouting_assignments')
          .select(`
            *,
            assigned_to_scout:profiles!assigned_to_scout_id(*)
          `)
          .eq('status', 'reviewed')
          .not('reviewed_at', 'is', null);

        if (error) {
          console.error('Error fetching reviewed assignments:', error);
          return;
        }

        const reviewedData = data?.map(assignment => {
          // Find player data from our unified players data
          const playerData = allPlayers.find(p => {
            const playerId = p.isPrivatePlayer ? p.id : p.id.toString();
            return playerId === assignment.player_id;
          });

          return {
            id: assignment.id,
            playerName: playerData?.name || 'Unknown Player',
            club: playerData?.club || 'Unknown Club',
            position: playerData?.positions?.[0] || 'Unknown',
            assignedTo: assignment.assigned_to_scout?.first_name 
              ? `${assignment.assigned_to_scout.first_name} ${assignment.assigned_to_scout.last_name || ''}`.trim()
              : assignment.assigned_to_scout?.email || 'Unknown Scout',
            avatar: playerData?.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format`,
            priority: assignment.priority,
            status: assignment.status,
            playerId: assignment.player_id,
            reviewed_at: assignment.reviewed_at
          };
        }) || [];

        setReviewedAssignments(reviewedData);
      } catch (error) {
        console.error('Error in fetchReviewedAssignments:', error);
      }
    };

    if (!isLoading && allPlayers.length > 0) {
      fetchReviewedAssignments();
    }
  }, [assignments, allPlayers, isLoading]);

  // Move scoutingAssignmentList outside useEffect to avoid dependency issues
  const scoutingAssignmentList = shortlists.find(shortlist => shortlist.is_scouting_assignment_list);

  // Transform assignments into assignment-based kanban format (one row per scout assignment)
  useEffect(() => {
    if (isLoading) return;

    console.log('Scout Management - Using assignment-based view with assignments:', assignments.length);  
    console.log('Scout Management - Scouts:', scouts.length);
    console.log('Scout Management - All Players:', allPlayers.length);
    console.log('Scout Management - Reports:', reports.length);

    const newKanbanData = transformToAssignmentBased(
      assignments,
      allPlayers,
      reports,
      scoutingAssignmentList,
      selectedScout,
      searchTerm,
      clubRatingData?.weights
    );

    console.log('Final assignment-based kanban data:', {
      shortlisted: newKanbanData.shortlisted.length,
      assigned: newKanbanData.assigned.length,  
      completed: newKanbanData.completed.length
    });

    setKanbanData(newKanbanData);
  }, [assignments, scouts, allPlayers, reports, selectedScout, searchTerm, isLoading, scoutingAssignmentList?.playerIds, clubRatingData?.weights]);

  const getUpdatedTime = (status: string) => {
    const times = {
      'assigned': '2 days ago',
      'in_progress': '5 hours ago', 
      'completed': '1 week ago',
      'reviewed': '3 days ago'
    };
    return times[status as keyof typeof times] || '1 day ago';
  };

  const getLastStatusChange = (status: string, updatedAt: string) => {
    const timeDiff = new Date().getTime() - new Date(updatedAt).getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
    
    let timeAgo = '';
    if (daysDiff > 0) {
      timeAgo = `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
    } else if (hoursDiff > 0) {
      timeAgo = `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'Just now';
    }

    const statusLabels = {
      'assigned': 'Assigned',
      'in_progress': 'In Progress', 
      'completed': 'Completed',
      'reviewed': 'Under review'
    };
    
    return `${statusLabels[status as keyof typeof statusLabels] || 'Updated'} ${timeAgo}`;
  };

  const [pipelineColumns] = usePipelineColumns();
  const [columnOverrides, setColumnOverrides] = useState<Record<string, string>>({});
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);

  // Bucket players from kanbanData into pipeline columns, applying any drag overrides.
  // Seed columns (shortlisted/assigned/completed) keep their default mapping; user-added
  // pipeline columns start empty and only fill via drag-drop overrides.
  const playersByColumn = useMemo(() => {
    const result: Record<string, any[]> = {};
    pipelineColumns.forEach((c) => (result[c.id] = []));

    const allSeededPlayers = [
      ...kanbanData.shortlisted.map((p) => ({ player: p, defaultCol: "shortlisted" })),
      ...kanbanData.assigned.map((p) => ({ player: p, defaultCol: "assigned" })),
      ...kanbanData.completed.map((p) => ({ player: p, defaultCol: "completed" })),
    ];

    const validIds = new Set(pipelineColumns.map((c) => c.id));
    const fallback = pipelineColumns[0]?.id;

    allSeededPlayers.forEach(({ player, defaultCol }) => {
      const overrideCol = columnOverrides[player.id];
      const target =
        overrideCol && validIds.has(overrideCol)
          ? overrideCol
          : validIds.has(defaultCol)
            ? defaultCol
            : fallback;
      if (target && result[target]) result[target].push(player);
    });

    return result;
  }, [pipelineColumns, kanbanData, columnOverrides]);

  // Prototype-only: react to mock "report submitted" events. For each
  // submitted player, find their current column and apply the first matching
  // auto-transition rule.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<MockReportSubmittedDetail>).detail;
      if (!detail?.playerIds?.length) return;

      // Build playerId -> currentColumnId map from current bucketing.
      const currentColumnByPlayerId = new Map<string, string>();
      Object.entries(playersByColumn).forEach(([colId, players]) => {
        players.forEach((p: any) => {
          if (p?.playerId) currentColumnByPlayerId.set(String(p.playerId), colId);
          if (p?.id) currentColumnByPlayerId.set(String(p.id), colId);
        });
      });

      const triggerLabels: Record<string, string> = {
        data_report_submitted: "data report submitted",
        video_report_submitted: "video report submitted",
        manually_assigned: "manually assigned",
      };

      const newOverrides: Record<string, string> = {};
      const moves: { destinationName: string }[] = [];

      detail.playerIds.forEach((pid) => {
        const currentColId = currentColumnByPlayerId.get(String(pid));
        if (!currentColId) return;
        const currentCol = pipelineColumns.find((c) => c.id === currentColId);
        const rule = currentCol?.rules.find(
          (r) => r.trigger === detail.trigger && r.destinationColumnId,
        );
        if (!rule || !rule.destinationColumnId) return;
        if (rule.destinationColumnId === currentColId) return;

        // Override by both card.id and playerId so the bucketer picks it up.
        const cards = (playersByColumn[currentColId] || []).filter(
          (p: any) => String(p.playerId) === String(pid),
        );
        cards.forEach((c: any) => {
          if (c?.id) newOverrides[c.id] = rule.destinationColumnId!;
        });

        const destName =
          pipelineColumns.find((c) => c.id === rule.destinationColumnId)?.name ?? "column";
        moves.push({ destinationName: destName });
      });

      if (Object.keys(newOverrides).length === 0) return;
      setColumnOverrides((prev) => ({ ...prev, ...newOverrides }));

      const triggerLabel = triggerLabels[detail.trigger] ?? detail.trigger;
      moves.forEach(({ destinationName }) => {
        sonnerToast.success(`Auto-moved to ${destinationName} (rule: ${triggerLabel})`);
      });
    };

    window.addEventListener(MOCK_REPORT_SUBMITTED_EVENT, handler);
    return () => window.removeEventListener(MOCK_REPORT_SUBMITTED_EVENT, handler);
  }, [playersByColumn, pipelineColumns]);

  const getColumnColor = (id: string) => {
    if (id === "completed") return "bg-green-500";
    if (id === "shortlisted" || id === "assigned") return "bg-orange-500";
    return "bg-muted-foreground";
  };

  const columns = pipelineColumns.map((c) => ({
    id: c.id,
    title: c.name,
    color: getColumnColor(c.id),
    count: playersByColumn[c.id]?.length ?? 0,
  }));

  const handleCardDragStart = (playerId: string) => {
    setDraggingPlayerId(playerId);
  };

  const handleCardDrop = (toColumnId: string) => {
    if (!draggingPlayerId) return;
    setColumnOverrides((prev) => ({ ...prev, [draggingPlayerId]: toColumnId }));
    setDraggingPlayerId(null);
  };

  const handleAssignmentCreated = () => {
    refetchAssignments();
    setIsAssignDialogOpen(false);
    setSelectedPlayer(null);
  };

  const handleAssignScout = (player: any) => {
    // Find the original player data from allPlayers to get the full player object
    const originalPlayer = allPlayers.find(p => {
      const playerId = p.isPrivatePlayer ? p.id : p.id.toString();
      return playerId === player.playerId;
    });
    
    if (originalPlayer) {
      setSelectedPlayer({
        id: originalPlayer.isPrivatePlayer ? originalPlayer.id : originalPlayer.id.toString(),
        name: originalPlayer.name,
        club: originalPlayer.club,
        positions: originalPlayer.positions
      });
      setIsAssignDialogOpen(true);
    }
  };

  const handleAssignDialogClose = () => {
    setIsAssignDialogOpen(false);
    setSelectedPlayer(null);
    refetchAssignments();
  };

  const handleScoutClick = (scoutId: string) => {
    setSelectedScout(scoutId);
  };

  const handleViewReport = (player: any) => {
    // Find the report for this player and scout combination
    const playerReport = reports.find(report => 
      report.playerId === player.playerId && 
      report.scoutId === player.scoutId
    );
    
    if (playerReport) {
      navigate(`/report/${playerReport.id}`);
    } else {
      console.error("No report found for player:", player.playerId, "and scout:", player.scoutId);
    }
  };

  const handleMarkAsReviewed = async (player: any) => {
    try {
      // Use assignmentId for assignments, or skip for unassigned players
      const assignmentId = player.assignmentId || player.id;
      
      if (!assignmentId || assignmentId.startsWith('scouting-assignment-')) {
        toast({
          title: "Error",
          description: "Cannot mark unassigned player as reviewed",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('scouting_assignments')
        .update({
          status: 'reviewed',
          reviewed_at: new Date().toISOString(),
          reviewed_by_manager_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error marking assignment as reviewed:', error);
        toast({
          title: "Error", 
          description: "Failed to mark assignment as reviewed",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Assignment marked as reviewed",
      });

      // Refresh assignments to update the kanban board
      refetchAssignments();
    } catch (error) {
      console.error('Error in handleMarkAsReviewed:', error);
      toast({
        title: "Error",
        description: "An error occurred while marking assignment as reviewed",
        variant: "destructive",
      });
    }
  };

  const handleViewReviewedAssignments = () => {
    setIsReviewedModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="text-center">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-4 md:pb-8 px-4 max-w-7xl">
      <ScoutManagementHeader />

      <ScoutPerformanceGrid
        scouts={scouts}
        assignments={assignments}
        selectedScout={selectedScout}
        onScoutClick={handleScoutClick}
      />

      <ScoutManagementFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedScout={selectedScout}
        setSelectedScout={setSelectedScout}
        scouts={scouts}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Assignment Status</h2>
          <ScoutManagementViewToggle 
            currentView={currentView} 
            onViewChange={handleViewChange} 
          />
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => navigate("/club-settings?tab=pipeline")}
              className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
            >
              Manage pipeline
            </button>
            {pipelineColumns.length > 5 && (
              <span className="text-muted-foreground">
                · {pipelineColumns.length} columns · scroll horizontally →
              </span>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleViewReviewedAssignments}
          className="gap-2 w-full sm:w-auto"
          size="sm"
        >
          View Reviewed ({reviewedAssignments.length})
        </Button>
      </div>

      {/* Status Board or Table View */}
      {currentView === 'kanban' ? (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))` }}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              players={playersByColumn[column.id] || []}
              searchTerm={searchTerm}
              selectedScout={selectedScout}
              onAssignScout={column.id === 'shortlisted' ? handleAssignScout : undefined}
              onViewReport={column.id === 'completed' ? handleViewReport : undefined}
              onMarkAsReviewed={column.id === 'completed' ? handleMarkAsReviewed : undefined}
              onCardDragStart={handleCardDragStart}
              onCardDrop={handleCardDrop}
              isDropTarget={!!draggingPlayerId}
              emptyMessage={`No items in ${column.title}`}
            />
          ))}
        </div>
      ) : (
        <ScoutManagementTableView
          kanbanData={kanbanData}
          onAssignScout={handleAssignScout}
          onViewReport={handleViewReport}
          onMarkAsReviewed={handleMarkAsReviewed}
        />
      )}

      {/* Assign Scout Dialog */}
      <AssignScoutDialog
        isOpen={isAssignDialogOpen}
        onClose={handleAssignDialogClose}
        player={selectedPlayer}
      />

      {/* Reviewed Assignments Modal */}
      <ReviewedAssignmentsModal
        isOpen={isReviewedModalOpen}
        onClose={() => setIsReviewedModalOpen(false)}
        reviewedAssignments={reviewedAssignments}
        onViewReport={handleViewReport}
      />
    </div>
  );
};

export default ScoutManagement;
