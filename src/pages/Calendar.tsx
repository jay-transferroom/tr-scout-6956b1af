
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedScout, setSelectedScout] = useState<string>("all");
  const [selectedShortlist, setSelectedShortlist] = useState<string>("all");
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

  // Get players from selected shortlist
  const getShortlistPlayers = () => {
    if (selectedShortlist === "all") return [];
    const shortlist = shortlists.find(s => s.id === selectedShortlist);
    if (!shortlist?.playerIds) return [];
    
    const shortlistPlayers = allPlayers.filter(player => shortlist.playerIds.includes(player.id.toString()));
    console.log(`Selected shortlist: ${shortlist.name}`, {
      shortlistId: selectedShortlist,
      playerIds: shortlist.playerIds,
      foundPlayers: shortlistPlayers.map(p => ({ name: p.name, club: p.club }))
    });
    
    return shortlistPlayers;
  };

  // Get teams that have shortlisted players
  const getShortlistTeams = () => {
    if (selectedShortlist === "all") return new Set();
    const shortlistPlayers = getShortlistPlayers();
    return new Set(shortlistPlayers.map(player => player.club));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Get the full calendar grid including leading/trailing days from adjacent months
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Enhanced fixture data with player recommendations
  const enhancedFixtures = fixtures.map(fixture => {
    // Find all players from teams playing in this fixture
    const playersInFixture = allPlayers.filter(player => 
      player.club === fixture.home_team || player.club === fixture.away_team
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
      console.log(`Filtering fixtures for shortlist teams:`, Array.from(shortlistTeams));
      
      dayFixtures = dayFixtures.filter(fixture => {
        const hasShortlistTeam = shortlistTeams.has(fixture.home_team) || shortlistTeams.has(fixture.away_team);
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
    
    // Filter by scout if selected
    if (selectedScout !== "all") {
      return dayFixtures.filter(fixture => {
        const hasScoutAssignments = assignments.some(a => 
          a.assigned_to_scout_id === selectedScout && 
          a.deadline && 
          isSameDay(new Date(a.deadline), date)
        );
        
        return hasScoutAssignments || fixture.recommendedPlayers.length > 0 || fixture.shortlistedPlayers.length > 0;
      });
    }

    return dayFixtures;
  };

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
        <h1 className="text-3xl font-bold">Scout Calendar</h1>
        <p className="text-muted-foreground mt-2">
          View fixtures and manage scout assignments with intelligent recommendations
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                  const dayFixtures = getScoutRelevantFixtures(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  // Calculate scout workload for this day
                  const totalWorkload = selectedScout === "all" 
                    ? assignments.filter(a => a.deadline && isSameDay(new Date(a.deadline), day)).length
                    : getScoutWorkloadForDate(day, selectedScout);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-2 h-24 border rounded-lg text-left hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                        !isCurrentMonth && "text-muted-foreground bg-muted/20",
                        isToday(day) && !isSelected && "bg-blue-50 border-blue-200"
                      )}
                    >
                      <div className="font-medium text-sm">{format(day, 'd')}</div>
                      <div className="mt-1 space-y-1">
                        {dayFixtures.slice(0, 2).map((fixture, index) => {
                          const isCompleted = fixture.status === 'completed' || fixture.status === 'Full Time' || (fixture.home_score !== null && fixture.away_score !== null);
                          const isLive = fixture.status === 'live' || fixture.status === 'Live';
                          
                          return (
                            <div 
                              key={`${fixture.match_number}-${index}`} 
                              className={cn(
                                "text-xs rounded px-1 py-0.5 truncate",
                                isLive && "bg-green-100 text-green-800 animate-pulse",
                                isCompleted && "bg-gray-100 text-gray-700",
                                !isLive && !isCompleted && "bg-blue-100 text-blue-800"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">
                                  {fixture.home_team.substring(0, 3)} vs {fixture.away_team.substring(0, 3)}
                                </span>
                                {isCompleted && fixture.home_score !== null && fixture.away_score !== null && (
                                  <span className="ml-1 font-medium">
                                    {fixture.home_score}-{fixture.away_score}
                                  </span>
                                )}
                                {isLive && (
                                  <span className="ml-1 text-xs">LIVE</span>
                                )}
                              </div>
                              {/* Show shortlisted players count */}
                              {fixture.shortlistedPlayers && fixture.shortlistedPlayers.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="h-2 w-2 text-yellow-600" />
                                  <span className="text-xs text-yellow-800 font-medium">
                                    {fixture.shortlistedPlayers.length} shortlisted
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayFixtures.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayFixtures.length - 2} more
                          </div>
                        )}
                        {totalWorkload > 0 && (
                          <div className="text-xs bg-orange-100 text-orange-800 rounded px-1 py-0.5">
                            {totalWorkload} task{totalWorkload > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixture Details & Recommendations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate 
                  ? format(selectedDate, "EEEE, MMMM d")
                  : "Select a date"
                }
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
                            <div className="text-right flex-1">
                              <div className="font-semibold text-lg">{fixture.home_team}</div>
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
                            <div className="text-left flex-1">
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
                        {fixture.shortlistedPlayers.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">
                                Shortlisted Players ({fixture.shortlistedPlayers.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {fixture.shortlistedPlayers.map(player => {
                                // Check if this shortlisted player has a scout assignment
                                const playerAssignment = assignments.find(a => a.player_id === player.id.toString());
                                
                                return (
                                  <div key={player.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                                    <div>
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
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recommended Players */}
                        {fixture.recommendedPlayers.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">
                                {isCompleted ? "Players to Review" : "Recommended for Scouting"}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {fixture.recommendedPlayers.map(player => (
                                <div key={player.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                  <div>
                                    <div className="text-sm font-medium">{player.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {player.club} • {player.positions?.[0] || 'Unknown'}
                                      {player.age && ` • ${player.age}y`}
                                      {player.transferroomRating && ` • ${player.transferroomRating}/100`}
                                      {player.xtvScore && ` • €${(player.xtvScore / 1000000).toFixed(1)}M`}
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
                              ))}
                            </div>
                          </div>
                        )}
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

          {/* Scout Performance Summary */}
          {selectedScout !== "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Scout Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const scout = scouts.find(s => s.id === selectedScout);
                    const scoutAssignments = assignments.filter(a => a.assigned_to_scout_id === selectedScout);
                    const completedCount = scoutAssignments.filter(a => a.status === 'completed').length;
                    const completionRate = scoutAssignments.length > 0 ? Math.round((completedCount / scoutAssignments.length) * 100) : 0;
                    
                    return (
                      <>
                        <div className="text-center mb-4">
                          <div className="font-semibold">{scout?.first_name} {scout?.last_name}</div>
                          <div className="text-sm text-muted-foreground">Scout Performance</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Assignments:</span>
                          <span className="font-semibold">{scoutAssignments.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Completed:</span>
                          <span className="font-semibold text-green-600">{completedCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Success Rate:</span>
                          <span className="font-semibold text-blue-600">{completionRate}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
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
