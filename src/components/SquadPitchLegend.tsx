import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Hash, AlertCircle } from "lucide-react";

const SquadPitchLegend = () => {
  return (
    <Card className="p-4 mb-4 bg-muted/30">
      <div className="flex items-center gap-6 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500/20 border-2 border-purple-500" />
          <span className="text-muted-foreground">Recommended position to strengthen</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">Insufficient depth at position</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Player depth at position</span>
        </div>
        
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">Average player rating</span>
        </div>
      </div>
    </Card>
  );
};

export default SquadPitchLegend;
