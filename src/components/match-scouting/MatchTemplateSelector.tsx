import { MatchTemplate, MATCH_TEMPLATES } from "@/types/matchReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Trophy } from "lucide-react";

interface MatchTemplateSelectorProps {
  onSelect: (template: MatchTemplate) => void;
}

const MatchTemplateSelector = ({ onSelect }: MatchTemplateSelectorProps) => {
  const getDepthColor = (depth: string) => {
    switch (depth) {
      case 'light': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'detailed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepthIcon = (depth: string) => {
    switch (depth) {
      case 'light': return <Clock size={16} />;
      case 'standard': return <Users size={16} />;
      case 'detailed': return <Trophy size={16} />;
      default: return null;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {MATCH_TEMPLATES.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge className={getDepthColor(template.depth)}>
                <div className="flex items-center gap-1">
                  {getDepthIcon(template.depth)}
                  {template.depth}
                </div>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {template.targetAgeGroup && (
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-muted-foreground" />
                  <span>Target: {template.targetAgeGroup}</span>
                </div>
              )}
              
              {template.targetLevel && (
                <div className="flex items-center gap-2 text-sm">
                  <Trophy size={16} className="text-muted-foreground" />
                  <span>Level: {template.targetLevel}</span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Includes:</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.map((section) => (
                    <Badge key={section.id} variant="outline" className="text-xs">
                      {section.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => onSelect(template)}
              >
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchTemplateSelector;