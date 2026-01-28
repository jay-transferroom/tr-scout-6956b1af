
import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Download, Plus, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, FileText, UserPlus, Bookmark, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import { useAuth } from "@/contexts/AuthContext";
import { ClubBadge } from "@/components/ui/club-badge";
import { ScoutAvatars } from "@/components/ui/scout-avatars";
import { usePlayerScouts } from "@/hooks/usePlayerScouts";
import { Slider } from "@/components/ui/slider";

interface ShortlistsContentProps {
  currentList: any;
  sortedPlayers: any[];
  allPlayers: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortByChange: (value: string) => void;
  onSortOrderChange: () => void;
  euGbeFilter: string;
  onEuGbeFilterChange: (value: string) => void;
  positionFilter: string;
  onPositionFilterChange: (value: string) => void;
  xtvRange: [number, number];
  onXtvRangeChange: (value: [number, number]) => void;
  maxXtv: number;
  scoutedFilter: string;
  onScoutedFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  getAssignmentBadge: (playerId: string) => { variant: any; className?: string; children: string };
  getEuGbeBadge: (status: string) => { variant: any; className?: string; children: string };
  formatXtvScore: (score: number) => string;
  onAssignScout: (player: any) => void;
  onRemovePlayer: (playerId: string) => void;
  onExportList: () => void;
  onAddPlayersToShortlist: (playerIds: string[]) => void;
}

export const ShortlistsContent = ({
  currentList,
  sortedPlayers,
  allPlayers,
  searchTerm,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  euGbeFilter,
  onEuGbeFilterChange,
  positionFilter,
  onPositionFilterChange,
  xtvRange,
  onXtvRangeChange,
  maxXtv,
  scoutedFilter,
  onScoutedFilterChange,
  statusFilter,
  onStatusFilterChange,
  getAssignmentBadge,
  getEuGbeBadge,
  formatXtvScore,
  onAssignScout,
  onRemovePlayer,
  onExportList,
  onAddPlayersToShortlist
}: ShortlistsContentProps) => {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { profile } = useAuth();

  // Check if user can manage shortlists (director or recruitment)
  const canManageShortlists = profile?.role === 'director' || profile?.role === 'recruitment';

  // Auto-suggest players based on shortlist name - moved before early return
  const suggestedPlayers = useMemo(() => {
    if (!currentList || !allPlayers || allPlayers.length === 0) return [];

    const listName = currentList.name.toLowerCase();
    const positionKeywords = {
      'striker': ['st', 'cf', 'striker', 'forward'],
      'winger': ['lw', 'rw', 'lm', 'rm', 'wing'],
      'midfielder': ['cm', 'cam', 'cdm', 'dm', 'mid'],
      'defender': ['cb', 'lb', 'rb', 'lwb', 'rwb', 'def'],
      'goalkeeper': ['gk', 'keeper'],
      'fullback': ['lb', 'rb', 'back'],
      'centreback': ['cb', 'centre', 'center'],
      'centremid': ['cm', 'centre', 'center'],
      'attacking': ['cam', 'cf', 'lw', 'rw', 'attack'],
      'defensive': ['cdm', 'cb', 'dm', 'def']
    };

    // Get current shortlist player IDs to exclude them
    const currentPlayerIds = new Set(currentList.playerIds || []);

    // Find matching positions based on shortlist name
    let relevantPositions: string[] = [];
    for (const [keyword, positions] of Object.entries(positionKeywords)) {
      if (listName.includes(keyword)) {
        relevantPositions.push(...positions);
      }
    }

    // If no specific keywords found, try to match exact position abbreviations
    if (relevantPositions.length === 0) {
      const allPositions = Object.values(positionKeywords).flat();
      relevantPositions = allPositions.filter(pos => listName.includes(pos.toLowerCase()));
    }

    if (relevantPositions.length === 0) return [];

    // Filter players by matching positions and exclude already added players
    const suggested = allPlayers
      .filter(player => {
        const playerId = player.isPrivatePlayer ? player.id : player.id.toString();
        if (currentPlayerIds.has(playerId)) return false;
        
        return player.positions?.some((pos: string) => 
          relevantPositions.some(relevantPos => 
            pos.toLowerCase().includes(relevantPos.toLowerCase())
          )
        );
      })
      .slice(0, 10); // Limit to 10 suggestions

    return suggested;
  }, [currentList, allPlayers]);

  const handleAddSuggestedPlayers = () => {
    const playerIds = suggestedPlayers.map(player => 
      player.isPrivatePlayer ? player.id : player.id.toString()
    );
    onAddPlayersToShortlist(playerIds);
  };

  const handleCreateReport = (player: any) => {
    // This will be handled by the parent component
    console.log("Creating report for:", player);
  };

  // Sortable table header component
  const SortableTableHead = ({ 
    column, 
    currentSort, 
    sortOrder, 
    onSort, 
    children 
  }: { 
    column: string; 
    currentSort: string; 
    sortOrder: "asc" | "desc"; 
    onSort: (value: string) => void; 
    children: React.ReactNode;
  }) => {
    const isActive = currentSort === column;
    
    const handleClick = () => {
      onSort(column);
    };
    
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={handleClick}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortOrder === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  if (!currentList) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Select a shortlist to view players</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-full">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-0 max-w-full">
            <span className="break-words max-w-full">{currentList.name}</span>
            <Badge variant="secondary" className="shrink-0">{sortedPlayers.length} players</Badge>
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto min-w-0">
            <Button variant="outline" size="sm" onClick={onExportList} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {canManageShortlists && (
              <Button size="sm" onClick={() => setIsSearchDialogOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Player</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Shortlist Description */}
      {currentList.description && (
        <div className="px-4 sm:px-6 pb-4 w-full max-w-full overflow-hidden">
          <p className="text-sm text-muted-foreground break-words">{currentList.description}</p>
        </div>
      )}
      
      <CardContent className="w-full max-w-full overflow-hidden px-4 sm:px-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Row 1: Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-full min-w-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by player or club name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto min-w-0">
              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger className="w-full sm:w-40 max-w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="potential">Potential</SelectItem>
                  <SelectItem value="xtv">XTV</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={onSortOrderChange}
                className="shrink-0"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Position Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Position</span>
              <Select value={positionFilter} onValueChange={onPositionFilterChange}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="GK">GK</SelectItem>
                  <SelectItem value="CB">CB</SelectItem>
                  <SelectItem value="LB">LB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="CDM">CDM</SelectItem>
                  <SelectItem value="CM">CM</SelectItem>
                  <SelectItem value="CAM">CAM</SelectItem>
                  <SelectItem value="LW">LW</SelectItem>
                  <SelectItem value="RW">RW</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="CF">CF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* xTV Range Filter */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[400px]">
              <span className="text-xs font-medium text-muted-foreground">
                xTV Range: £{xtvRange[0]}M - £{xtvRange[1]}M
              </span>
              <div className="h-9 flex items-center">
                <Slider
                  value={xtvRange}
                  onValueChange={(value) => onXtvRangeChange(value as [number, number])}
                  min={0}
                  max={maxXtv}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Scouted Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Scouted</span>
              <Select value={scoutedFilter} onValueChange={onScoutedFilterChange}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not_scouted">Not Scouted</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* EU/GBE Filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">EU/GBE</span>
              <Select value={euGbeFilter} onValueChange={onEuGbeFilterChange}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-transparent">Clear</span>
              <Button 
                variant="outline" 
                size="sm"
                className="h-9"
                onClick={() => {
                  onPositionFilterChange("all");
                  onXtvRangeChange([0, maxXtv]);
                  onScoutedFilterChange("all");
                  onStatusFilterChange("all");
                  onEuGbeFilterChange("all");
                  onSearchChange("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Auto-suggestions section */}
        {canManageShortlists && suggestedPlayers.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Suggested Players</h4>
                <Badge variant="secondary">{suggestedPlayers.length} found</Badge>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddSuggestedPlayers}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add All
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your shortlist name "{currentList.name}", we found these matching players:
            </p>
            <div className="space-y-2">
              {suggestedPlayers.map((player) => {
                const rating = player.transferroomRating || 0;
                const suitability = rating >= 85 ? 'Excellent' : rating >= 75 ? 'Good' : rating >= 65 ? 'Average' : 'Below Average';
                const suitabilityColor = rating >= 85 ? 'bg-green-100 text-green-800' : 
                                       rating >= 75 ? 'bg-blue-100 text-blue-800' : 
                                       rating >= 65 ? 'bg-yellow-100 text-yellow-800' : 
                                       'bg-gray-100 text-gray-800';
                
                return (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => onAddPlayersToShortlist([player.isPrivatePlayer ? player.id : player.id.toString()])}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.image} alt={player.name} />
                        <AvatarFallback className="text-xs">
                          {player.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-muted-foreground">{player.club}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {player.positions?.[0]}
                      </Badge>
                      {rating > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {rating.toFixed(1)}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${suitabilityColor} border-0`}>
                        {suitability}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players - Mobile cards and desktop table */}
        <div className="block md:hidden space-y-3 w-full max-w-full overflow-hidden">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player) => {
              const assignmentBadgeProps = getAssignmentBadge(player.id.toString());
              const euGbeBadgeProps = getEuGbeBadge(player.euGbeStatus || 'Pass');
              return (
                <ShortlistPlayerCard
                  key={player.id}
                  player={player}
                  assignmentBadgeProps={assignmentBadgeProps}
                  euGbeBadgeProps={euGbeBadgeProps}
                  formatXtvScore={formatXtvScore}
                  handleCreateReport={handleCreateReport}
                  onAssignScout={onAssignScout}
                  onRemovePlayer={onRemovePlayer}
                  canManageShortlists={canManageShortlists}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No players found matching your criteria.
            </div>
          )}
        </div>

        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead 
                  column="name" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  Player
                </SortableTableHead>
                <SortableTableHead 
                  column="age" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  Age
                </SortableTableHead>
                <SortableTableHead 
                  column="position" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  Positions
                </SortableTableHead>
                <SortableTableHead 
                  column="rating" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  Rating
                </SortableTableHead>
                <SortableTableHead 
                  column="potential" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  Potential
                </SortableTableHead>
                <SortableTableHead 
                  column="xtv" 
                  currentSort={sortBy} 
                  sortOrder={sortOrder} 
                  onSort={onSortByChange}
                >
                  XTV (£M)
                </SortableTableHead>
                <TableHead>EU/GBE</TableHead>
                <TableHead>Scouts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player) => {
                  const assignmentBadgeProps = getAssignmentBadge(player.id.toString());
                  const euGbeBadgeProps = getEuGbeBadge(player.euGbeStatus || 'Pass');
                  
                  return (
                    <ShortlistPlayerRow 
                      key={player.id}
                      player={player}
                      assignmentBadgeProps={assignmentBadgeProps}
                      euGbeBadgeProps={euGbeBadgeProps}
                      formatXtvScore={formatXtvScore}
                      handleCreateReport={handleCreateReport}
                      onAssignScout={onAssignScout}
                      onRemovePlayer={onRemovePlayer}
                      canManageShortlists={canManageShortlists}
                    />
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No players found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Player Search Dialog */}
      {canManageShortlists && (
        <PlayerSearchDialog
          open={isSearchDialogOpen}
          onOpenChange={setIsSearchDialogOpen}
          onAddPlayers={onAddPlayersToShortlist}
          excludePlayerIds={sortedPlayers.map(p => p.id.toString())}
        />
      )}
    </Card>
  );
};

// Separate component for table row to handle scout data fetching
const ShortlistPlayerRow = ({
  player,
  assignmentBadgeProps,
  euGbeBadgeProps,
  formatXtvScore,
  handleCreateReport,
  onAssignScout,
  onRemovePlayer,
  canManageShortlists
}: {
  player: any;
  assignmentBadgeProps: any;
  euGbeBadgeProps: any;
  formatXtvScore: (score: number) => string;
  handleCreateReport: (player: any) => void;
  onAssignScout: (player: any) => void;
  onRemovePlayer: (playerId: string) => void;
  canManageShortlists: boolean;
}) => {
  const { data: scouts = [] } = usePlayerScouts(player.id.toString());

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.image} alt={player.name} />
            <AvatarFallback>
              {player.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{player.name}</div>
            <div className="mt-1">
              <ClubBadge clubName={player.club} size="sm" />
            </div>
            {player.isPrivate && (
              <Badge variant="secondary" className="text-xs mt-1">Private</Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{player.age || 'N/A'}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          {player.positions?.slice(0, 2).map((pos: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {pos}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        {player.transferroomRating ? player.transferroomRating.toFixed(1) : 'N/A'}
      </TableCell>
      <TableCell>
        {player.futureRating ? player.futureRating.toFixed(1) : 'N/A'}
      </TableCell>
      <TableCell>
        {player.xtvScore ? formatXtvScore(player.xtvScore) : 'N/A'}
      </TableCell>
      <TableCell>
        {!player.isPrivate && <Badge {...euGbeBadgeProps} />}
      </TableCell>
      <TableCell>
        {!player.isPrivate && scouts.length > 0 ? (
          <ScoutAvatars scouts={scouts} size="sm" maxVisible={3} />
        ) : (
          <span className="text-xs text-muted-foreground">
            {player.isPrivate ? 'Private Player' : 'Unassigned'}
          </span>
        )}
      </TableCell>
      <TableCell>
        {!player.isPrivate ? (
          <div className="flex flex-col gap-1">
            <Badge {...assignmentBadgeProps} className="text-xs font-medium" />
            {assignmentBadgeProps.children.includes('completed') && (
              <span className="text-xs text-muted-foreground">
                Report submitted
              </span>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Private Player
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-[calc(100vw-16px)]">
            <DropdownMenuItem asChild>
              <Link to={player.profilePath}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateReport(player)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Report
            </DropdownMenuItem>
            {!player.isPrivate && (
              <DropdownMenuItem onClick={() => onAssignScout(player)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {scouts.length > 0 ? "Assign Another Scout" : "Assign Scout"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Bookmark className="h-4 w-4 mr-2" />
              Move to list
            </DropdownMenuItem>
            {canManageShortlists && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onRemovePlayer(player.id.toString())}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from list
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

// Mobile card component for shortlist players
const ShortlistPlayerCard = ({
  player,
  assignmentBadgeProps,
  euGbeBadgeProps,
  formatXtvScore,
  handleCreateReport,
  onAssignScout,
  onRemovePlayer,
  canManageShortlists
}: {
  player: any;
  assignmentBadgeProps: any;
  euGbeBadgeProps: any;
  formatXtvScore: (score: number) => string;
  handleCreateReport: (player: any) => void;
  onAssignScout: (player: any) => void;
  onRemovePlayer: (playerId: string) => void;
  canManageShortlists: boolean;
}) => {
  const { data: scouts = [] } = usePlayerScouts(player.id.toString());

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardContent className="p-3 sm:p-4 w-full max-w-full overflow-hidden">
        {/* Player Header */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3 w-full max-w-full overflow-hidden">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
            <AvatarImage src={player.image} alt={player.name} />
            <AvatarFallback className="text-xs">
              {player.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <Link to={player.profilePath} className="font-medium hover:underline text-sm sm:text-base block truncate">
              {player.name}
            </Link>
            <div className="mt-1">
              <ClubBadge clubName={player.club} size="sm" />
            </div>
            {player.isPrivate && (
              <Badge variant="secondary" className="text-xs mt-1">Private</Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-w-[calc(100vw-16px)]">
              <DropdownMenuItem asChild>
                <Link to={player.profilePath}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateReport(player)}>
                <FileText className="h-4 w-4 mr-2" />
                Create Report
              </DropdownMenuItem>
              {!player.isPrivate && (
                <DropdownMenuItem onClick={() => onAssignScout(player)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {scouts.length > 0 ? "Assign Another Scout" : "Assign Scout"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Bookmark className="h-4 w-4 mr-2" />
                Move to list
              </DropdownMenuItem>
              {canManageShortlists && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onRemovePlayer(player.id.toString())}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from list
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 max-w-full">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Age</div>
            <div className="font-medium">{player.age || 'N/A'}</div>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-muted-foreground mb-1">Positions</div>
            <div className="flex gap-1 flex-wrap">
              {player.positions?.slice(0, 2).map((pos: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs shrink-0">
                  {pos}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Rating</div>
            <div className="font-medium">
              {player.transferroomRating ? player.transferroomRating.toFixed(1) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Potential</div>
            <div className="font-medium">
              {player.futureRating ? player.futureRating.toFixed(1) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">XTV (£M)</div>
            <div className="font-medium">
              {player.xtvScore ? formatXtvScore(player.xtvScore) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">EU/GBE</div>
            <div>
              {!player.isPrivate ? (
                <Badge {...euGbeBadgeProps} className="text-xs" />
              ) : (
                <span className="text-xs">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* Scouts and Status */}
        <div className="flex items-start justify-between pt-3 border-t gap-2 w-full max-w-full overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-xs text-muted-foreground mb-1">Scouts</div>
            {!player.isPrivate && scouts.length > 0 ? (
              <div className="overflow-hidden">
                <ScoutAvatars scouts={scouts} size="sm" maxVisible={2} />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {player.isPrivate ? 'Private' : 'Unassigned'}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            {!player.isPrivate ? (
              <Badge {...assignmentBadgeProps} className="text-xs whitespace-nowrap" />
            ) : (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap">
                Private
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
