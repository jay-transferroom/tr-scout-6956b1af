
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClubBadge } from "@/components/ui/club-badge";
import { Player } from "@/types/player";

interface PlayerClubInfoProps {
  player: Player;
  getContractStatusColor: (status: string) => string;
  getPositionColor: (position: string) => string;
  formatDateLocal: (dateString: string) => string;
}

export const PlayerClubInfo = ({ player, getContractStatusColor, getPositionColor, formatDateLocal }: PlayerClubInfoProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Club & Contract</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Current Club</p>
            <ClubBadge clubName={player.club} className="scale-75 origin-left" />
          </div>
          
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Contract Status</p>
            <Badge className={`text-xs ${getContractStatusColor(player.contractStatus)}`}>
              {player.contractStatus}
            </Badge>
          </div>
        </div>
        
        {player.contractExpiry && (
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Contract Expires</p>
            <p className="text-xs font-medium">{formatDateLocal(player.contractExpiry)}</p>
          </div>
        )}
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Positions</p>
          <div className="flex flex-wrap gap-1">
            {player.positions.map((position) => (
              <span
                key={position}
                className={`inline-flex items-center justify-center text-xs font-bold rounded px-1.5 py-0.5 text-white ${getPositionColor(position)}`}
              >
                {position}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
