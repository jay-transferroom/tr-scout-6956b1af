import { useFixturesData } from "@/hooks/useFixturesData";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { FixtureCard } from "@/components/fixtures/FixtureCard";
import { isAfter, addDays } from "date-fns";

const UpcomingMatches = () => {
  const { data: fixtures = [], isLoading, error } = useFixturesData();

  // Filter for upcoming matches (next 30 days)
  const now = new Date();
  const next30Days = addDays(now, 30);
  
  const upcomingMatches = fixtures
    .filter(fixture => {
      const fixtureDate = new Date(fixture.match_date_utc);
      return isAfter(fixtureDate, now) && !isAfter(fixtureDate, next30Days);
    })
    .sort((a, b) => new Date(a.match_date_utc).getTime() - new Date(b.match_date_utc).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading fixtures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Error loading fixtures. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Upcoming Matches
        </h2>
        <p className="text-muted-foreground">Track upcoming fixtures and matches for scouting opportunities</p>
      </div>

      {upcomingMatches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {upcomingMatches.map((fixture, index) => (
            <FixtureCard
              key={`${fixture.match_number}-${index}`}
              homeTeam={fixture.home_team}
              awayTeam={fixture.away_team}
              matchDate={fixture.match_date_utc}
              venue={fixture.venue}
              competition={fixture.competition}
              homeScore={fixture.home_score}
              awayScore={fixture.away_score}
              shortlistedPlayersCount={0}
              scoutsAssignedCount={0}
              colorIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming fixtures available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingMatches;
