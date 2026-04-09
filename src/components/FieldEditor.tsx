import { ReportField, NamedRatingSystem } from "@/types/report";
import FieldBasicInfo from "@/components/field-editor/FieldBasicInfo";
import FieldTypeSelector from "@/components/field-editor/FieldTypeSelector";
import DropdownOptionsEditor from "@/components/field-editor/DropdownOptionsEditor";
import { STANDARD_SCOUT_VERDICTS } from "@/utils/recommendationHelpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FieldEditorProps {
  field: ReportField;
  onUpdate: (field: ReportField) => void;
  availableRatingSystems?: NamedRatingSystem[];
}

const FieldEditor = ({ field, onUpdate, availableRatingSystems = [] }: FieldEditorProps) => {
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

    if (type === 'rating' && !updatedField.ratingSystem && availableRatingSystems.length > 0) {
      updatedField.ratingSystem = availableRatingSystems[0].ratingSystem;
    }
    
    onUpdate(updatedField);
  };

  const handleRatingSystemSelect = (ratingSystemId: string) => {
    const selected = availableRatingSystems.find(rs => rs.id === ratingSystemId);
    if (selected) {
      onUpdate({
        ...field,
        ratingSystem: { ...selected.ratingSystem }
      });
    }
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

  // Find which named rating system matches the current field's rating system
  // Default to first numeric system if no match (for existing templates with ratings already applied)
  const currentRatingSystemId = availableRatingSystems.find(
    rs => rs.ratingSystem.type === field.ratingSystem?.type
  )?.id || availableRatingSystems.find(
    rs => rs.ratingSystem.type.startsWith('numeric')
  )?.id || availableRatingSystems[0]?.id;

  return (
    <div className="space-y-4">
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
      
      {field.type === 'rating' && availableRatingSystems.length > 0 && (
        <div className="space-y-2 border p-4 rounded">
          <Label>Rating System</Label>
          <Select 
            value={currentRatingSystemId || availableRatingSystems[0]?.id} 
            onValueChange={handleRatingSystemSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating system" />
            </SelectTrigger>
            <SelectContent>
              {availableRatingSystems.map((rs) => (
                <SelectItem key={rs.id} value={rs.id}>{rs.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Rating systems are configured in the Rating Systems section above
          </p>
        </div>
      )}
    </div>
  );
};

export default FieldEditor;
