import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ScoutUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  role: string;
}

interface ScoutAccessCellProps {
  userId: string;
  mode: string;
  selectedScoutIds: string[];
  scoutUsers: ScoutUser[];
  isEditable: boolean;
  onModeChange: (mode: string, scoutIds?: string[]) => void;
}

export const ScoutAccessCell = ({
  userId,
  mode,
  selectedScoutIds,
  scoutUsers,
  isEditable,
  onModeChange,
}: ScoutAccessCellProps) => {
  const [open, setOpen] = useState(false);
  const [scoutSelectOpen, setScoutSelectOpen] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedScoutIds);

  useEffect(() => {
    setLocalSelectedIds(selectedScoutIds);
  }, [selectedScoutIds]);

  const getScoutName = (id: string) => {
    const scout = scoutUsers.find(s => s.id === id);
    if (!scout) return 'Unknown';
    if (scout.first_name && scout.last_name) return `${scout.first_name} ${scout.last_name}`;
    if (scout.first_name) return scout.first_name;
    return scout.email;
  };

  const toggleScout = (scoutId: string) => {
    const newIds = localSelectedIds.includes(scoutId)
      ? localSelectedIds.filter(id => id !== scoutId)
      : [...localSelectedIds, scoutId];
    setLocalSelectedIds(newIds);
    onModeChange('custom', newIds);
  };

  if (!isEditable) {
    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={cn("text-xs bg-muted/60 text-muted-foreground border-border", mode === 'custom' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>{mode === 'all' ? 'All' : 'Custom'}</Badge>
        {mode === 'custom' && selectedScoutIds.map(id => (
          <Badge key={id} variant="outline" className="text-[10px] font-normal">
            {getScoutName(id)}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
            <Badge
              variant="outline"
              className={cn(
                "text-xs pointer-events-none bg-muted/60 text-muted-foreground border-border",
                mode === 'custom' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              )}
            >
              {mode === 'all' ? 'All' : 'Custom'}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          <button
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-accent",
              mode === 'all' && "bg-accent"
            )}
            onClick={() => { onModeChange('all'); setOpen(false); }}
          >
            All
          </button>
          <button
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-accent",
              mode === 'custom' && "bg-accent"
            )}
            onClick={() => { onModeChange('custom', localSelectedIds); setOpen(false); }}
          >
            Custom
          </button>
        </PopoverContent>
      </Popover>

      {mode === 'custom' && (
        <div className="space-y-1">
          <Popover open={scoutSelectOpen} onOpenChange={setScoutSelectOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2">
                Select scouts
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1 max-h-48 overflow-y-auto" align="start">
              {scoutUsers.map(scout => (
                <button
                  key={scout.id}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm hover:bg-accent text-left"
                  onClick={() => toggleScout(scout.id)}
                >
                  <div className={cn(
                    "h-3.5 w-3.5 rounded-sm border flex items-center justify-center",
                    localSelectedIds.includes(scout.id) && "bg-primary border-primary"
                  )}>
                    {localSelectedIds.includes(scout.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{getScoutName(scout.id)}</span>
                </button>
              ))}
              {scoutUsers.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No scouts found</div>
              )}
            </PopoverContent>
          </Popover>
          {localSelectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {localSelectedIds.map(id => (
                <Badge key={id} variant="outline" className="text-[10px] font-normal gap-0.5 pr-1">
                  {getScoutName(id)}
                  <button onClick={() => toggleScout(id)} className="ml-0.5 hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ShortlistAccessCellProps {
  mode: string;
  isEditable: boolean;
  onModeChange: (mode: string) => void;
}

export const ShortlistAccessCell = ({
  mode,
  isEditable,
  onModeChange,
}: ShortlistAccessCellProps) => {
  const [open, setOpen] = useState(false);

  const badgeClass = mode === 'own_only'
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "";

  if (!isEditable) {
    return (
      <Badge variant="secondary" className={cn("text-xs", badgeClass)}>
        {mode === 'all' ? 'All' : 'Own only'}
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-normal">
          <Badge
            variant="secondary"
            className={cn("text-xs pointer-events-none", badgeClass)}
          >
            {mode === 'all' ? 'All' : 'Own only'}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start">
        <button
          className={cn(
            "w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-accent",
            mode === 'all' && "bg-accent"
          )}
          onClick={() => { onModeChange('all'); setOpen(false); }}
        >
          All
        </button>
        <button
          className={cn(
            "w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-accent",
            mode === 'own_only' && "bg-accent"
          )}
          onClick={() => { onModeChange('own_only'); setOpen(false); }}
        >
          Own only
        </button>
      </PopoverContent>
    </Popover>
  );
};
