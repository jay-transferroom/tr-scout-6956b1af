import { ClubBadge } from "@/components/ui/club-badge";

export const ShortlistsHeader = () => {
  return (
    <div className="mb-8 max-w-full overflow-hidden">
      <div className="flex items-center gap-4">
        <ClubBadge clubName="Chelsea" size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Chelsea FC - Recruitment Shortlists</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base break-words">
            Targeted player lists for upcoming transfer windows
          </p>
        </div>
      </div>
    </div>
  );
};
