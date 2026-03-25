import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Clock, Star, ClipboardList, Globe, Trophy } from "lucide-react";
import { format, addDays, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useFixturesData, Fixture } from "@/hooks/useFixturesData";
import { useTeamsData } from "@/hooks/useTeamsData";
import { useShortlists } from "@/hooks/useShortlists";
import { usePlayersData } from "@/hooks/usePlayersData";
import { ClubBadge } from "@/components/ui/club-badge";
import { getMatchGradient } from "@/components/fixtures/FixtureCard";
import { MatchScoutingDrawer } from "@/components/match-scouting/MatchScoutingDrawer";

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

  // Get all shortlisted player IDs
  const allShortlistedPlayerIds = useMemo(() => 
    new Set(shortlists.flatMap(s => s.playerIds || [])),
    [shortlists]
  );

  // Build country -> leagues map from teams
  const countryLeagueMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    teams.forEach(t => {
      if (!map[t.country]) map[t.country] = [];
      if (!map[t.country].includes(t.league)) map[t.country].push(t.league);
    });
    return map;
  }, [teams]);

  const countries = useMemo(() => Object.keys(countryLeagueMap).sort(), [countryLeagueMap]);
  const leagues = useMemo(() => 
    selectedCountry ? (countryLeagueMap[selectedCountry] || []).sort() : [],
    [selectedCountry, countryLeagueMap]
  );

  // Get team names for selected country/league
  const filteredTeamNames = useMemo(() => {
    if (!selectedCountry) return new Set<string>();
    return new Set(
      teams
        .filter(t => t.country === selectedCountry && (!selectedLeague || t.league === selectedLeague))
        .map(t => t.name)
    );
  }, [teams, selectedCountry, selectedLeague]);

  // Normalize for matching
  const normalizeTeamName = (name: string) =>
    name.toLowerCase().replace(/\bf\.?c\.?\b/g, "").replace(/football club/g, "").replace(/[^a-z0-9&\s-]/g, "").replace(/\s+/g, " ").trim();

  const clubsMatch = (a: string, b: string) => {
    const na = normalizeTeamName(a);
    const nb = normalizeTeamName(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  };

  // Filter fixtures
  const filteredFixtures = useMemo(() => {
    if (!selectedCountry) return [];

    return fixtures.filter(f => {
      const fDate = new Date(f.match_date_utc);
      const inRange = !isBefore(fDate, startOfDay(dateFrom)) && !isAfter(fDate, addDays(startOfDay(dateTo), 1));
      if (!inRange) return false;

      // Check if either team belongs to filtered teams
      const homeMatch = Array.from(filteredTeamNames).some(tn => clubsMatch(tn, f.home_team));
      const awayMatch = Array.from(filteredTeamNames).some(tn => clubsMatch(tn, f.away_team));
      return homeMatch || awayMatch;
    }).sort((a, b) => new Date(a.match_date_utc).getTime() - new Date(b.match_date_utc).getTime());
  }, [fixtures, selectedCountry, filteredTeamNames, dateFrom, dateTo]);

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

  // Count shortlisted players in a fixture
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
            {/* Country */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Country
              </label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* League */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> League
              </label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague} disabled={!selectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCountry ? "All leagues" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
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
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => d && setDateFrom(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
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
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => d && setDateTo(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(new Date(dateKey), "EEEE, d MMMM yyyy")}
                </h3>
                <Badge variant="secondary" className="text-xs">{dayFixtures.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayFixtures.map((fixture, idx) => {
                  const gradient = getMatchGradient(fixture.home_team, fixture.away_team);
                  const hasScore = fixture.home_score !== null && fixture.away_score !== null;
                  const shortlistedCount = getShortlistedCount(fixture);

                  return (
                    <Card key={`${fixture.match_number}-${idx}`} className="overflow-hidden hover:shadow-md transition-shadow">
                      {/* Gradient Header */}
                      <div
                        className="px-4 py-3 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                        }}
                      >
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <ClubBadge clubName={fixture.home_team} size="sm" className="bg-white/20 rounded-full p-0.5" />
                            <span className="font-semibold text-sm truncate">{fixture.home_team}</span>
                          </div>
                          <div className="shrink-0 px-2">
                            {hasScore ? (
                              <span className="font-bold text-base">{fixture.home_score} - {fixture.away_score}</span>
                            ) : (
                              <span className="text-white/80 font-medium text-xs">vs</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-semibold text-sm truncate">{fixture.away_team}</span>
                            <ClubBadge clubName={fixture.away_team} size="sm" className="bg-white/20 rounded-full p-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-4 py-3 bg-card">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(fixture.match_date_utc), "HH:mm")}</span>
                          </div>
                          {fixture.venue && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{fixture.venue}</span>
                            </div>
                          )}
                          {fixture.competition && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">{fixture.competition}</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {shortlistedCount > 0 && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Star className="h-3 w-3 text-amber-500" />
                                {shortlistedCount} shortlisted
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => {
                              setScoutingFixture(fixture);
                              setMatchScoutingOpen(true);
                            }}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Match Report
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Scouting Drawer */}
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
