
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Scout {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface ScoutSelectionFormProps {
  allScoutOptions: Scout[];
  existingAssignments?: Scout[];
  isOpen: boolean;
  onSubmit: (formData: {
    selectedScout: string;
    priority: "High" | "Medium" | "Low";
    reportType: string;
    deadline?: Date;
    notes: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ScoutSelectionForm = ({ 
  allScoutOptions, 
  existingAssignments = [],
  isOpen, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: ScoutSelectionFormProps) => {
  const [selectedScout, setSelectedScout] = useState<string>("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [reportType, setReportType] = useState("Standard");
  const [deadline, setDeadline] = useState<Date>();
  const [notes, setNotes] = useState("");

  // Reset form for new assignment when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Always reset form since we're adding scouts, not reassigning
      setSelectedScout("");
      setPriority("Medium");
      setReportType("Standard");
      setDeadline(undefined);
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedScout) return;
    
    onSubmit({
      selectedScout,
      priority,
      reportType,
      deadline,
      notes
    });

    // Reset form
    setSelectedScout("");
    setPriority("Medium");
    setReportType("Standard");
    setDeadline(undefined);
    setNotes("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scout">
          Assign to Scout
        </Label>
        <Select value={selectedScout} onValueChange={setSelectedScout}>
          <SelectTrigger>
            <SelectValue placeholder="Select a scout" />
          </SelectTrigger>
          <SelectContent>
            {allScoutOptions.map((scout) => (
              <SelectItem key={scout.id} value={scout.id}>
                {scout.first_name} {scout.last_name} ({scout.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value: "High" | "Medium" | "Low") => setPriority(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Detailed">Detailed</SelectItem>
              <SelectItem value="Quick">Quick</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deadline (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, "PPP") : "Select deadline"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Assignment Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add specific instructions or context for the scout..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={!selectedScout || isSubmitting}
        >
          {isSubmitting ? "Assigning..." : "Assign Scout"}
        </Button>
      </div>
    </div>
  );
};

export default ScoutSelectionForm;
