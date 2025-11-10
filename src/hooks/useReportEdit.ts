
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportWithPlayer, Report } from "@/types/report";
import { useReports } from "@/hooks/useReports";
import { toast } from "sonner";

export const useReportEdit = () => {
  const navigate = useNavigate();
  const { saveReport } = useReports();
  const [saving, setSaving] = useState(false);

  const handleSectionUpdate = (report: ReportWithPlayer | null, updatedSection: any) => {
    if (!report) return null;

    const updatedSections = report.sections.map(section =>
      section.sectionId === updatedSection.sectionId ? updatedSection : section
    );

    return {
      ...report,
      sections: updatedSections
    };
  };

  const handleSave = async (report: ReportWithPlayer | null) => {
    if (!report) return;

    try {
      setSaving(true);
      
      const reportData: Partial<Report> = {
        id: report.id,
        playerId: report.playerId,
        templateId: report.templateId,
        sections: report.sections,
        matchContext: report.matchContext,
        tags: report.tags,
        flaggedForReview: report.flaggedForReview,
        status: report.status
      };

      await saveReport(reportData);
      toast.success("Report saved successfully");
      navigate(`/report/${report.id}`);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  return {
    handleSectionUpdate,
    handleSave,
    saving,
  };
};
