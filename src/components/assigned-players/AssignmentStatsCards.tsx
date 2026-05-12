import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreakdownStat {
  total: number;
  player: number;
  fixture: number;
}

interface AssignmentStatsCardsProps {
  stats: {
    total: BreakdownStat;
    pending: BreakdownStat;
    inProgress: BreakdownStat;
    completed: BreakdownStat;
  };
}

const Breakdown = ({ s }: { s: BreakdownStat }) => (
  <div className="text-[11px] text-muted-foreground mt-1">
    {s.player} player • {s.fixture} match
  </div>
);

const AssignmentStatsCards = ({ stats }: AssignmentStatsCardsProps) => {
  const cards = [
    { label: "Total Assigned", s: stats.total, color: "" },
    { label: "Pending", s: stats.pending, color: "text-red-600" },
    { label: "In Progress", s: stats.inProgress, color: "text-orange-600" },
    { label: "Completed", s: stats.completed, color: "text-green-600" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-3xl font-bold ${c.color}`}>{c.s.total}</div>
            <Breakdown s={c.s} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignmentStatsCards;
