
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
    const { batch_size = 5 } = await req.json()
    
    console.log('Starting batch update of player photos')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all players without AI-generated photos
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('id, name, positions, nationality, image_url')
      .limit(batch_size)

    if (fetchError) {
      throw new Error(`Failed to fetch players: ${fetchError.message}`)
    }

    console.log(`Found ${players?.length || 0} players to update`)

    let successCount = 0
    let errorCount = 0

    for (const player of players || []) {
      try {
        console.log(`Generating photo for ${player.name}`)
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Call the generate-player-photo function
        const { data: photoResult, error: photoError } = await supabase.functions.invoke('generate-player-photo', {
          body: {
            player_name: player.name,
            position: player.positions?.[0] || 'Player',
            nationality: player.nationality
          }
        })

        if (photoError || !photoResult?.success) {
          console.error(`Failed to generate photo for ${player.name}:`, photoError || photoResult?.error)
          errorCount++
          continue
        }

        // Update player with new AI-generated photo
        const { error: updateError } = await supabase
          .from('players')
          .update({ image_url: photoResult.image_url })
          .eq('id', player.id)

        if (updateError) {
          console.error(`Failed to update player ${player.name}:`, updateError)
          errorCount++
        } else {
          console.log(`Successfully updated photo for ${player.name}`)
          successCount++
        }

      } catch (error) {
        console.error(`Error processing player ${player.name}:`, error)
        errorCount++
      }
    }

    const message = `Batch update complete: ${successCount} photos generated successfully, ${errorCount} errors`
    console.log(message)

    return new Response(
      JSON.stringify({ 
        success: true,
        message,
        updated: successCount,
        errors: errorCount,
        total_processed: (players?.length || 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-player-photos function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
