
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FieldBasicInfoProps {
  label: string;
  description: string;
  required: boolean;
  onLabelChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRequiredChange: (value: boolean) => void;
}

const FieldBasicInfo = ({
  label,
  description,
  required,
  onLabelChange,
  onDescriptionChange,
  onRequiredChange
}: FieldBasicInfoProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="field-label">Field Label</Label>
        <Input
          id="field-label"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="field-description">Description (Optional)</Label>
        <Textarea
          id="field-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="resize-none"
          placeholder="Help text to explain this field"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="field-required"
          checked={required}
          onCheckedChange={(checked) => onRequiredChange(!!checked)}
        />
        <label htmlFor="field-required" className="text-sm">Required subsection</label>
      </div>
    </>
  );
};

export default FieldBasicInfo;
