import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = "scout_images";

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface AttachmentValue {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface ReportAttachmentProps {
  reportId: string;
  value?: AttachmentValue | null;
  onChange: (value: AttachmentValue | null) => void;
}

const ReportAttachment = ({ reportId, value, onChange }: ReportAttachmentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Attachments must be 5 MB or smaller.",
      });
      e.target.value = "";
      return;
    }

    if (!user) {
      toast.error("You must be signed in to upload attachments");
      return;
    }

    try {
      setUploading(true);
      const safeName = selected.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `report-attachments/${user.id}/${reportId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, selected, {
          cacheControl: "3600",
          upsert: false,
          contentType: selected.type || "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const next = {
        url: publicData.publicUrl,
        name: selected.name,
        type: selected.type || "application/octet-stream",
        size: selected.size,
      };

      // Persist immediately so the attachment isn't lost if the user navigates away
      // before clicking Save. Ignored silently if the report row doesn't exist yet.
      const { error: persistError } = await supabase
        .from("reports")
        .update({
          attachment_url: next.url,
          attachment_name: next.name,
          attachment_type: next.type,
          attachment_size: next.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (persistError) {
        console.warn("Attachment uploaded but not persisted to report row:", persistError);
      }

      onChange(next);
      toast.success("Attachment uploaded");
    } catch (err: any) {
      console.error("Attachment upload failed", err);
      toast.error("Upload failed", { description: err?.message ?? "Please try again." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
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
        disabled={uploading}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/30 border">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon size={16} className="text-muted-foreground shrink-0" />
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm truncate hover:underline"
            >
              {value.name}
            </a>
            <span className="text-xs text-muted-foreground shrink-0">
              ({formatBytes(value.size)})
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="gap-1">
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
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
            {uploading ? "Uploading…" : "Choose file"}
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
