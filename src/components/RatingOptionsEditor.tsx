
import { useState } from "react";
import { RatingSystem, RatingOption } from "@/types/report";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RatingOptionsEditorProps {
  ratingSystem: RatingSystem;
  onUpdate: (ratingSystem: RatingSystem) => void;
}

const RatingOptionsEditor = ({ ratingSystem, onUpdate }: RatingOptionsEditorProps) => {
  const isNumeric = ratingSystem.type.startsWith('numeric');
  const isLetter = ratingSystem.type === 'letter';
  const isCustomTag = ratingSystem.type === 'custom-tags';

  const handleUpdateOption = (index: number, field: string, value: string) => {
    const updatedValues = [...ratingSystem.values];
    updatedValues[index] = {
      ...updatedValues[index],
      [field]: field === "value" && isNumeric ? Number(value) : value
    };
    
    onUpdate({
      ...ratingSystem,
      values: updatedValues
    });
  };

  const handleDeleteOption = (index: number) => {
    // Don't allow deleting if we have minimum options
    if (isNumeric && ratingSystem.values.length <= 2) return;
    if ((isLetter || isCustomTag) && ratingSystem.values.length <= 1) return;
    
    const updatedValues = ratingSystem.values.filter((_, i) => i !== index);
    onUpdate({
      ...ratingSystem,
      values: updatedValues
    });
  };

  const handleAddOption = () => {
    let newValue: RatingOption;
    
    if (isNumeric) {
      const highest = Math.max(...ratingSystem.values.map(v => Number(v.value)));
      newValue = {
        value: highest + 1,
        label: `${highest + 1}`,
        description: "",
        color: "#8B5CF6" // Default color
      };
    } else if (isLetter) {
      newValue = {
        value: "X",
        label: "New Grade",
        description: "",
        color: "#8B5CF6" // Default color
      };
    } else {
      newValue = {
        value: "New Tag",
        description: "",
        color: "#8B5CF6" // Default color
      };
    }
    
    onUpdate({
      ...ratingSystem,
      values: [...ratingSystem.values, newValue]
    });
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Rating Options</div>
      
      <div className="space-y-1.5">
        {ratingSystem.values.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type={isNumeric ? "number" : "text"}
              value={option.value.toString()}
              onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
              disabled={isNumeric}
              className="w-20 h-8 text-sm"
            />
            <Input
              value={option.description || ""}
              onChange={(e) => handleUpdateOption(index, "description", e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 h-8 text-sm"
            />
            <label className="relative cursor-pointer block w-7 h-7 shrink-0">
              <div 
                className="w-7 h-7 rounded border border-border" 
                style={{ backgroundColor: option.color || "#000000" }}
              />
              <input
                type="color"
                value={option.color || "#000000"}
                onChange={(e) => handleUpdateOption(index, "color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 h-7 w-7 shrink-0 ${
                (isNumeric && ratingSystem.values.length <= 2) || 
                ((isLetter || isCustomTag) && ratingSystem.values.length <= 1)
                  ? "opacity-50 cursor-not-allowed"
                  : "text-destructive hover:text-destructive"
              }`}
              onClick={() => handleDeleteOption(index)}
              disabled={(isNumeric && ratingSystem.values.length <= 2) || 
                       ((isLetter || isCustomTag) && ratingSystem.values.length <= 1)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={handleAddOption}
      >
        <Plus size={14} className="mr-1" />
        Add Rating Option
      </Button>
    </div>
  );
};

export default RatingOptionsEditor;
