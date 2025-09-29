import { useState } from "react";
import { MatchReport } from "@/types/matchReport";
import MatchReportBuilder from "@/components/match-scouting/MatchReportBuilder";
import { toast } from "sonner";

const MatchScouting = () => {
  const [savedReports, setSavedReports] = useState<MatchReport[]>([]);

  const handleSaveReport = (report: MatchReport) => {
    setSavedReports(prev => {
      const existingIndex = prev.findIndex(r => r.id === report.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = report;
        return updated;
      }
      return [...prev, report];
    });
    
    toast.success("Match report saved successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <MatchReportBuilder onSave={handleSaveReport} />
    </div>
  );
};

export default MatchScouting;