import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Save } from "lucide-react";
import { DEFAULT_RATING_SYSTEMS, RatingSystem, NamedRatingSystem } from "@/types/report";
import RatingOptionsEditor from "@/components/RatingOptionsEditor";

export const createDefaultNamedSystems = (): NamedRatingSystem[] => [
  { id: 'numeric-1-5', name: 'Numeric (1-5)', ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-5'] },
  { id: 'numeric-1-10', name: 'Numeric (1-10)', ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'] },
  { id: 'letter', name: 'Letter Grades', ratingSystem: DEFAULT_RATING_SYSTEMS['letter'] },
  { id: 'custom-tags', name: 'Custom Tags', ratingSystem: DEFAULT_RATING_SYSTEMS['custom-tags'] },
];

interface RatingSystemsTabProps {
  namedRatingSystems: NamedRatingSystem[];
  onUpdate: (systems: NamedRatingSystem[]) => void;
}

const RatingSystemsTab = ({ namedRatingSystems, onUpdate }: RatingSystemsTabProps) => {
  const [expandedRatingId, setExpandedRatingId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const handleUpdateRatingSystem = (id: string, ratingSystem: RatingSystem) => {
    onUpdate(namedRatingSystems.map(rs => rs.id === id ? { ...rs, ratingSystem } : rs));
  };

  const handleRename = (id: string, name: string) => {
    onUpdate(namedRatingSystems.map(rs => rs.id === id ? { ...rs, name } : rs));
  };

  const handleAdd = () => {
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
    onUpdate([...namedRatingSystems, newSystem]);
    setExpandedRatingId(newSystem.id);
    setEditingNameId(newSystem.id);
  };

  const handleDelete = (id: string) => {
    if (namedRatingSystems.length <= 1) {
      toast({ title: "Cannot Delete", description: "You must have at least one rating system.", variant: "destructive" });
      return;
    }
    onUpdate(namedRatingSystems.filter(rs => rs.id !== id));
    if (expandedRatingId === id) setExpandedRatingId(null);
  };

  const handleSave = () => {
    console.log("Saving rating systems:", namedRatingSystems);
    toast({ title: "Changes Saved", description: "Your rating systems have been saved." });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rating Systems</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Define your rating systems. These can be applied to any rating field within your scouting templates.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1">
                <Plus size={14} /> Add Rating System
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Save size={14} /> Save
              </Button>
            </div>
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
                        onChange={(e) => handleRename(namedSystem.id, e.target.value)}
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
                      onClick={() => handleDelete(namedSystem.id)}
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
                      onUpdate={(rs) => handleUpdateRatingSystem(namedSystem.id, rs)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingSystemsTab;
