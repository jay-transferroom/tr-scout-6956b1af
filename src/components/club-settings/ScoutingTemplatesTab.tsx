import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Copy, Trash2 } from "lucide-react";
import { mockTemplates } from "@/data/mockTemplates";
import { ReportTemplate, DEFAULT_RATING_SYSTEMS, RatingSystem, RatingSystemType } from "@/types/report";
import TemplateSectionEditor from "@/components/TemplateSectionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import RatingOptionsEditor from "@/components/RatingOptionsEditor";

const RATING_SYSTEM_TYPES: { key: RatingSystemType; label: string }[] = [
  { key: 'numeric-1-5', label: 'Numeric (1-5)' },
  { key: 'numeric-1-10', label: 'Numeric (1-10)' },
  { key: 'letter', label: 'Letter Grades' },
  { key: 'custom-tags', label: 'Custom Tags' },
  { key: 'percentage', label: 'Percentage' },
];

const ScoutingTemplatesTab = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(templates[0]?.id || "");
  const [globalRatingSystems, setGlobalRatingSystems] = useState<Record<RatingSystemType, RatingSystem>>({ ...DEFAULT_RATING_SYSTEMS });
  const [editingRatingType, setEditingRatingType] = useState<RatingSystemType | null>(null);

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  // ... keep existing code (all handler functions from TemplateAdmin)
  const handleCreateTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      description: "Description of the new template",
      sections: [],
      defaultRatingSystem: globalRatingSystems['numeric-1-10']
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

  const handleUpdateTemplate = (updatedTemplate: ReportTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const handleSaveChanges = () => {
    console.log("Saving templates:", templates);
    toast({ title: "Changes Saved", description: "Your template and rating system changes have been saved." });
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

  const handleGlobalRatingSystemUpdate = (type: RatingSystemType, ratingSystem: RatingSystem) => {
    setGlobalRatingSystems(prev => ({ ...prev, [type]: ratingSystem }));
  };

  return (
    <div className="space-y-6">
      {/* Rating Systems Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Systems</CardTitle>
          <p className="text-sm text-muted-foreground">Define your rating systems. These can then be applied to any rating field within your templates.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {RATING_SYSTEM_TYPES.map(({ key, label }) => (
              <div key={key} className="border rounded-md">
                <button
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setEditingRatingType(editingRatingType === key ? null : key)}
                >
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{editingRatingType === key ? 'Collapse' : 'Customise'}</span>
                </button>
                {editingRatingType === key && key !== 'percentage' && (
                  <div className="p-4 pt-0 border-t">
                    <RatingOptionsEditor 
                      ratingSystem={globalRatingSystems[key]} 
                      onUpdate={(rs) => handleGlobalRatingSystemUpdate(key, rs)} 
                    />
                  </div>
                )}
                {editingRatingType === key && key === 'percentage' && (
                  <div className="p-4 pt-0 border-t">
                    <p className="text-sm text-muted-foreground">Percentage ratings use a 0-100 scale with no additional configuration needed.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

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
                  {template.name}{template.defaultTemplate ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCreateTemplate} className="gap-1"><Plus size={14} /> New</Button>
          <Button variant="outline" size="sm" onClick={handleCloneTemplate} className="gap-1" disabled={!currentTemplate}><Copy size={14} /> Clone</Button>
          <Button variant="outline" size="sm" onClick={handleDeleteTemplate} className="gap-1 text-destructive hover:text-destructive" disabled={!currentTemplate || templates.length <= 1}><Trash2 size={14} /> Delete</Button>
        </div>
        <Button onClick={handleSaveChanges} className="gap-2">
          <Save size={16} /> Save All Changes
        </Button>
      </div>

      {/* Template editor */}
      {currentTemplate && (
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Input value={currentTemplate.name} onChange={(e) => handleNameChange(e.target.value)} className="text-xl font-bold" />
              <Textarea value={currentTemplate.description} onChange={(e) => handleDescriptionChange(e.target.value)} className="resize-none text-sm text-muted-foreground" />
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="defaultTemplate" checked={!!currentTemplate.defaultTemplate} onChange={(e) => {
                  if (e.target.checked) {
                    const updatedTemplates = templates.map(t => ({ ...t, defaultTemplate: false }));
                    const updatedCurrentTemplate = { ...currentTemplate, defaultTemplate: true };
                    setTemplates(updatedTemplates.map(t => t.id === currentTemplateId ? updatedCurrentTemplate : t));
                  } else {
                    handleUpdateTemplate({ ...currentTemplate, defaultTemplate: false });
                  }
                }} />
                <label htmlFor="defaultTemplate" className="text-sm">Set as default template</label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TemplateSectionEditor sections={currentTemplate.sections} onUpdate={handleUpdateSections} defaultRatingSystem={currentTemplate.defaultRatingSystem} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoutingTemplatesTab;
