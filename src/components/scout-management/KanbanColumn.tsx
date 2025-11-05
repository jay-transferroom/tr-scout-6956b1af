
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import PlayerCard from "./PlayerCard";

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    count: number;
  };
  players: any[];
  searchTerm: string;
  selectedScout: string;
  onAssignScout?: (player: any) => void;
  onViewReport?: (player: any) => void;
  onMarkAsReviewed?: (player: any) => void;
}

const KanbanColumn = ({
  column,
  players,
  searchTerm,
  selectedScout,
  onAssignScout,
  onViewReport,
  onMarkAsReviewed
}: KanbanColumnProps) => {
  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${column.color}`} />
          <h3 className="font-medium text-sm md:text-base truncate">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.count}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9">
          <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Column Content */}
      <div className="flex-1 min-h-[300px] md:min-h-[400px] rounded-lg p-2 md:p-3 bg-muted/50 border-2 border-transparent">
        {players.length > 0 ? (
          players.map((player) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              onAssignScout={onAssignScout}
              onViewReport={onViewReport}
              onMarkAsReviewed={onMarkAsReviewed}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-xs md:text-sm border-2 border-dashed border-muted-foreground/20 rounded-lg p-4">
            {searchTerm || selectedScout !== "all" ? "No matching assignments" : 
             column.id === 'shortlisted' ? "No shortlisted players" :
             column.id === 'assigned' ? "No assigned players" : "No completed assignments"}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
