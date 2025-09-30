
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, MapPin, Users, UserCheck, Plus, Search, Star, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useFixturesData } from "@/hooks/useFixturesData";
import { useScoutUsers } from "@/hooks/useScoutUsers";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useScoutingAssignments } from "@/hooks/useScoutingAssignments";
import { useShortlists } from "@/hooks/useShortlists";
import { useAuth } from "@/contexts/AuthContext";
import AssignScoutDialog from "@/components/AssignScoutDialog";
import ViewToggle from "@/components/ViewToggle";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedScout, setSelectedScout] = useState<string>("all");
  const [selectedShortlist, setSelectedShortlist] = useState<string>("all");
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const { profile } = useAuth();
  const { data: fixtures = [] } = useFixturesData();
  const { data: scouts = [] } = useScoutUsers();
  const { data: allPlayers = [] } = usePlayersData();
  const { data: assignments = [], refetch: refetchAssignments } = useScoutingAssignments();
  const { shortlists } = useShortlists();

  // Check if user can assign scouts (recruitment or director roles)
  const canAssignScouts = profile?.role === 'recruitment' || profile?.role === 'director';

  // Get assigned player IDs to filter recommendations
  const assignedPlayerIds = new Set(assignments.map(a => a.player_id));

  // Get all shortlisted player IDs
  const allShortlistedPlayerIds = new Set(
    shortlists.flatMap(shortlist => shortlist.playerIds || [])
  );

  // Helper: normalize team/club names for matching
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

  // Infer shortlist by name (for role-based lists like "Strikers")
  const getNameBasedPredicate = (name?: string) => {
    const key = (name || "").toLowerCase();
    if (key.includes("striker")) {
      return (p: any) => (p.positions || []).some((pos: string) => ["st", "cf", "fw"].includes(pos.toLowerCase()));
    }
    if (key.includes("winger")) {
      return (p: any) => (p.positions || []).some((pos: string) => ["lw", "rw"].includes(pos.toLowerCase()));
    }
    if (key.includes("midfield")) {
      return (p: any) => (p.positions || []).some((pos: string) => ["cdm","cm","cam","lm","rm"].includes(pos.toLowerCase()));
    }
    if (key.includes("defend")) {
      return (p: any) => (p.positions || []).some((pos: string) => ["cb","lb","rb","lwb","rwb"].includes(pos.toLowerCase()));
    }
    if (key.includes("keeper") || key.includes("goalkeeper") || key === "gk") {
      return (p: any) => (p.positions || []).some((pos: string) => pos.toLowerCase() === "gk");
    }
    return null;
  };

  // Get players from selected shortlist
  const getShortlistPlayers = () => {
    if (selectedShortlist === "all") return [];
    const shortlist = shortlists.find(s => s.id === selectedShortlist);
    if (!shortlist) return [];

    // If explicit playerIds exist, use them
    if (shortlist.playerIds && shortlist.playerIds.length > 0) {
      const players = allPlayers.filter(player => shortlist.playerIds.includes(player.id.toString()));
      return players;
    }

    // Fallback: infer by shortlist name (e.g., "Strikers")
    const predicate = getNameBasedPredicate(shortlist.name);
    if (predicate) {
      const players = allPlayers.filter(predicate);
      return players;
    }

    return [];
  };

  // Get teams that have shortlisted players
  const getShortlistTeams = () => {
    if (selectedShortlist === "all") return [] as string[];
    const shortlistPlayers = getShortlistPlayers();
    return Array.from(new Set(shortlistPlayers.map(p => p.club)));
  };

  // (legacy) getShortlistTeams removed - consolidated above

  // Get date range for fixtures (30 days forward)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Enhanced fixture data with player recommendations
  const enhancedFixtures = fixtures.map(fixture => {
    // Find all players from teams playing in this fixture
    const playersInFixture = allPlayers.filter(player => 
      clubsMatch(player.club, fixture.home_team) || clubsMatch(player.club, fixture.away_team)
    );

    // Apply player search filter if provided
    const filteredPlayers = playerSearchTerm 
      ? playersInFixture.filter(player => 
          player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
        )
      : playersInFixture;

    // Separate shortlisted and non-shortlisted players
    const shortlistedPlayers = filteredPlayers.filter(player => 
      allShortlistedPlayerIds.has(player.id.toString())
    );

    const unassignedPlayers = filteredPlayers.filter(player => 
      !assignedPlayerIds.has(player.id.toString()) &&
      !allShortlistedPlayerIds.has(player.id.toString())
    );

    // Get scout assignments for this fixture's date
    const scoutWorkload = assignments.filter(assignment => {
      const assignmentDate = assignment.deadline ? new Date(assignment.deadline) : null;
      return assignmentDate && isSameDay(assignmentDate, new Date(fixture.match_date_utc));
    });

    // Prioritize recommendations: high XTV score, good ratings, young age
    const recommendedPlayers = unassignedPlayers
      .sort((a, b) => {
        const scoreA = (a.xtvScore || 0) + (a.transferroomRating || 0) * 100000 + (30 - (a.age || 30)) * 50000;
        const scoreB = (b.xtvScore || 0) + (b.transferroomRating || 0) * 100000 + (30 - (b.age || 30)) * 50000;
        return scoreB - scoreA;
      })
      .slice(0, 3);

    // Debug log for shortlisted players
    if (shortlistedPlayers.length > 0) {
      console.log(`Fixture: ${fixture.home_team} vs ${fixture.away_team}`, {
        shortlistedPlayers: shortlistedPlayers.map(p => ({ name: p.name, club: p.club })),
        totalPlayers: playersInFixture.length
      });
    }

    return {
      ...fixture,
      playersInFixture: filteredPlayers,
      shortlistedPlayers,
      unassignedPlayers,
      scoutWorkload: scoutWorkload.length,
      recommendedPlayers
    };
  });

  const getFixturesForDate = (date: Date) => {
    let dayFixtures = enhancedFixtures.filter(fixture => isSameDay(new Date(fixture.match_date_utc), date));
    
    // Filter by shortlist if selected - only show fixtures involving teams with shortlisted players
    if (selectedShortlist !== "all") {
      const shortlistTeams = getShortlistTeams();
      console.log(`Filtering fixtures for shortlist teams:`, shortlistTeams);
      
      dayFixtures = dayFixtures.filter(fixture => {
        const hasShortlistTeam = shortlistTeams.some(team =>
          clubsMatch(team, fixture.home_team) || clubsMatch(team, fixture.away_team)
        );
        if (hasShortlistTeam) {
          console.log(`Including fixture: ${fixture.home_team} vs ${fixture.away_team}`);
        }
        return hasShortlistTeam;
      });
      
      console.log(`After shortlist filtering: ${dayFixtures.length} fixtures for date ${format(date, 'yyyy-MM-dd')}`);
    }
    
    return dayFixtures;
  };

  // Filter fixtures by selected scout's workload or show all
  const getScoutRelevantFixtures = (date: Date) => {
    let dayFixtures = getFixturesForDate(date);
    
    // Filter by scout if selected - only show fixtures with players assigned to that scout
    if (selectedScout !== "all") {
      return dayFixtures.filter(fixture => {
        // Get all players in this fixture
        const fixturePlayerIds = fixture.playersInFixture.map(p => p.id.toString());
        
        // Check if any player in this fixture is assigned to the selected scout
        const hasScoutAssignedPlayer = assignments.some(a => 
          a.assigned_to_scout_id === selectedScout && 
          fixturePlayerIds.includes(a.player_id)
        );
        
        return hasScoutAssignedPlayer;
      });
    }

    return dayFixtures;
  };

  // Get all dates with fixtures
  const datesWithFixtures = Array.from(
    new Set(
      enhancedFixtures
        .filter(fixture => {
          const fixtureDate = new Date(fixture.match_date_utc);
          return fixtureDate >= today && fixtureDate <= thirtyDaysFromNow;
        })
        .map(fixture => format(new Date(fixture.match_date_utc), 'yyyy-MM-dd'))
    )
  )
    .sort()
    .map(dateStr => new Date(dateStr))
    .filter(date => getScoutRelevantFixtures(date).length > 0);

  // Auto-select first date if none selected
  if (!selectedDate && datesWithFixtures.length > 0) {
    setSelectedDate(datesWithFixtures[0]);
  }

  const selectedDateFixtures = selectedDate ? getScoutRelevantFixtures(selectedDate) : [];

  const getScoutWorkloadForDate = (date: Date, scoutId: string) => {
    return assignments.filter(assignment => 
      assignment.assigned_to_scout_id === scoutId &&
      assignment.deadline &&
      isSameDay(new Date(assignment.deadline), date)
    ).length;
  };

  const handleAssignPlayer = (player: any) => {
    setSelectedPlayer({
      id: player.id.toString(),
      name: player.name,
      club: player.club,
      positions: player.positions
    });
    setIsAssignDialogOpen(true);
  };

  const handleAssignDialogClose = () => {
    setIsAssignDialogOpen(false);
    setSelectedPlayer(null);
    refetchAssignments();
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scout Calendar</h1>
            <p className="text-muted-foreground mt-2">
              View fixtures and manage scout assignments with intelligent recommendations
            </p>
          </div>
          <ViewToggle 
            currentView={viewMode} 
            onViewChange={setViewMode}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Scout:</span>
          </div>
          <Select value={selectedScout} onValueChange={setSelectedScout}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select scout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scouts</SelectItem>
              {scouts.map((scout) => (
                <SelectItem key={scout.id} value={scout.id}>
                  {scout.first_name} {scout.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Shortlist:</span>
          </div>
          <Select value={selectedShortlist} onValueChange={setSelectedShortlist}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select shortlist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              {shortlists.map((shortlist) => (
                <SelectItem key={shortlist.id} value={shortlist.id}>
                  {shortlist.name} ({shortlist.playerIds?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Player:</span>
          </div>
          <Input
            placeholder="Search players..."
            value={playerSearchTerm}
            onChange={(e) => setPlayerSearchTerm(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dates List or Calendar Grid */}
        <div>
          {viewMode === 'list' ? (
            <Card className="h-[calc(100vh-280px)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto h-[calc(100vh-360px)]">
                  {datesWithFixtures.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No matches found for the selected filters</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {datesWithFixtures.map(date => {
                        const dayFixtures = getScoutRelevantFixtures(date);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const totalWorkload = selectedScout === "all" 
                          ? assignments.filter(a => a.deadline && isSameDay(new Date(a.deadline), date)).length
                          : getScoutWorkloadForDate(date, selectedScout);
                        
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                              "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                              isSelected && "bg-primary/10 border-l-4 border-primary"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-semibold">
                                  {format(date, 'EEEE, MMMM d')}
                                </div>
                                {isToday(date) && (
                                  <Badge variant="secondary" className="mt-1">Today</Badge>
                                )}
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                {dayFixtures.length} {dayFixtures.length === 1 ? 'match' : 'matches'}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              {dayFixtures.slice(0, 3).map((fixture, index) => {
                                const isCompleted = fixture.status === 'completed' || fixture.status === 'Full Time';
                                const isLive = fixture.status === 'live' || fixture.status === 'Live';
                                
                                return (
                                  <div 
                                    key={`${fixture.match_number}-${index}`}
                                    className="flex items-center justify-between text-sm gap-2"
                                  >
                                    <div className="flex items-center gap-2 truncate flex-1">
                                      <ClubBadge clubName={fixture.home_team} size="sm" />
                                      <span className="truncate">
                                        {fixture.home_team} vs {fixture.away_team}
                                      </span>
                                      <ClubBadge clubName={fixture.away_team} size="sm" />
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isLive && (
                                        <Badge variant="destructive" className="ml-2">LIVE</Badge>
                                      )}
                                      {isCompleted && fixture.home_score !== null && (
                                        <span className="ml-2 text-muted-foreground">
                                          {fixture.home_score}-{fixture.away_score}
                                        </span>
                                      )}
                                      {fixture.shortlistedPlayers?.length > 0 && (
                                        <div className="flex items-center gap-1 ml-2">
                                          <Star className="h-3 w-3 text-yellow-500" />
                                          <span className="text-xs">{fixture.shortlistedPlayers.length}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {dayFixtures.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayFixtures.length - 3} more matches
                                </div>
                              )}
                            </div>
                            
                            {totalWorkload > 0 && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{totalWorkload} scout {totalWorkload === 1 ? 'assignment' : 'assignments'}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-280px)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {format(currentDate, 'MMMM yyyy')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {(() => {
                    const monthStart = startOfMonth(currentDate);
                    const monthEnd = endOfMonth(currentDate);
                    const calendarStart = startOfWeek(monthStart);
                    const calendarEnd = endOfWeek(monthEnd);
                    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
                    
                    return days.map(day => {
                      const dayFixtures = getScoutRelevantFixtures(day);
                      const hasFixtures = dayFixtures.length > 0;
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      const totalWorkload = selectedScout === "all" 
                        ? assignments.filter(a => a.deadline && isSameDay(new Date(a.deadline), day)).length
                        : getScoutWorkloadForDate(day, selectedScout);
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => hasFixtures && setSelectedDate(day)}
                          disabled={!hasFixtures}
                          className={cn(
                            "relative p-2 rounded-lg text-sm transition-colors min-h-[80px] flex flex-col items-start",
                            !isCurrentMonth && "text-muted-foreground opacity-50",
                            isCurrentMonth && !hasFixtures && "hover:bg-muted/30 cursor-default",
                            hasFixtures && "hover:bg-muted cursor-pointer",
                            isSelected && "bg-primary/10 border-2 border-primary",
                            isTodayDate && !isSelected && "bg-accent"
                          )}
                        >
                          <div className="font-medium mb-1">{format(day, 'd')}</div>
                          {hasFixtures && (
                            <div className="space-y-1 w-full">
                              <div className="flex items-center gap-1 text-xs">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{dayFixtures.length}</span>
                              </div>
                              {dayFixtures.slice(0, 1).map((fixture, idx) => (
                                <div key={idx} className="text-xs truncate w-full flex items-center gap-1">
                                  <ClubBadge clubName={fixture.home_team} size="sm" />
                                  <span className="truncate">vs</span>
                                  <ClubBadge clubName={fixture.away_team} size="sm" />
                                </div>
                              ))}
                              {(() => {
                                const totalShortlisted = dayFixtures.reduce((sum, f) => sum + (f.shortlistedPlayers?.length || 0), 0);
                                return totalShortlisted > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                                    <Star className="h-3 w-3" />
                                    <span>{totalShortlisted}</span>
                                  </div>
                                );
                              })()}
                              {totalWorkload > 0 && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <Users className="h-3 w-3" />
                                  <span>{totalWorkload}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Match Details */}
        <div>
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
            <CardContent>
              {selectedDateFixtures.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateFixtures.map((fixture, index) => {
                    const isCompleted = fixture.status === 'completed' || fixture.status === 'Full Time' || (fixture.home_score !== null && fixture.away_score !== null);
                    const isLive = fixture.status === 'live' || fixture.status === 'Live';
                    const hasScore = fixture.home_score !== null && fixture.away_score !== null;
                    
                    return (
                      <div key={`${fixture.match_number}-${index}`} className={cn(
                        "p-4 border rounded-lg",
                        isLive && "border-green-300 bg-green-50",
                        isCompleted && "border-gray-300 bg-gray-50"
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(fixture.match_date_utc), "HH:mm")}
                            </span>
                            <Badge variant="outline">{fixture.competition}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLive && (
                              <Badge className="bg-green-500 text-white animate-pulse">LIVE</Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="secondary">FT</Badge>
                            )}
                            {!isLive && !isCompleted && (
                              <Badge variant="outline">Scheduled</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center gap-4">
                            <div className="text-right flex-1 flex items-center justify-end gap-2">
                              <div className="font-semibold text-lg">{fixture.home_team}</div>
                              <ClubBadge clubName={fixture.home_team} size="md" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              {hasScore ? (
                                <div className="text-2xl font-bold">
                                  {fixture.home_score} - {fixture.away_score}
                                </div>
                              ) : (
                                <div className="text-lg text-muted-foreground">vs</div>
                              )}
                              {fixture.status && (
                                <div className="text-xs text-muted-foreground uppercase">
                                  {fixture.status}
                                </div>
                              )}
                            </div>
                            <div className="text-left flex-1 flex items-center justify-start gap-2">
                              <ClubBadge clubName={fixture.away_team} size="md" />
                              <div className="font-semibold text-lg">{fixture.away_team}</div>
                            </div>
                          </div>
                        </div>
                        
                        {fixture.venue && (
                          <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{fixture.venue}</span>
                          </div>
                        )}
                        
                        {fixture.result && (
                          <div className="text-center mb-3">
                            <div className="text-sm font-medium text-muted-foreground">
                              Result: {fixture.result}
                            </div>
                          </div>
                        )}
                        
                        {/* Shortlisted Players */}
                        {(() => {
                          // Filter shortlisted players by selected scout if a scout filter is active
                          const displayedShortlistedPlayers = selectedScout !== "all"
                            ? fixture.shortlistedPlayers.filter(player => 
                                assignments.some(a => 
                                  a.player_id === player.id.toString() && 
                                  a.assigned_to_scout_id === selectedScout
                                )
                              )
                            : fixture.shortlistedPlayers;

                          return displayedShortlistedPlayers.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">
                                  Shortlisted Players ({displayedShortlistedPlayers.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {displayedShortlistedPlayers.map(player => {
                                  // Check if this shortlisted player has a scout assignment
                                  const playerAssignment = assignments.find(a => a.player_id === player.id.toString());
                                  
                                  return (
                                    <div key={player.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                                      <div className="flex items-center gap-2 flex-1">
                                        <ClubBadge clubName={player.club} size="sm" />
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{player.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {player.club} • {player.positions?.[0] || 'Unknown'}
                                            {player.age && ` • ${player.age}y`}
                                            {player.transferroomRating && ` • ${player.transferroomRating}/100`}
                                          </div>
                                          {playerAssignment && (
                                            <div className="text-xs text-blue-600 font-medium mt-1">
                                              Assigned to: {scouts.find(s => s.id === playerAssignment.assigned_to_scout_id)?.first_name} {scouts.find(s => s.id === playerAssignment.assigned_to_scout_id)?.last_name}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end gap-1">
                                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                            <Star className="h-3 w-3 mr-1" />
                                            Shortlisted
                                          </Badge>
                                          {playerAssignment && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                              Scout Assigned
                                            </Badge>
                                          )}
                                        </div>
                                        {canAssignScouts && !playerAssignment && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2"
                                            onClick={() => handleAssignPlayer(player)}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Recommended Players */}
                        {(() => {
                          // Filter recommended players by selected scout if a scout filter is active
                          const displayedRecommendedPlayers = selectedScout !== "all"
                            ? fixture.recommendedPlayers.filter(player => 
                                assignments.some(a => 
                                  a.player_id === player.id.toString() && 
                                  a.assigned_to_scout_id === selectedScout
                                )
                              )
                            : fixture.recommendedPlayers;

                          return displayedRecommendedPlayers.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                  {isCompleted ? "Players to Review" : "Recommended for Scouting"}
                                </span>
                              </div>
              <div className="space-y-2">
                {displayedRecommendedPlayers.map(player => {
                  const isShortlisted = allShortlistedPlayerIds.has(player.id.toString());
                  const playerAssignment = assignments.find(a => a.player_id === player.id.toString());
                  const assignedScout = playerAssignment ? scouts.find(s => s.id === playerAssignment.assigned_to_scout_id) : null;
                  
                  return (
                    <div key={player.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <ClubBadge clubName={player.club} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{player.name}</div>
                          {isShortlisted && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 h-5">
                              <Star className="h-3 w-3 mr-1" /> Shortlisted
                            </Badge>
                          )}
                          {playerAssignment && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 h-5">
                              Scout: {assignedScout ? `${assignedScout.first_name} ${assignedScout.last_name}` : 'Assigned'}
                            </Badge>
                          )}
                        </div>
                          <div className="text-xs text-muted-foreground">
                            {player.club} • {player.positions?.[0] || 'Unknown'}
                            {player.age && ` • ${player.age}y`}
                            {player.transferroomRating && ` • ${player.transferroomRating}/100`}
                            {player.xtvScore && ` • €${(player.xtvScore / 1000000).toFixed(1)}M`}
                          </div>
                        </div>
                      </div>
                       {canAssignScouts && (
                         <Button
                           size="sm"
                           variant="outline"
                           className="h-6 px-2"
                           onClick={() => handleAssignPlayer(player)}
                         >
                           <Plus className="h-3 w-3" />
                         </Button>
                       )}
                    </div>
                  );
                })}
              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate 
                    ? "No relevant fixtures or assignments for this date"
                    : "Select a date to view fixtures and recommendations"
                  }
                </div>
              )}
            </CardContent>
          </Card>
          )}

        </div>
      </div>

      {/* Assign Scout Dialog */}
      {canAssignScouts && (
        <AssignScoutDialog
          isOpen={isAssignDialogOpen}
          onClose={handleAssignDialogClose}
          player={selectedPlayer}
        />
      )}
    </div>
  );
};

export default Calendar;
