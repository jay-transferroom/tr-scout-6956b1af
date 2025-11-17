
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Player } from "@/types/player";
import CompactSquadView from "@/components/CompactSquadView";

interface SquadFormationCardProps {
  squadPlayers: Player[];
  selectedSquad: string;
  formation?: string;
  positionAssignments?: Array<{
    position: string;
    player_id: string;
  }>;
  onPositionClick: (position: string) => void;
  selectedPosition: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  disableAutoFill?: boolean;
}

const SquadFormationCard = ({ 
  squadPlayers, 
  selectedSquad, 
  formation,
  positionAssignments = [],
  onPositionClick, 
  selectedPosition,
  onPlayerChange,
  disableAutoFill
}: SquadFormationCardProps) => {
  return (
    <CompactSquadView 
      squadPlayers={squadPlayers}
      selectedSquad={selectedSquad}
      formation={formation}
      positionAssignments={positionAssignments}
      onPositionClick={onPositionClick}
      selectedPosition={selectedPosition}
      onPlayerChange={onPlayerChange}
      disableAutoFill={disableAutoFill}
    />
  );
};

export default SquadFormationCard;
