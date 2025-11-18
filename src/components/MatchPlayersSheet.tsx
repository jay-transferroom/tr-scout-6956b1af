import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListPlus, UserPlus } from "lucide-react";
import { MatchPlayer } from "@/hooks/useMatchPlayers";
import { useNavigate } from "react-router-dom";

interface MatchPlayersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homePlayers: MatchPlayer[];
  awayPlayers: MatchPlayer[];
  onAddToShortlist?: (player: MatchPlayer, e: React.MouseEvent) => void;
  onAssignScout?: (player: MatchPlayer, e: React.MouseEvent) => void;
}

const PlayerCard = ({ player, onAddToShortlist, onAssignScout }: { 
  player: MatchPlayer;
  onAddToShortlist?: (player: MatchPlayer, e: React.MouseEvent) => void;
  onAssignScout?: (player: MatchPlayer, e: React.MouseEvent) => void;
}) => {
  const navigate = useNavigate();

  const handlePlayerClick = () => {
    if (player.isPrivatePlayer) {
      navigate(`/private-player/${player.id}`);
    } else {
      navigate(`/player/${player.id}`);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-all group">
      <Avatar className="h-12 w-12 flex-shrink-0 cursor-pointer" onClick={handlePlayerClick}>
        <AvatarImage src={player.image} alt={player.name} />
        <AvatarFallback className="text-sm">
          {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handlePlayerClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-base">{player.name}</div>
            <div className="text-sm text-muted-foreground">
              {player.age}y • {player.nationality}
            </div>
          </div>
          
          {player.transferroomRating && (
            <Badge variant="secondary" className="shrink-0">
              {player.transferroomRating}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddToShortlist && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddToShortlist(player, e);
            }}
            title="Add to shortlist"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        )}
        {onAssignScout && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAssignScout(player, e);
            }}
            title="Assign scout"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const MatchPlayersSheet = ({
  open,
  onOpenChange,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homePlayers,
  awayPlayers,
  onAddToShortlist,
  onAssignScout,
}: MatchPlayersSheetProps) => {
  // Dummy data for demonstration - will be replaced with real data
  const dummyHomePlayers: MatchPlayer[] = homePlayers.length > 0 ? homePlayers : [
    {
      id: '1',
      name: 'Robert Sanchez',
      club: homeTeam,
      age: 26,
      positions: ['GK'],
      nationality: 'Spain',
      region: 'Europe',
      dateOfBirth: '1997-11-18',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 75,
      minutesPlayed: 90,
      positionPlayed: 'GK',
      matchRating: 7.2,
    },
    {
      id: '2',
      name: 'Reece James',
      club: homeTeam,
      age: 24,
      positions: ['RB', 'RWB'],
      nationality: 'England',
      region: 'Europe',
      dateOfBirth: '1999-12-08',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 85,
      minutesPlayed: 90,
      positionPlayed: 'RB',
      matchRating: 7.8,
      assists: 1,
    },
    {
      id: '3',
      name: 'Levi Colwill',
      club: homeTeam,
      age: 21,
      positions: ['CB', 'LB'],
      nationality: 'England',
      region: 'Europe',
      dateOfBirth: '2003-02-26',
      dominantFoot: 'Left',
      contractStatus: 'Under Contract',
      transferroomRating: 80,
      minutesPlayed: 90,
      positionPlayed: 'CB',
      matchRating: 7.5,
    },
    {
      id: '4',
      name: 'Cole Palmer',
      club: homeTeam,
      age: 22,
      positions: ['AM', 'RW'],
      nationality: 'England',
      region: 'Europe',
      dateOfBirth: '2002-05-06',
      dominantFoot: 'Left',
      contractStatus: 'Under Contract',
      transferroomRating: 88,
      minutesPlayed: 85,
      positionPlayed: 'AM',
      goals: 1,
      assists: 1,
      matchRating: 8.5,
    },
    {
      id: '5',
      name: 'Nicolas Jackson',
      club: homeTeam,
      age: 22,
      positions: ['ST'],
      nationality: 'Senegal',
      region: 'Africa',
      dateOfBirth: '2001-06-20',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 79,
      minutesPlayed: 75,
      positionPlayed: 'ST',
      goals: 1,
      matchRating: 7.6,
    },
    {
      id: '6',
      name: 'Christopher Nkunku',
      club: homeTeam,
      age: 26,
      positions: ['ST', 'AM'],
      nationality: 'France',
      region: 'Europe',
      dateOfBirth: '1997-11-14',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 86,
      minutesPlayed: 15,
      positionPlayed: 'ST',
      matchRating: 6.8,
    },
  ];

  const dummyAwayPlayers: MatchPlayer[] = awayPlayers.length > 0 ? awayPlayers : [
    {
      id: '7',
      name: 'Bernd Leno',
      club: awayTeam,
      age: 32,
      positions: ['GK'],
      nationality: 'Germany',
      region: 'Europe',
      dateOfBirth: '1992-03-04',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 78,
      minutesPlayed: 90,
      positionPlayed: 'GK',
      matchRating: 6.5,
    },
    {
      id: '8',
      name: 'Antonee Robinson',
      club: awayTeam,
      age: 27,
      positions: ['LB'],
      nationality: 'USA',
      region: 'North America',
      dateOfBirth: '1997-08-08',
      dominantFoot: 'Left',
      contractStatus: 'Under Contract',
      transferroomRating: 76,
      minutesPlayed: 90,
      positionPlayed: 'LB',
      matchRating: 7.0,
    },
    {
      id: '9',
      name: 'Issa Diop',
      club: awayTeam,
      age: 27,
      positions: ['CB'],
      nationality: 'France',
      region: 'Europe',
      dateOfBirth: '1997-01-09',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 74,
      minutesPlayed: 90,
      positionPlayed: 'CB',
      matchRating: 6.8,
    },
    {
      id: '10',
      name: 'Andreas Pereira',
      club: awayTeam,
      age: 28,
      positions: ['AM', 'CM'],
      nationality: 'Brazil',
      region: 'South America',
      dateOfBirth: '1996-01-01',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 77,
      minutesPlayed: 82,
      positionPlayed: 'AM',
      assists: 1,
      matchRating: 7.3,
    },
    {
      id: '11',
      name: 'Raúl Jiménez',
      club: awayTeam,
      age: 33,
      positions: ['ST'],
      nationality: 'Mexico',
      region: 'North America',
      dateOfBirth: '1991-05-05',
      dominantFoot: 'Right',
      contractStatus: 'Under Contract',
      transferroomRating: 75,
      minutesPlayed: 65,
      positionPlayed: 'ST',
      goals: 1,
      matchRating: 7.4,
    },
  ];

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
                <Badge variant="secondary">{dummyHomePlayers.length}</Badge>
              </h3>
              <div className="space-y-2">
                {dummyHomePlayers.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player}
                    onAddToShortlist={onAddToShortlist}
                    onAssignScout={onAssignScout}
                  />
                ))}
              </div>
            </div>

            {/* Away Team */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {awayTeam}
                <Badge variant="secondary">{dummyAwayPlayers.length}</Badge>
              </h3>
              <div className="space-y-2">
                {dummyAwayPlayers.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player}
                    onAddToShortlist={onAddToShortlist}
                    onAssignScout={onAssignScout}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
