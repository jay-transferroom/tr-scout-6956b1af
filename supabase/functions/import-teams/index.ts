
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

    console.log('Starting Premier League teams data import...')

    // Use the team list API endpoint
    const apiUrl = `https://free-api-live-football-data.p.rapidapi.com/football-get-list-all-team`
    
    console.log(`Fetching teams from: ${apiUrl}`)
    
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
      
      // Create Premier League sample data as fallback
      await createPremierLeagueSampleTeams(supabase)
      
      return new Response(
        JSON.stringify({ 
          message: `API returned ${response.status} error - created Premier League sample data instead`,
          error: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('API response data:', JSON.stringify(data, null, 2))

    // Extract teams from the API response
    let teams = []
    if (data && data.response && Array.isArray(data.response)) {
      teams = data.response
    } else if (Array.isArray(data)) {
      teams = data
    }

    // Filter for Premier League teams
    const premierLeagueTeams = teams.filter((team: any) =>
      team.league && (
        team.league.toLowerCase().includes('premier league') ||
        team.league.toLowerCase().includes('england') ||
        team.competition && team.competition.toLowerCase().includes('premier league')
      )
    )

    console.log(`Found ${teams.length} total teams, ${premierLeagueTeams.length} Premier League teams`)

    if (premierLeagueTeams.length === 0) {
      console.log('No Premier League teams found in API response, creating sample data')
      await createPremierLeagueSampleTeams(supabase)
      
      return new Response(
        JSON.stringify({ 
          message: 'No Premier League teams found in API response - created sample data instead',
          apiResponse: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process and insert the Premier League team data
    const insertedCount = await insertTeamData(supabase, premierLeagueTeams)
    
    return new Response(
      JSON.stringify({ 
        message: `Successfully imported ${insertedCount} Premier League teams`,
        totalTeamsFound: premierLeagueTeams.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in teams import function:', error)
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

async function insertTeamData(supabase: any, teams: any[]) {
  let insertedCount = 0
  
  for (const team of teams.slice(0, 20)) { // Limit to 20 teams
    try {
      const teamData = {
        name: team.name || team.team_name || `Team ${Math.random().toString(36).substr(2, 9)}`,
        league: team.league || team.competition || 'Premier League',
        country: team.country || team.nation || 'England',
        founded: team.founded || null,
        venue: team.venue || team.stadium || null,
        external_api_id: team.id?.toString() || `team_${Date.now()}_${Math.random()}`,
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
        } else {
          console.log('Inserted Premier League team:', teamData.name, 'ID:', teamData.external_api_id)
          insertedCount++
        }
      } else {
        console.log('Team already exists:', teamData.name)
      }
    } catch (teamError) {
      console.error('Error processing team:', teamError, team)
    }
  }
  
  return insertedCount
}

async function createPremierLeagueSampleTeams(supabase: any) {
  const premierLeagueTeams = [
    {
      name: 'Manchester United',
      league: 'Premier League',
      country: 'England',
      founded: 1878,
      venue: 'Old Trafford',
      external_api_id: '33',
      logo_url: 'https://picsum.photos/id/200/100/100'
    },
    {
      name: 'Liverpool',
      league: 'Premier League',
      country: 'England',
      founded: 1892,
      venue: 'Anfield',
      external_api_id: '8650',
      logo_url: 'https://picsum.photos/id/201/100/100'
    },
    {
      name: 'Arsenal',
      league: 'Premier League',
      country: 'England',
      founded: 1886,
      venue: 'Emirates Stadium',
      external_api_id: '8455',
      logo_url: 'https://picsum.photos/id/202/100/100'
    },
    {
      name: 'Chelsea',
      league: 'Premier League',
      country: 'England',
      founded: 1905,
      venue: 'Stamford Bridge',
      external_api_id: '8456',
      logo_url: 'https://picsum.photos/id/203/100/100'
    },
    {
      name: 'Manchester City',
      league: 'Premier League',
      country: 'England',
      founded: 1880,
      venue: 'Etihad Stadium',
      external_api_id: '8557',
      logo_url: 'https://picsum.photos/id/204/100/100'
    },
    {
      name: 'Tottenham Hotspur',
      league: 'Premier League',
      country: 'England',
      founded: 1882,
      venue: 'Tottenham Hotspur Stadium',
      external_api_id: '8586',
      logo_url: 'https://picsum.photos/id/205/100/100'
    }
  ]

  for (const team of premierLeagueTeams) {
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('external_api_id', team.external_api_id)
      .single()

    if (!existingTeam) {
      const { error } = await supabase
        .from('teams')
        .insert(team)

      if (error) {
        console.error('Error inserting sample team:', error)
      } else {
        console.log('Inserted sample Premier League team:', team.name, 'ID:', team.external_api_id)
      }
    } else {
      console.log('Sample team already exists:', team.name)
    }
  }
}
