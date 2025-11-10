import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportWithPlayer, Report } from '@/types/report';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TEMPLATES } from '@/data/defaultTemplates';
import { mockTemplates } from '@/data/mockTemplates';

export const useReports = () => {
  const [reports, setReports] = useState<ReportWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('reports')
        .select(`
          *,
          scout_profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      // If user is a scout, only show their reports
      if (profile?.role === 'scout') {
        query = query.eq('scout_id', user.id);
      }

      const { data, error } = await query;

      // Gather template names for the fetched reports
      const templateIds = Array.from(new Set(((data as any[]) || []).map((r: any) => r.template_id).filter(Boolean)));
      const templatesById: Record<string, string> = {};
      if (templateIds.length > 0) {
        const { data: templatesData } = await supabase
          .from('report_templates')
          .select('id, name')
          .in('id', templateIds);
        (templatesData || []).forEach((t: any) => {
          if (t?.id && t?.name) templatesById[t.id] = t.name;
        });
      }
      // Fallback to default templates and mocks
      DEFAULT_TEMPLATES.forEach((t) => {
        if (t?.id && t?.name && !templatesById[t.id]) templatesById[t.id] = t.name;
      });
      mockTemplates.forEach((t) => {
        if (t?.id && t?.name && !templatesById[t.id]) templatesById[t.id] = t.name;
      });

      if (error) throw error;

      console.log('Raw reports data from database:', data);
      console.log('Current user ID:', user.id);
      console.log('User profile role:', profile?.role);

      // Transform the data and fetch player data for each report
      const transformedReports: any[] = await Promise.all(
        (data || []).map(async (report: any) => {
          console.log(`Processing report ${report.id}:`, {
            scoutId: report.scout_id,
            status: report.status,
            playerId: report.player_id,
            sections: report.sections,
            sectionsType: typeof report.sections,
            isArray: Array.isArray(report.sections)
          });

          // Parse sections if it's a string
          let sections = report.sections;
          if (typeof sections === 'string') {
            try {
              sections = JSON.parse(sections);
              console.log(`Parsed sections for report ${report.id}:`, sections);
            } catch (e) {
              console.log(`Failed to parse sections for report ${report.id}:`, e);
              sections = [];
            }
          }

          // Fetch player data for this report
          let playerData = null;
          if (report.player_id) {
            try {
              // Check if the ID is numeric (from players_new table)
              if (/^\d+$/.test(report.player_id)) {
                const { data: playerNewData } = await supabase
                  .from('players_new')
                  .select('*')
                  .eq('id', parseInt(report.player_id))
                  .single();
                
                if (playerNewData) {
                  playerData = {
                    id: playerNewData.id.toString(),
                    name: playerNewData.name,
                    club: playerNewData.currentteam || playerNewData.parentteam || 'Unknown',
                    age: playerNewData.age || 0,
                    dateOfBirth: playerNewData.birthdate || '',
                    positions: [playerNewData.firstposition, playerNewData.secondposition].filter(Boolean),
                    dominantFoot: 'Right' as const,
                    nationality: playerNewData.firstnationality || 'Unknown',
                    contractStatus: 'Under Contract' as const,
                    contractExpiry: playerNewData.contractexpiration,
                    region: 'Europe',
                    image: playerNewData.imageurl,
                  };
                }
              } else {
                // UUID format - check players table first, then private_players
                const { data: playersData } = await supabase
                  .from('players')
                  .select('*')
                  .eq('id', report.player_id)
                  .maybeSingle();

                if (playersData) {
                  playerData = {
                    id: playersData.id,
                    name: playersData.name,
                    club: playersData.club,
                    age: playersData.age,
                    dateOfBirth: playersData.date_of_birth,
                    positions: playersData.positions,
                    dominantFoot: playersData.dominant_foot,
                    nationality: playersData.nationality,
                    contractStatus: playersData.contract_status,
                    contractExpiry: playersData.contract_expiry,
                    region: playersData.region,
                    image: playersData.image_url,
                  };
                } else {
                  // Check private_players table
                  const { data: privatePlayerData } = await supabase
                    .from('private_players')
                    .select('*')
                    .eq('id', report.player_id)
                    .maybeSingle();

                  if (privatePlayerData) {
                    playerData = {
                      id: privatePlayerData.id,
                      name: privatePlayerData.name,
                      club: privatePlayerData.club || 'Unknown',
                      age: privatePlayerData.age || 0,
                      dateOfBirth: privatePlayerData.date_of_birth || '',
                      positions: privatePlayerData.positions || [],
                      dominantFoot: privatePlayerData.dominant_foot || 'Right',
                      nationality: privatePlayerData.nationality || 'Unknown',
                      contractStatus: 'Private Player' as any,
                      contractExpiry: null,
                      region: privatePlayerData.region || 'Unknown',
                      isPrivatePlayer: true,
                    };
                  }
                }
              }
            } catch (playerError) {
              console.error(`Error fetching player data for report ${report.id}:`, playerError);
            }
          }

          return {
            id: report.id,
            playerId: report.player_id,
            templateId: report.template_id,
            templateName: templatesById[report.template_id],
            scoutId: report.scout_id,
            createdAt: new Date(report.created_at),
            updatedAt: new Date(report.updated_at),
            status: report.status as 'draft' | 'submitted' | 'reviewed',
            sections: Array.isArray(sections) ? sections : [],
            matchContext: report.match_context,
            tags: report.tags || [],
            flaggedForReview: report.flagged_for_review || false,
            player: playerData,
            scoutProfile: report.scout_profile,
          };
        })
      );

      console.log('Final transformed reports:', transformedReports);
      console.log('Reports by status:', {
        submitted: transformedReports.filter(r => r.status === 'submitted').length,
        draft: transformedReports.filter(r => r.status === 'draft').length,
        total: transformedReports.length
      });
      
      setReports(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (reportData: Partial<Report>) => {
    if (!user) throw new Error('User not authenticated');
    if (!reportData.playerId) throw new Error('Player ID is required');

    try {
      console.log('Saving report with data:', reportData);
      
      // Transform camelCase to snake_case for database
      const dbData = {
        id: reportData.id,
        player_id: reportData.playerId,
        template_id: reportData.templateId,
        scout_id: user.id,
        status: reportData.status || 'draft',
        sections: JSON.stringify(reportData.sections || []), // Convert to JSON string
        match_context: reportData.matchContext ? JSON.stringify(reportData.matchContext) : null, // Convert to JSON string
        tags: reportData.tags,
        flagged_for_review: reportData.flaggedForReview,
        updated_at: new Date().toISOString(),
      };

      console.log('Database data being sent:', dbData);

      const { data, error } = await supabase
        .from('reports')
        .upsert(dbData)
        .select()
        .single();

      if (error) throw error;

      // If report is submitted, mark the assignment as completed
      if (reportData.status === 'submitted') {
        const { error: assignmentError } = await supabase
          .from('scouting_assignments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('player_id', reportData.playerId)
          .eq('assigned_to_scout_id', user.id);

        if (assignmentError) {
          console.error('Error updating assignment status:', assignmentError);
        }
      }

      await fetchReports(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      await fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, profile]);

  return {
    reports,
    loading,
    saveReport,
    deleteReport,
    refetch: fetchReports,
  };
};
