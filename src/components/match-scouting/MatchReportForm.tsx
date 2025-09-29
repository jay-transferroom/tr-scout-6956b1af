import { MatchTemplate, MatchReport } from "@/types/matchReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MatchReportFormProps {
  template: MatchTemplate;
  initialData: Partial<MatchReport>;
  onUpdate: (data: Partial<MatchReport>) => void;
  mode: 'setup' | 'detailed';
}

const FORMATION_OPTIONS = [
  '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1', '3-4-3', '4-5-1'
];

const MatchReportForm = ({ template, initialData, onUpdate, mode }: MatchReportFormProps) => {
  const updateMatchContext = (field: string, value: string) => {
    onUpdate({
      matchContext: {
        ...initialData.matchContext,
        [field]: value
      } as any
    });
  };

  const updateOverview = (field: string, value: string | number) => {
    onUpdate({
      overview: {
        ...initialData.overview,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Match Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Match Context
            <Badge variant="outline">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="competition">Competition</Label>
            <Input
              id="competition"
              value={initialData.matchContext?.competition || ''}
              onChange={(e) => updateMatchContext('competition', e.target.value)}
              placeholder="Premier League, FA Cup, etc."
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={initialData.matchContext?.date || ''}
              onChange={(e) => updateMatchContext('date', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="homeTeam">Home Team</Label>
            <Input
              id="homeTeam"
              value={initialData.matchContext?.homeTeam || ''}
              onChange={(e) => updateMatchContext('homeTeam', e.target.value)}
              placeholder="Home team name"
            />
          </div>

          <div>
            <Label htmlFor="awayTeam">Away Team</Label>
            <Input
              id="awayTeam"
              value={initialData.matchContext?.awayTeam || ''}
              onChange={(e) => updateMatchContext('awayTeam', e.target.value)}
              placeholder="Away team name"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={initialData.matchContext?.location || ''}
              onChange={(e) => updateMatchContext('location', e.target.value)}
              placeholder="Stadium, venue"
            />
          </div>

          {template.depth === 'detailed' && (
            <>
              <div>
                <Label htmlFor="conditions">Conditions</Label>
                <Select 
                  value={initialData.matchContext?.conditions || ''} 
                  onValueChange={(value) => updateMatchContext('conditions', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weather conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perfect">Perfect</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="windy">Windy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="attendance">Attendance</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={initialData.matchContext?.attendance || ''}
                  onChange={(e) => updateMatchContext('attendance', e.target.value)}
                  placeholder="Number of spectators"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Match Overview */}
      {mode === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Match Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.depth !== 'light' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="homeFormation">Home Formation</Label>
                  <Select 
                    value={initialData.overview?.homeFormation || ''} 
                    onValueChange={(value) => updateOverview('homeFormation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select formation" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATION_OPTIONS.map(formation => (
                        <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="awayFormation">Away Formation</Label>
                  <Select 
                    value={initialData.overview?.awayFormation || ''} 
                    onValueChange={(value) => updateOverview('awayFormation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select formation" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATION_OPTIONS.map(formation => (
                        <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="tacticalNotes">Tactical Notes</Label>
              <Textarea
                id="tacticalNotes"
                value={initialData.overview?.tacticalNotes || ''}
                onChange={(e) => updateOverview('tacticalNotes', e.target.value)}
                placeholder="Key tactical observations, pressing style, build-up patterns..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="matchQuality">Match Quality (1-10)</Label>
              <Input
                id="matchQuality"
                type="number"
                min="1"
                max="10"
                value={initialData.overview?.matchQuality || ''}
                onChange={(e) => updateOverview('matchQuality', Number(e.target.value))}
                placeholder="Rate overall match quality"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchReportForm;