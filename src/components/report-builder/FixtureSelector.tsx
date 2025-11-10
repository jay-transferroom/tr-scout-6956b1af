import { useMemo } from "react";
import { useFixturesData, Fixture } from "@/hooks/useFixturesData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Player } from "@/types/player";

interface FixtureSelectorProps {
  player: Player;
  selectedFixtureId?: string;
  onFixtureSelect: (fixture: Fixture | null) => void;
}

const FixtureSelector = ({ player, selectedFixtureId, onFixtureSelect }: FixtureSelectorProps) => {
  const { data: fixtures, isLoading } = useFixturesData();

  // Normalize team/club names for robust matching
  const normalizeTeamName = (name?: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\bf\.?c\.?\b/g, "") // remove FC / F.C.
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
    
    // Filter fixtures where the player's club is either home or away team (with normalization)
    const filtered = fixtures.filter(
      (fixture) =>
        clubsMatch(fixture.home_team, player.club) || clubsMatch(fixture.away_team, player.club)
    );

    // Sort by date (most recent first)
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
        onFixtureSelect(selectedFixture);
      }
    }
  };

  const getFixtureId = (fixture: Fixture) => 
    `${fixture.home_team}-${fixture.away_team}-${fixture.match_date_utc}`;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Match</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading fixtures..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Match</Label>
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
        </SelectContent>
      </Select>
    </div>
  );
};

export default FixtureSelector;
