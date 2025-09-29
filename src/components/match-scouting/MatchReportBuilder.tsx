import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MatchTemplate, MatchReport } from "@/types/matchReport";
import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video, Save, Settings } from "lucide-react";
import MatchTemplateSelector from "./MatchTemplateSelector";
import LiveMatchMode from "./LiveMatchMode";
import ReplayMatchMode from "./ReplayMatchMode";
import MatchReportForm from "./MatchReportForm";

interface MatchReportBuilderProps {
  onSave: (report: MatchReport) => void;
  existingReport?: MatchReport;
}

interface LocationState {
  selectedTemplate?: MatchTemplate;
  player?: Player;
}

type BuilderStep = 'template' | 'setup' | 'live' | 'replay' | 'review';

const MatchReportBuilder = ({ onSave, existingReport }: MatchReportBuilderProps) => {
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const [currentStep, setCurrentStep] = useState<BuilderStep>(existingReport ? 'review' : 'template');
  const [selectedTemplate, setSelectedTemplate] = useState<MatchTemplate | null>(
    locationState?.selectedTemplate || null
  );
  const [selectedMode, setSelectedMode] = useState<'live' | 'replay'>('live');
  const [currentReport, setCurrentReport] = useState<Partial<MatchReport>>(existingReport || {});

  // If template is provided from navigation, skip template selection
  useEffect(() => {
    if (locationState?.selectedTemplate && !existingReport) {
      setSelectedTemplate(locationState.selectedTemplate);
      setCurrentStep('setup');
    }
  }, [locationState, existingReport]);

  const handleTemplateSelect = (template: MatchTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('setup');
  };

  const handleModeSelect = (mode: 'live' | 'replay') => {
    setSelectedMode(mode);
    setCurrentStep(mode);
  };

  const handleReportSetup = (reportData: Partial<MatchReport>) => {
    setCurrentReport(reportData);
    setCurrentStep(selectedMode);
  };

  const handleReportUpdate = (updatedReport: Partial<MatchReport>) => {
    setCurrentReport(prev => ({ ...prev, ...updatedReport }));
  };

  const handleSave = () => {
    if (currentReport && selectedTemplate) {
      const finalReport: MatchReport = {
        id: currentReport.id || `match-${Date.now()}`,
        templateId: selectedTemplate.id,
        scoutId: 'current-scout', // This would come from auth context
        createdAt: currentReport.createdAt || new Date(),
        updatedAt: new Date(),
        status: currentReport.status || 'draft',
        mode: selectedMode,
        matchContext: currentReport.matchContext || {
          competition: '',
          date: '',
          location: '',
          homeTeam: '',
          awayTeam: '',
        },
        overview: currentReport.overview || {},
        playerAssessments: currentReport.playerAssessments || [],
        generalNotes: currentReport.generalNotes || {},
      };
      
      onSave(finalReport);
    }
  };

  if (currentStep === 'template') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Create Match Report</h1>
          <p className="text-muted-foreground">Select a template based on the match context</p>
        </div>
        <MatchTemplateSelector onSelect={handleTemplateSelect} />
      </div>
    );
  }

  if (currentStep === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Match Setup</h1>
          <p className="text-muted-foreground">Configure your scouting mode and basic match details</p>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Scouting Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={selectedMode === 'live' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={() => setSelectedMode('live')}
                >
                  <div className="flex items-center gap-2">
                    <Play size={20} />
                    <span className="font-medium">Live Match Mode</span>
                  </div>
                  <p className="text-sm text-left opacity-75">
                    Quick capture during live match with minimal distractions
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">Quick taps</Badge>
                    <Badge variant="secondary" className="text-xs">Voice notes</Badge>
                    <Badge variant="secondary" className="text-xs">Offline</Badge>
                  </div>
                </Button>

                <Button
                  variant={selectedMode === 'replay' ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={() => setSelectedMode('replay')}
                >
                  <div className="flex items-center gap-2">
                    <Video size={20} />
                    <span className="font-medium">Video/Replay Mode</span>
                  </div>
                  <p className="text-sm text-left opacity-75">
                    Detailed analysis with timestamped notes and footage review
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">Timestamps</Badge>
                    <Badge variant="secondary" className="text-xs">Detailed notes</Badge>
                    <Badge variant="secondary" className="text-xs">Compare reports</Badge>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <MatchReportForm
            template={selectedTemplate!}
            initialData={currentReport}
            onUpdate={handleReportSetup}
            mode="setup"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('template')}>
            Back to Templates
          </Button>
          <Button onClick={() => handleModeSelect(selectedMode)}>
            Start {selectedMode === 'live' ? 'Live' : 'Replay'} Scouting
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'live' && selectedTemplate) {
    return (
      <LiveMatchMode
        template={selectedTemplate}
        report={currentReport as MatchReport}
        onUpdate={handleReportUpdate}
        onSave={handleSave}
        onBack={() => setCurrentStep('setup')}
      />
    );
  }

  if (currentStep === 'replay' && selectedTemplate) {
    return (
      <ReplayMatchMode
        template={selectedTemplate}
        report={currentReport as MatchReport}
        onUpdate={handleReportUpdate}
        onSave={handleSave}
        onBack={() => setCurrentStep('setup')}
      />
    );
  }

  return <div>Loading...</div>;
};

export default MatchReportBuilder;