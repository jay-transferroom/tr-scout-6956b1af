import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award } from "lucide-react";
import { SortableTableHead } from "./SortableTableHead";

export type IndividualSortKey =
  | "player"
  | "club"
  | "match"
  | "watchMethod"
  | "date"
  | "status"
  | "rating"
  | "verdict"
  | "scout";

export type IndividualSortDir = "asc" | "desc";

interface ReportsTableHeaderProps {
  sortKey?: IndividualSortKey | null;
  sortDir?: IndividualSortDir;
  onSort?: (k: IndividualSortKey) => void;
  showRecommendation?: boolean;
}

const ReportsTableHeader = ({ sortKey = null, sortDir = "asc", onSort, showRecommendation = true }: ReportsTableHeaderProps) => {
  const Head = onSort
    ? (props: { label: string; k: IndividualSortKey; icon?: React.ReactNode; className?: string }) => (
        <SortableTableHead
          label={props.label}
          sortKey={props.k}
          currentKey={sortKey}
          currentDir={sortDir}
          onSort={onSort}
          icon={props.icon}
          className={props.className}
        />
      )
    : null;

  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {Head ? (
          <>
            <Head label="Player" k="player" />
            <Head label="Club" k="club" />
            <TableHead className="text-sm">Positions</TableHead>
            <Head label="Match" k="match" />
            <Head label="Watch Method" k="watchMethod" />
            <Head label="Report Date" k="date" />
            <Head label="Status" k="status" className="w-[100px]" />
            <Head label="Rating" k="rating" icon={<Award size={14} />} />
            {showRecommendation && <Head label="Recommendation" k="verdict" />}
            <Head label="Scout" k="scout" />
          </>
        ) : (
          <>
            <TableHead className="text-sm">Player</TableHead>
            <TableHead className="text-sm">Club</TableHead>
            <TableHead className="text-sm">Positions</TableHead>
            <TableHead className="text-sm">Match</TableHead>
            <TableHead className="text-sm">Watch Method</TableHead>
            <TableHead className="text-sm">Report Date</TableHead>
            <TableHead className="w-[100px] text-sm">Status</TableHead>
            <TableHead className="text-sm">
              <div className="flex items-center gap-1">
                <Award size={14} />
                <span>Rating</span>
              </div>
            </TableHead>
            {showRecommendation && <TableHead className="text-sm">Recommendation</TableHead>}
            <TableHead className="text-sm">Scout</TableHead>
          </>
        )}
        <TableHead className="w-[80px] text-right text-sm">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ReportsTableHeader;
