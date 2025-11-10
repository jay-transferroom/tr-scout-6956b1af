
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Download, Flag, Calendar, MapPin, User, Clock } from "lucide-react";
import { ReportWithPlayer } from "@/types/report";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReportPlayerData } from "@/hooks/useReportPlayerData";
import { extractReportDataForDisplay } from "@/utils/reportDataExtraction";
import { formatReportDate, formatReportTime } from "@/utils/reportFormatting";
import { DEFAULT_TEMPLATES } from "@/data/defaultTemplates";
import ReportSummary from "@/components/reports/ReportSummary";

const ReportView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportWithPlayer | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>("");

  // Fetch player data separately
  const { data: playerData, isLoading: playerLoading } = useReportPlayerData(playerId);

  useEffect(() => {
    // If the ID is "new", redirect to report builder
    if (id === "new") {
      navigate("/report-builder");
      return;
    }

    if (!id || !user) return;
    
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching report with ID:', id);
        
        const { data, error: fetchError } = await supabase
          .from('reports')
          .select(`
            *,
            scout_profile:profiles(*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching report:', fetchError);
          setError('Failed to load report');
          return;
        }

        if (!data) {
          setError('Report not found');
          return;
        }

        // Set the player ID to fetch player data
        setPlayerId(data.player_id);

        // Try to fetch template from database first
        const { data: templateData, error: templateError } = await supabase
          .from('report_templates')
          .select('*')
          .eq('id', data.template_id)
          .single();

        let templateToUse = null;
        
        if (templateError || !templateData) {
          // If template not found in database, check default templates
          console.log('Template not found in database, checking default templates');
          templateToUse = DEFAULT_TEMPLATES.find(t => t.id === data.template_id);
          
          if (!templateToUse) {
            // Fallback to first default template
            templateToUse = DEFAULT_TEMPLATES[0];
            console.log('Using fallback template:', templateToUse.name);
          }
        } else {
          // Convert database template to our format
          templateToUse = {
            id: templateData.id,
            name: templateData.name,
            description: templateData.description || '',
            defaultTemplate: templateData.default_template || false,
            defaultRatingSystem: templateData.default_rating_system,
            sections: templateData.sections || []
          };
        }

        setTemplate(templateToUse);

        // Store the report data without player info for now
        const reportWithoutPlayer = {
          id: data.id,
          playerId: data.player_id,
          templateId: data.template_id,
          scoutId: data.scout_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          status: data.status as 'draft' | 'submitted' | 'reviewed',
          sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections || [],
          matchContext: typeof data.match_context === 'string' ? JSON.parse(data.match_context) : data.match_context,
          tags: data.tags || [],
          flaggedForReview: data.flagged_for_review || false,
          scoutProfile: data.scout_profile ? {
            id: data.scout_profile.id,
            first_name: data.scout_profile.first_name,
            last_name: data.scout_profile.last_name,
            email: data.scout_profile.email,
            role: data.scout_profile.role as 'scout' | 'recruitment',
          } : undefined,
        };

        // We'll set the full report once player data is loaded
        setReport({ ...reportWithoutPlayer, player: null } as any);
      } catch (err) {
        console.error('Error in fetchReport:', err);
        setError('An error occurred while loading the report');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id, user, navigate]);

  // Update report with player data when it's available
  useEffect(() => {
    if (report && playerData && !report.player) {
      setReport(prev => prev ? { ...prev, player: playerData } : null);
    }
  }, [report, playerData]);

  if (loading || playerLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-lg">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4 text-lg font-medium">{error}</p>
            <Button onClick={() => navigate("/reports")} variant="outline">
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!report || !report.player) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-lg">Report not found</p>
            <Button onClick={() => navigate("/reports")} variant="outline">
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportData = extractReportDataForDisplay(report, template);
  const canEdit = report.scoutId === user?.id;

  return (
    <div className="container mx-auto py-3 sm:py-6 max-w-5xl px-3 sm:px-4">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-3 sm:mb-6 gap-2">
        <Button variant="ghost" onClick={() => navigate("/reports")} className="gap-1 sm:gap-2 hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10">
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Back to Reports</span>
          <span className="xs:hidden">Back</span>
        </Button>
        
        <div className="flex gap-1 sm:gap-2">
          {canEdit && (
            <Button onClick={() => navigate(`/report/${report.id}/edit`)} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit Report</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          )}
          <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </Button>
          {report.flaggedForReview && (
            <Button variant="outline" className="gap-1 sm:gap-2 text-orange-600 border-orange-200 bg-orange-50 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10 hidden md:flex">
              <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
              Flagged for Review
            </Button>
          )}
        </div>
      </div>

      {/* Match Context */}
      {report.matchContext && (
        <Card className="mb-3 sm:mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-sm sm:text-base font-semibold">Match Context</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Opposition:</span>
                <p className="font-medium">{report.matchContext.opposition}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Competition:</span>
                <p className="font-medium">{report.matchContext.competition}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">{formatReportDate(new Date(report.matchContext.date))}</p>
              </div>
              {report.matchContext.minutesPlayed > 0 && (
                <div>
                  <span className="text-muted-foreground">Minutes:</span>
                  <p className="font-medium">{report.matchContext.minutesPlayed}'</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary Component */}
      <ReportSummary report={report} template={template} />

      {/* Enhanced Player Header */}
      <Card className="mb-3 sm:mb-6 overflow-hidden">
        <CardContent className="p-0">
          <Link 
            to={report.player.isPrivatePlayer 
              ? `/private-player/${report.playerId}` 
              : `/player/${report.playerId}`
            }
            className="block hover:bg-gray-50 transition-colors"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-6 hover:from-blue-100 hover:to-purple-100 transition-all cursor-pointer">
              <div className="flex items-start gap-3 sm:gap-6">
                {report.player.image ? (
                  <img 
                    src={report.player.image} 
                    alt={report.player.name} 
                    className="w-12 h-12 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg" 
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 sm:border-4 border-white shadow-lg">
                    <span className="text-base sm:text-2xl font-bold text-white">
                      {report.player.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 hover:text-blue-700 transition-colors">{report.player.name}</h1>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">{report.player.club}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{report.player.positions.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{report.player.age} years old</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {report.player.positions.map((position) => (
                      <Badge key={position} variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0">
                        {position}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={
                      report.status === 'submitted' ? 'default' : 
                      report.status === 'draft' ? 'secondary' : 'outline'
                    }
                    className="mb-1 sm:mb-2 text-xs"
                  >
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">{formatReportDate(report.createdAt)}</span>
                      <span className="sm:hidden text-[10px]">{formatReportDate(report.createdAt).split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card className="mb-3 sm:mb-6">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Scout</p>
              <p className="text-sm sm:text-base font-medium truncate">
                {report.scoutProfile 
                  ? `${report.scoutProfile.first_name} ${report.scoutProfile.last_name}`
                  : 'Unknown Scout'
                }
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Template</p>
              <p className="text-sm sm:text-base font-medium truncate">{template?.name || 'Unknown Template'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Created</p>
              <p className="text-sm sm:text-base font-medium">{formatReportTime(report.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="text-sm sm:text-base font-medium">{formatReportTime(report.updatedAt)}</p>
            </div>
          </div>

          {report.matchContext && (
            <>
              <Separator className="my-3 sm:my-4" />
              <div>
                <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3 flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Match Context
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-gray-50 p-2 sm:p-4 rounded-lg text-xs sm:text-sm">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-medium">{report.matchContext.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Opposition</p>
                    <p className="font-medium">{report.matchContext.opposition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Competition</p>
                    <p className="font-medium">{report.matchContext.competition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Minutes Played</p>
                    <p className="font-medium">{report.matchContext.minutesPlayed}'</p>
                  </div>
                </div>
                {report.matchContext.conditions && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Match Conditions</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{report.matchContext.conditions}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {report.tags && report.tags.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Sections */}
      <div className="space-y-3 sm:space-y-6">
        {reportData.map((section, index) => (
          <Card key={section.sectionId} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl text-gray-900">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {section.fields.map((field, fieldIndex) => (
                  <div key={field.fieldId} className={fieldIndex < section.fields.length - 1 ? "pb-3 sm:pb-4 border-b border-gray-100" : ""}>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{field.label}</h4>
                    {field.value !== null && field.value !== undefined && field.value !== "" ? (
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-sm sm:text-base text-gray-800">{field.displayValue}</p>
                        </div>
                        {field.notes && (
                          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border-l-2 sm:border-l-4 border-blue-200">
                            <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1">Scout Notes:</p>
                            <p className="text-blue-700 text-xs sm:text-sm italic">{field.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-400 italic bg-gray-50 p-2 sm:p-3 rounded-lg">No data recorded for this field</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportView;
