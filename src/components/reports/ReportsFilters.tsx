import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ReportsFilterCriteria {
  searchTerm: string;
  playerName: string;
  club: string;
  positions: string;
  verdict: string;
  status: string;
  scout: string;
  dateRange: string;
}

interface ReportsFiltersProps {
  filters: ReportsFilterCriteria;
  onFiltersChange: (filters: ReportsFilterCriteria) => void;
  availableVerdicts: string[];
  availableScouts: Array<{ id: string; name: string }>;
  availableClubs: Array<{ id: string; name: string }>;
  availablePositions: string[];
  availablePlayerNames: string[];
}

const ReportsFilters = ({ filters, onFiltersChange, availableVerdicts, availableScouts, availableClubs, availablePositions, availablePlayerNames }: ReportsFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof ReportsFilterCriteria, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      playerName: '',
      club: '',
      positions: '',
      verdict: '',
      status: '',
      scout: '',
      dateRange: ''
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className="mb-6">
      {/* Search Bar - Always Visible */}
        <div className="flex gap-4 items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by player name, club, position, or status..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Toggle */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-[800px] p-6 z-50 bg-background border shadow-lg" align="end">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Player Name Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Player Name</label>
                  <Select value={filters.playerName} onValueChange={(value) => updateFilter('playerName', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All players</SelectItem>
                      {availablePlayerNames.map((playerName) => (
                        <SelectItem key={playerName} value={playerName}>
                          {playerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Club Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Club</label>
                  <Select value={filters.club} onValueChange={(value) => updateFilter('club', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clubs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clubs</SelectItem>
                      {availableClubs.map((club) => (
                        <SelectItem key={club.id} value={club.name}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Positions Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Select value={filters.positions} onValueChange={(value) => updateFilter('positions', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All positions</SelectItem>
                      {availablePositions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recommendation Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recommendation</label>
                  <Select value={filters.verdict} onValueChange={(value) => updateFilter('verdict', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All recommendations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All recommendations</SelectItem>
                      {availableVerdicts.map((verdict) => (
                        <SelectItem key={verdict} value={verdict}>
                          {verdict}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scout Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scout</label>
                  <Select value={filters.scout} onValueChange={(value) => updateFilter('scout', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All scouts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All scouts</SelectItem>
                      {availableScouts.map((scout) => (
                        <SelectItem key={scout.id} value={scout.id}>
                          {scout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="quarter">This quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Search: "{filters.searchTerm}"
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('searchTerm', '')}
                />
              </Badge>
            )}
            {filters.playerName && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Player: {filters.playerName}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('playerName', '')}
                />
              </Badge>
            )}
            {filters.club && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Club: {filters.club}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('club', '')}
                />
              </Badge>
            )}
            {filters.positions && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Position: {filters.positions}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('positions', '')}
                />
              </Badge>
            )}
            {filters.verdict && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Recommendation: {filters.verdict}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('verdict', '')}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Status: {filters.status}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('status', '')}
                />
              </Badge>
            )}
            {filters.scout && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Scout: {availableScouts.find(s => s.id === filters.scout)?.name || filters.scout}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('scout', '')}
                />
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="flex items-center gap-1 font-normal" style={{fontSize: '0.9rem'}}>
                Date: {filters.dateRange}
                <X 
                  className="h-4 w-4 cursor-pointer" 
                  onClick={() => updateFilter('dateRange', '')}
                />
              </Badge>
            )}
          </div>
        )}
    </div>
  );
};

export default ReportsFilters;