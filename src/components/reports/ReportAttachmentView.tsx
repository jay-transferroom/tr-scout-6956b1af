import { FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/components/report-builder/ReportAttachment";

interface ReportAttachmentViewProps {
  url: string;
  name: string;
  type?: string | null;
  size?: number | null;
}

const ReportAttachmentView = ({ url, name, type, size }: ReportAttachmentViewProps) => {
  const mime = (type || "").toLowerCase();
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  const isImage = mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext);
  const isVideo = mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext);
  const isAudio = mime.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "flac"].includes(ext);
  const isPdf = mime === "application/pdf" || ext === "pdf";

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{name}</span>
          {size != null && (
            <span className="text-xs text-muted-foreground shrink-0">({formatBytes(size)})</span>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <a href={url} download={name} target="_blank" rel="noopener noreferrer">
            <Download size={14} />
            Download
          </a>
        </Button>
      </div>

      <div className="bg-background">
        {isImage && (
          <img src={url} alt={name} className="block max-h-[720px] w-full object-contain bg-muted/20" />
        )}
        {isVideo && (
          <video src={url} controls className="block w-full max-h-[720px] bg-black" />
        )}
        {isAudio && (
          <div className="p-4">
            <audio src={url} controls className="w-full" />
          </div>
        )}
        {isPdf && (
          <iframe
            src={url}
            title={name}
            className="w-full"
            style={{ height: "720px", border: 0 }}
          />
        )}
        {!isImage && !isVideo && !isAudio && !isPdf && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Preview not available for this file type. Use the Download button above to open it.
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAttachmentView;
