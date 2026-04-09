import { ReportField } from "@/types/report";
import FieldBasicInfo from "@/components/field-editor/FieldBasicInfo";
import FieldTypeSelector from "@/components/field-editor/FieldTypeSelector";
import DropdownOptionsEditor from "@/components/field-editor/DropdownOptionsEditor";
import { STANDARD_SCOUT_VERDICTS } from "@/utils/recommendationHelpers";

interface FieldEditorProps {
  field: ReportField;
  onUpdate: (field: ReportField) => void;
}

const FieldEditor = ({ field, onUpdate }: FieldEditorProps) => {
  const handleFieldTypeChange = (type: string) => {
    let updatedField = { ...field, type: type as any };
    
    if (type === 'dropdown') {
      if (field.label.toLowerCase().includes('recommendation') || 
          field.label.toLowerCase().includes('verdict') ||
          field.label.toLowerCase().includes('decision')) {
        updatedField.options = [...STANDARD_SCOUT_VERDICTS];
      } else {
        updatedField.options = ['Option 1', 'Option 2', 'Option 3'];
      }
    }
    
    onUpdate(updatedField);
  };

  const handleAddDropdownOption = () => {
    const currentOptions = (field.options as string[]) || [];
    onUpdate({
      ...field,
      options: [...currentOptions, `Option ${currentOptions.length + 1}`]
    });
  };

  const handleUpdateDropdownOption = (index: number, value: string) => {
    const currentOptions = (field.options as string[]) || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = value;
    onUpdate({ ...field, options: updatedOptions });
  };

  const handleRemoveDropdownOption = (index: number) => {
    const currentOptions = (field.options as string[]) || [];
    onUpdate({ ...field, options: currentOptions.filter((_, i) => i !== index) });
  };

  const handleUseScoutVerdicts = () => {
    onUpdate({ ...field, options: [...STANDARD_SCOUT_VERDICTS] });
  };

  return (
    <div className="space-y-3">
      <FieldBasicInfo
        label={field.label}
        description={field.description || ""}
        required={field.required || false}
        onLabelChange={(value) => onUpdate({ ...field, label: value })}
        onDescriptionChange={(value) => onUpdate({ ...field, description: value })}
        onRequiredChange={(value) => onUpdate({ ...field, required: value })}
      />
      
      <FieldTypeSelector
        value={field.type}
        onChange={handleFieldTypeChange}
      />
      
      {field.type === 'dropdown' && (
        <DropdownOptionsEditor
          options={(field.options as string[]) || []}
          onAddOption={handleAddDropdownOption}
          onUpdateOption={handleUpdateDropdownOption}
          onRemoveOption={handleRemoveDropdownOption}
          onUseScoutRecommendations={handleUseScoutVerdicts}
        />
      )}
    </div>
  );
};

export default FieldEditor;
