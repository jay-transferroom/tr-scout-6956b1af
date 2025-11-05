import { SlidingToggle } from "@/components/ui/sliding-toggle";
import { LayoutGrid, Table } from "lucide-react";

interface ScoutManagementViewToggleProps {
  currentView: 'kanban' | 'table';
  onViewChange: (view: 'kanban' | 'table') => void;
}

const ScoutManagementViewToggle = ({ currentView, onViewChange }: ScoutManagementViewToggleProps) => {
  return (
    <SlidingToggle
      value={currentView}
      onChange={(value) => onViewChange(value as 'kanban' | 'table')}
      options={[
        { 
          value: "kanban", 
          label: (
            <div className="flex items-center gap-1.5 md:gap-2">
              <LayoutGrid className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">Board</span>
            </div>
          )
        },
        { 
          value: "table", 
          label: (
            <div className="flex items-center gap-1.5 md:gap-2">
              <Table className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">Table</span>
            </div>
          )
        }
      ]}
    />
  );
};

export default ScoutManagementViewToggle;