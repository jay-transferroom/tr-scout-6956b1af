
import { ReportSection, ReportField, NamedRatingSystem } from "@/types/report";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card 
      className={cn(
        "border",
        isExpanded ? "border-primary/50" : "",
        isDragged ? "opacity-50" : ""
      )}
    >
      <CardHeader>
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
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
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
                className="text-sm"
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
        </CardContent>
      )}
    </Card>
  );
};

export default SectionCard;
