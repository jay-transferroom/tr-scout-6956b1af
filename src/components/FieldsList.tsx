
import { ReportField, NamedRatingSystem } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Plus, File, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldEditor from "@/components/FieldEditor";

interface FieldsListProps {
  fields: ReportField[];
  editingFieldId: string | null;
  availableRatingSystems?: NamedRatingSystem[];
  onAddField: () => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (field: ReportField) => void;
  onSetEditingField: (fieldId: string | null) => void;
}

const FieldsList = ({
  fields,
  editingFieldId,
  availableRatingSystems,
  onAddField,
  onDeleteField,
  onUpdateField,
  onSetEditingField
}: FieldsListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Fields</div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddField}
          className="gap-1"
        >
          <Plus size={16} />
          Add Field
        </Button>
      </div>
      
      <div className="space-y-2">
        {fields.map((field) => (
          <div 
            key={field.id}
            className={cn(
              "border rounded-md p-3 bg-card",
              editingFieldId === field.id ? "border-primary/50" : ""
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File size={16} className="text-muted-foreground" />
                <div>
                  <div className="font-medium">{field.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Type: {field.type}
                    {field.required && " • Required"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 p-0 px-2"
                  onClick={() => onSetEditingField(
                    editingFieldId === field.id ? null : field.id
                  )}
                >
                  {editingFieldId === field.id ? "Done" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteField(field.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            {editingFieldId === field.id && (
              <div className="mt-3 pt-3 border-t">
                <FieldEditor
                  field={field}
                  onUpdate={onUpdateField}
                  availableRatingSystems={availableRatingSystems}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldsList;
