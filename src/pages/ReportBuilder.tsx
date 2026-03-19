import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Player } from "@/types/player";
import { PrivatePlayer } from "@/types/privatePlayer";
import { ReportTemplate, Report } from "@/types/report";
import { useAuth } from "@/contexts/AuthContext";
import PlayerSelectionScreen from "@/components/report-builder/PlayerSelectionScreen";
import TemplateSelectionScreen from "@/components/report-builder/TemplateSelectionScreen";
import ReportForm from "@/components/report-builder/ReportForm";
import { useReportBuilder } from "@/hooks/useReportBuilder";
import { usePlayerData } from "@/hooks/usePlayerData";
import { useTemplates } from "@/hooks/useTemplates";

interface LocationState {
  player?: Player;
  template?: ReportTemplate;
  selectedPlayerId?: string;
  selectedPrivatePlayer?: PrivatePlayer;
}

const transformPrivatePlayerToPlayer = (privatePlayer: PrivatePlayer): Player => ({
  id: `private-${privatePlayer.id}`,
  name: privatePlayer.name,
  club: privatePlayer.club || "Unknown",
  age: privatePlayer.age || 0,
  dateOfBirth: privatePlayer.date_of_birth || "",
  positions: privatePlayer.positions || [],
  dominantFoot: privatePlayer.dominant_foot || "Right",
  nationality: privatePlayer.nationality || "Unknown",
  contractStatus: "Under Contract",
  contractExpiry: undefined,
  region: privatePlayer.region || "Unknown",
  image: undefined,
  xtvScore: undefined,
  transferroomRating: undefined,
  futureRating: undefined,
  euGbeStatus: "Pass",
  recentForm: undefined,
  isPrivatePlayer: true,
  privatePlayerData: privatePlayer,
});

const ReportBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const { user } = useAuth();
  const { initializeReport, handleSaveReport, isSubmitting } = useReportBuilder();
  const { templates } = useTemplates();

  const state = location.state as LocationState;
  const playerIdFromUrl = searchParams.get("playerId");
  const templateIdFromUrl = searchParams.get("templateId");
  const playerIdToFetch = playerIdFromUrl || state?.selectedPlayerId;
  const { data: fetchedPlayer, isLoading: playerLoading } = usePlayerData(playerIdToFetch || undefined);

  useEffect(() => {
    if (initialized) return;

    const applyMatchContext = (baseReport: Report): Report => ({
      ...baseReport,
      matchContext: searchParams.get("matchDate") && searchParams.get("opposition")
        ? {
            fixtureId: searchParams.get("fixtureId") || undefined,
            date: searchParams.get("matchDate") || "",
            opposition: searchParams.get("opposition") || "",
            competition: searchParams.get("competition") || "Match Scouting",
            minutesPlayed: Number(searchParams.get("minutesPlayed") || 0),
            roleContext: searchParams.get("roleContext") || undefined,
          }
        : baseReport.matchContext,
      watchMethod: (searchParams.get("watchMethod") as Report["watchMethod"]) || baseReport.watchMethod,
    });

    const initializeWithPlayerAndTemplate = (selectedPlayer: Player, selectedTemplate: ReportTemplate) => {
      setPlayer(selectedPlayer);
      setTemplate(selectedTemplate);
      setShowPlayerSearch(false);
      setShowTemplateSelection(false);
      setReport(applyMatchContext(initializeReport(selectedPlayer, selectedTemplate)));
      setInitialized(true);
    };

    if (state?.player && state?.template) {
      initializeWithPlayerAndTemplate(state.player, state.template);
      return;
    }

    if (state?.player) {
      setPlayer(state.player);
      setShowTemplateSelection(true);
      setInitialized(true);
      return;
    }

    if (state?.selectedPrivatePlayer) {
      setPlayer(transformPrivatePlayerToPlayer(state.selectedPrivatePlayer));
      setShowTemplateSelection(true);
      setInitialized(true);
      return;
    }

    if (playerIdToFetch && playerLoading) {
      return;
    }

    if (playerIdToFetch && fetchedPlayer && templateIdFromUrl) {
      const matchedTemplate = templates.find((item) => item.id === templateIdFromUrl);
      if (!matchedTemplate) return;
      initializeWithPlayerAndTemplate(fetchedPlayer, matchedTemplate);
      return;
    }

    if (playerIdToFetch && fetchedPlayer) {
      setPlayer(fetchedPlayer);
      setShowTemplateSelection(true);
      setInitialized(true);
      return;
    }

    if (!playerIdToFetch && !state?.player && !state?.selectedPrivatePlayer && !playerLoading) {
      setShowPlayerSearch(true);
      setInitialized(true);
    }
  }, [fetchedPlayer, initializeReport, initialized, playerIdToFetch, playerLoading, searchParams, state, templateIdFromUrl, templates]);

  const handlePlayerSelect = useCallback((selectedPlayer: Player) => {
    setPlayer(selectedPlayer);
    setShowPlayerSearch(false);
    setShowTemplateSelection(true);
  }, []);

  const handleTemplateSelect = useCallback((selectedPlayer: Player, selectedTemplate: ReportTemplate) => {
    setTemplate(selectedTemplate);
    setShowTemplateSelection(false);
    setReport(initializeReport(selectedPlayer, selectedTemplate));
  }, [initializeReport]);

  const handleFieldChange = useCallback((sectionId: string, fieldId: string, value: any, notes?: string) => {
    setReport((prevReport) => {
      if (!prevReport) return null;

      const updatedSections = prevReport.sections.map((section) => {
        if (section.sectionId !== sectionId) return section;

        return {
          ...section,
          fields: section.fields.map((field) => {
            if (field.fieldId !== fieldId) return field;

            return {
              ...field,
              value,
              notes,
            };
          }),
        };
      });

      return {
        ...prevReport,
        updatedAt: new Date(),
        sections: updatedSections,
      };
    });
  }, []);

  if (playerIdToFetch && playerLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center py-8">
        <p>Loading player information...</p>
      </div>
    );
  }

  if (showPlayerSearch) {
    return <PlayerSelectionScreen onSelectPlayer={handlePlayerSelect} onBack={() => navigate("/")} />;
  }

  if (showTemplateSelection && player) {
    return <TemplateSelectionScreen player={player} onSelectTemplate={handleTemplateSelect} onBack={() => navigate(-1)} />;
  }

  if (!initialized || !report || !player) {
    return (
      <div className="container mx-auto flex items-center justify-center py-8">
        <p>Loading report builder...</p>
      </div>
    );
  }

  return (
    <ReportForm
      player={player}
      template={template}
      report={report}
      isSubmitting={isSubmitting}
      onFieldChange={handleFieldChange}
      onSaveDraft={() => handleSaveReport(report, player, template, "draft")}
      onSubmitReport={() => handleSaveReport(report, player, template, "submitted")}
      onBack={() => navigate("/")}
      onManageTemplates={() => navigate("/admin/templates")}
      onReportUpdate={setReport}
    />
  );
};

export default ReportBuilder;
