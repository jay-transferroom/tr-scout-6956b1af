import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface PipelineColumn {
  id: string;
  name: string;
}

const SEED_COLUMNS: PipelineColumn[] = [
  { id: "shortlisted", name: "Shortlisted" },
  { id: "assigned", name: "Assigned" },
  { id: "completed", name: "Completed" },
];

const PipelineTab = () => {
  const [columns, setColumns] = useState<PipelineColumn[]>(SEED_COLUMNS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleNameChange = (id: string, name: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleDelete = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    setColumns((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, name: "New column" },
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

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Pipeline columns</h2>
        <p className="text-sm text-muted-foreground">
          Configure the columns players move through. Drag to reorder.
        </p>
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
              className="h-auto p-0 text-sm"
              onClick={() => toast.info("Rules editor coming soon")}
            >
              Rules
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
    </Card>
  );
};

export default PipelineTab;
