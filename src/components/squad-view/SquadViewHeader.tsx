import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Lightbulb, Save, Plus } from "lucide-react";
import { SquadConfiguration } from "@/hooks/useSquadConfigurations";
import { SquadRecommendation } from "@/hooks/useSquadRecommendations";
import { SquadRatingCTAs } from "./SquadRatingCTAs";

interface HeadCoach {
  staffid: number;
  shortname: string | null;
  Image: string | null;
  current_squad: string | null;
  current_Role: string | null;
  age: number | null;
  rating: number | null;
  Style: string | null;
  "Favourite Formation": string | null;
  TrustInYouth: number | null;
  CurrentSquadId: number | null;
}

interface Formation {
  formation: string | null;
  games: number | null;
}

interface AlertPlayer {
  id: string;
  name: string;
  positions: string[];
  age: number;
  contractExpiry?: string;
}

interface SquadViewHeaderProps {
  loadedConfiguration: SquadConfiguration | null;
  selectedSquad: string;
  onSquadChange: (squad: string) => void;
  squadsList: { id: string; label: string; count: number }[];
  headCoach: HeadCoach | null | undefined;
  currentFormation: string;
  onFormationChange: (formation: string) => void;
  formations: Formation[];
  recommendations: SquadRecommendation[];
  alertPlayers: AlertPlayer[];
  onStartNewSquad: () => void;
  onSaveSquad: () => void;
  currentSquadRating?: {
    average_starter_rating: number;
    KeeperRating: number;
    DefenderRating: number;
    CentreBackRating: number;
    LeftBackRating: number;
    RightBackRating: number;
    MidfielderRating: number;
    CentreMidfielderRating: number;
    AttackerRating: number;
    ForwardRating: number;
    WingerRating: number;
  } | null;
}

export function SquadViewHeader({
  loadedConfiguration,
  selectedSquad,
  onSquadChange,
  squadsList,
  headCoach,
  currentFormation,
  onFormationChange,
  formations,
  recommendations,
  alertPlayers,
  onStartNewSquad,
  onSaveSquad,
  currentSquadRating,
}: SquadViewHeaderProps) {
  return (
    <div className="w-full bg-background border-b">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4">
        {/* Top Row: Configuration + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {loadedConfiguration ? (
              <>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Editing
                </Badge>
                <h1 className="text-xl font-semibold">{loadedConfiguration.name}</h1>
              </>
            ) : (
              <h1 className="text-xl font-semibold text-muted-foreground">New Squad Configuration</h1>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onStartNewSquad}>
              <Plus className="h-4 w-4 mr-1.5" />
              New
            </Button>
            <Button size="sm" onClick={onSaveSquad}>
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Rating CTAs Row */}
        <div className="mb-4">
          <SquadRatingCTAs currentSquadRating={currentSquadRating} />
        </div>

        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Squad Type + Formation */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Squad Type Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {squadsList.map((squad) => (
                <Button
                  key={squad.id}
                  onClick={() => onSquadChange(squad.id)}
                  variant={selectedSquad === squad.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                >
                  <span className="text-sm">{squad.label}</span>
                  <Badge 
                    variant="secondary"
                    className="ml-1.5 text-xs h-5 min-w-5 justify-center"
                  >
                    {squad.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Formation Selector */}
            <Select value={currentFormation} onValueChange={onFormationChange}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Formation" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {formations.map((formation) => (
                  <SelectItem 
                    key={formation.formation} 
                    value={formation.formation || ''}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{formation.formation}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formation.games})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right: Coach Info (Compact) */}
          {headCoach && (
            <div className="flex items-center gap-3 ml-auto">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={headCoach.Image || undefined} alt={headCoach.shortname || "Coach"} />
                <AvatarFallback className="text-xs">
                  {headCoach.shortname ? headCoach.shortname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "HC"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{headCoach.shortname}</p>
                <p className="text-xs text-muted-foreground">Head Coach</p>
              </div>
              <div className="flex gap-1.5">
                {headCoach.rating && (
                  <Badge variant="secondary" className="text-xs">
                    {headCoach.rating}
                  </Badge>
                )}
                {headCoach["Favourite Formation"] && (
                  <Badge variant="outline" className="text-xs">
                    {headCoach["Favourite Formation"]}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations & Alerts Row */}
        {(recommendations.length > 0 || alertPlayers.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {/* Recommendations */}
            {recommendations.slice(0, 3).map((rec, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md cursor-default">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" />
                      <Badge variant="default" className="text-xs">
                        {rec.Position}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline max-w-[200px] truncate">
                        {rec.Reason}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{rec.Reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {/* Alert Players */}
            {alertPlayers.slice(0, 3).map((player) => {
              const contractExpiringSoon = player.contractExpiry ? (() => {
                const expiryDate = new Date(player.contractExpiry);
                const now = new Date();
                const monthsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return monthsUntilExpiry <= 12 && monthsUntilExpiry > 0;
              })() : false;
              const isAging = player.age >= 30;
              const alertType = contractExpiringSoon ? "Contract" : "Age";

              return (
                <TooltipProvider key={player.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-md cursor-default">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs font-medium">{player.name.split(' ').pop()}</span>
                        <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                          {alertType}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.positions.join(', ')} • Age {player.age}
                        {contractExpiringSoon && " • Contract expiring soon"}
                        {isAging && !contractExpiringSoon && " • Aging player"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}

            {/* Show more indicator */}
            {(recommendations.length > 3 || alertPlayers.length > 3) && (
              <Badge variant="outline" className="text-xs">
                +{Math.max(0, recommendations.length - 3) + Math.max(0, alertPlayers.length - 3)} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
