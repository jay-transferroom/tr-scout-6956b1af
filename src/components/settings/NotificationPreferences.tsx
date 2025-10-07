import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/useNotificationSettings";
import { NotificationSettings } from "@/types/notification";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const NOTIFICATION_OPTIONS = [
  { key: 'scout_management' as keyof NotificationSettings, label: 'Scout Management', description: 'Notifications about scouting assignments and updates' },
  { key: 'status_update' as keyof NotificationSettings, label: 'Status Updates', description: 'When report statuses change' },
  { key: 'player_tracking' as keyof NotificationSettings, label: 'Player Tracking', description: 'Updates on tracked players' },
  { key: 'xtv_change' as keyof NotificationSettings, label: 'XTV Changes', description: 'When player XTV scores are updated' },
  { key: 'injury' as keyof NotificationSettings, label: 'Injuries', description: 'Player injury notifications' },
  { key: 'transfer' as keyof NotificationSettings, label: 'Transfers', description: 'Transfer-related updates' },
  { key: 'availability' as keyof NotificationSettings, label: 'Availability', description: 'Player availability changes' },
  { key: 'market_tracking' as keyof NotificationSettings, label: 'Market Tracking', description: 'Market trends and insights' },
  { key: 'comparable_players' as keyof NotificationSettings, label: 'Comparable Players', description: 'Similar player suggestions' },
  { key: 'players_of_interest' as keyof NotificationSettings, label: 'Players of Interest', description: 'Updates on shortlisted players' },
  { key: 'questions' as keyof NotificationSettings, label: 'Questions', description: 'When questions need your attention' },
  { key: 'chatbot' as keyof NotificationSettings, label: 'AI Assistant', description: 'AI chatbot notifications' },
];

const NotificationPreferences = () => {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    
    try {
      await updateSettings.mutateAsync({
        [key]: !settings[key]
      });
      toast.success('Notification preference updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update notification preference');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div key={option.key} className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor={option.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {option.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Switch
              id={option.key}
              checked={settings?.[option.key] ?? false}
              onCheckedChange={() => handleToggle(option.key)}
              disabled={updateSettings.isPending}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
