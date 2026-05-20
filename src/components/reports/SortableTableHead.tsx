import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  currentKey: K | null;
  currentDir: "asc" | "desc";
  onSort: (k: K) => void;
  icon?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  icon,
  className,
  align = "left",
}: SortableTableHeadProps<K>) {
  const active = currentKey === sortKey;
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-muted transition-colors",
          align === "right" && "ml-auto",
          align === "center" && "mx-auto",
          active ? "text-foreground font-semibold" : "text-muted-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
        <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-50")} />
      </button>
    </TableHead>
  );
}
