import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { league_name: leagueName, force_reimport = false } = await req.json()
    console.log(`Starting complete league data import for: ${leagueName}, force_reimport: ${force_reimport}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log(`Environment check - Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}, Service Key: ${supabaseServiceKey ? 'SET' : 'MISSING'}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Define league mappings for better API calls
    type LeagueName = 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'Ligue 1';
    
    const leagueData: Record<LeagueName, { country: string; season: string }> = {
      'Premier League': { country: 'England', season: '2024' },
      'La Liga': { country: 'Spain', season: '2024' },
      'Serie A': { country: 'Italy', season: '2024' },
      'Bundesliga': { country: 'Germany', season: '2024' },
      'Ligue 1': { country: 'France', season: '2024' }
    }

    if (!leagueData[leagueName as LeagueName]) {
      return new Response(
        JSON.stringify({ 
          error: `League "${leagueName}" not supported. Available: ${Object.keys(leagueData).join(', ')}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const league = leagueData[leagueName as LeagueName]
    let totalTeamsImported = 0
    let totalPlayersImported = 0

    // Check existing data
    const { data: existingTeams, error: checkError } = await supabase
      .from('teams')
      .select('id, name, external_api_id')
      .eq('league', leagueName)

    if (checkError) {
      console.error('Error checking existing teams:', checkError)
    } else {
      console.log(`Existing teams for ${leagueName}: ${existingTeams?.length || 0}`)
    }

    // If force_reimport is true, delete existing league data first
    if (force_reimport) {
      console.log(`Force reimport requested - deleting existing ${leagueName} data`)
      
      // Get team names for player deletion
      const teamNames = getSampleTeamsForLeague(leagueName).map((team: any) => team.name)
      
      // Delete players from teams in this league
      const { error: deletePlayersError } = await supabase
        .from('players')
        .delete()
        .in('club', teamNames)
      
      if (deletePlayersError) {
        console.error('Error deleting existing players:', deletePlayersError)
      } else {
        console.log(`Successfully deleted players for ${leagueName} teams`)
      }
      
      // Delete teams from this league
      const { error: deleteTeamsError } = await supabase
        .from('teams')
        .delete()
        .eq('league', leagueName)
      
      if (deleteTeamsError) {
        console.error('Error deleting existing teams:', deleteTeamsError)
      } else {
        console.log(`Successfully deleted teams for ${leagueName}`)
      }
      
      console.log(`Cleared existing ${leagueName} data`)
    }

    // Step 1: Import teams for the league
    console.log(`Step 1: Importing teams for ${leagueName}`)
    
    // Use sample teams (API teams endpoint seems unreliable)
    const sampleTeams = getSampleTeamsForLeague(leagueName)
    console.log(`Processing ${sampleTeams.length} teams for ${leagueName}`)
    
    for (const [teamIndex, team] of sampleTeams.entries()) {
      console.log(`Processing team ${teamIndex + 1}/${sampleTeams.length}: ${team.name}`)
      
      // Check if team already exists (unless force reimport)
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('external_api_id', team.external_api_id || team.id)
        .single()

      if (!existingTeam || force_reimport) {
        const teamData = {
          name: team.name,
          league: leagueName,
          country: league.country,
          founded: team.founded || null,
          venue: team.venue || team.stadium || null,
          external_api_id: team.external_api_id || team.id,
          logo_url: team.logo || team.image || team.badge || null
        }

        console.log(`Inserting/updating team data:`, {
          name: teamData.name,
          external_api_id: teamData.external_api_id,
          venue: teamData.venue
        })

        if (existingTeam && force_reimport) {
          // Update existing team
          const { error } = await supabase
            .from('teams')
            .update(teamData)
            .eq('external_api_id', team.external_api_id || team.id)

          if (error) {
            console.error('Error updating team:', error)
          } else {
            console.log('Updated team:', team.name)
            totalTeamsImported++
          }
        } else {
          // Insert new team
          const { error } = await supabase
            .from('teams')
            .insert(teamData)

          if (error) {
            console.error('Error inserting team:', error)
          } else {
            console.log('Imported team:', team.name)
            totalTeamsImported++
          }
        }
      } else {
        console.log('Team already exists:', team.name)
      }
    }

    // Step 2: Import players for each team with enhanced error handling
    console.log(`Step 2: Importing players for all ${leagueName} teams`)
    
    for (const [teamIndex, team] of sampleTeams.entries()) {
      try {
        console.log(`\n=== Starting player import for team ${teamIndex + 1}/${sampleTeams.length}: ${team.name} ===`)
        
        // Add longer delay between teams to avoid rate limiting
        if (teamIndex > 0) {
          console.log('Waiting 3 seconds between teams to avoid rate limiting...')
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
        
        const { data: playerImportResult, error: playerImportError } = await supabase.functions.invoke('import-player-data', {
          body: { 
            team_id: team.external_api_id || team.id, 
            season: league.season,
            team_name: team.name,
            force_reimport: force_reimport
          }
        })

        if (playerImportError) {
          console.error(`Player import function error for ${team.name}:`, playerImportError)
        } else if (playerImportResult?.error) {
          console.error(`Player import failed for ${team.name}:`, playerImportResult.error)
        } else {
          console.log(`Successfully imported players for ${team.name}:`, {
            totalFound: playerImportResult?.totalPlayersFound || 0,
            inserted: playerImportResult?.playersInserted || 0,
            skipped: playerImportResult?.skipped || false
          })
          totalPlayersImported += playerImportResult?.playersInserted || 0
        }
        
      } catch (error) {
        console.error(`Error processing team ${team.name}:`, error)
      }
    }

    const finalMessage = `Successfully processed ${leagueName} data: ${totalTeamsImported} teams, ${totalPlayersImported} players`
    console.log(`\n=== IMPORT COMPLETE ===`)
    console.log(finalMessage)

    return new Response(
      JSON.stringify({ 
        message: finalMessage,
        league: leagueName,
        teamsImported: totalTeamsImported,
        playersImported: totalPlayersImported,
        totalTeams: sampleTeams.length,
        forceReimport: force_reimport
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error importing league data:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function getSampleTeamsForLeague(leagueName: string) {
  type LeagueName = 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'Ligue 1';
  
  const teams: Record<LeagueName, Array<{ name: string; external_api_id: string; venue: string; founded: number }>> = {
    'Premier League': [
      { name: 'Manchester United', external_api_id: '33', venue: 'Old Trafford', founded: 1878 },
      { name: 'Liverpool', external_api_id: '8650', venue: 'Anfield', founded: 1892 },
      { name: 'Arsenal', external_api_id: '8455', venue: 'Emirates Stadium', founded: 1886 },
      { name: 'Chelsea', external_api_id: '8456', venue: 'Stamford Bridge', founded: 1905 },
      { name: 'Manchester City', external_api_id: '8557', venue: 'Etihad Stadium', founded: 1880 },
      { name: 'Tottenham Hotspur', external_api_id: '8586', venue: 'Tottenham Hotspur Stadium', founded: 1882 },
    ],
    'La Liga': [
      { name: 'Real Madrid', external_api_id: '8633', venue: 'Santiago Bernabéu', founded: 1902 },
      { name: 'Barcelona', external_api_id: '8634', venue: 'Camp Nou', founded: 1899 },
      { name: 'Atletico Madrid', external_api_id: '8635', venue: 'Wanda Metropolitano', founded: 1903 },
    ],
    'Serie A': [
      { name: 'Juventus', external_api_id: '8636', venue: 'Allianz Stadium', founded: 1897 },
      { name: 'AC Milan', external_api_id: '8637', venue: 'San Siro', founded: 1899 },
      { name: 'Inter Milan', external_api_id: '8638', venue: 'San Siro', founded: 1908 },
    ],
    'Bundesliga': [
      { name: 'Bayern Munich', external_api_id: '8639', venue: 'Allianz Arena', founded: 1900 },
      { name: 'Borussia Dortmund', external_api_id: '8640', venue: 'Signal Iduna Park', founded: 1909 },
    ],
    'Ligue 1': [
      { name: 'Paris Saint-Germain', external_api_id: '8641', venue: 'Parc des Princes', founded: 1970 },
      { name: 'Olympique Marseille', external_api_id: '8642', venue: 'Stade Vélodrome', founded: 1899 },
    ]
  }

  return (teams[leagueName as LeagueName] || []).map((team: any) => ({
    ...team,
    league: leagueName,
    country: leagueName === 'Premier League' ? 'England' : 
             leagueName === 'La Liga' ? 'Spain' :
             leagueName === 'Serie A' ? 'Italy' :
             leagueName === 'Bundesliga' ? 'Germany' :
             leagueName === 'Ligue 1' ? 'France' : 'Unknown',
    logo_url: null
  }))
}
