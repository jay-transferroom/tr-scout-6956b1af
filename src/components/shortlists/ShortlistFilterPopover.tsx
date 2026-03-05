import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Filter, X, Search } from "lucide-react";
import { AVAILABILITY_OPTIONS } from "@/hooks/useShortlists";

interface ShortlistFilterPopoverProps {
  positionFilter: string;
  onPositionFilterChange: (value: string) => void;
  scoutedFilter: string;
  onScoutedFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  euGbeFilter: string;
  onEuGbeFilterChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityFilterChange: (value: string) => void;
  xtvRange: [number, number];
  onXtvRangeChange: (value: [number, number]) => void;
  maxXtv: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export const ShortlistFilterPopover = ({
  positionFilter,
  onPositionFilterChange,
  scoutedFilter,
  onScoutedFilterChange,
  statusFilter,
  onStatusFilterChange,
  euGbeFilter,
  onEuGbeFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  xtvRange,
  onXtvRangeChange,
  maxXtv,
  searchTerm,
  onSearchChange,
  onClearFilters,
}: ShortlistFilterPopoverProps) => {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    searchTerm.length > 0,
    positionFilter !== "all",
    scoutedFilter !== "all",
    statusFilter !== "all",
    euGbeFilter !== "all",
    availabilityFilter !== "all",
    xtvRange[0] > 0 || xtvRange[1] < maxXtv,
  ].filter(Boolean).length;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => setOpen(true)}>
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Filters</DialogTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onClearFilters}>
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
            {/* Name / Club Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Player or Club Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or club..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 h-8 text-sm"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Position</label>
              <Select value={positionFilter} onValueChange={onPositionFilterChange}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
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

            {/* Availability */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Availability</label>
              <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unset">Not Set</SelectItem>
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scouted */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Scouted</label>
              <Select value={scoutedFilter} onValueChange={onScoutedFilterChange}>
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full h-8 text-sm">
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

            {/* EU/GBE */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">EU/GBE</label>
              <Select value={euGbeFilter} onValueChange={onEuGbeFilterChange}>
                <SelectTrigger className="w-full h-8 text-sm">
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

            {/* xTV Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                xTV Range: £{xtvRange[0]}M – £{xtvRange[1]}M
              </label>
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

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
