import { ScoutAvatars } from "@/components/ui/scout-avatars";

interface Player {
  id: string;
  name: string;
  club: string;
  positions: string[];
}

interface Scout {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface PlayerInfoCardProps {
  player: Player;
  existingAssignments?: Scout[];
}

const PlayerInfoCard = ({ player, existingAssignments = [] }: PlayerInfoCardProps) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <h4 className="font-medium">{player.name}</h4>
      <p className="text-sm text-gray-600">{player.club} • {player.positions.join(', ')}</p>
      {existingAssignments.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-orange-600 mb-1">Currently assigned to:</p>
          <ScoutAvatars scouts={existingAssignments} maxVisible={5} size="sm" />
        </div>
      )}
    </div>
  );
};

export default PlayerInfoCard;
