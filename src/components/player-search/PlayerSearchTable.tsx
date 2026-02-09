import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/player";
import { Star, ArrowUpDown, ArrowDown, User } from "lucide-react";
import { CategoryWeights, computeMyRating, PositionKey } from "./CustomiseMyRatingDialog";
import MyRatingHover from "./MyRatingHover";

interface PlayerSearchTableProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  getTeamLogo: (clubName: string) => string | undefined;
  currentSort: string;
  onSort: (sortBy: string) => void;
  myRatingWeights: Record<PositionKey, CategoryWeights[]>;
}

const PlayerSearchTable = ({ players, onPlayerClick, getTeamLogo, currentSort, onSort, myRatingWeights }: PlayerSearchTableProps) => {
  const formatRating = (rating: number | undefined | null) => {
    if (!rating) return '-';
    return rating.toFixed(1);
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'Free Agent':
        return 'bg-green-100 text-green-800';
      case 'Under Contract':
        return 'bg-blue-100 text-blue-800';
      case 'Loan':
        return 'bg-orange-100 text-orange-800';
      case 'Youth Contract':
        return 'bg-purple-100 text-purple-800';
      case 'Private Player':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (column: string) => {
    if (currentSort !== column) return <ArrowUpDown className="h-3 w-3" />;
    return <ArrowDown className="h-3 w-3" />;
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead 
      className="text-sm cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {getSortIcon(column)}
      </div>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-sm">Player</TableHead>
          <TableHead className="text-sm">Club</TableHead>
          <TableHead className="text-sm">Position</TableHead>
          <TableHead className="text-sm">Age</TableHead>
          <TableHead className="text-sm">Nationality</TableHead>
          <TableHead className="text-sm">Contract Status</TableHead>
          <SortableHeader column="rating">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>Rating</span>
            </div>
          </SortableHeader>
          <SortableHeader column="myRating">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-primary" />
              <span>My Rating</span>
            </div>
          </SortableHeader>
          <SortableHeader column="potential">Potential</SortableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.length > 0 ? (
          players.map((player) => {
            const teamLogo = getTeamLogo(player.club);
            const myRating = computeMyRating(player, myRatingWeights['CM']);
            
            return (
              <TableRow 
                key={player.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onPlayerClick(player)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={player.image} 
                        alt={player.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                        {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    {teamLogo && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage 
                          src={teamLogo} 
                          alt={`${player.club} logo`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-semibold">
                          {player.club.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span>{player.club}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span>{player.positions.join(", ")}</span>
                </TableCell>
                
                <TableCell>
                  <span>{player.age}</span>
                </TableCell>
                
                <TableCell>
                  <span>{player.nationality}</span>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getContractStatusColor(player.contractStatus)} border-0`}
                  >
                    {player.contractStatus}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span>{formatRating(player.transferroomRating)}</span>
                    {player.transferroomRating && (
                      <Star className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <MyRatingHover rating={myRating} categories={myRatingWeights['CM']}>
                    <div className="flex items-center gap-1 cursor-default">
                      <span className={myRating ? "font-medium" : ""}>{formatRating(myRating)}</span>
                      {myRating && (
                        <User className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </MyRatingHover>
                </TableCell>
                
                <TableCell>
                  <span>{formatRating(player.futureRating)}</span>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
              No players found matching your criteria
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PlayerSearchTable;