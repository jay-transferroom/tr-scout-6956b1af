import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Trash2, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  usePipelineColumns,
  type PipelineColumn,
  type PipelineRule,
  type RuleTrigger,
} from "@/hooks/usePipelineColumns";

const TRIGGER_OPTIONS: { value: RuleTrigger; label: string }[] = [
  { value: "data_report_submitted", label: "When data report submitted" },
  { value: "video_report_submitted", label: "When video report submitted" },
  { value: "manually_assigned", label: "When manually assigned" },
];

interface ReferenceWorkflow {
  id: string;
  clubName: string;
  stages: string[];
}

const REFERENCE_WORKFLOWS: ReferenceWorkflow[] = [
  {
    id: "kuopion",
    clubName: "Kuopion",
    stages: [
      "WhatsApp Intake",
      "Data Vetting",
      "Video Scout",
      "Live Scout",
      "Manager Review",
      "Decision",
    ],
  },
];

const PipelineTab = () => {
  const [columns, setColumns] = usePipelineColumns();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [rulesColumnId, setRulesColumnId] = useState<string | null>(null);
  const [draftRules, setDraftRules] = useState<PipelineRule[]>([]);

  const handleLoadReference = (id: string) => {
    const workflow = REFERENCE_WORKFLOWS.find((w) => w.id === id);
    if (!workflow) return;
    const now = Date.now();
    setColumns(
      workflow.stages.map((name, i) => ({
        id: `col-${now}-${i}`,
        name,
        rules: [],
      }))
    );
    // Active club name mirrors the value rendered by <ClubBadge> in the header ("Chelsea F.C.").
    const activeClubName = "Chelsea";
    toast.success(`Reference workflow loaded into ${activeClubName}'s pipeline`);
  };

  const handleNameChange = (id: string, name: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleDelete = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    setColumns((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, name: "New column", rules: [] },
    ]);
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    setColumns((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const openRules = (col: PipelineColumn) => {
    setRulesColumnId(col.id);
    setDraftRules(col.rules.map((r) => ({ ...r })));
  };

  const closeRules = () => {
    setRulesColumnId(null);
    setDraftRules([]);
  };

  const addDraftRule = () => {
    setDraftRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        trigger: "data_report_submitted",
        destinationColumnId: null,
      },
    ]);
  };

  const updateDraftRule = (id: string, patch: Partial<PipelineRule>) => {
    setDraftRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeDraftRule = (id: string) => {
    setDraftRules((prev) => prev.filter((r) => r.id !== id));
  };

  const saveRules = () => {
    if (!rulesColumnId) return;
    const incomplete = draftRules.some((r) => !r.destinationColumnId);
    if (incomplete) {
      toast.error("Select a destination column for every rule");
      return;
    }
    setColumns((prev) =>
      prev.map((c) =>
        c.id === rulesColumnId ? { ...c, rules: draftRules } : c
      )
    );
    toast.success("Rules saved");
    closeRules();
  };

  const activeColumn = columns.find((c) => c.id === rulesColumnId) || null;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Pipeline columns</h2>
        <p className="text-sm text-muted-foreground">
          Configure the columns players move through. Drag to reorder.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 rounded-md border bg-muted/30 px-3 py-3">
        <div>
          <div className="text-sm font-medium">Load reference workflow</div>
          <div className="text-xs text-muted-foreground">Reference customer workflow</div>
        </div>
        <Select value="" onValueChange={handleLoadReference}>
          <SelectTrigger className="h-9 w-full sm:w-64">
            <SelectValue placeholder="Choose a club…" />
          </SelectTrigger>
          <SelectContent>
            {REFERENCE_WORKFLOWS.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.clubName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        {columns.map((col, index) => (
          <div
            key={col.id}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={[
              "flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 transition-colors",
              "hover:bg-muted/50",
              dragIndex === index ? "opacity-50" : "",
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? "border-primary"
                : "border-border",
            ].join(" ")}
          >
            <button
              type="button"
              className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Input
              value={col.name}
              onChange={(e) => handleNameChange(col.id, e.target.value)}
              className="h-9 max-w-xs"
            />
            <div className="flex-1" />
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm gap-2"
              onClick={() => openRules(col)}
            >
              Rules
              {col.rules.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {col.rules.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(col.id)}
              aria-label={`Delete ${col.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add column
        </Button>
      </div>

      <Sheet open={!!rulesColumnId} onOpenChange={(open) => !open && closeRules()}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>
              Rules — {activeColumn?.name || ""}
            </SheetTitle>
            <SheetDescription>
              Auto-transition players out of this column when a trigger fires.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {draftRules.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No rules configured yet.
              </div>
            ) : (
              draftRules.map((rule) => {
                const destinationOptions = columns.filter((c) => c.id !== rulesColumnId);
                return (
                  <div
                    key={rule.id}
                    className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex flex-1 min-w-0 flex-col gap-2">
                      <Select
                        value={rule.trigger}
                        onValueChange={(value) =>
                          updateDraftRule(rule.id, { trigger: value as RuleTrigger })
                        }
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Select
                          value={rule.destinationColumnId ?? undefined}
                          onValueChange={(value) =>
                            updateDraftRule(rule.id, { destinationColumnId: value })
                          }
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Move to…" />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationOptions.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No other columns
                              </div>
                            ) : (
                              destinationOptions.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeDraftRule(rule.id)}
                      aria-label="Remove rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}

            <Button variant="outline" size="sm" onClick={addDraftRule} className="gap-2">
              <Plus className="h-4 w-4" />
              Add rule
            </Button>
          </div>

          <SheetFooter className="border-t pt-4">
            <Button variant="outline" onClick={closeRules}>
              Cancel
            </Button>
            <Button onClick={saveRules}>Save rules</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default PipelineTab;
