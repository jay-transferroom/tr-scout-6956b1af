
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
    console.log('Starting player team name update...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all teams to create a mapping
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('external_api_id, name')

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      throw teamsError
    }

    console.log(`Found ${teams?.length || 0} teams`)

    // Create a mapping from external_api_id to team name
    const teamMapping: Record<string, string> = {}
    teams?.forEach(team => {
      teamMapping[team.external_api_id] = team.name
    })

    // Get all players that have numeric team IDs (need updating)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, club')

    if (playersError) {
      console.error('Error fetching players:', playersError)
      throw playersError
    }

    console.log(`Found ${players?.length || 0} players to check`)

    let updatedCount = 0
    let skippedCount = 0

    for (const player of players || []) {
      // Check if the club field looks like a team ID (numeric)
      const isTeamId = /^\d+$/.test(player.club)
      
      if (isTeamId && teamMapping[player.club]) {
        // Update the player with the proper team name
        const { error: updateError } = await supabase
          .from('players')
          .update({ club: teamMapping[player.club] })
          .eq('id', player.id)

        if (updateError) {
          console.error(`Error updating player ${player.id}:`, updateError)
        } else {
          console.log(`Updated player ${player.id}: ${player.club} -> ${teamMapping[player.club]}`)
          updatedCount++
        }
      } else {
        skippedCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Player team update completed. Updated ${updatedCount} players, skipped ${skippedCount} players.`,
        updatedCount,
        skippedCount,
        totalPlayers: players?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error updating player teams:', error)
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
