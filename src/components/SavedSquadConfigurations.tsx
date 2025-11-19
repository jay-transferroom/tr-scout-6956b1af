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
  loadedConfigurationId?: string;
}

const SavedSquadConfigurations = ({ 
  clubName, 
  onLoadConfiguration,
  loadedConfigurationId
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Save className="h-4 w-4" />
          Saved Configurations
          <Badge variant="secondary" className="ml-auto text-xs">
            {configurations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {configurations.map((config) => {
          const isLoaded = config.id === loadedConfigurationId;
          return (
            <div 
              key={config.id} 
              className={`p-3 border rounded-md transition-colors ${
                isLoaded 
                  ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm truncate ${isLoaded ? 'text-primary' : ''}`}>
                    {config.name}
                  </span>
                  {isLoaded && (
                    <Badge variant="default" className="text-xs">Loaded</Badge>
                  )}
                  {config.is_default && (
                    <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                  )}
                <Badge variant="outline" className="text-xs">{config.formation}</Badge>
                {config.overall_rating && (
                  <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    ⭐ {config.overall_rating}
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3 w-3" />
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
          </div>
        );
        })}
      </CardContent>
    </Card>
  );
};

export default SavedSquadConfigurations;
