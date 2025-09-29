import { useState, useEffect } from "react";
import { MatchTemplate, MatchReport, PlayerAssessment, KeyEvent, QUICK_EVENT_TYPES } from "@/types/matchReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Save, ArrowLeft, Mic, MicOff, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface LiveMatchModeProps {
  template: MatchTemplate;
  report: MatchReport;
  onUpdate: (report: Partial<MatchReport>) => void;
  onSave: () => void;
  onBack: () => void;
}

const LiveMatchMode = ({ template, report, onUpdate, onSave, onBack }: LiveMatchModeProps) => {
  const [isLive, setIsLive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [quickNote, setQuickNote] = useState('');
  const [currentHalf, setCurrentHalf] = useState<1 | 2>(1);

  // Timer for live match
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickEvent = (eventType: string) => {
    if (!selectedPlayer) {
      toast.error("Please select a player first");
      return;
    }

    const newEvent: KeyEvent = {
      id: `event-${Date.now()}`,
      type: eventType as any,
      timestamp: currentTime,
      impact: ['goal', 'assist', 'duel-won', 'key-pass', 'tackle'].includes(eventType) ? 'positive' : 
              ['error', 'duel-lost', 'foul'].includes(eventType) ? 'negative' : 'neutral',
      quickCapture: true,
    };

    // Update the player's events
    const updatedAssessments = (report.playerAssessments || []).map(assessment => {
      if (assessment.playerName === selectedPlayer) {
        return {
          ...assessment,
          keyEvents: [...(assessment.keyEvents || []), newEvent]
        };
      }
      return assessment;
    });

    onUpdate({ playerAssessments: updatedAssessments });
    toast.success(`${eventType} recorded for ${selectedPlayer}`);
  };

  const handleAddQuickNote = () => {
    if (!quickNote.trim()) return;

    const existingNotes = report.generalNotes?.additionalNotes || '';
    const timestamp = `[${formatTime(currentTime)}]`;
    const newNote = `${timestamp} ${quickNote}`;
    
    onUpdate({
      generalNotes: {
        ...report.generalNotes,
        additionalNotes: existingNotes ? `${existingNotes}\n${newNote}` : newNote
      }
    });

    setQuickNote('');
    toast.success("Note added");
  };

  const handleVoiceNote = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.info("Voice recording started");
      // Implement voice recording logic here
    } else {
      setIsRecording(false);
      toast.success("Voice note saved");
      // Implement voice recording stop and save logic here
    }
  };

  const playerOptions = report.playerAssessments?.map(p => p.playerName) || [];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with match controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Live Match</h1>
            <p className="text-sm text-muted-foreground">
              {report.matchContext?.homeTeam} vs {report.matchContext?.awayTeam}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isLive ? "default" : "secondary"} className="text-lg px-4 py-2">
            <Clock size={16} className="mr-2" />
            {formatTime(currentTime)}
          </Badge>
          
          <Select value={currentHalf.toString()} onValueChange={(v) => setCurrentHalf(Number(v) as 1 | 2)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Half</SelectItem>
              <SelectItem value="2">2nd Half</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={isLive ? "destructive" : "default"}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Pause' : 'Start'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Capture Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Capture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player to track" />
                </SelectTrigger>
                <SelectContent>
                  {playerOptions.map(player => (
                    <SelectItem key={player} value={player}>{player}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {QUICK_EVENT_TYPES.map(eventType => (
                  <Button
                    key={eventType.id}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => handleQuickEvent(eventType.id)}
                    disabled={!selectedPlayer}
                  >
                    <span className="text-lg">{eventType.icon}</span>
                    <span className="text-xs">{eventType.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Quick observation..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddQuickNote()}
                />
                <Button onClick={handleAddQuickNote} disabled={!quickNote.trim()}>
                  <Plus size={16} />
                </Button>
              </div>

              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={handleVoiceNote}
                className="w-full"
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? 'Stop Recording' : 'Voice Note'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Summary Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span>Events Captured:</span>
                  <span className="font-medium">
                    {report.playerAssessments?.reduce((sum, p) => sum + (p.keyEvents?.length || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Players Tracked:</span>
                  <span className="font-medium">{report.playerAssessments?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Notes:</span>
                  <span className="font-medium">
                    {report.generalNotes?.additionalNotes?.split('\n').length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.playerAssessments?.flatMap(player => 
                  player.keyEvents?.map(event => (
                    <div key={event.id} className="text-sm p-2 bg-muted rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{player.playerName}</span>
                        <span className="text-xs">{formatTime(event.timestamp || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {QUICK_EVENT_TYPES.find(t => t.id === event.type)?.label}
                        </Badge>
                      </div>
                    </div>
                  )) || []
                ).slice(-5)}
              </div>
            </CardContent>
          </Card>

          <Button onClick={onSave} className="w-full">
            <Save size={16} className="mr-2" />
            Save Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchMode;