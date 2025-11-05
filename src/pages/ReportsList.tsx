import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { useReportsFilter } from "@/hooks/useReportsFilter";
import { toast } from "sonner";
import ReportsTabNavigation from "@/components/reports/ReportsTabNavigation";
import ReportsTable from "@/components/reports/ReportsTable";
import GroupedReportsTable from "@/components/reports/GroupedReportsTable";
import PlayerReportsModal from "@/components/reports/PlayerReportsModal";
import ReportsFilters, { ReportsFilterCriteria } from "@/components/reports/ReportsFilters";
import { getRecommendation } from "@/utils/reportDataExtraction";
import { groupReportsByPlayer } from "@/utils/reportGrouping";
import { SlidingToggle } from "@/components/ui/sliding-toggle";
import { List, Users } from "lucide-react";

// Reports List Component
const ReportsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all-reports");
  const [viewMode, setViewMode] = useState<"individual" | "grouped">("individual");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>("");
  const [playerReportsModalOpen, setPlayerReportsModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<ReportsFilterCriteria>({
    searchTerm: '',
    playerName: '',
    club: '',
    positions: '',
    verdict: '',
    status: '',
    scout: '',
    dateRange: ''
  });
  
  const itemsPerPage = 10;
  
  // Set initial tab and filters from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["all-reports", "my-reports", "my-drafts"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Handle verdict filter from URL
    const verdictParam = searchParams.get("verdict");
    if (verdictParam) {
      setSearchFilters(prev => ({
        ...prev,
        verdict: verdictParam.includes(',') ? verdictParam.split(',')[0] : verdictParam
      }));
    }
    
    // Handle playerName filter from URL
    const playerNameParam = searchParams.get("playerName");
    if (playerNameParam) {
      setSearchFilters(prev => ({
        ...prev,
        playerName: decodeURIComponent(playerNameParam)
      }));
    }
  }, [searchParams]);
  
  const { reports, loading, deleteReport } = useReports();
  const filteredReports = useReportsFilter(reports, activeTab, searchFilters);

  // Extract available filter options from reports
  const { availableVerdicts, availableScouts, availableClubs, availablePositions, availablePlayerNames } = useMemo(() => {
    const verdicts = new Set<string>();
    const scouts = new Map<string, string>();
    const clubs = new Set<string>();
    const positions = new Set<string>();
    const playerNames = new Set<string>();

    reports.forEach(report => {
      // Collect verdicts
      const verdict = getRecommendation(report);
      if (verdict) {
        verdicts.add(verdict);
      }

      // Collect scouts
      if (report.scoutId && report.scoutProfile) {
        const scoutName = `${report.scoutProfile.first_name || ''} ${report.scoutProfile.last_name || ''}`.trim() || 'Scout';
        scouts.set(report.scoutId, scoutName);
      }

      // Collect clubs
      if (report.player?.club) {
        clubs.add(report.player.club);
      }

      // Collect positions
      if (report.player?.positions) {
        report.player.positions.forEach(pos => positions.add(pos));
      }

      // Collect player names
      if (report.player?.name) {
        playerNames.add(report.player.name);
      }
    });

    return {
      availableVerdicts: Array.from(verdicts).sort(),
      availableScouts: Array.from(scouts.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      availableClubs: Array.from(clubs).map(club => ({ id: club, name: club })).sort((a, b) => a.name.localeCompare(b.name)),
      availablePositions: Array.from(positions).sort(),
      availablePlayerNames: Array.from(playerNames).sort()
    };
  }, [reports]);
  
  // Pagination logic
  const groupedReports = groupReportsByPlayer(filteredReports);
  
  const isGroupedMode = viewMode === "grouped";
  const itemsToDisplay = isGroupedMode ? groupedReports : filteredReports;
  const totalItems = itemsToDisplay.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = isGroupedMode 
    ? groupedReports.slice(startIndex, endIndex).flatMap(group => group.allReports)
    : filteredReports.slice(startIndex, endIndex);
  
  // Reset to first page when tab changes or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchFilters, viewMode]);
  
  const handleViewReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleEditReport = (reportId: string) => {
    navigate(`/report/${reportId}/edit`);
  };

  const handleDeleteReport = async (reportId: string, playerName: string) => {
    if (window.confirm(`Are you sure you want to delete the report for ${playerName}?`)) {
      try {
        await deleteReport(reportId);
        toast.success("Report deleted successfully");
      } catch (error) {
        toast.error("Failed to delete report");
      }
    }
  };

  const handleViewAllReports = (playerId: string, playerName: string) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerName(playerName);
    setPlayerReportsModalOpen(true);
  };

  const getPlayerReports = () => {
    if (!selectedPlayerId) return [];
    return filteredReports.filter(report => report.playerId === selectedPlayerId);
  };


  const getCardTitle = () => {
    if (activeTab === "all-reports") return "All Scouting Reports";
    if (activeTab === "my-reports") return "My Reports";
    return "Draft Reports";
  };

  if (loading) {
    return (
      <div className="container mx-auto pt-8 pb-16 max-w-7xl">
        <div className="text-center">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-4 sm:pt-8 pb-16 max-w-7xl px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Player Reports</h1>
        <p className="text-sm sm:text-base text-muted-foreground">View and manage scouting reports</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
        <ReportsTabNavigation onTabChange={setActiveTab} activeTab={activeTab} />
        
        <SlidingToggle
          value={viewMode}
          onChange={(value) => setViewMode(value as "individual" | "grouped")}
          options={[
            { 
              value: "individual", 
              label: (
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Report
                </div>
              )
            },
            { 
              value: "grouped", 
              label: (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Player
                </div>
              )
            }
          ]}
        />
      </div>

      <ReportsFilters 
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        availableVerdicts={availableVerdicts}
        availableScouts={availableScouts}
        availableClubs={availableClubs}
        availablePositions={availablePositions}
        availablePlayerNames={availablePlayerNames}
      />

      <div>
        <div>
          {viewMode === "individual" ? (
            <ReportsTable
              reports={paginatedReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
            />
          ) : (
            <GroupedReportsTable
              reports={paginatedReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              onViewAllReports={handleViewAllReports}
            />
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} {isGroupedMode ? 'players' : 'reports'}
          </div>
        </div>
      </div>

      <PlayerReportsModal
        isOpen={playerReportsModalOpen}
        onClose={() => setPlayerReportsModalOpen(false)}
        playerName={selectedPlayerName}
        reports={getPlayerReports()}
        onViewReport={handleViewReport}
        onEditReport={handleEditReport}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
};

export default ReportsList;
