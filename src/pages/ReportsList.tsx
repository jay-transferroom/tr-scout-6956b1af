import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { useReportsFilter } from "@/hooks/useReportsFilter";
import { toast } from "sonner";
import ReportsTabNavigation from "@/components/reports/ReportsTabNavigation";
import ReportsTable from "@/components/reports/ReportsTable";
import { IndividualSortKey, IndividualSortDir } from "@/components/reports/ReportsTableHeader";
import GroupedReportsTable, { GroupedSortKey, GroupedSortDir } from "@/components/reports/GroupedReportsTable";
import MatchReportsTable from "@/components/reports/MatchReportsTable";

import { MatchScoutingDrawer } from "@/components/match-scouting/MatchScoutingDrawer";
import PlayerReportsModal from "@/components/reports/PlayerReportsModal";
import MatchReportDetailDialog from "@/components/reports/MatchReportDetailDialog";
import ReportDetailSheet from "@/components/reports/ReportDetailSheet";
import ReportsFilters, { ReportsFilterCriteria } from "@/components/reports/ReportsFilters";
import { getOverallRating, getRecommendation } from "@/utils/reportDataExtraction";
import { convertRatingToNumeric } from "@/utils/ratingConversion";
import { groupReportsByPlayer } from "@/utils/reportGrouping";
import { useAllMatchScoutingReports, GroupedMatchReport } from "@/hooks/useAllMatchScoutingReports";
import { SlidingToggle } from "@/components/ui/sliding-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRecommendationRank } from "@/utils/mockRecommendations";
import { useRecommendationsActive } from "@/hooks/useRecommendationsActive";
import { List, Users, ClipboardList } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

// Reports List Component
const ReportsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all-reports");
  const [viewMode, setViewMode] = useState<"individual" | "grouped" | "match">("individual");
  const [sortBy, setSortBy] = useState<"default" | "recommendation">("default");
  const recommendationsActive = useRecommendationsActive();
  const effectiveSortBy = recommendationsActive ? sortBy : "default";
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>("");
  const [playerReportsModalOpen, setPlayerReportsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<GroupedMatchReport | null>(null);
  const [editingMatch, setEditingMatch] = useState<GroupedMatchReport | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [groupedSortKey, setGroupedSortKey] = useState<GroupedSortKey | null>("latestDate");
  const [groupedSortDir, setGroupedSortDir] = useState<GroupedSortDir>("desc");

  const handleGroupedSort = (key: GroupedSortKey) => {
    if (groupedSortKey === key) {
      setGroupedSortDir(groupedSortDir === "asc" ? "desc" : "asc");
    } else {
      setGroupedSortKey(key);
      setGroupedSortDir("asc");
    }
    setCurrentPage(1);
  };

  const [individualSortKey, setIndividualSortKey] = useState<IndividualSortKey | null>("date");
  const [individualSortDir, setIndividualSortDir] = useState<IndividualSortDir>("desc");

  const handleIndividualSort = (key: IndividualSortKey) => {
    if (individualSortKey === key) {
      setIndividualSortDir(individualSortDir === "asc" ? "desc" : "asc");
    } else {
      setIndividualSortKey(key);
      setIndividualSortDir("asc");
    }
    setCurrentPage(1);
  };
  
  const { user } = useAuth();
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
  const { data: matchReports = [], isLoading: matchReportsLoading } = useAllMatchScoutingReports();
  const filteredReportsRaw = useReportsFilter(reports, activeTab, searchFilters);

  const filteredReports = useMemo(() => {
    if (effectiveSortBy !== "recommendation") return filteredReportsRaw;
    return [...filteredReportsRaw].sort((a, b) => {
      const aRank = getRecommendationRank(a.playerId);
      const bRank = getRecommendationRank(b.playerId);
      return aRank - bRank; // unset (Infinity) → bottom
    });
  }, [filteredReportsRaw, effectiveSortBy]);

  const sortedMatchReports = useMemo(() => {
    if (effectiveSortBy !== "recommendation") return matchReports;
    // For Match view, sort matches by best (lowest rank) recommendation among their players
    return [...matchReports].sort((a, b) => {
      const aMin = Math.min(
        ...a.reports.map(r => getRecommendationRank(r.player_id)),
        Number.POSITIVE_INFINITY
      );
      const bMin = Math.min(
        ...b.reports.map(r => getRecommendationRank(r.player_id)),
        Number.POSITIVE_INFINITY
      );
      return aMin - bMin;
    });
  }, [matchReports, effectiveSortBy]);

  // Sub-tab filtering for Match view
  const visibleMatchReports = useMemo(() => {
    const hasAnyScoutingData = (report: GroupedMatchReport["reports"][number]) => {
      if (report.rating !== null) return true;
      if (report.ratings && typeof report.ratings === "object") {
        if (Object.values(report.ratings).some((value) => value != null && String(value).trim() !== "")) return true;
      }
      return !!report.notes?.trim();
    };

    // A report counts as "submitted" if it has a numeric rating OR any per-config
    // ratings filled in. The new flow (and custom matches) store values in the
    // ratings jsonb and may leave the legacy `rating` column null.
    const isSubmittedReport = (report: GroupedMatchReport["reports"][number]) => {
      if (report.rating !== null) return true;
      if (report.ratings && typeof report.ratings === "object") {
        return Object.values(report.ratings).some((value) => value != null && String(value).trim() !== "");
      }
      return false;
    };

    return sortedMatchReports
      .map((match) => {
        const totalRatings = new Set(
          match.reports.filter(hasAnyScoutingData).map((report) => report.player_id)
        ).size;
        return { ...match, totalRatings };
      })
      .filter((match) => match.reports.length > 0);
  }, [sortedMatchReports]);


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
  const groupedReports = useMemo(() => groupReportsByPlayer(filteredReports), [filteredReports]);

  const sortedGroupedReports = useMemo(() => {
    if (!groupedSortKey) return groupedReports;
    const arr = [...groupedReports];
    const dir = groupedSortDir === "asc" ? 1 : -1;
    const getVal = (g: typeof arr[number]): string | number => {
      const latest = g.allReports[0];
      switch (groupedSortKey) {
        case "player": return (latest.player?.name || "").toLowerCase();
        case "club": return (latest.player?.club || "").toLowerCase();
        case "reportsCount": return g.reportCount;
        case "latestDate": return new Date(latest.createdAt).getTime();
        case "status": return latest.status || "";
        case "latestRating": return g.latestRating ?? g.avgRating ?? -Infinity;
        case "recommendation": return (getRecommendation(latest) || "").toLowerCase();
        case "scout": {
          const p = latest.scoutProfile;
          return `${p?.first_name || ""} ${p?.last_name || ""}`.trim().toLowerCase();
        }
        default: return 0;
      }
    };
    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [groupedReports, groupedSortKey, groupedSortDir]);

  const isGroupedMode = viewMode === "grouped";
  // Individual "Report" tab is for player-level reports only — custom players
  // (created inline in a match report) should only appear in the Player and
  // Match views, not as standalone report rows.
  const individualReports = useMemo(
    () => filteredReports.filter((r) => !(typeof r.playerId === "string" && r.playerId.startsWith("custom-"))),
    [filteredReports]
  );

  const sortedIndividualReports = useMemo(() => {
    if (!individualSortKey) return individualReports;
    const arr = [...individualReports];
    const dir = individualSortDir === "asc" ? 1 : -1;
    const getVal = (r: typeof arr[number]): string | number => {
      switch (individualSortKey) {
        case "player": return (r.player?.name || "").toLowerCase();
        case "club": return (r.player?.club || "").toLowerCase();
        case "match": {
          const mc = r.matchContext as any;
          if (!mc) return "";
          return (mc.isManual
            ? `${mc.homeTeam || ""} ${mc.awayTeam || ""}`
            : mc.opposition || ""
          ).toLowerCase();
        }
        case "watchMethod": return (r.watchMethod || "").toLowerCase();
        case "date": return new Date(r.createdAt).getTime();
        case "status": return r.status || "";
        case "rating": return convertRatingToNumeric(getOverallRating(r)) ?? -Infinity;
        case "verdict": return (getRecommendation(r) || "").toLowerCase();
        case "scout": {
          const p = r.scoutProfile;
          return `${p?.first_name || ""} ${p?.last_name || ""}`.trim().toLowerCase();
        }
        default: return 0;
      }
    };
    arr.sort((a, b) => {
      const va = getVal(a); const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [individualReports, individualSortKey, individualSortDir]);

  const itemsToDisplay = isGroupedMode ? sortedGroupedReports : sortedIndividualReports;
  const totalItems = itemsToDisplay.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = isGroupedMode
    ? sortedGroupedReports.slice(startIndex, endIndex).flatMap(group => group.allReports)
    : sortedIndividualReports.slice(startIndex, endIndex);
  
  // Reset to first page when tab changes or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchFilters, viewMode]);
  
  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const selectedReport = useMemo(
    () => (selectedReportId ? reports.find((r) => r.id === selectedReportId) ?? null : null),
    [selectedReportId, reports]
  );

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
        
        <div className="flex items-center gap-2">
          {recommendationsActive && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "default" | "recommendation")}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sort: Default</SelectItem>
                <SelectItem value="recommendation">Sort: Recommendation</SelectItem>
              </SelectContent>
            </Select>
          )}
          <SlidingToggle
            value={viewMode}
            onChange={(value) => setViewMode(value as "individual" | "grouped" | "match")}
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
              },
              { 
                value: "match", 
                label: (
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Match
                  </div>
                )
              }
            ]}
          />
        </div>
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
          {viewMode === "match" ? (
            <MatchReportsTable
              reports={sortedIndividualReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
            />
          ) : viewMode === "individual" ? (
            <ReportsTable
              reports={paginatedReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              sortKey={individualSortKey}
              sortDir={individualSortDir}
              onSort={handleIndividualSort}
            />
          ) : (
            <GroupedReportsTable
              reports={paginatedReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              onViewAllReports={handleViewAllReports}
              sortKey={groupedSortKey}
              sortDir={groupedSortDir}
              onSort={handleGroupedSort}
            />
          )}

          {viewMode !== "match" && totalPages > 1 && (
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

          {viewMode !== "match" && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} {isGroupedMode ? 'players' : 'reports'}
            </div>
          )}
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

      <MatchReportDetailDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => { if (!open) setSelectedMatch(null); }}
      />

      {editingMatch && (
        <MatchScoutingDrawer
          open={!!editingMatch}
          onOpenChange={(open) => { if (!open) setEditingMatch(null); }}
          homeTeam={editingMatch.homeTeam}
          awayTeam={editingMatch.awayTeam}
          matchDate={editingMatch.matchDate}
        />
      )}
    </div>
  );
};

export default ReportsList;
