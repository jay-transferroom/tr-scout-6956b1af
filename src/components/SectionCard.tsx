
import { ReportSection, ReportField, NamedRatingSystem } from "@/types/report";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import FieldsList from "@/components/FieldsList";

interface SectionCardProps {
  section: ReportSection;
  sectionIndex: number;
  totalSections: number;
  isExpanded: boolean;
  isDragged: boolean;
  editingFieldId: string | null;
  availableRatingSystems?: NamedRatingSystem[];
  onUpdateSection: (section: ReportSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleExpand: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onAddField: () => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (field: ReportField) => void;
  onSetEditingField: (fieldId: string | null) => void;
}

const SectionCard = ({
  section,
  sectionIndex,
  totalSections,
  isExpanded,
  isDragged,
  editingFieldId,
  availableRatingSystems,
  onUpdateSection,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onAddField,
  onDeleteField,
  onUpdateField,
  onSetEditingField
}: SectionCardProps) => {
  return (
    <div 
      className={cn(
        "border rounded-lg transition-colors",
        isExpanded ? "border-primary/30 bg-card" : "border-border bg-card",
        isDragged ? "opacity-50" : ""
      )}
    >
      <div className="px-4 py-3">
        <SectionHeader
          section={section}
          sectionIndex={sectionIndex}
          totalSections={totalSections}
          isExpanded={isExpanded}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onToggleExpand={onToggleExpand}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-border/50 pt-3">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id={`section-optional-${section.id}`}
                checked={section.optional}
                onCheckedChange={(checked) => {
                  onUpdateSection({ 
                    ...section, 
                    optional: !!checked 
                  });
                }}
              />
              <label 
                htmlFor={`section-optional-${section.id}`}
                className="text-xs text-muted-foreground"
              >
                Optional section
              </label>
            </div>
            
            <FieldsList
              fields={section.fields}
              editingFieldId={editingFieldId}
              availableRatingSystems={availableRatingSystems}
              onAddField={onAddField}
              onDeleteField={onDeleteField}
              onUpdateField={onUpdateField}
              onSetEditingField={onSetEditingField}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionCard;
