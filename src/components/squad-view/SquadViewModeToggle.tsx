import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers } from "lucide-react";

interface SquadViewModeToggleProps {
  currentView: 'detail' | 'depth';
  onViewChange: (view: 'detail' | 'depth') => void;
}

const SquadViewModeToggle = ({
  currentView,
  onViewChange
}: SquadViewModeToggleProps) => {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={currentView === 'detail' ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange('detail')}
        className="flex items-center gap-2 h-8"
      >
        <LayoutGrid className="h-4 w-4" />
        Detail
      </Button>
      <Button
        variant={currentView === 'depth' ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange('depth')}
        className="flex items-center gap-2 h-8"
      >
        <Layers className="h-4 w-4" />
        Depth
      </Button>
    </div>
  );
};

export default SquadViewModeToggle;
