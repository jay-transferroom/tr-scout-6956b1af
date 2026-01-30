import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFixturesData, Fixture } from "@/hooks/useFixturesData";
import { isAfter, addDays } from "date-fns";
import { FixtureCard } from "@/components/fixtures/FixtureCard";

const UpcomingMatches = () => {
  const navigate = useNavigate();
  const { data: fixtures = [], isLoading } = useFixturesData();

  // Filter for upcoming matches (next 7 days)
  const now = new Date();
  const nextWeek = addDays(now, 7);
  
  const upcomingMatches = fixtures
    .filter(fixture => {
      const fixtureDate = new Date(fixture.match_date_utc);
      return isAfter(fixtureDate, now) && !isAfter(fixtureDate, nextWeek) && fixture.status !== 'completed';
    })
    .slice(0, 4); // Show 4 cards for a nice grid

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fixture Tracking - Next 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading matches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Fixture Tracking - Next 7 Days
        </h2>
        <Badge variant="secondary">{upcomingMatches.length}</Badge>
      </div>
      
      {upcomingMatches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingMatches.map((match, index) => (
              <FixtureCard
                key={`${match.match_number}-${index}`}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                matchDate={match.match_date_utc}
                venue={match.venue}
                competition={match.competition}
                homeScore={match.home_score}
                awayScore={match.away_score}
                shortlistedPlayersCount={0}
                scoutsAssignedCount={0}
                colorIndex={index}
                variant="compact"
                onClick={() => navigate("/calendar")}
              />
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/calendar")}
          >
            View Full Calendar
          </Button>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No upcoming matches in the next 7 days</p>
              <Button
                variant="outline"
                onClick={() => navigate("/calendar")}
              >
                View Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UpcomingMatches;