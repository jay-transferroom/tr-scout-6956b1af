import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, ArrowRight } from "lucide-react";
import { Player } from "@/types/player";
import { useUnifiedPlayersData } from "@/hooks/useUnifiedPlayersData";
import { useTeamsData } from "@/hooks/useTeamsData";
import { getTeamLogoUrl } from "@/utils/teamLogos";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const HeaderSearch = () => {
  const { data: players = [] } = useUnifiedPlayersData();
  const { data: teams = [] } = useTeamsData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);

  const MAX_DISPLAY_RESULTS = 8; // Increased to show more results

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

  // Filter players based on search query - IMPROVED SEARCH LOGIC
  useEffect(() => {
    if (!players.length) {
      setFilteredPlayers([]);
      return;
    }
    
    if (!searchQuery.trim()) {
      setFilteredPlayers([]);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase().trim();
    console.log('HeaderSearch - Filtering players for query:', lowercaseQuery);
    console.log('HeaderSearch - Total players to search:', players.length);
    
    const results = players.filter(player => {
      const nameMatch = player.name.toLowerCase().includes(lowercaseQuery);
      const clubMatch = player.club.toLowerCase().includes(lowercaseQuery);
      const idMatch = player.id.toLowerCase() === lowercaseQuery;
      const positionMatch = player.positions.some(pos => pos.toLowerCase().includes(lowercaseQuery));
      const nationalityMatch = player.nationality?.toLowerCase().includes(lowercaseQuery);
      
      // Debug logging for James searches
      if (lowercaseQuery.includes('james')) {
        console.log(`HeaderSearch - Player ${player.name}: name=${nameMatch}, club=${clubMatch}, matches=${nameMatch || clubMatch || idMatch || positionMatch || nationalityMatch}`);
      }
      
      return nameMatch || clubMatch || idMatch || positionMatch || nationalityMatch;
    });
    
    console.log('HeaderSearch - Filtered results count:', results.length);
    setFilteredPlayers(results); // Keep all results for proper counting
  }, [searchQuery, players]);

  // Handle player selection - Updated to handle private players
  const handleSelectPlayer = (player: Player) => {
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.privatePlayerData?.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
    setOpen(false);
    setSearchQuery("");
    
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
    setOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((open) => !open);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search players, reports... (⌘K)"
          className="pl-10 pr-4 cursor-pointer"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search players, reports..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.trim() ? (
            filteredPlayers.length > 0 ? (
            <CommandGroup heading={`Players (${filteredPlayers.length})`}>
                {filteredPlayers.slice(0, MAX_DISPLAY_RESULTS).map((player) => {
                  const teamLogo = getTeamLogo(player.club);
                  
                  return (
                    <CommandItem
                      key={player.id}
                      onSelect={() => handleSelectPlayer(player)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={player.image} 
                          alt={player.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                          {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.club} • {player.positions.join(", ")}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-right">
                          <p>{player.age} yrs</p>
                          <p className="text-muted-foreground">{player.nationality}</p>
                        </div>
                        
                        {teamLogo && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={teamLogo} 
                              alt={`${player.club} logo`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-semibold">
                              {player.club.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
                
                {filteredPlayers.length > MAX_DISPLAY_RESULTS && (
                  <CommandItem onSelect={handleViewMore} className="flex items-center justify-center gap-2 p-3 text-sm">
                    <ArrowRight className="h-4 w-4" />
                    View all {filteredPlayers.length} results
                  </CommandItem>
                )}
              </CommandGroup>
            ) : (
              <CommandEmpty>No players found for "{searchQuery}"</CommandEmpty>
            )
          ) : (
            recentPlayers.length > 0 && (
              <CommandGroup heading="Recently Viewed">
                {recentPlayers.map((player) => {
                  const teamLogo = getTeamLogo(player.club);
                  
                  return (
                    <CommandItem
                      key={player.id}
                      onSelect={() => handleSelectPlayer(player)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={player.image} 
                          alt={player.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                          {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.club} • {player.positions.join(", ")}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-right">
                          <p>{player.age} yrs</p>
                          <p className="text-muted-foreground">{player.nationality}</p>
                        </div>
                        
                        {teamLogo && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={teamLogo} 
                              alt={`${player.club} logo`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-semibold">
                              {player.club.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default HeaderSearch;
