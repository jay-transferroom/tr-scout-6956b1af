
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Player } from "@/types/player";

interface PlayerItemProps {
  player: Player;
  teamLogo?: string;
  onSelect: (player: Player) => void;
}

const PlayerItem = ({ player, teamLogo, onSelect }: PlayerItemProps) => {
  return (
    <li 
      className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center gap-3"
      onClick={() => onSelect(player)}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage 
          src={player.image || undefined} 
          alt={player.name}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
          {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <p className="font-medium">{player.name}</p>
        <p className="text-sm text-muted-foreground">{player.club} • {player.positions.join(", ")}</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-sm text-right">
          <p>{player.age} yrs</p>
          <p className="text-muted-foreground">{player.nationality}</p>
        </div>
        
        {teamLogo && (
          <Avatar className="h-8 w-8">
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
      </div>
    </li>
  );
};

export default PlayerItem;
