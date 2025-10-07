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
    const { report, template, playerData, language = 'English' } = await req.json();
    console.log('Generating report summary for:', report.player?.name, 'in', language);

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

    const prompt = `You are an experienced football recruitment analyst and sporting director with 20+ years of experience. Your job is to provide INTELLIGENT ANALYSIS and INSIGHTS that go beyond the raw data.

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

CRITICAL INSTRUCTIONS:
Your role is NOT to simply repeat or reformat the scouting data above. Instead, you must:

1. **ANALYZE PATTERNS**: Look for connections between different attributes (e.g., how does their technical ability relate to their decision-making?)

2. **PROVIDE CONTEXT**: Compare the player's profile against typical players in their position and age group

3. **IDENTIFY RED FLAGS**: Look for concerning patterns like inconsistent ratings, behavioral issues, or skill gaps

4. **PROJECT DEVELOPMENT**: Based on their current profile, predict their development trajectory and potential ceiling

5. **ASSESS CULTURAL FIT**: Consider personality traits and how they might integrate with a professional club environment

6. **MAKE BOLD RECOMMENDATIONS**: Don't hedge - give a clear verdict with confidence levels

Generate a professional executive summary with these sections:

**EXECUTIVE RECOMMENDATION**
[Clear verdict: Recommend Signing / Priority Shortlist / Monitor Closely / Further Assessment Needed / Pass]
[Include confidence level: High / Medium / Low and why]

**PLAYER PROFILE ANALYSIS**
Provide your expert interpretation of what type of player this is based on the data:
- Playing style and archetype (e.g., "dynamic ball-winner", "creative playmaker", "target man")
- Best-case player comparison from professional football
- Ceiling and floor projections

**KEY STRENGTHS**
Don't just list attributes - explain WHY they matter and HOW they translate to match performance:
- What makes this player stand out?
- What would they bring to a squad immediately?

**DEVELOPMENT AREAS & CONCERNS**
Be honest about weaknesses and what they mean:
- Technical gaps that could limit progression
- Tactical understanding issues
- Physical or mental limitations
- Any behavioral red flags from the scout's observations

**CHARACTER & PROFESSIONALISM ASSESSMENT**
This is CRITICAL - analyze:
- Work ethic indicators from the data
- Discipline and punctuality (if mentioned)
- Attitude and coachability signals
- Leadership potential or follower mentality
- Cultural fit considerations for a professional environment
- Any concerns about off-field behavior or commitment

**RISK ASSESSMENT**
Evaluate the risks of signing vs. passing:
- What could go wrong?
- What could we miss if we don't act?
- Investment risk level: Low / Medium / High

**ACTIONABLE NEXT STEPS**
Be specific about what should happen next:
- Timeline for decision-making
- Additional scouting required (if any)
- Key questions that need answering
- Contract/negotiation considerations

IMPORTANT: Generate the entire summary in ${language}. Use professional language but be direct and honest. Format with markdown headings and bullet points. Make it decision-ready for a sporting director.`;

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
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3072,
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
