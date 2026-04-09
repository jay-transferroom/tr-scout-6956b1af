
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReportTemplate } from '@/types/report';
import { DEFAULT_TEMPLATES } from '@/data/defaultTemplates';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const createDefaultTemplates = async () => {
    try {
      console.log('Creating default templates...');
      
      for (const template of DEFAULT_TEMPLATES) {
        // Check if template already exists
        const { data: existing } = await supabase
          .from('report_templates')
          .select('id')
          .eq('id', template.id)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('report_templates')
            .insert({
              id: template.id,
              name: template.name,
              description: template.description,
              sections: template.sections as any,
              default_template: template.defaultTemplate,
              default_rating_system: template.defaultRatingSystem as any,
            });

          if (error) {
            console.error('Error creating template:', template.name, error);
          } else {
            console.log('Created template:', template.name);
          }
        }
      }
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // First ensure default templates exist
      await createDefaultTemplates();
      
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our ReportTemplate interface
      const transformedTemplates: ReportTemplate[] = (data || []).map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        sections: (Array.isArray(template.sections) ? template.sections : []).map((section: any, index: number) => ({
          ...section,
          isOverall: section.isOverall === true || section.id === 'overall' || (index === 0 && section.title?.toLowerCase().includes('overall')),
        })),
        defaultTemplate: template.default_template || false,
        defaultRatingSystem: template.default_rating_system || undefined,
      }));

      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    refetch: fetchTemplates,
  };
};
