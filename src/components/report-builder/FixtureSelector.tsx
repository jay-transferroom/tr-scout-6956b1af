import { useMemo, useState } from "react";
import { useFixturesData, Fixture } from "@/hooks/useFixturesData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Plus, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Player } from "@/types/player";

export interface ManualMatch {
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition?: string;
}

interface FixtureSelectorProps {
  player: Player;
  selectedFixtureId?: string;
  onFixtureSelect: (fixture: Fixture | null) => void;
  manualMatch?: ManualMatch | null;
  onManualMatchChange?: (match: ManualMatch | null) => void;
}

const FixtureSelector = ({ player, selectedFixtureId, onFixtureSelect, manualMatch, onManualMatchChange }: FixtureSelectorProps) => {
  const { data: fixtures, isLoading } = useFixturesData();
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHomeTeam, setManualHomeTeam] = useState("");
  const [manualAwayTeam, setManualAwayTeam] = useState("");
  const [manualDate, setManualDate] = useState<Date | undefined>(undefined);
  const [manualCompetition, setManualCompetition] = useState("");

  const normalizeTeamName = (name?: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\bf\.?c\.?\b/g, "")
      .replace(/football club/g, "")
      .replace(/[^a-z0-9&\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const clubsMatch = (a?: string, b?: string) => {
    const na = normalizeTeamName(a);
    const nb = normalizeTeamName(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  };

  const playerFixtures = useMemo(() => {
    if (!fixtures || !player.club) return [];
    const filtered = fixtures.filter(
      (fixture) =>
        clubsMatch(fixture.home_team, player.club) || clubsMatch(fixture.away_team, player.club)
    );
    return filtered.sort((a, b) => 
      new Date(b.match_date_utc).getTime() - new Date(a.match_date_utc).getTime()
    );
  }, [fixtures, player.club]);

  const formatFixture = (fixture: Fixture) => {
    const date = format(new Date(fixture.match_date_utc), "dd MMM yyyy");
    const score = fixture.home_score !== null && fixture.away_score !== null
      ? ` (${fixture.home_score}-${fixture.away_score})`
      : "";
    return `${fixture.home_team} vs ${fixture.away_team}${score} - ${date}`;
  };

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onFixtureSelect(null);
    } else {
      const selectedFixture = playerFixtures.find(
        (f) => `${f.home_team}-${f.away_team}-${f.match_date_utc}` === value
      );
      if (selectedFixture) {
        // Clear manual match when selecting a fixture
        onManualMatchChange?.(null);
        onFixtureSelect(selectedFixture);
      }
    }
  };

  const getFixtureId = (fixture: Fixture) => 
    `${fixture.home_team}-${fixture.away_team}-${fixture.match_date_utc}`;

  const handleManualConfirm = () => {
    if (!manualHomeTeam.trim() || !manualAwayTeam.trim() || !manualDate) return;
    
    const match: ManualMatch = {
      homeTeam: manualHomeTeam.trim(),
      awayTeam: manualAwayTeam.trim(),
      date: manualDate.toISOString(),
      competition: manualCompetition.trim() || undefined,
    };
    
    onManualMatchChange?.(match);
    // Clear any fixture selection
    onFixtureSelect(null);
    setShowManualForm(false);
    // Reset form
    setManualHomeTeam("");
    setManualAwayTeam("");
    setManualDate(undefined);
    setManualCompetition("");
  };

  const handleClearManualMatch = () => {
    onManualMatchChange?.(null);
  };

  const handleShowManualForm = () => {
    setShowManualForm(true);
  };

  const handleBackToFixtures = () => {
    setShowManualForm(false);
  };

  // If a manual match is set, show the label
  if (manualMatch) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {manualMatch.homeTeam} vs {manualMatch.awayTeam}
            </span>
            <Badge variant="outline" className="text-[10px] shrink-0 bg-muted/60 text-muted-foreground border-border">
              Manual
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(manualMatch.date), "dd MMM yyyy")}
            {manualMatch.competition && ` • ${manualMatch.competition}`}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={handleClearManualMatch}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Manual entry form
  if (showManualForm) {
    const canConfirm = manualHomeTeam.trim() && manualAwayTeam.trim() && manualDate;
    
    return (
      <div className="space-y-3 rounded-md border bg-background p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Home team *</label>
            <Input
              placeholder="e.g. Arsenal"
              value={manualHomeTeam}
              onChange={(e) => setManualHomeTeam(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Away team *</label>
            <Input
              placeholder="e.g. Chelsea"
              value={manualAwayTeam}
              onChange={(e) => setManualAwayTeam(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-8 justify-start text-left font-normal text-sm",
                    !manualDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {manualDate ? format(manualDate, "dd MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={manualDate}
                  onSelect={setManualDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Competition</label>
            <Input
              placeholder="e.g. FA Youth Cup"
              value={manualCompetition}
              onChange={(e) => setManualCompetition(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleManualConfirm}
            disabled={!canConfirm}
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleBackToFixtures}
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to fixtures
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading fixtures..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={selectedFixtureId || "none"}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="bg-background">
        <SelectValue placeholder="No match selected" />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        <SelectItem value="none">No match selected</SelectItem>
        {playerFixtures.length === 0 ? (
          <SelectItem value="no-fixtures" disabled>
            No fixtures found for {player.club}
          </SelectItem>
        ) : (
          playerFixtures.map((fixture) => (
            <SelectItem key={getFixtureId(fixture)} value={getFixtureId(fixture)}>
              {formatFixture(fixture)}
            </SelectItem>
          ))
        )}
        <div className="border-t mt-1 pt-1 px-2 pb-1">
          <button
            type="button"
            className="w-full text-left text-xs text-primary hover:underline py-1.5 px-2 flex items-center gap-1.5 rounded hover:bg-muted/50 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShowManualForm();
            }}
          >
            <Plus className="h-3 w-3" />
            Add match manually
          </button>
        </div>
      </SelectContent>
    </Select>
  );
};

export default FixtureSelector;
