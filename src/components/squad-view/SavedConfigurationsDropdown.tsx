import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Save, ChevronDown, Star, Trash2 } from "lucide-react";
import { 
  useSquadConfigurations, 
  useDeleteSquadConfiguration,
  useUpdateSquadConfiguration,
  SquadConfiguration 
} from "@/hooks/useSquadConfigurations";
import { toast } from "@/hooks/use-toast";


interface SavedConfigurationsDropdownProps {
  clubName: string;
  onLoadConfiguration: (config: SquadConfiguration) => void;
  loadedConfigurationId?: string;
}

const SavedConfigurationsDropdown = ({
  clubName,
  onLoadConfiguration,
  loadedConfigurationId
}: SavedConfigurationsDropdownProps) => {
  const { data: configurations = [], isLoading } = useSquadConfigurations(clubName);
  const deleteConfiguration = useDeleteSquadConfiguration();
  const updateConfiguration = useUpdateSquadConfiguration();

  const handleSetDefault = async (config: SquadConfiguration, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (config: SquadConfiguration, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConfiguration.mutateAsync({ id: config.id, clubName });
      toast({
        title: "Configuration deleted",
        description: `${config.name} has been removed`,
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
  };

  const loadedConfig = configurations.find(c => c.id === loadedConfigurationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {loadedConfig ? loadedConfig.name : 'Configurations'}
          </span>
          <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
            {configurations.length}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Saved Configurations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : configurations.length === 0 ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            No saved configurations yet
          </div>
        ) : (
          configurations.map((config) => {
            const isLoaded = config.id === loadedConfigurationId;
            return (
              <DropdownMenuItem
                key={config.id}
                className={`flex items-center justify-between p-2 cursor-pointer ${isLoaded ? 'bg-primary/10' : ''}`}
                onClick={() => handleLoad(config)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-sm truncate ${isLoaded ? 'text-primary' : ''}`}>
                        {config.name}
                      </span>
                      {config.is_default && (
                        <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                      )}
                      {isLoaded && (
                        <Badge variant="default" className="text-[10px] h-4 px-1">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{config.formation}</span>
                      {config.overall_rating && (
                        <>
                          <span>•</span>
                          <span>⭐ {config.overall_rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleSetDefault(config, e)}
                  >
                    <Star className={`h-3 w-3 ${config.is_default ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(config, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SavedConfigurationsDropdown;
