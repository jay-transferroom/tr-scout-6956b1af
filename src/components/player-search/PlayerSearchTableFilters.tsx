import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface PlayerSearchFilterCriteria {
  searchTerm: string;
  sortBy: string;
  ageFilter: string;
  contractFilter: string;
  regionFilter: string;
  nationalityFilter: string;
  positionFilter: string;
}

interface PlayerSearchFiltersProps {
  filters: PlayerSearchFilterCriteria;
  onFiltersChange: (filters: PlayerSearchFilterCriteria) => void;
  availableNationalities: string[];
  onCustomiseMyRating?: () => void;
}

const PlayerSearchFilters = ({ filters, onFiltersChange, availableNationalities, onCustomiseMyRating }: PlayerSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof PlayerSearchFilterCriteria, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: filters.searchTerm, // Keep search term
      sortBy: 'name',
      ageFilter: 'all',
      contractFilter: 'all',
      regionFilter: 'all',
      nationalityFilter: 'all',
      positionFilter: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    const filtersToCount = { ...filters };
    delete filtersToCount.searchTerm; // Don't count search term
    delete filtersToCount.sortBy; // Don't count sort
    return Object.values(filtersToCount).filter(value => value && value !== 'all').length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className="mb-6">
      {/* Search Bar - Always Visible */}
      <div className="flex gap-4 items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search player name, club, position or ID"
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
              Sort & Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[800px] p-6 z-50 bg-background border shadow-lg" align="end">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="myRating">My Rating</SelectItem>
                    <SelectItem value="potential">Potential</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="contract-expiry">Contract expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Select value={filters.ageFilter} onValueChange={(value) => updateFilter('ageFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ages</SelectItem>
                    <SelectItem value="u21">Under 21</SelectItem>
                    <SelectItem value="21-25">21-25 years</SelectItem>
                    <SelectItem value="26+">26+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Position Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Select value={filters.positionFilter} onValueChange={(value) => updateFilter('positionFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All positions</SelectItem>
                    <SelectItem value="gk">Goalkeeper</SelectItem>
                    <SelectItem value="def">Defender</SelectItem>
                    <SelectItem value="mid">Midfielder</SelectItem>
                    <SelectItem value="att">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contract Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Contract Status</label>
                <Select value={filters.contractFilter} onValueChange={(value) => updateFilter('contractFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Free Agent">Free Agent</SelectItem>
                    <SelectItem value="Under Contract">Under Contract</SelectItem>
                    <SelectItem value="Loan">Loan</SelectItem>
                    <SelectItem value="Youth Contract">Youth Contract</SelectItem>
                    <SelectItem value="Expiring">Expiring Soon</SelectItem>
                    <SelectItem value="Private Player">Private Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Select value={filters.regionFilter} onValueChange={(value) => updateFilter('regionFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="South America">South America</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Africa">Africa</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Oceania">Oceania</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nationality Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nationality</label>
                <Select value={filters.nationalityFilter} onValueChange={(value) => updateFilter('nationalityFilter', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All nationalities</SelectItem>
                    {availableNationalities.slice(0, 15).map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions Row */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-end">
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
          {filters.ageFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              Age: {filters.ageFilter === 'u21' ? 'Under 21' : filters.ageFilter === '21-25' ? '21-25 years' : '26+ years'}
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => updateFilter('ageFilter', 'all')}
              />
            </Badge>
          )}
          {filters.positionFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              Position: {filters.positionFilter === 'gk' ? 'Goalkeeper' : filters.positionFilter === 'def' ? 'Defender' : filters.positionFilter === 'mid' ? 'Midfielder' : 'Forward'}
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => updateFilter('positionFilter', 'all')}
              />
            </Badge>
          )}
          {filters.contractFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              Contract: {filters.contractFilter === 'Expiring' ? 'Expiring Soon' : filters.contractFilter}
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => updateFilter('contractFilter', 'all')}
              />
            </Badge>
          )}
          {filters.regionFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              Region: {filters.regionFilter}
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => updateFilter('regionFilter', 'all')}
              />
            </Badge>
          )}
          {filters.nationalityFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              Nationality: {filters.nationalityFilter}
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => updateFilter('nationalityFilter', 'all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSearchFilters;