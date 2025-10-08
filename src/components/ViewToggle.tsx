import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
interface ViewToggleProps {
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}
const ViewToggle = ({
  currentView,
  onViewChange
}: ViewToggleProps) => {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={currentView === 'grid' ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        Squad
      </Button>
      <Button
        variant={currentView === 'list' ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        List
      </Button>
    </div>
  );
};
export default ViewToggle;