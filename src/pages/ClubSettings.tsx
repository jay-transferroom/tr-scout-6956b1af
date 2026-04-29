import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, FileText, Shield, Upload, Star, ClipboardList, ThumbsUp, Workflow } from "lucide-react";
import ClubRatingsTab from "@/components/club-settings/ClubRatingsTab";
import RatingSystemsTab, { createDefaultNamedSystems } from "@/components/club-settings/RatingSystemsTab";
import ScoutingTemplatesTab from "@/components/club-settings/ScoutingTemplatesTab";
import MatchReportConfigTab from "@/components/club-settings/MatchReportConfigTab";
import RecommendationsTab from "@/components/club-settings/RecommendationsTab";
import PipelineTab from "@/components/club-settings/PipelineTab";
import UserManagementTab from "@/components/club-settings/UserManagementTab";
import DataImportTab from "@/components/club-settings/DataImportTab";
import { useAuth } from "@/contexts/AuthContext";
import { NamedRatingSystem } from "@/types/report";

const ClubSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "ratings";
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'recruitment' || profile?.role === 'director';
  const [namedRatingSystems, setNamedRatingSystems] = useState<NamedRatingSystem[]>(createDefaultNamedSystems());

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
              <TabsTrigger value="rating-systems" className="gap-2">
                <Star className="h-4 w-4" />
                Rating Systems
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                Scouting Templates
              </TabsTrigger>
              <TabsTrigger value="match-reports" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Match Reports
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2">
                <ThumbsUp className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <Workflow className="h-4 w-4" />
                Pipeline
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
            <TabsContent value="rating-systems">
              <RatingSystemsTab namedRatingSystems={namedRatingSystems} onUpdate={setNamedRatingSystems} />
            </TabsContent>
            <TabsContent value="templates">
              <ScoutingTemplatesTab availableRatingSystems={namedRatingSystems} />
            </TabsContent>
            <TabsContent value="match-reports">
              <MatchReportConfigTab availableRatingSystems={namedRatingSystems} />
            </TabsContent>
            <TabsContent value="recommendations">
              <RecommendationsTab />
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
