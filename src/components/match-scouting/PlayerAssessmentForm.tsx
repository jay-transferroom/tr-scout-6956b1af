import { PlayerAssessment, KeyEvent, QUICK_EVENT_TYPES } from "@/types/matchReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";


interface PlayerAssessmentFormProps {
  player: PlayerAssessment;
  onUpdate: (player: PlayerAssessment) => void;
  timestamp?: string;
}

const POSITIONS = [
  'GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'
];

const PlayerAssessmentForm = ({ player, onUpdate, timestamp }: PlayerAssessmentFormProps) => {
  const updateField = (field: keyof PlayerAssessment, value: any) => {
    onUpdate({
      ...player,
      [field]: value
    });
  };

  const addKeyEvent = (eventType: string) => {
    const newEvent: KeyEvent = {
      id: `event-${Date.now()}`,
      type: eventType as any,
      timestamp: timestamp ? parseTimestamp(timestamp) : undefined,
      description: '',
      impact: ['goal', 'assist', 'duel-won', 'key-pass', 'tackle'].includes(eventType) ? 'positive' : 
              ['error', 'duel-lost', 'foul'].includes(eventType) ? 'negative' : 'neutral',
      quickCapture: false,
    };

    updateField('keyEvents', [...(player.keyEvents || []), newEvent]);
  };

  const updateKeyEvent = (eventId: string, updates: Partial<KeyEvent>) => {
    const updatedEvents = (player.keyEvents || []).map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    updateField('keyEvents', updatedEvents);
  };

  const removeKeyEvent = (eventId: string) => {
    const updatedEvents = (player.keyEvents || []).filter(event => event.id !== eventId);
    updateField('keyEvents', updatedEvents);
  };

  const parseTimestamp = (time: string): number => {
    const [minutes, seconds] = time.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  };

  const formatTimestamp = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Player Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={player.playerName}
              onChange={(e) => updateField('playerName', e.target.value)}
              placeholder="Player name"
            />
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Select 
              value={player.position} 
              onValueChange={(value) => updateField('position', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="team">Team</Label>
            <Select 
              value={player.team} 
              onValueChange={(value: 'home' | 'away') => updateField('team', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="minutesPlayed">Minutes Played</Label>
            <Input
              id="minutesPlayed"
              type="number"
              min="0"
              max="120"
              value={player.minutesPlayed}
              onChange={(e) => updateField('minutesPlayed', Number(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="startingXI"
              checked={player.startingXI}
              onCheckedChange={(checked) => updateField('startingXI', checked)}
            />
            <Label htmlFor="startingXI">Starting XI</Label>
          </div>

          <div>
            <Label htmlFor="role">Role/Instructions</Label>
            <Input
              id="role"
              value={player.role || ''}
              onChange={(e) => updateField('role', e.target.value)}
              placeholder="Specific role or tactical instructions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rating">Overall Rating</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="10"
              value={player.rating || ''}
              onChange={(e) => updateField('rating', Number(e.target.value))}
              placeholder="Rating 1-10"
            />
          </div>

          <div>
            <Label htmlFor="performanceNotes">Performance Notes</Label>
            <Textarea
              id="performanceNotes"
              value={player.performanceNotes}
              onChange={(e) => updateField('performanceNotes', e.target.value)}
              placeholder="Detailed assessment of player's performance..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Events</CardTitle>
            <div className="flex flex-wrap gap-1">
              {QUICK_EVENT_TYPES.slice(0, 4).map(eventType => (
                <Button
                  key={eventType.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addKeyEvent(eventType.id)}
                  className="text-xs"
                >
                  {eventType.icon} {eventType.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {player.keyEvents && player.keyEvents.length > 0 ? (
            <div className="space-y-3">
              {player.keyEvents.map((event) => (
                <div key={event.id} className="border rounded p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {QUICK_EVENT_TYPES.find(t => t.id === event.type)?.label || event.type}
                      </Badge>
                      {event.timestamp && (
                        <Badge variant="secondary" className="text-xs">
                          {formatTimestamp(event.timestamp)}
                        </Badge>
                      )}
                      <Badge 
                        variant={event.impact === 'positive' ? 'default' : 
                                event.impact === 'negative' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {event.impact}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyEvent(event.id)}
                      className="text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <Textarea
                    value={event.description || ''}
                    onChange={(e) => updateKeyEvent(event.id, { description: e.target.value })}
                    placeholder="Describe what happened..."
                    rows={2}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No events recorded yet</p>
              <p className="text-sm">Use the buttons above to add key events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerAssessmentForm;