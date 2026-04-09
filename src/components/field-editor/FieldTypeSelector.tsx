
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface FieldTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FieldTypeSelector = ({ value, onChange }: FieldTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="field-type">Field Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Rating</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="dropdown">Dropdown</SelectItem>
          <SelectItem value="checkbox">Checkbox</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="percentage">Percentage</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FieldTypeSelector;
