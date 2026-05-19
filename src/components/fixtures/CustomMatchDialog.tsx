import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ClubBadge } from "@/components/ui/club-badge";
import { Input } from "@/components/ui/input";
import { useTeamsData } from "@/hooks/useTeamsData";

interface CustomMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (homeTeam: string, awayTeam: string, matchDate: string) => void;
}

const TeamCombobox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  teams: { name: string; league: string; country: string }[];
  placeholder: string;
  excludeTeam?: string;
}> = ({ value, onChange, teams, placeholder, excludeTeam }) => {
  const [open, setOpen] = useState(false);
  const filtered = teams.filter((t) => t.name !== excludeTeam);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <ClubBadge clubName={value} size="sm" />
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((team) => (
                <CommandItem
                  key={team.name}
                  value={team.name}
                  onSelect={() => {
                    onChange(team.name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === team.name ? "opacity-100" : "opacity-0")} />
                  <ClubBadge clubName={team.name} size="sm" />
                  <span className="ml-2 flex-1 truncate">{team.name}</span>
                  <span className="text-xs text-muted-foreground">{team.league}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CustomMatchDialog: React.FC<CustomMatchDialogProps> = ({ open, onOpenChange, onConfirm }) => {
  const { data: teams = [] } = useTeamsData();
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("15:00");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const reset = () => {
    setHomeTeam("");
    setAwayTeam("");
    setDate(new Date());
    setTime("15:00");
  };

  const handleSubmit = () => {
    if (!homeTeam || !awayTeam || !date) return;
    const [h, m] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0);
    onConfirm(homeTeam, awayTeam, combined.toISOString());
    reset();
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add custom match</DialogTitle>
          <DialogDescription>
            Create a one-off match for teams not currently in the schedule. You can then scout players from each team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Home team</label>
            <TeamCombobox
              value={homeTeam}
              onChange={setHomeTeam}
              teams={sortedTeams}
              placeholder="Select home team"
              excludeTeam={awayTeam}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Away team</label>
            <TeamCombobox
              value={awayTeam}
              onChange={setAwayTeam}
              teams={sortedTeams}
              placeholder="Select away team"
              excludeTeam={homeTeam}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Match date</label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "EEEE, d MMMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) setDate(d);
                      setDatePopoverOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-[120px] font-normal"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!homeTeam || !awayTeam || !date}>
            Open match report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomMatchDialog;
