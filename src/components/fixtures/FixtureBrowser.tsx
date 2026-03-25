import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Clock, Star, ClipboardList, Globe, Trophy } from "lucide-react";
import { format, addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useFixturesData, Fixture } from "@/hooks/useFixturesData";
import { useTeamsData } from "@/hooks/useTeamsData";
import { useShortlists } from "@/hooks/useShortlists";
import { usePlayersData } from "@/hooks/usePlayersData";
import { ClubBadge } from "@/components/ui/club-badge";
import { getMatchGradient } from "@/components/fixtures/FixtureCard";
import { MatchScoutingDrawer } from "@/components/match-scouting/MatchScoutingDrawer";

// Map competition names to countries for matching
const COMPETITION_COUNTRY_MAP: Record<string, string> = {
  "Premier League": "England",
  "La Liga": "Spain",
  "Bundesliga": "Germany",
  "Serie A": "Italy",
  "Ligue 1": "France",
  "Eredivisie": "Netherlands",
  "Primeira Liga": "Portugal",
  "Championship": "England",
};

// Country -> known leagues
const COUNTRY_LEAGUES: Record<string, string[]> = {
  "England": ["Premier League", "Championship"],
  "Spain": ["La Liga"],
  "Germany": ["Bundesliga"],
  "Italy": ["Serie A"],
  "France": ["Ligue 1"],
  "Netherlands": ["Eredivisie"],
  "Portugal": ["Primeira Liga"],
};

const FixtureBrowser: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(addDays(new Date(), 7));
  const [matchScoutingOpen, setMatchScoutingOpen] = useState(false);
  const [scoutingFixture, setScoutingFixture] = useState<Fixture | null>(null);

  const { data: fixtures = [] } = useFixturesData();
  const { data: teams = [] } = useTeamsData();
  const { shortlists } = useShortlists();
  const { data: allPlayers = [] } = usePlayersData();

  const allShortlistedPlayerIds = useMemo(() =>
    new Set(shortlists.flatMap(s => s.playerIds || [])),
    [shortlists]
  );

  // Build available countries from teams table + competition map
  const countries = useMemo(() => {
    const fromTeams = new Set(teams.map(t => t.country));
    // Also add countries from competitions present in fixtures
    fixtures.forEach(f => {
      if (f.competition && COMPETITION_COUNTRY_MAP[f.competition]) {
        fromTeams.add(COMPETITION_COUNTRY_MAP[f.competition]);
      }
    });
    return Array.from(fromTeams).sort();
  }, [teams, fixtures]);

  // Leagues for selected country
  const leagues = useMemo(() => {
    if (!selectedCountry) return [];
    const fromConfig = COUNTRY_LEAGUES[selectedCountry] || [];
    const fromTeams = [...new Set(teams.filter(t => t.country === selectedCountry).map(t => t.league))];
    return [...new Set([...fromConfig, ...fromTeams])].sort();
  }, [selectedCountry, teams]);

  // Get competitions that belong to selected country
  const countryCompetitions = useMemo(() => {
    if (!selectedCountry) return new Set<string>();
    const comps = new Set<string>();
    Object.entries(COMPETITION_COUNTRY_MAP).forEach(([comp, country]) => {
      if (country === selectedCountry) comps.add(comp);
    });
    // If a specific league is selected, only include that
    if (selectedLeague) {
      return new Set([selectedLeague]);
    }
    return comps;
  }, [selectedCountry, selectedLeague]);

  // Normalize for matching
  const normalizeTeamName = (name: string) =>
    name.toLowerCase().replace(/\bf\.?c\.?\b/g, "").replace(/football club/g, "").replace(/[^a-z0-9&\s-]/g, "").replace(/\s+/g, " ").trim();

  const clubsMatch = (a: string, b: string) => {
    const na = normalizeTeamName(a);
    const nb = normalizeTeamName(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  };

  // Team names for the selected country
  const countryTeamNames = useMemo(() => {
    return teams
      .filter(t => t.country === selectedCountry && (!selectedLeague || t.league === selectedLeague))
      .map(t => t.name);
  }, [teams, selectedCountry, selectedLeague]);

  // Filter fixtures by competition match OR team name match
  const filteredFixtures = useMemo(() => {
    if (!selectedCountry) return [];

    return fixtures.filter(f => {
      const fDate = new Date(f.match_date_utc);
      const inRange = !isBefore(fDate, startOfDay(dateFrom)) && !isAfter(fDate, addDays(startOfDay(dateTo), 1));
      if (!inRange) return false;

      // Match by competition name
      if (f.competition && countryCompetitions.has(f.competition)) return true;

      // Fallback: match by team names from teams table
      const teamMatch = countryTeamNames.some(tn =>
        clubsMatch(tn, f.home_team) || clubsMatch(tn, f.away_team)
      );
      return teamMatch;
    }).sort((a, b) => new Date(a.match_date_utc).getTime() - new Date(b.match_date_utc).getTime());
  }, [fixtures, selectedCountry, countryCompetitions, countryTeamNames, dateFrom, dateTo]);

  // Group by date
  const groupedFixtures = useMemo(() => {
    const groups: Record<string, Fixture[]> = {};
    filteredFixtures.forEach(f => {
      const key = format(new Date(f.match_date_utc), "yyyy-MM-dd");
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [filteredFixtures]);

  const getShortlistedCount = (fixture: Fixture) => {
    return allPlayers.filter(p => {
      if (!allShortlistedPlayerIds.has(p.id.toString())) return false;
      return clubsMatch(p.club, fixture.home_team) || clubsMatch(p.club, fixture.away_team);
    }).length;
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedLeague("");
  };

  const hasFilters = selectedCountry !== "";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Country
              </label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> League
              </label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague} disabled={!selectedCountry}>
                <SelectTrigger><SelectValue placeholder={selectedCountry ? "All leagues" : "Select country first"} /></SelectTrigger>
                <SelectContent>
                  {leagues.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, "d MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, "d MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixture List */}
      {!hasFilters ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a country and league to browse fixtures</h3>
              <p className="text-sm text-muted-foreground">
                Use the filters above to find matches across different leagues and competitions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(groupedFixtures).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No fixtures found for the selected filters and date range</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFixtures).map(([dateKey, dayFixtures]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(new Date(dateKey), "EEEE, d MMMM yyyy")}
                </h3>
                <Badge variant="secondary" className="text-xs">{dayFixtures.length}</Badge>
              </div>

              <Card>
                <div className="divide-y">
                  {dayFixtures.map((fixture, idx) => {
                    const gradient = getMatchGradient(fixture.home_team, fixture.away_team);
                    const hasScore = fixture.home_score !== null && fixture.away_score !== null;
                    const shortlistedCount = getShortlistedCount(fixture);

                    return (
                      <div
                        key={`${fixture.match_number}-${idx}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        {/* Time */}
                        <div className="w-14 shrink-0 text-xs text-muted-foreground font-medium text-center">
                          {format(new Date(fixture.match_date_utc), "HH:mm")}
                        </div>

                        {/* Teams */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ClubBadge clubName={fixture.home_team} size="sm" />
                          <span className="text-sm font-medium truncate">{fixture.home_team}</span>

                          {hasScore ? (
                            <span className="text-sm font-bold shrink-0 px-2">
                              {fixture.home_score} - {fixture.away_score}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground shrink-0 px-2">vs</span>
                          )}

                          <span className="text-sm font-medium truncate">{fixture.away_team}</span>
                          <ClubBadge clubName={fixture.away_team} size="sm" />
                        </div>

                        {/* Venue */}
                        {fixture.venue && (
                          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 max-w-[160px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{fixture.venue}</span>
                          </div>
                        )}

                        {/* Competition */}
                        {fixture.competition && (
                          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 shrink-0">
                            {fixture.competition}
                          </Badge>
                        )}

                        {/* Shortlisted badge */}
                        {shortlistedCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                            <Star className="h-3 w-3 text-amber-500" />
                            {shortlistedCount}
                          </Badge>
                        )}

                        {/* Match Report button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={() => {
                            setScoutingFixture(fixture);
                            setMatchScoutingOpen(true);
                          }}
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Report</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <MatchScoutingDrawer
        open={matchScoutingOpen}
        onOpenChange={setMatchScoutingOpen}
        homeTeam={scoutingFixture?.home_team || ''}
        awayTeam={scoutingFixture?.away_team || ''}
        matchDate={scoutingFixture?.match_date_utc || ''}
        homeScore={scoutingFixture?.home_score}
        awayScore={scoutingFixture?.away_score}
      />
    </div>
  );
};

export default FixtureBrowser;
