import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { report, template, playerData } = await req.json();
    console.log('Generating report summary for:', report.player?.name);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Build a comprehensive prompt from the report data
    const sectionsText = report.sections.map((section: any) => {
      const templateSection = template?.sections?.find((ts: any) => ts.id === section.sectionId);
      const sectionTitle = templateSection?.title || section.sectionId;
      
      const fieldsText = section.fields.map((field: any) => {
        const templateField = templateSection?.fields?.find((tf: any) => tf.id === field.fieldId);
        const fieldLabel = templateField?.label || field.fieldId;
        const fieldValue = field.value !== null && field.value !== undefined ? field.value : 'N/A';
        const fieldNotes = field.notes ? `\n  Notes: ${field.notes}` : '';
        return `  - ${fieldLabel}: ${fieldValue}${fieldNotes}`;
      }).join('\n');
      
      return `${sectionTitle}:\n${fieldsText}`;
    }).join('\n\n');

    const matchContext = report.matchContext ? `
Match Context:
- Date: ${report.matchContext.date || 'N/A'}
- Opposition: ${report.matchContext.opposition || 'N/A'}
- Competition: ${report.matchContext.competition || 'N/A'}
- Minutes Played: ${report.matchContext.minutesPlayed || 'N/A'}
- Conditions: ${report.matchContext.conditions || 'N/A'}
- Role: ${report.matchContext.roleContext || 'N/A'}
` : '';

    const prompt = `You are an experienced football recruitment analyst and sporting director. Generate a comprehensive executive summary for the following scouting report.

PLAYER INFORMATION:
Name: ${report.player?.name || 'Unknown'}
Age: ${playerData?.age || report.player?.age || 'Unknown'}
Nationality: ${playerData?.nationality || report.player?.nationality || 'Unknown'}
Current Club: ${playerData?.club || report.player?.club || 'Unknown'}
Position(s): ${playerData?.positions?.join(', ') || report.player?.position || 'Unknown'}

${matchContext}

SCOUTING REPORT DATA:
${sectionsText}

Scout: ${report.scoutProfile?.first_name || ''} ${report.scoutProfile?.last_name || ''}
Date: ${new Date(report.createdAt).toLocaleDateString()}

INSTRUCTIONS:
Generate a professional executive summary that includes:

1. **RECOMMENDATION**: Clear verdict (Recommend Signing / Add to Shortlist / Monitor / Further Scouting Required / With Reservations / Not Recommended)

2. **KEY HIGHLIGHTS**: 
   - Technical abilities and standout skills
   - Tactical understanding and positioning
   - Physical attributes
   - Mental/psychological strengths
   - Leadership and character traits

3. **AREAS FOR DEVELOPMENT**:
   - Technical aspects needing improvement
   - Tactical or positional weaknesses
   - Physical limitations
   - Mental/behavioral concerns if any

4. **PERSONALITY & CHARACTER ASSESSMENT**:
   - Work ethic and professionalism
   - Discipline (training punctuality, conduct, etc.)
   - Cultural fit considerations
   - Leadership qualities
   - Any behavioral concerns or exemplary traits noted

5. **OVERALL ASSESSMENT**:
   - Summary of potential and current level
   - Fit for our squad/system
   - Development timeline if applicable

6. **NEXT STEPS**:
   - Recommended actions
   - Timeline for decisions or follow-ups

Use the specific data from the scouting report to make your assessment. Be honest and balanced. Format with clear sections using markdown-style headings. Keep it concise but comprehensive - suitable for a sporting director to make informed decisions.`;

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const summary = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-report-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
