import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MatchPlayer } from "@/hooks/useMatchPlayers";

interface MatchPlayersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homePlayers: MatchPlayer[];
  awayPlayers: MatchPlayer[];
}

const PlayerCard = ({ player }: { player: MatchPlayer }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
    <Avatar className="h-12 w-12">
      <AvatarImage src={player.image} alt={player.name} />
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-sm">
        {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </AvatarFallback>
    </Avatar>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{player.name}</p>
          <p className="text-sm text-muted-foreground">
            {player.positionPlayed || player.positions?.[0] || 'Unknown'}
            {player.age && ` • ${player.age}y`}
            {player.nationality && ` • ${player.nationality}`}
          </p>
        </div>
        
        {player.transferroomRating && (
          <Badge variant="secondary" className="shrink-0">
            {player.transferroomRating}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        {player.minutesPlayed !== undefined && (
          <span>{player.minutesPlayed}'</span>
        )}
        {player.goals !== undefined && player.goals > 0 && (
          <span>⚽ {player.goals}</span>
        )}
        {player.assists !== undefined && player.assists > 0 && (
          <span>🅰️ {player.assists}</span>
        )}
        {player.matchRating && (
          <span>Rating: {player.matchRating}</span>
        )}
      </div>
    </div>
  </div>
);

export const MatchPlayersSheet = ({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homePlayers,
  awayPlayers,
}: MatchPlayersSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center justify-between gap-4">
              <span className="truncate">{homeTeam}</span>
              {homeScore !== undefined && awayScore !== undefined && (
                <Badge variant="outline" className="shrink-0 text-lg px-3 py-1">
                  {homeScore} - {awayScore}
                </Badge>
              )}
              <span className="truncate">{awayTeam}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            {/* Home Team */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {homeTeam}
                <Badge variant="secondary">{homePlayers.length}</Badge>
              </h3>
              {homePlayers.length > 0 ? (
                <div className="space-y-2">
                  {homePlayers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
                  No player data available for this team
                </p>
              )}
            </div>

            {/* Away Team */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {awayTeam}
                <Badge variant="secondary">{awayPlayers.length}</Badge>
              </h3>
              {awayPlayers.length > 0 ? (
                <div className="space-y-2">
                  {awayPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
                  No player data available for this team
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
