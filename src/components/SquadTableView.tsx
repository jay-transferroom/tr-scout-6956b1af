import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ClubBadge } from "@/components/ui/club-badge";
import { Player } from "@/types/player";

interface SquadTableViewProps {
  players: Player[];
}

const SquadTableView = ({ players }: SquadTableViewProps) => {
  const formatValue = (value: number | undefined) => {
    if (!value) return '-';
    return `£${(value / 1000000).toFixed(1)}M`;
  };

  const formatRating = (rating: number | undefined) => {
    if (!rating) return '-';
    return rating.toFixed(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-semibold">Squad Players</span>
        <Badge variant="secondary">{players.length} players</Badge>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Player</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Club</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Age</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Positions</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Rating</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Value</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Contract</TableHead>
                </TableRow>
              </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-2 sm:gap-3 min-w-[140px]">
                  <PlayerAvatar 
                    playerName={player.name}
                    avatarUrl={player.image}
                    size="sm"
                  />
                  <span className="font-medium text-grey-900 text-xs sm:text-sm truncate">{player.name}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <ClubBadge clubName={player.club} size="sm" />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="text-xs sm:text-sm text-grey-600">{player.age}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 min-w-[100px]">
                  {player.positions.slice(0, 2).map((position, idx) => (
                    <Badge 
                      key={idx} 
                      variant="neutral" 
                      className="text-xs whitespace-nowrap"
                    >
                      {position}
                    </Badge>
                  ))}
                  {player.positions.length > 2 && (
                    <Badge variant="neutral" className="text-xs opacity-60 whitespace-nowrap">
                      +{player.positions.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="text-xs sm:text-sm text-grey-700 font-medium">
                  {formatRating(player.transferroomRating)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="text-xs sm:text-sm text-grey-700">
                  {formatValue(player.xtvScore)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="space-y-1 min-w-[100px]">
                  <div className="text-xs sm:text-sm text-grey-600">
                    {player.contractExpiry ? 
                      new Date(player.contractExpiry).getFullYear() : 
                      'Unknown'
                    }
                  </div>
                  <Badge 
                    variant={player.contractStatus === 'Under Contract' ? 'success' : 'neutral'}
                    className="text-xs whitespace-nowrap"
                  >
                    {player.contractStatus}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {players.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-grey-500">
                No players found in this squad.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadTableView;