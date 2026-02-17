import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUnifiedPlayersData } from "@/hooks/useUnifiedPlayersData";
import { usePlayerNameSearch } from "@/hooks/usePlayerNameSearch";
import { useTeamsData } from "@/hooks/useTeamsData";
import { getTeamLogoUrl } from "@/utils/teamLogos";
import { Player } from "@/types/player";
import PlayerSearchTableFilters, { PlayerSearchFilterCriteria } from "@/components/player-search/PlayerSearchTableFilters";
import PlayerSearchTable from "@/components/player-search/PlayerSearchTable";
import { isNationalityInRegion } from "@/utils/regionMapping";
import CustomiseMyRatingDialog, { CategoryWeights, DEFAULT_POSITION_WEIGHTS, computeMyRating, PositionKey } from "@/components/player-search/CustomiseMyRatingDialog";
import { clonePositionWeights } from "@/data/myRatingWeights";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: localPlayers = [], isLoading: localLoading } = useUnifiedPlayersData();
  const { data: teams = [] } = useTeamsData();
  
  const initialQuery = searchParams.get('q') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [myRatingWeights, setMyRatingWeights] = useState<Record<PositionKey, CategoryWeights[]>>(() => clonePositionWeights(DEFAULT_POSITION_WEIGHTS));
  const [leagueAdjustments, setLeagueAdjustments] = useState(true);
  const [showMyRatingDialog, setShowMyRatingDialog] = useState(false);
  const [searchFilters, setSearchFilters] = useState<PlayerSearchFilterCriteria>({
    searchTerm: initialQuery,
    sortBy: 'name',
    ageFilter: 'all',
    contractFilter: 'all',
    regionFilter: 'all',
    nationalityFilter: 'all',
    positionFilter: 'all'
  });

  const itemsPerPage = 20;

  // Use server-side search for queries with 2+ characters
  const { data: remotePlayers = [], isLoading: remoteLoading } = usePlayerNameSearch(searchFilters.searchTerm, 200);
  
  const isLoading = localLoading || (searchFilters.searchTerm.length >= 2 && remoteLoading);

  // Create a map of team names to team data for quick lookup
  const teamMap = teams.reduce((acc, team) => {
    acc[team.name] = team;
    return acc;
  }, {} as Record<string, any>);

  // Get team logo for a given club name
  const getTeamLogo = (clubName: string) => {
    // First try to get from teams data
    const team = teamMap[clubName];
    if (team?.logo_url) return team.logo_url;
    
    // Fallback to storage bucket logos
    return getTeamLogoUrl(clubName);
  };

  // Extract available nationalities from all players
  const availableNationalities = useMemo(() => {
    const nationalities = new Set<string>();
    [...localPlayers, ...remotePlayers].forEach(player => {
      if (player.nationality) {
        nationalities.add(player.nationality);
      }
    });
    return Array.from(nationalities).sort();
  }, [localPlayers, remotePlayers]);

  // Filter and sort players based on search query and filters
  useEffect(() => {
    let results: Player[] = [];
    
    // For queries with 2+ chars, use server-side search results and merge private players
    if (searchFilters.searchTerm.trim().length >= 2) {
      results = [...remotePlayers];
      
      // Add private players that match the query
      const privateMatches = localPlayers.filter(
        (p) => (p as any).isPrivatePlayer && p.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
      );
      results = [...privateMatches, ...results];
    } else if (searchFilters.searchTerm.trim().length === 1) {
      // For single character queries, use local search only
      const lowercaseQuery = searchFilters.searchTerm.toLowerCase().trim();
      results = localPlayers.filter(player => 
        player.name.toLowerCase().includes(lowercaseQuery) || 
        player.club.toLowerCase().includes(lowercaseQuery) || 
        player.id.toLowerCase() === lowercaseQuery ||
        player.positions.some(pos => pos.toLowerCase().includes(lowercaseQuery))
      );
    } else {
      // No query - show recent/all players (limited for performance)
      results = localPlayers.slice(0, 200);
    }
    
    // Apply filters
    if (searchFilters.ageFilter !== "all") {
      if (searchFilters.ageFilter === "u21") {
        results = results.filter(player => player.age < 21);
      } else if (searchFilters.ageFilter === "21-25") {
        results = results.filter(player => player.age >= 21 && player.age <= 25);
      } else if (searchFilters.ageFilter === "26+") {
        results = results.filter(player => player.age > 25);
      }
    }
    
    if (searchFilters.contractFilter !== "all") {
      if (searchFilters.contractFilter === "Expiring") {
        // Filter for contracts expiring within the next 6 months
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        results = results.filter(player => {
          if (!player.contractExpiry) return false;
          const expiryDate = new Date(player.contractExpiry);
          return expiryDate <= sixMonthsFromNow && expiryDate >= new Date();
        });
      } else {
        results = results.filter(player => player.contractStatus === searchFilters.contractFilter);
      }
    }
    
    if (searchFilters.regionFilter !== "all") {
      results = results.filter(player => isNationalityInRegion(player.nationality, searchFilters.regionFilter));
    }
    
    if (searchFilters.nationalityFilter !== "all") {
      results = results.filter(player => player.nationality === searchFilters.nationalityFilter);
    }
    
    if (searchFilters.positionFilter !== "all") {
      if (searchFilters.positionFilter === "gk") {
        results = results.filter(player => player.positions.some(pos => pos.toLowerCase() === "gk"));
      } else if (searchFilters.positionFilter === "def") {
        results = results.filter(player => player.positions.some(pos => 
          ["cb", "lb", "rb", "lwb", "rwb"].includes(pos.toLowerCase())
        ));
      } else if (searchFilters.positionFilter === "mid") {
        results = results.filter(player => player.positions.some(pos => 
          ["cdm", "cm", "cam", "lm", "rm"].includes(pos.toLowerCase())
        ));
      } else if (searchFilters.positionFilter === "att") {
        results = results.filter(player => player.positions.some(pos => 
          ["lw", "rw", "st", "cf"].includes(pos.toLowerCase())
        ));
      } else {
        // Fallback to original logic for other filters
        results = results.filter(player => player.positions.some(pos => pos.toLowerCase().includes(searchFilters.positionFilter.toLowerCase())));
      }
    }
    
    // Apply sorting (High to Low for rating/potential by default)
    results.sort((a, b) => {
      switch (searchFilters.sortBy) {
        case "rating":
          return (b.transferroomRating || 0) - (a.transferroomRating || 0);
        case "myRating":
          return (computeMyRating(b, myRatingWeights['CM']) || 0) - (computeMyRating(a, myRatingWeights['CM']) || 0);
        case "potential":
          return (b.futureRating || 0) - (a.futureRating || 0);
        case "contract-expiry":
          if (!a.contractExpiry && !b.contractExpiry) return 0;
          if (!a.contractExpiry) return 1;
          if (!b.contractExpiry) return -1;
          return new Date(a.contractExpiry).getTime() - new Date(b.contractExpiry).getTime();
        case "age":
          return a.age - b.age;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredPlayers(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchFilters, localPlayers, remotePlayers, myRatingWeights]);

  // Initialize filters from URL parameters
  useEffect(() => {
    const contractParam = searchParams.get('contract');
    const positionParam = searchParams.get('position');
    const ageParam = searchParams.get('age');
    
    if (contractParam) {
      setSearchFilters(prev => ({ ...prev, contractFilter: contractParam }));
    }
    if (positionParam) {
      setSearchFilters(prev => ({ ...prev, positionFilter: positionParam }));
    }
    if (ageParam) {
      setSearchFilters(prev => ({ ...prev, ageFilter: ageParam }));
    }
  }, [searchParams]);

  const handlePlayerClick = (player: Player) => {
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.privatePlayerData?.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  // Pagination logic
  const totalItems = filteredPlayers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading players...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Player Search</h1>
        <p className="text-muted-foreground mt-2">
          {searchFilters.searchTerm ? `Results for "${searchFilters.searchTerm}"` : "Recommended players"}
        </p>
      </div>

      <PlayerSearchTableFilters 
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        availableNationalities={availableNationalities}
        onCustomiseMyRating={() => setShowMyRatingDialog(true)}
      />

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Found {totalItems} players
        </p>
      </div>

      <PlayerSearchTable
        players={paginatedPlayers}
        onPlayerClick={handlePlayerClick}
        getTeamLogo={getTeamLogo}
        currentSort={searchFilters.sortBy}
        onSort={(sortBy) => setSearchFilters({ ...searchFilters, sortBy })}
        myRatingWeights={myRatingWeights}
      />

      <CustomiseMyRatingDialog
        open={showMyRatingDialog}
        onOpenChange={setShowMyRatingDialog}
        weights={myRatingWeights}
        onWeightsChange={setMyRatingWeights}
        leagueAdjustments={leagueAdjustments}
        onLeagueAdjustmentsChange={setLeagueAdjustments}
      />

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
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} players
      </div>
    </div>
  );
};

export default SearchResults;