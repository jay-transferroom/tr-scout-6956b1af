
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, FileText, Upload, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Import existing admin components
import UserManagement from './admin/UserManagement';
import TemplateAdmin from './TemplateAdmin';
import ReportDataImport from '@/components/ReportDataImport';
import NotificationPreferences from '@/components/settings/NotificationPreferences';

const Settings = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("preferences");

  const isAdmin = profile?.role === 'recruitment' || profile?.role === 'director';

  return (
    <div className="container mx-auto pt-8 pb-16 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and administration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="user-management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="preferences" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Display</CardTitle>
                <CardDescription>
                  Customize your viewing experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="text-sm font-medium">
                    Dark mode
                  </Label>
                  <Switch id="dark-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-view" className="text-sm font-medium">
                    Compact table view
                  </Label>
                  <Switch id="compact-view" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <ReportDataImport />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="user-management" className="mt-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <TemplateAdmin />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
