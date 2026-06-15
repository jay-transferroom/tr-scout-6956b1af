import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserAccessSettings } from '@/hooks/useUserAccessSettings';
import { useQueryClient } from '@tanstack/react-query';

type ShortlistMode = 'created' | 'specific' | 'all';

interface ScoutProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ShortlistOption {
  id: string;
  name: string;
}

interface RowState {
  mode: ShortlistMode;
  ids: string[];
}

const MODE_LABEL: Record<ShortlistMode, string> = {
  created: 'Created only',
  specific: 'Specific',
  all: 'All',
};

const normalizeMode = (raw: string | undefined): ShortlistMode => {
  if (raw === 'specific') return 'specific';
  if (raw === 'created' || raw === 'created_only' || raw === 'own') return 'created';
  return 'all';
};

const UserManagementTab = () => {
  const [scouts, setScouts] = useState<ScoutProfile[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [initial, setInitial] = useState<Record<string, RowState>>({});
  const [saving, setSaving] = useState(false);

  const { data: accessSettings = [] } = useUserAccessSettings();
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: profiles, error: pErr }, { data: lists, error: lErr }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id,email,first_name,last_name,role')
              .eq('role', 'scout')
              .order('first_name'),
            supabase
              .from('shortlists')
              .select('id,name')
              .order('name'),
          ]);
        if (pErr) throw pErr;
        if (lErr) throw lErr;
        setScouts((profiles as ScoutProfile[]) || []);
        setShortlists((lists as ShortlistOption[]) || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load shortlist access data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build initial state from access settings whenever they (or scouts) change.
  useEffect(() => {
    if (!scouts.length) return;
    const built: Record<string, RowState> = {};
    scouts.forEach((s) => {
      const setting = accessSettings.find((a: any) => a.user_id === s.id) as any;
      built[s.id] = {
        mode: normalizeMode(setting?.shortlist_access_mode),
        ids: Array.isArray(setting?.shortlist_access_ids)
          ? (setting.shortlist_access_ids as string[])
          : [],
      };
    });
    setInitial(built);
    setRows(built);
  }, [scouts, accessSettings]);

  const dirtyUserIds = useMemo(() => {
    return Object.keys(rows).filter((uid) => {
      const a = rows[uid];
      const b = initial[uid];
      if (!b) return true;
      if (a.mode !== b.mode) return true;
      if (a.mode === 'specific') {
        const sa = [...a.ids].sort().join(',');
        const sb = [...b.ids].sort().join(',');
        if (sa !== sb) return true;
      }
      return false;
    });
  }, [rows, initial]);

  const hasUnsaved = dirtyUserIds.length > 0;

  const setRow = (uid: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [uid]: { ...prev[uid], ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const uid of dirtyUserIds) {
        const r = rows[uid];
        await (supabase
          .from('user_access_settings' as any)
          .upsert(
            {
              user_id: uid,
              shortlist_access_mode: r.mode,
              shortlist_access_ids: r.mode === 'specific' ? r.ids : [],
            } as any,
            { onConflict: 'user_id' },
          ));
      }
      setInitial(rows);
      toast.success('Shortlist access saved');
      queryClient.invalidateQueries({ queryKey: ['user-access-settings'] });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setRows(initial);

  const getInitials = (s: ScoutProfile) =>
    `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() ||
    s.email[0].toUpperCase();

  const getName = (s: ScoutProfile) =>
    [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading scouts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shortlist Access</h2>
          <p className="text-sm text-muted-foreground">
            Control which shortlists each scout can see.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsaved && (
            <span className="text-xs text-muted-foreground">
              Unsaved changes ({dirtyUserIds.length})
            </span>
          )}
          {hasUnsaved && (
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={saving}>
              Discard
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!hasUnsaved || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {scouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No scouts found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scout</TableHead>
                  <TableHead className="w-[640px]">Shortlist access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scouts.map((s) => {
                  const row = rows[s.id] ?? { mode: 'all' as ShortlistMode, ids: [] };
                  const isDirty = dirtyUserIds.includes(s.id);
                  return (
                    <TableRow key={s.id} className={cn(isDirty && 'bg-muted/40')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(s)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{getName(s)}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {s.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2 flex-wrap">
                          <Select
                            value={row.mode}
                            onValueChange={(v) =>
                              setRow(s.id, { mode: v as ShortlistMode })
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Created only</SelectItem>
                              <SelectItem value="specific">Specific</SelectItem>
                              <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                          </Select>
                          {row.mode === 'specific' && (
                            <ShortlistMultiSelect
                              options={shortlists}
                              value={row.ids}
                              onChange={(ids) => setRow(s.id, { ids })}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface MultiSelectProps {
  options: ShortlistOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}

const ShortlistMultiSelect = ({ options, value, onChange }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.filter((o) => value.includes(o.id));
  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [options, query],
  );

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const allSelected = options.length > 0 && selected.length === options.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          className="justify-between h-8"
        >
          <span className="text-sm">
            {selected.length === 0
              ? 'Select shortlists'
              : selected.length === options.length
                ? `All ${options.length} shortlists`
                : `${selected.length} of ${options.length}`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shortlists..."
              className="h-8 pl-7 text-sm"
            />
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-muted-foreground">
              {selected.length} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                onClick={() => onChange(options.map((o) => o.id))}
                disabled={allSelected}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline disabled:opacity-40 disabled:no-underline"
                onClick={() => onChange([])}
                disabled={selected.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No shortlists match
            </div>
          ) : (
            filtered.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      checked ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{o.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserManagementTab;
