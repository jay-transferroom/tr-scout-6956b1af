import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlaskConical } from "lucide-react";
import { Report } from "@/types/report";
import { fillReportWithTestData } from "@/utils/reportTestData";
import { toast } from "sonner";

interface TestDataFillerProps {
  report: Report;
  template: any;
  onReportUpdate: (report: Report) => void;
}

const TestDataFiller = ({ report, template, onReportUpdate }: TestDataFillerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFillReport = (quality: 'good' | 'average' | 'poor') => {
    const updatedReport = fillReportWithTestData(report, template, quality);
    onReportUpdate(updatedReport);
    
    const qualityLabel = quality.charAt(0).toUpperCase() + quality.slice(1);
    toast.success(`Report filled with ${qualityLabel} test data`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity"
          title="Fill with test data (Dev Tool)"
        >
          <FlaskConical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border shadow-md">
        <DropdownMenuItem 
          onClick={() => handleFillReport('good')}
          className="cursor-pointer hover:bg-accent"
        >
          <div className="flex flex-col">
            <span className="font-medium text-green-600">Good Report</span>
            <span className="text-xs text-muted-foreground">High ratings & positive feedback</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleFillReport('average')}
          className="cursor-pointer hover:bg-accent"
        >
          <div className="flex flex-col">
            <span className="font-medium text-yellow-600">Average Report</span>
            <span className="text-xs text-muted-foreground">Mixed ratings & balanced feedback</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleFillReport('poor')}
          className="cursor-pointer hover:bg-accent"
        >
          <div className="flex flex-col">
            <span className="font-medium text-red-600">Poor Report</span>
            <span className="text-xs text-muted-foreground">Low ratings & critical feedback</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TestDataFiller;
