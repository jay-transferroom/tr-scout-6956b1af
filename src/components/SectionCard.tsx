
import { ReportSection, ReportField, ReportFieldType, NamedRatingSystem } from "@/types/report";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/SectionHeader";
import FieldsList from "@/components/FieldsList";
import { STANDARD_SCOUT_VERDICTS } from "@/utils/recommendationHelpers";

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
  onSetEditingField
}: SectionCardProps) => {
  // Derive section field type from explicit value or first field
  const sectionFieldType: ReportFieldType = section.fieldType || section.fields[0]?.type || 'rating';

  // Match current section rating system to a named one
  const currentRatingSystemId = availableRatingSystems.find(
    rs => rs.ratingSystem.type === section.ratingSystem?.type
  )?.id || availableRatingSystems.find(
    rs => rs.ratingSystem.type.startsWith('numeric')
  )?.id || availableRatingSystems[0]?.id;

  const handleFieldTypeChange = (type: ReportFieldType) => {
    const updatedFields = section.fields.map(field => {
      const updated: ReportField = { ...field, type };
      if (type === 'dropdown') {
        if (field.label.toLowerCase().includes('recommendation') || 
            field.label.toLowerCase().includes('verdict')) {
          updated.options = [...STANDARD_SCOUT_VERDICTS];
        } else if (!field.options?.length) {
          updated.options = ['Option 1', 'Option 2', 'Option 3'];
        }
      }
      return updated;
    });

    onUpdateSection({
      ...section,
      fieldType: type,
      fields: updatedFields,
    });
  };

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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`section-optional-${section.id}`}
                  checked={section.optional}
                  onCheckedChange={(checked) => {
                    onUpdateSection({ ...section, optional: !!checked });
                  }}
                />
                <label 
                  htmlFor={`section-optional-${section.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Optional section
                </label>
              </div>

              <div className="flex items-center gap-3">
                {/* Field Type at section level */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Field Type</Label>
                  <Select value={sectionFieldType} onValueChange={(v) => handleFieldTypeChange(v as ReportFieldType)}>
                    <SelectTrigger className="h-7 text-xs w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating" className="text-xs">Rating</SelectItem>
                      <SelectItem value="text" className="text-xs">Text</SelectItem>
                      <SelectItem value="dropdown" className="text-xs">Dropdown</SelectItem>
                      <SelectItem value="checkbox" className="text-xs">Checkbox</SelectItem>
                      <SelectItem value="number" className="text-xs">Number</SelectItem>
                      <SelectItem value="percentage" className="text-xs">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating system - only shown when field type is rating */}
                {sectionFieldType === 'rating' && availableRatingSystems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Rating System</Label>
                    <Select 
                      value={currentRatingSystemId || availableRatingSystems[0]?.id} 
                      onValueChange={handleRatingSystemChange}
                    >
                      <SelectTrigger className="h-7 text-xs w-[160px]">
                        <SelectValue placeholder="Select system" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRatingSystems.map((rs) => (
                          <SelectItem key={rs.id} value={rs.id} className="text-xs">{rs.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <FieldsList
              fields={section.fields}
              editingFieldId={editingFieldId}
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
