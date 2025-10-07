
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
    const body = await req.json()
    const { team_id: teamId, season = 2024, team_name: teamName, force_reimport = false } = body
    
    console.log(`Starting player data import for team ${teamId} (${teamName}), season ${season}, force_reimport: ${force_reimport}`)

    if (!teamId) {
      return new Response(
        JSON.stringify({ 
          message: 'Team ID is required',
          error: 'Missing team_id parameter' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')!

    console.log(`Environment check - Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}, Service Key: ${supabaseServiceKey ? 'SET' : 'MISSING'}, RapidAPI Key: ${rapidApiKey ? 'SET' : 'MISSING'}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get team name from database if not provided
    let finalTeamName = teamName
    if (!finalTeamName) {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('external_api_id', teamId)
        .single()

      if (teamError || !teamData) {
        console.error('Team not found in database:', teamError)
        return new Response(
          JSON.stringify({ 
            message: `Team with ID ${teamId} not found in database. Please import teams first.`,
            error: teamError 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      finalTeamName = teamData.name
    }

    console.log(`Found team: ${finalTeamName}`)

    // Check if we already have players for this team
    const { data: existingPlayers, error: checkError } = await supabase
      .from('players')
      .select('id, name')
      .eq('club', finalTeamName)

    if (checkError) {
      console.error('Error checking existing players:', checkError)
    } else {
      console.log(`Existing players for ${finalTeamName}: ${existingPlayers?.length || 0}`)
      if (existingPlayers && existingPlayers.length > 0 && !force_reimport) {
        console.log(`Players already exist for ${finalTeamName}, skipping import. Use force_reimport=true to overwrite.`)
        return new Response(
          JSON.stringify({ 
            message: `Players already exist for ${finalTeamName}. Use force_reimport=true to overwrite.`,
            totalPlayersFound: existingPlayers.length,
            playersInserted: 0,
            teamId,
            teamName: finalTeamName,
            skipped: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // If force_reimport, delete existing players for this team
    if (force_reimport) {
      console.log(`Force reimport - deleting existing players for ${finalTeamName}`)
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('club', finalTeamName)
      
      if (deleteError) {
        console.error('Error deleting existing players:', deleteError)
      } else {
        console.log(`Successfully deleted existing players for ${finalTeamName}`)
      }
    }

    // Retry mechanism for API calls
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds

    const makeApiCall = async (attempt: number): Promise<any> => {
      const apiUrl = `https://free-api-live-football-data.p.rapidapi.com/football-get-list-player?teamid=${teamId}`
      console.log(`API call attempt ${attempt}/${maxRetries} for team ${teamId}: ${apiUrl}`)

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com'
          }
        })

        console.log(`API response status (attempt ${attempt}): ${response.status}`)

        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`)
        }

        const data = await response.json()
        console.log(`API response data structure (attempt ${attempt}):`, {
          status: data.status,
          hasResponse: !!data.response,
          hasSquad: !!(data.response?.list?.squad),
          squadLength: data.response?.list?.squad?.length || 0,
          message: data.message
        })

        if (data.status !== 'success' || !data.response?.list?.squad) {
          throw new Error(`Invalid API response: ${data.message || 'Unknown error'}`)
        }

        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`API call attempt ${attempt} failed:`, errorMessage)
        
        if (attempt < maxRetries) {
          console.log(`Waiting ${retryDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return makeApiCall(attempt + 1)
        } else {
          throw error
        }
      }
    }

    let data
    try {
      data = await makeApiCall(1)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`All API attempts failed for team ${teamId}:`, errorMessage)
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch player data after ${maxRetries} attempts: ${errorMessage}`,
          teamId,
          teamName: finalTeamName
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const squad = data.response.list.squad
    let totalPlayersFound = 0
    let playersInserted = 0
    let duplicatesSkipped = 0

    console.log(`Processing ${squad.length} squad categories for ${finalTeamName}`)

    // Get all existing player names to check for duplicates across the entire database
    const { data: allExistingPlayers, error: allPlayersError } = await supabase
      .from('players')
      .select('name, club')

    if (allPlayersError) {
      console.error('Error fetching existing players for duplicate check:', allPlayersError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to check for existing players: ${allPlayersError.message}`,
          teamId,
          teamName: finalTeamName
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const existingPlayerNames = new Set(allExistingPlayers?.map(p => p.name.toLowerCase()) || [])

    // Process all squad categories
    for (const [categoryIndex, category] of squad.entries()) {
      console.log(`Processing category ${categoryIndex + 1}/${squad.length}: ${category.name || 'Unnamed'} with ${category.members?.length || 0} members`)
      
      if (category.members) {
        for (const [playerIndex, player] of category.members.entries()) {
          // Skip coaches and other non-player roles
          if (player.role?.key === 'coach' || player.excludeFromRanking === true) {
            console.log(`Skipping non-player: ${player.name} (role: ${player.role?.key})`)
            continue
          }

          totalPlayersFound++

          // Check for duplicates (case-insensitive)
          const playerNameLower = player.name.toLowerCase()
          if (existingPlayerNames.has(playerNameLower)) {
            console.log(`Skipping duplicate player: ${player.name}`)
            duplicatesSkipped++
            continue
          }

          console.log(`Processing player ${playerIndex + 1}/${category.members.length}: ${player.name}`)

          const positions = player.positionIdsDesc ? player.positionIdsDesc.split(',').map((p: string) => p.trim()) : ['Unknown']
          
          // Map nationality codes to full country names
          const nationalityMap: Record<string, string> = {
            'ENG': 'England', 'ESP': 'Spain', 'FRA': 'France', 'GER': 'Germany',
            'ITA': 'Italy', 'BRA': 'Brazil', 'ARG': 'Argentina', 'POR': 'Portugal',
            'NED': 'Netherlands', 'BEL': 'Belgium', 'CRO': 'Croatia', 'POL': 'Poland',
            'URU': 'Uruguay', 'COL': 'Colombia', 'CZE': 'Czechia', 'WAL': 'Wales',
            'SCO': 'Scotland', 'IRE': 'Ireland', 'NOR': 'Norway', 'SWE': 'Sweden',
            'DEN': 'Denmark', 'AUT': 'Austria', 'SUI': 'Switzerland', 'SER': 'Serbia',
            'TUR': 'Turkey', 'UKR': 'Ukraine', 'RUS': 'Russia', 'MEX': 'Mexico',
            'USA': 'United States', 'CAN': 'Canada', 'JPN': 'Japan', 'KOR': 'South Korea',
            'AUS': 'Australia', 'NZL': 'New Zealand', 'RSA': 'South Africa',
            'NGA': 'Nigeria', 'GHA': 'Ghana', 'CMR': 'Cameroon', 'SEN': 'Senegal',
            'MAR': 'Morocco', 'EGY': 'Egypt', 'ALG': 'Algeria', 'TUN': 'Tunisia',
            'CIV': 'Ivory Coast', 'MLI': 'Mali', 'BFA': 'Burkina Faso', 'GUI': 'Guinea',
            'LIB': 'Liberia', 'SLE': 'Sierra Leone', 'TOG': 'Togo', 'BEN': 'Benin',
            'GAB': 'Gabon', 'CGO': 'Congo', 'ANG': 'Angola', 'ZAM': 'Zambia',
            'ZIM': 'Zimbabwe', 'BOT': 'Botswana', 'NAM': 'Namibia', 'SWZ': 'Eswatini'
          }

          const nationality = nationalityMap[player.ccode] || player.cname || 'Unknown'
          
          const getRegion = (nationality: string): string => {
            const europeanCountries = ['England', 'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland', 'Czechia', 'Wales', 'Scotland', 'Ireland', 'Norway', 'Sweden', 'Denmark', 'Austria', 'Switzerland', 'Serbia', 'Turkey', 'Ukraine', 'Russia']
            const southAmericanCountries = ['Brazil', 'Argentina', 'Uruguay', 'Colombia']
            const northAmericanCountries = ['United States', 'Canada', 'Mexico']
            const africanCountries = ['Nigeria', 'Ghana', 'Cameroon', 'Senegal', 'Morocco', 'Egypt', 'Algeria', 'Tunisia', 'Ivory Coast', 'Mali', 'Burkina Faso', 'Guinea', 'Liberia', 'Sierra Leone', 'Togo', 'Benin', 'Gabon', 'Congo', 'Angola', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'Eswatini', 'South Africa']
            const asianCountries = ['Japan', 'South Korea']
            const oceaniaCountries = ['Australia', 'New Zealand']

            if (europeanCountries.includes(nationality)) return 'Europe'
            if (southAmericanCountries.includes(nationality)) return 'South America'
            if (northAmericanCountries.includes(nationality)) return 'North America'
            if (africanCountries.includes(nationality)) return 'Africa'
            if (asianCountries.includes(nationality)) return 'Asia'
            if (oceaniaCountries.includes(nationality)) return 'Oceania'
            return 'Unknown'
          }

          const playerImage = player.image || player.img || player.photo || null

          const playerData = {
            name: player.name,
            club: finalTeamName,
            age: player.age || 0,
            date_of_birth: player.dateOfBirth || '1990-01-01',
            positions: positions,
            dominant_foot: 'Right',
            nationality: nationality,
            contract_status: 'Under Contract',
            contract_expiry: null,
            region: getRegion(nationality),
            image_url: playerImage
          }

          console.log(`Inserting player data:`, {
            name: playerData.name,
            club: playerData.club,
            age: playerData.age,
            nationality: playerData.nationality,
            positions: playerData.positions,
            hasImage: !!playerData.image_url
          })

          // Insert new player
          const { error: insertError } = await supabase
            .from('players')
            .insert(playerData)

          if (insertError) {
            console.error(`Error inserting player ${player.name}:`, insertError)
          } else {
            console.log(`Successfully inserted player: ${player.name} from ${finalTeamName}`)
            playersInserted++
            
            // Add the player name to our set to prevent duplicates within this import
            existingPlayerNames.add(playerNameLower)

            // Insert recent form data if available
            if (player.rating && player.goals !== undefined && player.assists !== undefined) {
              const { data: insertedPlayer, error: playerFetchError } = await supabase
                .from('players')
                .select('id')
                .eq('name', player.name)
                .eq('club', finalTeamName)
                .single()

              if (insertedPlayer && !playerFetchError) {
                const { error: formError } = await supabase
                  .from('player_recent_form')
                  .insert({
                    player_id: insertedPlayer.id,
                    matches: 10,
                    goals: player.goals || 0,
                    assists: player.assists || 0,
                    rating: parseFloat(player.rating) || 0.0
                  })

                if (formError) {
                  console.error(`Error inserting form data for ${player.name}:`, formError)
                } else {
                  console.log(`Inserted form data for ${player.name}`)
                }
              }
            }
          }
        }
      }
    }

    console.log(`Import completed for ${finalTeamName}: found ${totalPlayersFound} players, successfully inserted ${playersInserted}, skipped ${duplicatesSkipped} duplicates`)

    return new Response(
      JSON.stringify({ 
        message: `Successfully imported ${playersInserted} players for ${finalTeamName}${duplicatesSkipped > 0 ? ` (${duplicatesSkipped} duplicates skipped)` : ''}`,
        totalPlayersFound,
        playersInserted,
        duplicatesSkipped,
        teamId,
        teamName: finalTeamName,
        forceReimport: force_reimport
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error importing player data:', error)
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
