import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToggleRecommendationsActive } from "@/hooks/useRecommendationsActive";
import RecommendationBadge from "@/components/RecommendationBadge";
import { PlayerRecommendationControl } from "@/components/PlayerRecommendationControl";

const DEMO_VALUE = { label: "Sign", colour: "#22C55E" };

const RecommendationsOffDemo = () => {
  const { active, setActive } = useToggleRecommendationsActive();

  const verifyRoutes = [
    { to: "/player/1", label: "Player Profile (recommendation control)" },
    { to: "/shortlists", label: "Shortlists (column + badges)" },
    { to: "/reports", label: "Reports (badges + sort option)" },
    { to: "/calendar", label: "Calendar (dot on fixture player rows)" },
  ];

  return (
    <div className="container mx-auto max-w-3xl py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Recommendations — activation demo</h1>
        <p className="text-sm text-muted-foreground">
          Flip the Club Settings activation flag and verify that no recommendation UI
          renders anywhere in the app while it's off.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activation flag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="rec-toggle" className="text-sm font-medium">
                Recommendations active
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When off, every <code>RecommendationBadge</code> and the
                <code> PlayerRecommendationControl</code> renders nothing.
              </p>
            </div>
            <Switch
              id="rec-toggle"
              checked={active}
              onCheckedChange={(v) => setActive(v)}
            />
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Live preview
            </div>
            <div className="flex items-center gap-3 min-h-8">
              <span className="text-xs text-muted-foreground w-24">default:</span>
              <RecommendationBadge value={DEMO_VALUE} variant="default" />
            </div>
            <div className="flex items-center gap-3 min-h-8">
              <span className="text-xs text-muted-foreground w-24">compact:</span>
              <RecommendationBadge value={DEMO_VALUE} variant="compact" />
            </div>
            <div className="flex items-center gap-3 min-h-8">
              <span className="text-xs text-muted-foreground w-24">dot:</span>
              <RecommendationBadge value={DEMO_VALUE} variant="dot" />
            </div>
            <div className="flex items-center gap-3 min-h-8">
              <span className="text-xs text-muted-foreground w-24">control:</span>
              <PlayerRecommendationControl playerId="demo" />
            </div>
            {!active && (
              <p className="text-xs text-muted-foreground italic">
                ✓ All four slots above are empty — nothing leaks through.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Verify in the app</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {verifyRoutes.map((r) => (
              <li key={r.to}>
                <Button asChild variant="outline" size="sm">
                  <Link to={r.to}>{r.label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsOffDemo;
