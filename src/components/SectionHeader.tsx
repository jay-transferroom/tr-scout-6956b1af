
import { useState } from "react";
import { ReportSection } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Edit, Trash2 } from "lucide-react";

interface SectionHeaderProps {
  section: ReportSection;
  sectionIndex: number;
  totalSections: number;
  isExpanded: boolean;
  onUpdateSection: (section: ReportSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleExpand: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const SectionHeader = ({
  section,
  sectionIndex,
  totalSections,
  isExpanded,
  onUpdateSection,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  onDragStart,
  onDragEnd
}: SectionHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="py-3 flex flex-row items-center justify-between space-y-0">
      <div className="flex items-center space-x-2 w-full">
        <div
          className="cursor-move p-1 hover:bg-muted rounded"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
        
        {isEditing ? (
          <Input
            value={section.title}
            onChange={(e) => onUpdateSection({ ...section, title: e.target.value })}
            className="text-base font-medium border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <div className="text-base font-medium flex-1">{section.title}</div>
        )}
        
        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={onToggleExpand}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
