import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, TrendingUp, Hash, TriangleAlert, Info } from "lucide-react";

const SquadPitchLegend = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Legend
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Squad View Legend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500 flex-shrink-0" />
            <span className="text-sm">Recommended position to strengthen</span>
          </div>
          
          <div className="flex items-center gap-3">
            <TriangleAlert className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <span className="text-sm">Alert (injury, contract expiry, or ageing player)</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Hash className="h-6 w-6 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">Player depth at position</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-base px-2.5 py-1 flex-shrink-0">ø</Badge>
            <span className="text-sm">Average player rating</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SquadPitchLegend;
