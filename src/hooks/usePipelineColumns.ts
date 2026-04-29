import { useEffect, useState } from "react";

export type RuleTrigger =
  | "data_report_submitted"
  | "video_report_submitted"
  | "manually_assigned";

export interface PipelineRule {
  id: string;
  trigger: RuleTrigger;
  destinationColumnId: string | null;
}

export interface PipelineColumn {
  id: string;
  name: string;
  rules: PipelineRule[];
}

export const SEED_COLUMNS: PipelineColumn[] = [
  { id: "shortlisted", name: "Shortlisted", rules: [] },
  { id: "assigned", name: "Assigned", rules: [] },
  { id: "completed", name: "Completed", rules: [] },
];

const STORAGE_KEY = "pipeline-columns";
const EVENT_NAME = "pipeline-columns-updated";

const readFromStorage = (): PipelineColumn[] => {
  if (typeof window === "undefined") return SEED_COLUMNS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_COLUMNS;
    return parsed.map((c) => ({
      id: String(c.id),
      name: String(c.name ?? "Untitled"),
      rules: Array.isArray(c.rules) ? c.rules : [],
    }));
  } catch {
    return SEED_COLUMNS;
  }
};

export const writePipelineColumns = (columns: PipelineColumn[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const usePipelineColumns = () => {
  const [columns, setColumns] = useState<PipelineColumn[]>(() => readFromStorage());

  useEffect(() => {
    const refresh = () => setColumns(readFromStorage());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) refresh();
    });
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
    };
  }, []);

  const update = (next: PipelineColumn[] | ((prev: PipelineColumn[]) => PipelineColumn[])) => {
    setColumns((prev) => {
      const resolved = typeof next === "function" ? (next as (p: PipelineColumn[]) => PipelineColumn[])(prev) : next;
      writePipelineColumns(resolved);
      return resolved;
    });
  };

  return [columns, update] as const;
};
