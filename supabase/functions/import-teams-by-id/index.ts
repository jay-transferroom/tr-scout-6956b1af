
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get team ID from request body
    const { team_id } = await req.json()
    const teamId = team_id || '33' // Default to Manchester United

    console.log(`Starting team import for team ID: ${teamId}...`)

    // Use the team by ID API endpoint
    const apiUrl = `https://free-api-live-football-data.p.rapidapi.com/football-get-team-by-id?teamid=${teamId}`
    
    console.log(`Fetching team from: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
      }
    })

    console.log(`API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error (${response.status}): ${errorText}`)
      
      // Create sample data as fallback
      const sampleTeamName = await createSampleTeam(supabase, teamId)
      
      return new Response(
        JSON.stringify({ 
          message: `API returned ${response.status} error - created sample data instead`,
          error: errorText,
          teamId: teamId,
          teamName: sampleTeamName
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('API response data:', JSON.stringify(data, null, 2))

    // Extract team from the API response
    let team = null
    if (data && data.response) {
      team = data.response
    }

    console.log(`Found team:`, team)

    if (!team) {
      console.log('No team found in API response, creating sample data')
      const sampleTeamName = await createSampleTeam(supabase, teamId)
      
      return new Response(
        JSON.stringify({ 
          message: 'No team found in API response - created sample data instead',
          apiResponse: data,
          teamId: teamId,
          teamName: sampleTeamName
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process and insert the team data
    const result = await insertTeamData(supabase, team, teamId)
    
    return new Response(
      JSON.stringify({ 
        message: `Successfully imported team ${teamId}`,
        inserted: result.inserted,
        teamId: teamId,
        teamName: result.teamName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in team import function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function insertTeamData(supabase: any, team: any, teamId: string) {
  try {
    const teamData = {
      name: team.name || team.team_name || `Team ${teamId}`,
      league: team.league || team.competition || 'Unknown League',
      country: team.country || team.nation || 'Unknown',
      founded: team.founded || null,
      venue: team.venue || team.stadium || null,
      external_api_id: teamId,
      logo_url: team.logo || `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/100/100`
    }

    // Check if team already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('external_api_id', teamData.external_api_id)
      .single()

    if (!existingTeam) {
      const { error } = await supabase
        .from('teams')
        .insert(teamData)

      if (error) {
        console.error('Error inserting team:', error)
        return { inserted: false, teamName: teamData.name }
      } else {
        console.log('Inserted team:', teamData.name)
        return { inserted: true, teamName: teamData.name }
      }
    } else {
      console.log('Team already exists:', teamData.name)
      return { inserted: false, teamName: teamData.name }
    }
  } catch (teamError) {
    console.error('Error processing team:', teamError, team)
    return { inserted: false, teamName: `Team ${teamId}` }
  }
}

async function createSampleTeam(supabase: any, teamId: string) {
  const sampleTeam = {
    name: `Sample Team ${teamId}`,
    league: 'Sample League',
    country: 'England',
    founded: 1900,
    venue: 'Sample Stadium',
    external_api_id: teamId,
    logo_url: 'https://picsum.photos/id/200/100/100'
  }

  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('external_api_id', sampleTeam.external_api_id)
    .single()

  if (!existingTeam) {
    const { error } = await supabase
      .from('teams')
      .insert(sampleTeam)

    if (error) {
      console.error('Error inserting sample team:', error)
    } else {
      console.log('Inserted sample team:', sampleTeam.name)
    }
  } else {
    console.log('Sample team already exists:', sampleTeam.name)
  }

  return sampleTeam.name
}
