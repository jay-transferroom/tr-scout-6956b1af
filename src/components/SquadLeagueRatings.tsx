import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSquadLeagueRatings, SquadLeagueRating } from "@/hooks/useSquadLeagueRatings";
import { Skeleton } from "@/components/ui/skeleton";

const SquadLeagueRatings = () => {
  const { data: leagueRatings, isLoading } = useSquadLeagueRatings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Average Ratings</CardTitle>
          <CardDescription>Position ratings across competitions</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!leagueRatings || leagueRatings.length === 0) {
    return null;
  }

  const positionKeys = [
    { key: 'KeeperRating', label: 'GK' },
    { key: 'DefenderRating', label: 'DEF' },
    { key: 'CentreBackRating', label: 'CB' },
    { key: 'LeftBackRating', label: 'LB' },
    { key: 'RightBackRating', label: 'RB' },
    { key: 'MidfielderRating', label: 'MID' },
    { key: 'CentreMidfielderRating', label: 'CM' },
    { key: 'AttackerRating', label: 'ATT' },
    { key: 'ForwardRating', label: 'FWD' },
    { key: 'WingerRating', label: 'W' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Average Ratings</CardTitle>
        <CardDescription>Position ratings across competitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Competition</th>
                <th className="text-center py-2 px-2 font-semibold">Avg</th>
                {positionKeys.map(({ label }) => (
                  <th key={label} className="text-center py-2 px-2 font-semibold text-xs">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leagueRatings.map((league) => (
                <tr key={league.competitionid} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">{league.competition}</td>
                  <td className="text-center py-2 px-2 font-medium">
                    {league.average_starter_rating?.toFixed(1) || '-'}
                  </td>
                  {positionKeys.map(({ key }) => (
                    <td key={key} className="text-center py-2 px-2 text-xs">
                      {league[key as keyof SquadLeagueRating]
                        ? (league[key as keyof SquadLeagueRating] as number).toFixed(1)
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadLeagueRatings;
