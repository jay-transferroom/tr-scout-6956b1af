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
  multiPlayerSlots?: Array<{
    position: string;
    activePlayerId: string;
    alternatePlayerIds: string[];
  }>;
  onPositionClick: (position: string) => void;
  selectedPosition: string | null;
  onPlayerChange?: (position: string, playerId: string) => void;
  onAddPlayerToPosition?: (position: string, playerId: string) => void;
  onSetActivePlayer?: (position: string, playerId: string) => void;
  disableAutoFill?: boolean;
  hideSlideout?: boolean;
}

const SquadFormationCard = ({ 
  squadPlayers, 
  selectedSquad, 
  formation,
  positionAssignments = [],
  multiPlayerSlots = [],
  onPositionClick, 
  selectedPosition,
  onPlayerChange,
  onAddPlayerToPosition,
  onSetActivePlayer,
  disableAutoFill,
  hideSlideout
}: SquadFormationCardProps) => {
  return (
    <CompactSquadView 
      squadPlayers={squadPlayers}
      selectedSquad={selectedSquad}
      formation={formation}
      positionAssignments={positionAssignments}
      multiPlayerSlots={multiPlayerSlots}
      onPositionClick={onPositionClick}
      selectedPosition={selectedPosition}
      onPlayerChange={onPlayerChange}
      onAddPlayerToPosition={onAddPlayerToPosition}
      onSetActivePlayer={onSetActivePlayer}
      disableAutoFill={disableAutoFill}
      hideSlideout={hideSlideout}
    />
  );
};

export default SquadFormationCard;
