
import { useMemo } from "react";
import { determinePlayerStatus, getStatusBadgeProps } from "@/utils/playerStatusUtils";

interface UseShortlistsLogicProps {
  allPlayers: any[];
  assignments: any[];
  reports: any[];
  selectedList: string | null;
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  euGbeFilter: string;
  shortlists: any[];
  privatePlayers: any[];
  positionFilter: string;
  xtvRange: [number, number];
  scoutedFilter: string;
  statusFilter: string;
}

export const useShortlistsLogic = ({
  allPlayers,
  assignments,
  reports,
  selectedList,
  searchTerm,
  sortBy,
  sortOrder,
  euGbeFilter,
  shortlists,
  privatePlayers,
  positionFilter,
  xtvRange,
  scoutedFilter,
  statusFilter
}: UseShortlistsLogicProps) => {
  
  // Get real private players for shortlists from usePrivatePlayers hook
  const getPrivatePlayersForShortlist = (shortlistId: string, allPrivatePlayers: any[], shortlist: any) => {
    if (!shortlist || !shortlist.playerIds) return [];
    
    return allPrivatePlayers
      .filter(player => shortlist.playerIds.includes(player.id))
      .map(player => ({
        ...player,
        isPrivate: true,
        profilePath: `/private-player/${player.id}`
      }));
  };

  const currentList = shortlists.find(list => list.id === selectedList);
  
  console.log('=== SHORTLISTS LOGIC DEBUG ===');
  console.log('Selected list ID:', selectedList);
  console.log('Current list found:', currentList ? `${currentList.name} (${currentList.playerIds?.length || 0} players)` : 'None');
  console.log('All shortlists:', shortlists.map(s => ({ id: s.id, name: s.name, playerCount: s.playerIds?.length || 0 })));
  
  // Get players based on list type - FIXED LOGIC
  let currentPublicPlayers: any[] = [];
  let currentPrivatePlayers: any[] = [];
  
  if (currentList) {
    // Get private players for this shortlist first
    currentPrivatePlayers = getPrivatePlayersForShortlist(currentList.id, privatePlayers, currentList);
    
    // For custom lists (those with playerIds but no filter), only show manually added players
    if (currentList.playerIds && currentList.playerIds.length > 0 && !currentList.filter) {
      // Custom shortlist - only show manually added public players
      currentPublicPlayers = allPlayers.filter(player => 
        currentList.playerIds.includes(player.id.toString())
      );
    }
    // For default lists with filters, apply the filter to get base players
    else if (currentList.filter && typeof currentList.filter === 'function') {
      currentPublicPlayers = allPlayers.filter(currentList.filter);
      
      // Then add any manually added players that aren't already included
      if (currentList.playerIds && currentList.playerIds.length > 0) {
        const manualPlayers = allPlayers.filter(player => 
          currentList.playerIds.includes(player.id.toString()) &&
          !currentPublicPlayers.some(existing => existing.id.toString() === player.id.toString())
        );
        currentPublicPlayers = [...currentPublicPlayers, ...manualPlayers];
      }
    }
    // For lists with only playerIds and no filter (shouldn't happen with current setup, but defensive)
    else if (currentList.playerIds && currentList.playerIds.length > 0) {
      currentPublicPlayers = allPlayers.filter(player => 
        currentList.playerIds.includes(player.id.toString())
      );
    }
    
    // Remove duplicates from public players
    const seenIds = new Set();
    currentPublicPlayers = currentPublicPlayers.filter(player => {
      const id = player.id.toString();
      if (seenIds.has(id)) {
        return false;
      }
      seenIds.add(id);
      return true;
    });
  }
  
  // Combine public and private players
  const allCurrentPlayers = [
    ...currentPublicPlayers.map(p => ({ ...p, isPrivate: false, profilePath: `/player/${p.id}` })),
    ...currentPrivatePlayers
  ];
  
  console.log('Total players for current list:', allCurrentPlayers.length);
  console.log('Public players:', currentPublicPlayers.length, 'Private players:', currentPrivatePlayers.length);
  
  // Calculate max xTV for range filter
  const maxXtv = useMemo(() => {
    if (allCurrentPlayers.length === 0) return 100;
    const maxScore = Math.max(...allCurrentPlayers.map(p => (p.xtvScore || 0) / 1000000));
    return Math.max(Math.ceil(maxScore), 1); // At least 1M for the slider
  }, [allCurrentPlayers]);

  // Helper to check if player has been scouted (has reports)
  const hasPlayerBeenScouted = (playerId: string): boolean => {
    return reports.some(report => report.playerId === playerId);
  };

  // Helper to get player status for filtering
  const getPlayerStatusForFilter = (playerId: string): string => {
    const assignment = assignments.find(a => a.player_id === playerId);
    if (hasPlayerBeenScouted(playerId)) return 'reported';
    if (assignment) {
      if (assignment.status === 'completed') return 'completed';
      if (assignment.status === 'in_progress') return 'in_progress';
      return 'assigned';
    }
    return 'not_scouted';
  };

  // Apply search filter
  const searchFilteredPlayers = allCurrentPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.positions.some((pos: string) => pos?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Apply EU/GBE filter (only for public players)
  const euGbeFilteredPlayers = euGbeFilter === "all" 
    ? searchFilteredPlayers 
    : searchFilteredPlayers.filter(player => 
        player.isPrivate || (player.euGbeStatus || 'Pass').toLowerCase() === euGbeFilter.toLowerCase()
      );

  // Apply position filter
  const positionFilteredPlayers = positionFilter === "all"
    ? euGbeFilteredPlayers
    : euGbeFilteredPlayers.filter(player =>
        player.positions?.some((pos: string) => 
          pos.toLowerCase() === positionFilter.toLowerCase()
        )
      );

  // Apply xTV range filter
  const xtvFilteredPlayers = positionFilteredPlayers.filter(player => {
    const xtvInMillions = (player.xtvScore || 0) / 1000000;
    return xtvInMillions >= xtvRange[0] && xtvInMillions <= xtvRange[1];
  });

  // Apply scouted filter
  const scoutedFilteredPlayers = scoutedFilter === "all"
    ? xtvFilteredPlayers
    : xtvFilteredPlayers.filter(player => {
        const isScouted = hasPlayerBeenScouted(player.id.toString());
        return scoutedFilter === "yes" ? isScouted : !isScouted;
      });

  // Apply status filter
  const statusFilteredPlayers = statusFilter === "all"
    ? scoutedFilteredPlayers
    : scoutedFilteredPlayers.filter(player => {
        const status = getPlayerStatusForFilter(player.id.toString());
        return status === statusFilter;
      });

  // Apply sorting
  const sortedPlayers = useMemo(() => {
    return [...statusFilteredPlayers].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "age":
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        case "xtv":
          aValue = a.xtvScore || 0;
          bValue = b.xtvScore || 0;
          break;
        case "rating":
          aValue = a.transferroomRating || 0;
          bValue = b.transferroomRating || 0;
          break;
        case "potential":
          aValue = a.futureRating || 0;
          bValue = b.futureRating || 0;
          break;
        case "contract":
          aValue = a.contractExpiry ? new Date(a.contractExpiry).getTime() : 0;
          bValue = b.contractExpiry ? new Date(b.contractExpiry).getTime() : 0;
          break;
        case "position":
          aValue = a.positions?.[0]?.toLowerCase() || '';
          bValue = b.positions?.[0]?.toLowerCase() || '';
          break;
        case "name":
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [statusFilteredPlayers, sortBy, sortOrder]);

  const formatXtvScore = (score: number) => {
    return (score / 1000000).toFixed(1);
  };

  // Updated to use consolidated assignment data
  const getPlayerAssignment = (playerId: string) => {
    const assignment = assignments.find(assignment => assignment.player_id === playerId);
    console.log(`Looking for assignment for player ${playerId}:`, assignment);
    return assignment;
  };

  // Create reports map for quick lookup
  const playerReportsMap = new Map();
  reports.forEach(report => {
    if (report.playerId) {
      playerReportsMap.set(report.playerId, report);
    }
  });

  const getAssignmentBadge = (playerId: string) => {
    const assignment = getPlayerAssignment(playerId);
    
    // Clean up: if player has active assignment but is still in scouting shortlist, remove them
    const scoutingShortlist = shortlists.find(list => list.is_scouting_assignment_list);
    const isInScoutingList = scoutingShortlist?.playerIds?.includes(playerId);
    
    if (assignment && isInScoutingList) {
      // Player has assignment but is still in scouting list - this is inconsistent
      // The player should have been removed when assigned, but let's handle this case
      console.log(`Player ${playerId} has assignment but is still in scouting list - data cleanup needed`);
    }
    
    // Use unified status determination - but override scoutingAssignmentPlayerIds
    // to exclude players who have active assignments (they shouldn't be "marked for scouting")
    const cleanScoutingAssignmentPlayerIds = new Set<string>(
      (scoutingShortlist?.playerIds || [])
        .filter((id): id is string => typeof id === 'string')
        .filter(id => !assignments.some(a => a.player_id === id))
    );
    
    const statusInfo = determinePlayerStatus({
      playerId,
      assignments,
      reports,
      scoutingAssignmentPlayerIds: cleanScoutingAssignmentPlayerIds
    });
    
    return getStatusBadgeProps(statusInfo);
  };

  const getEuGbeBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pass': 'bg-green-100 text-green-800',
      'Fail': 'bg-red-100 text-red-800',
      'Pending': 'bg-yellow-100 text-yellow-800'
    };
    
    return {
      variant: "outline" as const,
      className: `${colors[status]} border-0`,
      children: status
    };
  };

  return {
    currentList,
    sortedPlayers,
    maxXtv,
    formatXtvScore,
    getPlayerAssignment,
    getAssignmentBadge,
    getEuGbeBadge,
    hasPlayerBeenScouted,
    getPlayerStatusForFilter
  };
};
