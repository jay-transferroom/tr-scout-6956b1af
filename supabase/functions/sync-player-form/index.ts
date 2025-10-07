
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all players first
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name')

    if (playersError) {
      throw playersError
    }

    // Sample form data for each player
    const sampleFormData = [
      { matches: 5, goals: 2, assists: 3, rating: 7.8 },
      { matches: 4, goals: 3, assists: 1, rating: 8.1 },
      { matches: 6, goals: 0, assists: 0, rating: 7.2 },
      { matches: 7, goals: 1, assists: 2, rating: 7.5 },
      { matches: 5, goals: 4, assists: 1, rating: 8.3 },
      { matches: 3, goals: 0, assists: 0, rating: 6.7 },
    ]

    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const formData = sampleFormData[i] || sampleFormData[0] // Fallback to first entry

      const { error } = await supabase
        .from('player_recent_form')
        .upsert({
          player_id: player.id,
          matches: formData.matches,
          goals: formData.goals,
          assists: formData.assists,
          rating: formData.rating
        }, {
          onConflict: 'player_id'
        })

      if (error) {
        console.error('Error inserting form data for player:', player.name, error)
      } else {
        console.log('Added form data for:', player.name)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Player form data synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing player form:', error)
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
