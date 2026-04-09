
import { useState } from "react";
import { ReportField } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldEditor from "@/components/FieldEditor";
import { Badge } from "@/components/ui/badge";
import AddFieldDialog from "@/components/AddFieldDialog";

interface FieldsListProps {
  fields: ReportField[];
  editingFieldId: string | null;
  onAddField: (types: Array<"rating" | "text">) => void;
  onDeleteField: (fieldId: string) => void;
  onUpdateField: (field: ReportField) => void;
  onSetEditingField: (fieldId: string | null) => void;
  onMoveField?: (fromIndex: number, toIndex: number) => void;
  readOnly?: boolean;
}

const FieldsList = ({
  fields,
  editingFieldId,
  onAddField,
  onDeleteField,
  onUpdateField,
  onSetEditingField,
  onMoveField,
  readOnly = false
}: FieldsListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subsections</div>
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1 h-7 text-xs"
            >
              <Plus size={14} />
              Add Subsection
            </Button>
            <AddFieldDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onConfirm={onAddField}
            />
          </>
        )}
      </div>
      
      <div className="space-y-1">
        {fields.map((field, index) => {
          const isEditing = editingFieldId === field.id;

          return (
            <div 
              key={field.id}
              draggable={!readOnly && !!onMoveField}
              onDragStart={readOnly ? undefined : (e) => {
                e.stopPropagation();
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={readOnly ? undefined : (e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIndex(index);
              }}
              onDrop={readOnly ? undefined : (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (draggedIndex !== null && draggedIndex !== index && onMoveField) {
                  onMoveField(draggedIndex, index);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={readOnly ? undefined : () => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={cn(
                "rounded-md transition-colors",
                isEditing && !readOnly ? "bg-muted/50 p-3" : "hover:bg-muted/30",
                draggedIndex === index && "opacity-50",
                dragOverIndex === index && draggedIndex !== index && "border-t-2 border-primary"
              )}
            >
              <div className={cn(
                "flex items-center justify-between",
                !isEditing && "px-3 py-2"
              )}>
                <div className="flex items-center gap-2">
                  {!readOnly && onMoveField && (
                    <div className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded">
                      <GripVertical size={14} className="text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{field.label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-blue-950/10 text-blue-900 dark:bg-blue-400/10 dark:text-blue-300">
                    {field.type}
                  </Badge>
                  {field.required && (
                    <span className="text-[10px] text-muted-foreground">Required</span>
                  )}
                </div>
                
                {!readOnly && (
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
                )}
              </div>
              
              {isEditing && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-3">
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
