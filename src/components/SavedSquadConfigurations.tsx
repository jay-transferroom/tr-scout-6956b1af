import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Trash2, 
  Eye, 
  Calendar,
  MoreVertical,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  useSquadConfigurations, 
  useDeleteSquadConfiguration,
  useUpdateSquadConfiguration,
  SquadConfiguration 
} from "@/hooks/useSquadConfigurations";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getSquadDisplayName } from "@/utils/squadUtils";

interface SavedSquadConfigurationsProps {
  clubName: string;
  onLoadConfiguration: (config: SquadConfiguration) => void;
}

const SavedSquadConfigurations = ({ 
  clubName, 
  onLoadConfiguration 
}: SavedSquadConfigurationsProps) => {
  const { data: configurations = [], isLoading } = useSquadConfigurations(clubName);
  const deleteConfiguration = useDeleteSquadConfiguration();
  const updateConfiguration = useUpdateSquadConfiguration();

  const handleSetDefault = async (config: SquadConfiguration) => {
    try {
      await updateConfiguration.mutateAsync({
        id: config.id,
        is_default: !config.is_default,
        club_name: config.club_name,
      });

      toast({
        title: config.is_default ? "Default removed" : "Default set",
        description: config.is_default 
          ? `${config.name} is no longer the default configuration`
          : `${config.name} is now the default configuration`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default configuration",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteConfiguration.mutateAsync({ id, clubName });
      toast({
        title: "Configuration deleted",
        description: `${name} has been removed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive"
      });
    }
  };

  const handleLoad = (config: SquadConfiguration) => {
    onLoadConfiguration(config);
    toast({
      title: "Configuration loaded",
      description: `${config.name} has been applied`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Saved Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (configurations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Saved Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No saved configurations yet. Create one by assigning players to positions and saving.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Saved Configurations
          <Badge variant="secondary" className="ml-auto">
            {configurations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {configurations.map((config) => (
          <div 
            key={config.id} 
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{config.name}</h4>
                {config.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleLoad(config)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Load Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetDefault(config)}>
                    <Star className={`h-4 w-4 mr-2 ${config.is_default ? 'fill-current' : ''}`} />
                    {config.is_default ? 'Remove as Default' : 'Set as Default'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(config.id, config.name)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{config.formation}</Badge>
              <Badge variant="secondary">{getSquadDisplayName(config.squad_type)}</Badge>
              <Badge variant="outline">
                {config.position_assignments.length} positions
              </Badge>
              {config.overall_rating && (
                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                  ⭐ {config.overall_rating} Overall
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Saved {format(new Date(config.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedSquadConfigurations;
