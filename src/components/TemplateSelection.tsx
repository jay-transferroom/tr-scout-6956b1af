
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportTemplate } from "@/types/report";
import { Player } from "@/types/player";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mockTemplates } from "@/data/mockTemplates";

interface TemplateSelectionProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (player: Player, template: ReportTemplate) => void;
}

const TemplateSelection = ({ player, isOpen, onClose, onSelectTemplate }: TemplateSelectionProps) => {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    mockTemplates.find(t => t.defaultTemplate)?.id || null
  );

  const handleSelectTemplate = () => {
    const template = mockTemplates.find(t => t.id === selectedTemplateId);
    if (template && player) {
      // Check if this is a match template
      if (template.isMatchTemplate) {
        // Redirect to match scouting page
        navigate("/match-scouting", {
          state: {
            selectedTemplate: template.originalMatchTemplate,
            player
          }
        });
        return;
      }
      
      onSelectTemplate(player, template);
      
      // Navigate to the report builder page with player and template data
      navigate("/report-builder", {
        state: {
          player,
          template
        }
      });
    }
  };

  // Don't render if player is null
  if (!player) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Report Template</DialogTitle>
          <DialogDescription>
            Choose a template to create a report for {player.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mockTemplates.map((template) => (
            <div 
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedTemplateId === template.id ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div className="h-4 w-4 rounded-full border flex items-center justify-center">
                  {selectedTemplateId === template.id && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-sm text-muted-foreground">
                <p>
                  {template.sections.length} sections • {template.sections.reduce((acc, section) => acc + section.fields.length, 0)} fields
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectTemplate} disabled={!selectedTemplateId || !player}>
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelection;
