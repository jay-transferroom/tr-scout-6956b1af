import { ReportField, RatingSystem, RatingSystemType, DEFAULT_RATING_SYSTEMS } from "@/types/report";
import FieldBasicInfo from "@/components/field-editor/FieldBasicInfo";
import FieldTypeSelector from "@/components/field-editor/FieldTypeSelector";
import DropdownOptionsEditor from "@/components/field-editor/DropdownOptionsEditor";
import { STANDARD_SCOUT_VERDICTS } from "@/utils/recommendationHelpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FieldEditorProps {
  field: ReportField;
  onUpdate: (field: ReportField) => void;
}

const RATING_SYSTEM_LABELS: Record<RatingSystemType, string> = {
  'numeric-1-5': 'Numeric (1-5)',
  'numeric-1-10': 'Numeric (1-10)',
  'letter': 'Letter Grades',
  'custom-tags': 'Custom Tags',
  'percentage': 'Percentage',
};

const FieldEditor = ({ field, onUpdate }: FieldEditorProps) => {
  const handleFieldTypeChange = (type: string) => {
    let updatedField = { ...field, type: type as any };
    
    // Set default options for specific field types
    if (type === 'dropdown') {
      if (field.label.toLowerCase().includes('recommendation') || 
          field.label.toLowerCase().includes('verdict') ||
          field.label.toLowerCase().includes('decision')) {
        updatedField.options = [...STANDARD_SCOUT_VERDICTS];
      } else {
        updatedField.options = ['Option 1', 'Option 2', 'Option 3'];
      }
    }

    // Set default rating system when switching to rating type
    if (type === 'rating' && !updatedField.ratingSystem) {
      updatedField.ratingSystem = DEFAULT_RATING_SYSTEMS['numeric-1-10'];
    }
    
    onUpdate(updatedField);
  };

  const handleRatingSystemTypeChange = (ratingType: RatingSystemType) => {
    onUpdate({
      ...field,
      ratingSystem: DEFAULT_RATING_SYSTEMS[ratingType]
    });
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
    onUpdate({
      ...field,
      options: updatedOptions
    });
  };

  const handleRemoveDropdownOption = (index: number) => {
    const currentOptions = (field.options as string[]) || [];
    onUpdate({
      ...field,
      options: currentOptions.filter((_, i) => i !== index)
    });
  };

  const handleUseScoutVerdicts = () => {
    onUpdate({
      ...field,
      options: [...STANDARD_SCOUT_VERDICTS]
    });
  };

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
      
      {field.type === 'rating' && (
        <div className="space-y-2 border p-4 rounded">
          <Label>Rating System</Label>
          <Select 
            value={field.ratingSystem?.type || "numeric-1-10"} 
            onValueChange={(value) => handleRatingSystemTypeChange(value as RatingSystemType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating system" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RATING_SYSTEM_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Rating options are configured in the Global Rating System above
          </p>
        </div>
      )}
    </div>
  );
};

export default FieldEditor;
