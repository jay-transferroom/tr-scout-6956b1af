
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
  onAddField: (types: Array<"rating" | "text">) => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (field: ReportField) => void;
  onSetEditingField: (fieldId: string | null) => void;
  onMoveField?: (sectionId: string, fromIndex: number, toIndex: number) => void;
}

const SectionCard = ({
  section,
  sectionIndex,
  totalSections,
  isExpanded,
  isDragged,
  editingFieldId,
  availableRatingSystems = [],
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
  onSetEditingField,
  onMoveField
}: SectionCardProps) => {
  // Check if section has any rating fields
  const hasRatingFields = section.fields.some(f => f.type === 'rating');

  // Match current section rating system to a named one
  const currentRatingSystemId = availableRatingSystems.find(
    rs => rs.ratingSystem.type === section.ratingSystem?.type
  )?.id || availableRatingSystems.find(
    rs => rs.ratingSystem.type.startsWith('numeric')
  )?.id || availableRatingSystems[0]?.id;

  const handleRatingSystemChange = (ratingSystemId: string) => {
    const selected = availableRatingSystems.find(rs => rs.id === ratingSystemId);
    if (selected) {
      onUpdateSection({
        ...section,
        ratingSystem: { ...selected.ratingSystem },
        fields: section.fields.map(field => 
          field.type === 'rating' 
            ? { ...field, ratingSystem: { ...selected.ratingSystem } }
            : field
        )
      });
    }
  };

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
            {/* Section-level settings row */}
            <div className="flex items-center mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`section-required-${section.id}`}
                  checked={!section.optional}
                  onCheckedChange={(checked) => {
                    onUpdateSection({ ...section, optional: !checked });
                  }}
                />
                <label 
                  htmlFor={`section-required-${section.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Required section
                </label>
              </div>
            </div>
            
            <FieldsList
              fields={section.fields}
              editingFieldId={editingFieldId}
              availableRatingSystems={availableRatingSystems}
              onAddField={onAddField}
              onDeleteField={onDeleteField}
              onUpdateField={onUpdateField}
              onSetEditingField={onSetEditingField}
              onMoveField={onMoveField ? (fromIndex, toIndex) => onMoveField(section.id, fromIndex, toIndex) : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionCard;
