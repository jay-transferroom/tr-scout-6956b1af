import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ReportAttachment = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Attachments must be 5 MB or smaller.",
      });
      e.target.value = "";
      return;
    }

    setFile(selected);
  };

  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="bg-card p-4 rounded-md mb-6 border">
      <label className="text-sm font-medium mb-2 block">Attachment (Optional)</label>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleSelect}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/30 border">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon size={16} className="text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({formatBytes(file.size)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="gap-1"
          >
            <X size={14} />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            <Paperclip size={14} />
            Choose file
          </Button>
          <span className="text-xs text-muted-foreground">
            One file, any type, up to 5 MB.
          </span>
        </div>
      )}
    </div>
  );
};

export default ReportAttachment;
