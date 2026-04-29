import RecommendationBadge, { RecommendationValue, RecommendationBadgeVariant } from "@/components/RecommendationBadge";

const DEFAULT_RECOMMENDATIONS: RecommendationValue[] = [
  { label: "Sign", colour: "#22C55E" },
  { label: "Strong Sign", colour: "#16A34A" },
  { label: "Monitor", colour: "#EAB308" },
  { label: "Loan", colour: "#3B82F6" },
  { label: "Pass", colour: "#EF4444" },
  { label: "Reject", colour: "#991B1B" },
  { label: "Light Option", colour: "#FDE68A" },
  { label: "Neutral", colour: "#9CA3AF" },
];

const VARIANTS: RecommendationBadgeVariant[] = ["default", "compact", "dot"];

const RecommendationBadgeShowcase = () => {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">RecommendationBadge</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showcase of all variants across the default recommendation colour palette. (Storybook
          stand-in — Storybook is not configured in this project.)
        </p>
      </header>

      <div className="space-y-8">
        {VARIANTS.map((variant) => (
          <section key={variant} className="border rounded-md p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              variant: {variant}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {DEFAULT_RECOMMENDATIONS.map((value) => (
                <div key={value.label} className="flex items-center gap-2">
                  <RecommendationBadge value={value} variant={variant} />
                  <span className="text-xs text-muted-foreground">{value.label}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default RecommendationBadgeShowcase;
