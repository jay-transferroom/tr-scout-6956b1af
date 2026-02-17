import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Copy, Trash2, Settings } from "lucide-react";
import { mockTemplates } from "@/data/mockTemplates";
import { ReportTemplate, DEFAULT_RATING_SYSTEMS, RatingSystem, RatingSystemType } from "@/types/report";
import TemplateSectionEditor from "@/components/TemplateSectionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import RatingOptionsEditor from "@/components/RatingOptionsEditor";

const ScoutingTemplatesTab = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(templates[0]?.id || "");
  const [globalRatingSystem, setGlobalRatingSystem] = useState<RatingSystem>(DEFAULT_RATING_SYSTEMS["numeric-1-10"]);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

  // ... keep existing code (all handler functions from TemplateAdmin)
  const handleCreateTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: "New Template",
      description: "Description of the new template",
      sections: [],
      defaultRatingSystem: globalRatingSystem
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

  const handleGlobalRatingSystemTypeChange = (ratingType: RatingSystemType) => {
    const newRatingSystem = DEFAULT_RATING_SYSTEMS[ratingType];
    setGlobalRatingSystem(newRatingSystem);
    if (confirm("Do you want to apply this rating system to all templates?")) {
      applyGlobalRatingSystemToAllTemplates(newRatingSystem);
    }
  };

  const handleGlobalRatingSystemUpdate = (ratingSystem: RatingSystem) => {
    setGlobalRatingSystem(ratingSystem);
    if (confirm("Do you want to apply this rating system to all templates?")) {
      applyGlobalRatingSystemToAllTemplates(ratingSystem);
    }
  };

  const applyGlobalRatingSystemToAllTemplates = (ratingSystem: RatingSystem) => {
    const updatedTemplates = templates.map(template => {
      const updatedTemplate = { ...template, defaultRatingSystem: { ...ratingSystem } };
      if (updatedTemplate.sections.length > 0) {
        updatedTemplate.sections = updatedTemplate.sections.map(section => ({
          ...section,
          fields: section.fields.map(field => field.type === 'rating' ? { ...field, ratingSystem: { ...ratingSystem } } : field)
        }));
      }
      return updatedTemplate;
    });
    setTemplates(updatedTemplates);
    toast({ title: "Rating System Updated", description: "Global rating system applied to all templates and their rating fields." });
  };

  const handleDefaultRatingSystemTypeChange = (ratingType: RatingSystemType) => {
    if (!currentTemplate) return;
    const newRatingSystem = DEFAULT_RATING_SYSTEMS[ratingType];
    const updatedTemplate = { ...currentTemplate, defaultRatingSystem: newRatingSystem };
    if (updatedTemplate.sections.length > 0) {
      updatedTemplate.sections = updatedTemplate.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => field.type === 'rating' ? { ...field, ratingSystem: { ...newRatingSystem } } : field)
      }));
    }
    handleUpdateTemplate(updatedTemplate);
    toast({ title: "Rating System Updated", description: "Rating system updated and applied to all rating fields in this template." });
  };

  const handleDefaultRatingSystemUpdate = (ratingSystem: RatingSystem) => {
    if (!currentTemplate) return;
    const updatedTemplate = { ...currentTemplate, defaultRatingSystem: ratingSystem };
    if (updatedTemplate.sections.length > 0) {
      updatedTemplate.sections = updatedTemplate.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => field.type === 'rating' ? { ...field, ratingSystem: { ...ratingSystem } } : field)
      }));
    }
    handleUpdateTemplate(updatedTemplate);
    toast({ title: "Rating System Updated", description: "Rating system updated and applied to all rating fields in this template." });
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
                  {template.name}{template.defaultTemplate ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleCreateTemplate} className="gap-1"><Plus size={14} /> New</Button>
          <Button variant="outline" size="sm" onClick={handleCloneTemplate} className="gap-1" disabled={!currentTemplate}><Copy size={14} /> Clone</Button>
          <Button variant="outline" size="sm" onClick={handleDeleteTemplate} className="gap-1 text-destructive hover:text-destructive" disabled={!currentTemplate || templates.length <= 1}><Trash2 size={14} /> Delete</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGlobalSettings(!showGlobalSettings)} className="gap-2">
            <Settings size={16} />
            {showGlobalSettings ? "Hide Global Settings" : "Global Settings"}
          </Button>
          <Button onClick={handleSaveChanges} className="gap-2">
            <Save size={16} /> Save All Changes
          </Button>
        </div>
      </div>

      {/* Global Rating System */}
      {showGlobalSettings && (
        <Card>
          <CardHeader><CardTitle>Global Rating System</CardTitle><p className="text-sm text-muted-foreground">Configure the default rating system used across all templates</p></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="global-rating-system">Rating System Type</Label>
                <Select value={globalRatingSystem?.type || "numeric-1-10"} onValueChange={(value) => handleGlobalRatingSystemTypeChange(value as RatingSystemType)}>
                  <SelectTrigger id="global-rating-system"><SelectValue placeholder="Select rating system" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric-1-5">Numeric (1-5)</SelectItem>
                    <SelectItem value="numeric-1-10">Numeric (1-10)</SelectItem>
                    <SelectItem value="letter">Letter Grades</SelectItem>
                    <SelectItem value="custom-tags">Custom Tags</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {globalRatingSystem && globalRatingSystem.type !== "percentage" && (
                <div className="border p-4 rounded-md">
                  <RatingOptionsEditor ratingSystem={globalRatingSystem} onUpdate={handleGlobalRatingSystemUpdate} />
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => applyGlobalRatingSystemToAllTemplates(globalRatingSystem)} className="gap-2">Apply To All Templates</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Tabs defaultValue="sections" className="w-full">
              <TabsList>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="settings">Rating System</TabsTrigger>
              </TabsList>
              <TabsContent value="sections" className="space-y-4 pt-4">
                <TemplateSectionEditor sections={currentTemplate.sections} onUpdate={handleUpdateSections} defaultRatingSystem={currentTemplate.defaultRatingSystem} />
              </TabsContent>
              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="defaultTemplate" checked={!!currentTemplate.defaultTemplate} onChange={(e) => {
                      if (e.target.checked) {
                        const updatedTemplates = templates.map(t => ({ ...t, defaultTemplate: false }));
                        const updatedCurrentTemplate = { ...currentTemplate, defaultTemplate: true };
                        setTemplates(updatedTemplates.map(t => t.id === currentTemplateId ? updatedCurrentTemplate : t));
                      } else {
                        handleUpdateTemplate({ ...currentTemplate, defaultTemplate: false });
                      }
                    }} />
                    <label htmlFor="defaultTemplate">Set as default template</label>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Template Rating System</h3>
                    <p className="text-sm text-muted-foreground">Set the rating system used for all ratings in this template</p>
                    <div className="space-y-2">
                      <Label htmlFor="rating-system">Rating System Type</Label>
                      <Select value={currentTemplate.defaultRatingSystem?.type || "numeric-1-10"} onValueChange={(value) => handleDefaultRatingSystemTypeChange(value as RatingSystemType)}>
                        <SelectTrigger id="default-rating-system"><SelectValue placeholder="Select rating system" /></SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="numeric-1-5">Numeric (1-5)</SelectItem>
                          <SelectItem value="numeric-1-10">Numeric (1-10)</SelectItem>
                          <SelectItem value="letter">Letter Grades</SelectItem>
                          <SelectItem value="custom-tags">Custom Tags</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Button variant="outline" onClick={() => {
                        if (globalRatingSystem && confirm("Use global rating system for this template?")) {
                          handleDefaultRatingSystemUpdate(globalRatingSystem);
                        }
                      }}>Use Global Rating System</Button>
                    </div>
                    {currentTemplate.defaultRatingSystem && currentTemplate.defaultRatingSystem.type !== "percentage" && (
                      <div className="border p-4 rounded-md">
                        <RatingOptionsEditor ratingSystem={currentTemplate.defaultRatingSystem} onUpdate={handleDefaultRatingSystemUpdate} />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoutingTemplatesTab;
