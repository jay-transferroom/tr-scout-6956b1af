import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Copy, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { mockTemplates } from "@/data/mockTemplates";
import { ReportTemplate, DEFAULT_RATING_SYSTEMS, RatingSystem, NamedRatingSystem } from "@/types/report";
import TemplateSectionEditor from "@/components/TemplateSectionEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RatingOptionsEditor from "@/components/RatingOptionsEditor";

const createDefaultNamedSystems = (): NamedRatingSystem[] => [
  { id: 'numeric-1-5', name: 'Numeric (1-5)', ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-5'] },
  { id: 'numeric-1-10', name: 'Numeric (1-10)', ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'] },
  { id: 'letter', name: 'Letter Grades', ratingSystem: DEFAULT_RATING_SYSTEMS['letter'] },
  { id: 'custom-tags', name: 'Custom Tags', ratingSystem: DEFAULT_RATING_SYSTEMS['custom-tags'] },
];

const ScoutingTemplatesTab = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(templates[0]?.id || "");
  const [namedRatingSystems, setNamedRatingSystems] = useState<NamedRatingSystem[]>(createDefaultNamedSystems());
  const [expandedRatingId, setExpandedRatingId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const currentTemplate = templates.find(t => t.id === currentTemplateId);

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

  const handleUpdateTemplate = (updatedTemplate: ReportTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const handleSaveChanges = () => {
    console.log("Saving templates:", templates, "Rating systems:", namedRatingSystems);
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

  // Named rating system handlers
  const handleUpdateNamedRatingSystem = (id: string, ratingSystem: RatingSystem) => {
    setNamedRatingSystems(prev => prev.map(rs => rs.id === id ? { ...rs, ratingSystem } : rs));
  };

  const handleRenameRatingSystem = (id: string, name: string) => {
    setNamedRatingSystems(prev => prev.map(rs => rs.id === id ? { ...rs, name } : rs));
  };

  const handleAddRatingSystem = () => {
    const newSystem: NamedRatingSystem = {
      id: `rating-${Date.now()}`,
      name: 'New Rating System',
      ratingSystem: {
        type: 'custom-tags',
        values: [
          { value: "Excellent", color: "#22C55E" },
          { value: "Good", color: "#84CC16" },
          { value: "Average", color: "#EAB308" },
          { value: "Poor", color: "#EF4444" },
        ]
      }
    };
    setNamedRatingSystems(prev => [...prev, newSystem]);
    setExpandedRatingId(newSystem.id);
    setEditingNameId(newSystem.id);
  };

  const handleDeleteRatingSystem = (id: string) => {
    if (namedRatingSystems.length <= 1) {
      toast({ title: "Cannot Delete", description: "You must have at least one rating system.", variant: "destructive" });
      return;
    }
    setNamedRatingSystems(prev => prev.filter(rs => rs.id !== id));
    if (expandedRatingId === id) setExpandedRatingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Rating Systems Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rating Systems</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Define your rating systems. These can be applied to any rating field within your templates.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddRatingSystem} className="gap-1">
              <Plus size={14} /> Add Rating System
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {namedRatingSystems.map((namedSystem) => (
              <div key={namedSystem.id} className="border rounded-md">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 flex-1">
                    {editingNameId === namedSystem.id ? (
                      <Input
                        value={namedSystem.name}
                        onChange={(e) => handleRenameRatingSystem(namedSystem.id, e.target.value)}
                        onBlur={() => setEditingNameId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingNameId(null)}
                        className="h-7 text-sm font-medium max-w-[250px]"
                        autoFocus
                      />
                    ) : (
                      <button
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        onClick={() => setEditingNameId(namedSystem.id)}
                      >
                        <span className="font-medium text-sm">{namedSystem.name}</span>
                        <Pencil size={12} className="text-muted-foreground" />
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {namedSystem.ratingSystem.values.length} options
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRatingSystem(namedSystem.id)}
                      disabled={namedRatingSystems.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setExpandedRatingId(expandedRatingId === namedSystem.id ? null : namedSystem.id)}
                    >
                      {expandedRatingId === namedSystem.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                  </div>
                </div>
                {expandedRatingId === namedSystem.id && (
                  <div className="p-4 pt-0 border-t">
                    <RatingOptionsEditor 
                      ratingSystem={namedSystem.ratingSystem} 
                      onUpdate={(rs) => handleUpdateNamedRatingSystem(namedSystem.id, rs)} 
                    />
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
            <TemplateSectionEditor 
              sections={currentTemplate.sections} 
              onUpdate={handleUpdateSections} 
              defaultRatingSystem={currentTemplate.defaultRatingSystem}
              availableRatingSystems={namedRatingSystems}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoutingTemplatesTab;
