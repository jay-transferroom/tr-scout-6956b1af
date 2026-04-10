
import { ReportSection, ReportField, NamedRatingSystem } from "@/types/report";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import FieldsList from "@/components/FieldsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  isOverall?: boolean;
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
  onMoveField,
  isOverall = false
}: SectionCardProps) => {
  const hasRatingFields = section.fields.some(f => f.type === 'rating');

  const currentRatingSystemId = section.ratingSystem
    ? availableRatingSystems.find(rs => rs.ratingSystem.type === section.ratingSystem?.type)?.id
    : undefined;

  const currentRatingLabel = currentRatingSystemId
    ? availableRatingSystems.find(rs => rs.id === currentRatingSystemId)?.name
    : null;

  const handleRatingSystemChange = (ratingSystemId: string) => {
    const selected = availableRatingSystems.find(rs => rs.id === ratingSystemId);
    if (selected) {
      onUpdateSection({ ...section, ratingSystem: { ...selected.ratingSystem } });
    }
  };

  return (
    <div 
      className={cn(
        "border rounded-lg transition-colors",
        isOverall 
          ? "border-primary/40 bg-primary/5" 
          : isExpanded ? "border-primary/30 bg-card" : "border-border bg-card",
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
          isOverall={isOverall}
        />
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-border/50 pt-3">
            {/* Section-level settings row */}
            <div className="flex items-center justify-between mb-3">
              {availableRatingSystems.length > 0 ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Rating System</label>
                  <Select 
                    value={currentRatingSystemId || ''} 
                    onValueChange={handleRatingSystemChange}
                  >
                    <SelectTrigger className="h-7 text-xs w-[180px]">
                      <SelectValue placeholder="Select rating system" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRatingSystems.map((rs) => (
                        <SelectItem key={rs.id} value={rs.id} className="text-xs">{rs.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : <div />}

              {!isOverall && (
                <div className="flex items-center space-x-2">
                  <label 
                    htmlFor={`section-required-${section.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Required section
                  </label>
                  <Checkbox
                    id={`section-required-${section.id}`}
                    checked={(() => {
                      const allRequired = section.fields.every(f => f.required);
                      const noneRequired = section.fields.every(f => !f.required);
                      if (allRequired && section.fields.length > 0) return true;
                      if (noneRequired) return false;
                      return "indeterminate";
                    })()}
                    onCheckedChange={(checked) => {
                      const makeRequired = checked === true;
                      const updatedFields = section.fields.map(f => ({ ...f, required: makeRequired }));
                      onUpdateSection({ ...section, optional: !makeRequired, fields: updatedFields });
                    }}
                  />
                </div>
              )}
            </div>
            
            <FieldsList
              fields={section.fields}
              editingFieldId={editingFieldId}
              onAddField={onAddField}
              onDeleteField={onDeleteField}
              onUpdateField={onUpdateField}
              onSetEditingField={onSetEditingField}
              onMoveField={onMoveField ? (fromIndex, toIndex) => onMoveField(section.id, fromIndex, toIndex) : undefined}
              readOnly={isOverall}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionCard;
