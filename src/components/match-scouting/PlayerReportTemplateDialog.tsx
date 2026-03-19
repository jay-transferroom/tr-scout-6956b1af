import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/hooks/useTemplates";
import { Player } from "@/types/player";
import { buildPlayerFullReportUrl } from "@/utils/matchScoutingDrafts";

interface PlayerReportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  matchDate: string;
  opposition: string;
  competition?: string;
  minutesPlayed?: number;
  watchMethod?: "Live" | "Video" | "Data";
}

const PlayerReportTemplateDialog = ({
  open,
  onOpenChange,
  player,
  matchDate,
  opposition,
  competition = "Match Scouting",
  minutesPlayed = 0,
  watchMethod = "Live",
}: PlayerReportTemplateDialogProps) => {
  const { templates, loading } = useTemplates();

  const availableTemplates = templates.filter((template) => template.id !== "match-scouting");

  const handleTemplateSelect = (templateId: string) => {
    if (!player) return;

    const reportBuilderUrl = buildPlayerFullReportUrl({
      playerId: player.id,
      templateId,
      matchDate,
      opposition,
      competition,
      minutesPlayed,
      watchMethod,
    });

    window.open(reportBuilderUrl, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create full report for {player?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : availableTemplates.length > 0 ? (
            availableTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className="w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="font-medium text-foreground">{template.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {template.sections.length} sections
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No full report templates are available yet.</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerReportTemplateDialog;
