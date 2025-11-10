
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send, Settings } from "lucide-react";
import { Player } from "@/types/player";
import { ReportTemplate, Report } from "@/types/report";
import ReportSection from "@/components/ReportSection";
import TestDataFiller from "./TestDataFiller";
import FixtureSelector from "./FixtureSelector";
import { Fixture } from "@/hooks/useFixturesData";

interface ReportFormProps {
  player: Player;
  template: ReportTemplate;
  report: Report;
  isSubmitting: boolean;
  onFieldChange: (sectionId: string, fieldId: string, value: any, notes?: string) => void;
  onSaveDraft: () => void;
  onSubmitReport: () => void;
  onBack: () => void;
  onManageTemplates: () => void;
  onReportUpdate: (report: Report) => void;
}

const ReportForm = ({
  player,
  template,
  report,
  isSubmitting,
  onFieldChange,
  onSaveDraft,
  onSubmitReport,
  onBack,
  onManageTemplates,
  onReportUpdate,
}: ReportFormProps) => {
  // Separate overall section from other sections
  const overallSection = template.sections.find(section => section.id === "overall");
  const otherSections = template.sections.filter(section => section.id !== "overall");

  const handleFixtureSelect = (fixture: Fixture | null) => {
    if (!fixture) {
      onReportUpdate({
        ...report,
        matchContext: undefined,
      });
      return;
    }

    const buildFixtureId = (f: Fixture) => `${f.home_team}-${f.away_team}-${f.match_date_utc}`;
    const normalize = (name: string) => name
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\bf\.?c\.?\b/g, "")
      .replace(/football club/g, "")
      .replace(/[^a-z0-9&\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const isHome = normalize(fixture.home_team) === normalize(player.club);

    onReportUpdate({
      ...report,
      matchContext: {
        fixtureId: buildFixtureId(fixture),
        date: fixture.match_date_utc,
        opposition: isHome ? fixture.away_team : fixture.home_team,
        competition: fixture.competition || "Unknown",
        minutesPlayed: 0,
      },
    });
  };

  const getSelectedFixtureId = () => {
    const ctx: any = report.matchContext;
    if (!ctx) return undefined;
    if (ctx.fixtureId) return ctx.fixtureId as string;
    if (!ctx.date || !ctx.opposition) return undefined;
    // Fallback (legacy): assume player club was home
    return `${player.club}-${ctx.opposition}-${ctx.date}`;
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <TestDataFiller 
            report={report} 
            template={template} 
            onReportUpdate={onReportUpdate}
          />
        </div>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={onManageTemplates}
            className="gap-2"
          >
            <Settings size={16} />
            Manage Templates
          </Button>
          <Button 
            variant="outline" 
            onClick={onSaveDraft} 
            disabled={isSubmitting}
            className="gap-2"
          >
            <Save size={16} />
            Save Draft
          </Button>
          <Button 
            onClick={onSubmitReport} 
            disabled={isSubmitting}
            className="gap-2"
          >
            <Send size={16} />
            Submit Report
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-md mb-6">
        <div className="flex items-center gap-4">
          {player.image ? (
            <img 
              src={player.image} 
              alt={player.name} 
              className="w-16 h-16 rounded-full object-cover" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold">{player.name.charAt(0)}</span>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-bold">{player.name}</h2>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span>{player.club}</span>
              <span>•</span>
              <span>{player.positions.join(", ")}</span>
              <span>•</span>
              <span>{player.age} years</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-4 rounded-md mb-6 border">
        <FixtureSelector
          player={player}
          selectedFixtureId={getSelectedFixtureId()}
          onFixtureSelect={handleFixtureSelect}
        />
      </div>

      <div className="space-y-6">
        {/* Render overall section first if it exists */}
        {overallSection && (
          <ReportSection
            key={overallSection.id}
            section={overallSection}
            sectionData={report.sections.find(s => s.sectionId === overallSection.id)!}
            onChange={onFieldChange}
            isOverallSection={true}
          />
        )}

        {/* Render all other sections */}
        {otherSections.map((section) => (
          <ReportSection
            key={section.id}
            section={section}
            sectionData={report.sections.find(s => s.sectionId === section.id)!}
            onChange={onFieldChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ReportForm;
