import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Copy, Trash2, Undo2 } from "lucide-react";
import { mockTemplates } from "@/data/mockTemplates";
import { ReportTemplate, NamedRatingSystem } from "@/types/report";
import TemplateSectionEditor from "@/components/TemplateSectionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScoutingTemplatesTabProps {
  availableRatingSystems: NamedRatingSystem[];
}

const ScoutingTemplatesTab = ({ availableRatingSystems }: ScoutingTemplatesTabProps) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(templates[0]?.id || "");
  const savedSnapshotRef = useRef<string>(JSON.stringify(mockTemplates));

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  const hasChanges = useMemo(() => {
    return JSON.stringify(templates) !== savedSnapshotRef.current;
  }, [templates]);

  const handleCreateTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      description: "Description of the new template",
      sections: [],
    };
    setTemplates([...templates, newTemplate]);
    setCurrentTemplateId(newTemplate.id);
  };

  const handleCloneTemplate = () => {
    if (!currentTemplate) return;
    const clonedTemplate: ReportTemplate = {
      ...currentTemplate,
      id: `template-${Date.now()}`,
      name: `${currentTemplate.name} (Copy)`,
      defaultTemplate: false
    };
    setTemplates([...templates, clonedTemplate]);
    setCurrentTemplateId(clonedTemplate.id);
  };

  const handleDeleteTemplate = () => {
    if (!currentTemplate) return;
    if (templates.length === 1) {
      toast({ title: "Cannot Delete", description: "You must have at least one template.", variant: "destructive" });
      return;
    }
    const updatedTemplates = templates.filter(t => t.id !== currentTemplateId);
    setTemplates(updatedTemplates);
    setCurrentTemplateId(updatedTemplates[0].id);
  };

  const handleUpdateTemplate = useCallback((updatedTemplate: ReportTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  }, []);

  const handleSaveChanges = () => {
    console.log("Saving templates:", templates);
    savedSnapshotRef.current = JSON.stringify(templates);
    setTemplates([...templates]); // trigger re-render for hasChanges
    toast({ title: "Changes Saved", description: "Your template changes have been saved." });
  };

  const handleClearChanges = () => {
    const restored = JSON.parse(savedSnapshotRef.current) as ReportTemplate[];
    setTemplates(restored);
    setCurrentTemplateId(restored[0]?.id || "");
  };

  const handleNameChange = (name: string) => {
    if (!currentTemplate) return;
    handleUpdateTemplate({ ...currentTemplate, name });
  };

  const handleDescriptionChange = (description: string) => {
    if (!currentTemplate) return;
    handleUpdateTemplate({ ...currentTemplate, description });
  };

  const handleUpdateSections = (sections: any) => {
    if (!currentTemplate) return;
    handleUpdateTemplate({ ...currentTemplate, sections });
  };

  return (
    <div className="space-y-6">
      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={currentTemplateId} onValueChange={setCurrentTemplateId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCreateTemplate} className="gap-1"><Plus size={14} /> New</Button>
          <Button variant="outline" size="sm" onClick={handleCloneTemplate} className="gap-1" disabled={!currentTemplate}><Copy size={14} /> Clone</Button>
          <Button variant="outline" size="sm" onClick={handleDeleteTemplate} className="gap-1 text-destructive hover:text-destructive" disabled={!currentTemplate || templates.length <= 1}><Trash2 size={14} /> Delete</Button>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleClearChanges} className="gap-1 text-muted-foreground">
              <Undo2 size={14} /> Clear changes
            </Button>
          )}
          <Button onClick={handleSaveChanges} className="gap-2" disabled={!hasChanges}>
            <Save size={16} /> Save All Changes
          </Button>
        </div>
      </div>

      {/* Template editor */}
      {currentTemplate && (
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Input value={currentTemplate.name} onChange={(e) => handleNameChange(e.target.value)} className="text-xl font-bold" />
              <Textarea value={currentTemplate.description} onChange={(e) => handleDescriptionChange(e.target.value)} className="resize-none text-sm text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <TemplateSectionEditor 
              sections={currentTemplate.sections} 
              onUpdate={handleUpdateSections} 
              defaultRatingSystem={currentTemplate.defaultRatingSystem}
              availableRatingSystems={availableRatingSystems}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoutingTemplatesTab;
