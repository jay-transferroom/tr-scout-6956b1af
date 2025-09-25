import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Player } from "@/types/player";
import { useUnifiedPlayersData } from "@/hooks/useUnifiedPlayersData";
import { useTeamsData } from "@/hooks/useTeamsData";
import { getTeamLogoUrl } from "@/utils/teamLogos";
import { useNavigate } from "react-router-dom";
import { isNationalityInRegion } from "@/utils/regionMapping";
import SearchFilters from "@/components/unified-search/SearchFilters";
import PlayerSearchResults from "./player-search/PlayerSearchResults";
import PlayerRecentList from "./player-search/PlayerRecentList";

interface PlayerSearchProps {
  onSelectPlayer: (player: Player) => void;
}

const PlayerSearch = ({ onSelectPlayer }: PlayerSearchProps) => {
  const { data: players = [], isLoading, error } = useUnifiedPlayersData();
  const { data: teams = [] } = useTeamsData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const MAX_DISPLAY_RESULTS = 5;

  // Debug logging
  useEffect(() => {
    console.log('Players loading:', isLoading);
    console.log('Players error:', error);
    console.log('Search query:', searchQuery);
    console.log('Filtered players:', filteredPlayers);
    console.log('Show results:', searchQuery.length > 0);
  }, [isLoading, error, searchQuery, filteredPlayers]);

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

  // Initialize recent players from localStorage
  useEffect(() => {
    const recentPlayerIds = JSON.parse(localStorage.getItem('recentPlayers') || '[]');
    if (players.length > 0) {
      const recent = recentPlayerIds
        .map((id: string) => players.find(p => p.id === id))
        .filter((player: Player | undefined): player is Player => player !== undefined)
        .slice(0, 3);
      setRecentPlayers(recent);
    }
  }, [players]);

  // Filter players based on search query and filters
  useEffect(() => {
    if (!players.length) {
      setFilteredPlayers([]);
      return;
    }
    
    let results = [...players];
    
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase().trim();
      results = results.filter(player => 
        player.name.toLowerCase().includes(lowercaseQuery) || 
        player.club.toLowerCase().includes(lowercaseQuery) || 
        player.id.toLowerCase() === lowercaseQuery ||
        player.positions.some(pos => pos.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    if (ageFilter !== "all") {
      if (ageFilter === "u21") {
        results = results.filter(player => player.age < 21);
      } else if (ageFilter === "21-25") {
        results = results.filter(player => player.age >= 21 && player.age <= 25);
      } else if (ageFilter === "26+") {
        results = results.filter(player => player.age > 25);
      }
    }
    
    if (contractFilter !== "all") {
      results = results.filter(player => player.contractStatus === contractFilter);
    }
    
    if (regionFilter !== "all") {
      results = results.filter(player => isNationalityInRegion(player.nationality, regionFilter));
    }
    
    setFilteredPlayers(results);
  }, [searchQuery, ageFilter, contractFilter, regionFilter, players]);

  // Handle player selection - Updated to handle private players
  const handleSelectPlayer = (player: Player) => {
    console.log('Selecting player:', player);
    
    // Call the callback first
    onSelectPlayer(player);
    
    // Navigate to the appropriate profile page
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.privatePlayerData?.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
    
    // Update recent players in localStorage
    const recentPlayerIds = JSON.parse(localStorage.getItem('recentPlayers') || '[]');
    const updatedRecent = [player.id, ...recentPlayerIds.filter((id: string) => id !== player.id)].slice(0, 3);
    localStorage.setItem('recentPlayers', JSON.stringify(updatedRecent));
    
    // Update local state
    const isAlreadyRecent = recentPlayers.some(p => p.id === player.id);
    if (!isAlreadyRecent) {
      setRecentPlayers(prev => [player, ...prev.slice(0, 2)]);
    }
  };

  const handleViewMore = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    navigate(`/search?${params.toString()}`);
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Error loading players. Please try again later.
      </div>
    );
  }

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search player name, club, position or ID"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <SearchFilters
          ageFilter={ageFilter}
          contractFilter={contractFilter}
          regionFilter={regionFilter}
          onAgeFilterChange={setAgeFilter}
          onContractFilterChange={setContractFilter}
          onRegionFilterChange={setRegionFilter}
        />
      </div>
      
      {showSearchResults && (
        <PlayerSearchResults
          players={filteredPlayers}
          totalCount={filteredPlayers.length}
          maxDisplayResults={MAX_DISPLAY_RESULTS}
          getTeamLogo={getTeamLogo}
          onSelectPlayer={handleSelectPlayer}
          onViewMore={handleViewMore}
        />
      )}
      
      {!showSearchResults && (
        <PlayerRecentList
          players={recentPlayers}
          getTeamLogo={getTeamLogo}
          onSelectPlayer={handleSelectPlayer}
        />
      )}
    </div>
  );
};

export default PlayerSearch;
