
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award } from "lucide-react";

const ReportsTableHeader = () => {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="text-sm">Player</TableHead>
        <TableHead className="text-sm">Club</TableHead>
        <TableHead className="text-sm">Positions</TableHead>
        <TableHead className="text-sm">Match</TableHead>
        <TableHead className="text-sm">Report Date</TableHead>
        <TableHead className="w-[100px] text-sm">Status</TableHead>
        <TableHead className="text-sm">
          <div className="flex items-center gap-1">
            <Award size={14} />
            <span>Rating</span>
          </div>
        </TableHead>
        <TableHead className="text-sm">Verdict</TableHead>
        <TableHead className="text-sm">Scout</TableHead>
        <TableHead className="w-[80px] text-right text-sm">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ReportsTableHeader;
