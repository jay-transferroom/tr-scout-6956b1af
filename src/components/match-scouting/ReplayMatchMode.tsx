import { useState } from "react";
import { MatchTemplate, MatchReport, PlayerAssessment } from "@/types/matchReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Clock, FileText, Users, BarChart3 } from "lucide-react";
import MatchReportForm from "./MatchReportForm";
import PlayerAssessmentForm from "./PlayerAssessmentForm";

interface ReplayMatchModeProps {
  template: MatchTemplate;
  report: MatchReport;
  onUpdate: (report: Partial<MatchReport>) => void;
  onSave: () => void;
  onBack: () => void;
}

const ReplayMatchMode = ({ template, report, onUpdate, onSave, onBack }: ReplayMatchModeProps) => {
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);

  const handleTimestampedNote = (note: string) => {
    if (!currentTimestamp || !note.trim()) return;

    const timestampedNote = `[${currentTimestamp}] ${note}`;
    const existingNotes = report.generalNotes?.additionalNotes || '';
    
    onUpdate({
      generalNotes: {
        ...report.generalNotes,
        additionalNotes: existingNotes ? `${existingNotes}\n${timestampedNote}` : timestampedNote
      }
    });
  };

  const handlePlayerUpdate = (updatedPlayer: PlayerAssessment) => {
    const updatedAssessments = [...(report.playerAssessments || [])];
    updatedAssessments[selectedPlayerIndex] = updatedPlayer;
    onUpdate({ playerAssessments: updatedAssessments });
  };

  const addNewPlayer = () => {
    const newPlayer: PlayerAssessment = {
      playerName: 'New Player',
      team: 'home',
      position: '',
      minutesPlayed: 0,
      startingXI: false,
      performanceNotes: '',
      keyEvents: []
    };

    onUpdate({
      playerAssessments: [...(report.playerAssessments || []), newPlayer]
    });
    setSelectedPlayerIndex((report.playerAssessments || []).length);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Video Analysis</h1>
            <p className="text-sm text-muted-foreground">
              {report.matchContext?.homeTeam} vs {report.matchContext?.awayTeam}
            </p>
          </div>
        </div>
        
        <Button onClick={onSave}>
          <Save size={16} className="mr-2" />
          Save Report
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Video Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Video Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timestamp">Current Timestamp</Label>
                <Input
                  id="timestamp"
                  value={currentTimestamp}
                  onChange={(e) => setCurrentTimestamp(e.target.value)}
                  placeholder="12:34"
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Use video player controls to navigate footage.</p>
                <p>Enter timestamp above to add timestamped notes.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Clock size={14} className="mr-2" />
                Add Timestamp
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText size={14} className="mr-2" />
                Quick Note
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 size={14} className="mr-2" />
                Mark Key Moment
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="moments">Key Moments</TabsTrigger>
              <TabsTrigger value="notes">General Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <MatchReportForm
                template={template}
                initialData={report}
                onUpdate={onUpdate}
                mode="detailed"
              />
            </TabsContent>

            <TabsContent value="players" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Player Assessments</h3>
                <Button onClick={addNewPlayer}>
                  <Users size={16} className="mr-2" />
                  Add Player
                </Button>
              </div>

              {report.playerAssessments && report.playerAssessments.length > 0 ? (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Players</Label>
                    <div className="space-y-1">
                      {report.playerAssessments.map((player, index) => (
                        <Button
                          key={index}
                          variant={index === selectedPlayerIndex ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedPlayerIndex(index)}
                        >
                          {player.playerName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    {report.playerAssessments[selectedPlayerIndex] && (
                      <PlayerAssessmentForm
                        player={report.playerAssessments[selectedPlayerIndex]}
                        onUpdate={handlePlayerUpdate}
                        timestamp={currentTimestamp}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No players added yet</h3>
                      <p className="text-muted-foreground mb-4">Start by adding players to assess</p>
                      <Button onClick={addNewPlayer}>Add First Player</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="moments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Match Moments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                  <div>
                    <Label htmlFor="keyMoments">Key Moments</Label>
                    <Textarea
                      id="keyMoments"
                      value={(typeof report.generalNotes?.keyMoments === 'string' ? report.generalNotes.keyMoments : '') || ''}
                      onChange={(e) => onUpdate({
                        generalNotes: {
                          ...report.generalNotes,
                          keyMoments: e.target.value
                        }
                      })}
                      placeholder="Describe significant moments in the match..."
                      rows={6}
                    />
                  </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="progressionNotes">Progression vs Past</Label>
                    <Textarea
                      id="progressionNotes"
                      value={report.generalNotes?.progressionNotes || ''}
                      onChange={(e) => onUpdate({
                        generalNotes: {
                          ...report.generalNotes,
                          progressionNotes: e.target.value
                        }
                      })}
                      placeholder="How has the team/players progressed since last observation?"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="overallRecommendation">Overall Recommendation</Label>
                    <Textarea
                      id="overallRecommendation"
                      value={report.generalNotes?.overallRecommendation || ''}
                      onChange={(e) => onUpdate({
                        generalNotes: {
                          ...report.generalNotes,
                          overallRecommendation: e.target.value
                        }
                      })}
                      placeholder="Your overall assessment and recommendations..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalNotes">Timestamped Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={report.generalNotes?.additionalNotes || ''}
                      onChange={(e) => onUpdate({
                        generalNotes: {
                          ...report.generalNotes,
                          additionalNotes: e.target.value
                        }
                      })}
                      placeholder="Additional observations and notes..."
                      rows={8}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ReplayMatchMode;