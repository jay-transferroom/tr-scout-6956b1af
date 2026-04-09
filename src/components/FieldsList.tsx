
import { ReportField } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldEditor from "@/components/FieldEditor";
import { Badge } from "@/components/ui/badge";

interface FieldsListProps {
  fields: ReportField[];
  editingFieldId: string | null;
  onAddField: () => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (field: ReportField) => void;
  onSetEditingField: (fieldId: string | null) => void;
}

const FieldsList = ({
  fields,
  editingFieldId,
  onAddField,
  onDeleteField,
  onUpdateField,
  onSetEditingField
}: FieldsListProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fields</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddField}
          className="gap-1 h-7 text-xs"
        >
          <Plus size={14} />
          Add Field
        </Button>
      </div>
      
      <div className="space-y-1">
        {fields.map((field) => {
          const isEditing = editingFieldId === field.id;
          return (
            <div 
              key={field.id}
              className={cn(
                "rounded-md transition-colors",
                isEditing ? "bg-muted/50 p-3" : "hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex items-center justify-between",
                !isEditing && "px-3 py-2"
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    {field.type}
                  </Badge>
                  {field.required && (
                    <span className="text-[10px] text-muted-foreground">Required</span>
                  )}
                </div>
                
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => onSetEditingField(isEditing ? null : field.id)}
                  >
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteField(field.id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <FieldEditor
                    field={field}
                    onUpdate={onUpdateField}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FieldsList;
