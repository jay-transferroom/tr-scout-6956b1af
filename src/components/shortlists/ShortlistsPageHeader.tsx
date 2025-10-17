import { ClubBadge } from "@/components/ui/club-badge";

export const ShortlistsHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <ClubBadge clubName="Chelsea" size="lg" />
        <div>
          <h1 className="text-3xl font-bold">Chelsea FC - Recruitment Shortlists</h1>
          <p className="text-muted-foreground mt-2">
            Targeted player lists for upcoming transfer windows
          </p>
        </div>
      </div>
    </div>
  );
};
