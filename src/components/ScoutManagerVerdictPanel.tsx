
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Plus, Edit3 } from "lucide-react";
import VerdictSelector from "@/components/VerdictSelector";
import VerdictBadge from "@/components/VerdictBadge";
import { useAuth } from "@/contexts/AuthContext";

interface ScoutManagerVerdictPanelProps {
  playerId: string;
  playerName: string;
  currentVerdict?: string | null;
  onVerdictUpdate?: (verdict: string) => void;
}

const ScoutManagerVerdictPanel = ({ 
  playerId, 
  playerName, 
  currentVerdict, 
  onVerdictUpdate 
}: ScoutManagerVerdictPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<string>(currentVerdict || "");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  // Only show for recruitment users (who act as scout managers)
  const canAddVerdict = profile?.role === 'recruitment';

  if (!canAddVerdict) {
    return null;
  }

  const handleSaveVerdict = async () => {
    if (!selectedVerdict) return;
    
    setIsLoading(true);
    try {
      // Here you would typically save to a database
      // For now, we'll just call the callback
      onVerdictUpdate?.(selectedVerdict);
      setIsEditing(false);
      console.log(`Scout Manager verdict for ${playerName}: ${selectedVerdict}`);
    } catch (error) {
      console.error('Error saving verdict:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedVerdict(currentVerdict || "");
    setIsEditing(false);
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
          <UserCheck className="h-5 w-5" />
          Scout Manager Decision
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isEditing ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentVerdict ? (
                  <>
                    <span className="text-sm text-muted-foreground">Current recommendation:</span>
                    <VerdictBadge verdict={currentVerdict} />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    No recommendation set yet
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                {currentVerdict ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit Recommendation
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Recommendation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Set your recommendation for {playerName}:
                </label>
                <VerdictSelector
                  value={selectedVerdict}
                  onValueChange={setSelectedVerdict}
                  placeholder="Select your recommendation..."
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveVerdict}
                  disabled={!selectedVerdict || isLoading}
                  size="sm"
                >
                  {isLoading ? "Saving..." : "Save Recommendation"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Scout Manager Note:</strong> This recommendation represents your final decision 
              on this player after reviewing all scout reports and assessments.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoutManagerVerdictPanel;
