import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, FileText, Shield, Upload } from "lucide-react";
import ClubRatingsTab from "@/components/club-settings/ClubRatingsTab";
import ScoutingTemplatesTab from "@/components/club-settings/ScoutingTemplatesTab";
import UserManagementTab from "@/components/club-settings/UserManagementTab";
import DataImportTab from "@/components/club-settings/DataImportTab";
import { useAuth } from "@/contexts/AuthContext";

const ClubSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "ratings";
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'recruitment' || profile?.role === 'director';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="container mx-auto pt-8 pb-16 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Club Settings</h1>
        <p className="text-muted-foreground">
          Manage your club's ratings, templates, users, and data imports
        </p>
      </div>

      <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="ratings" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Club Ratings
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                Scouting Templates
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Shield className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="ratings">
          <ClubRatingsTab />
        </TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="templates">
              <ScoutingTemplatesTab />
            </TabsContent>
            <TabsContent value="users">
              <UserManagementTab />
            </TabsContent>
            <TabsContent value="import">
              <DataImportTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ClubSettings;
