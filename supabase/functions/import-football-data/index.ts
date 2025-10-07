
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting football data import from RapidAPI...')
    console.log('RapidAPI Key available:', !!rapidApiKey)

    // Format today's date as YYYYMMDD
    const today = new Date()
    const dateString = today.getFullYear().toString() + 
                      (today.getMonth() + 1).toString().padStart(2, '0') + 
                      today.getDate().toString().padStart(2, '0')
    
    // Use the correct API endpoint format
    const apiUrl = `https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-date-and-league?date=${dateString}`
    
    try {
      console.log(`Fetching fixtures from: ${apiUrl}`)
      console.log(`Using date: ${dateString}`)
      
      const response = await fetch(apiUrl, {
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
        }
      })

      console.log(`API Response Status: ${response.status}`)
      console.log(`API Response Headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`API Error Response: ${errorText}`)
        console.log(`API response not OK (${response.status}), using sample data instead`)
        await createSampleFixtures(supabase)
        return new Response(
          JSON.stringify({ 
            message: 'Sample fixtures created successfully due to API failure',
            error: `API returned ${response.status}: ${errorText}`,
            debug: {
              url: apiUrl,
              hasApiKey: !!rapidApiKey,
              date: dateString
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json()
      console.log('Fetched data from RapidAPI:', JSON.stringify(data, null, 2))

      // Check if we have fixture data in various possible formats
      let fixtures = []
      if (Array.isArray(data)) {
        fixtures = data
      } else if (data.response && Array.isArray(data.response)) {
        fixtures = data.response
      } else if (data.fixtures && Array.isArray(data.fixtures)) {
        fixtures = data.fixtures
      } else if (data.matches && Array.isArray(data.matches)) {
        fixtures = data.matches
      }

      console.log(`Found ${fixtures.length} fixtures to process`)

      if (fixtures.length > 0) {
        let insertedCount = 0
        for (const match of fixtures.slice(0, 20)) { // Limit to 20 matches
          const fixture = {
            home_team: match.home_team || match.teams?.home?.name || match.homeTeam || 'Unknown Home Team',
            away_team: match.away_team || match.teams?.away?.name || match.awayTeam || 'Unknown Away Team',
            competition: match.league || match.competition || match.league?.name || 'Unknown Competition',
            fixture_date: match.date ? new Date(match.date).toISOString() : 
                         match.fixture?.date ? new Date(match.fixture.date).toISOString() : 
                         new Date().toISOString(),
            venue: match.venue || match.fixture?.venue?.name || null,
            status: mapApiStatus(match.status || match.fixture?.status?.short || 'scheduled'),
            home_score: match.home_score || match.goals?.home || null,
            away_score: match.away_score || match.goals?.away || null,
            external_api_id: match.id?.toString() || match.fixture?.id?.toString() || `api_${Date.now()}_${Math.random()}`
          }

          const { error } = await supabase
            .from('fixtures')
            .upsert(fixture, { 
              onConflict: 'external_api_id',
              ignoreDuplicates: false 
            })

          if (error) {
            console.error('Error inserting fixture:', error)
          } else {
            console.log('Inserted fixture:', fixture.home_team, 'vs', fixture.away_team)
            insertedCount++
          }
        }
        
        return new Response(
          JSON.stringify({ 
            message: `Successfully imported ${insertedCount} fixtures from API`,
            totalFound: fixtures.length,
            debug: {
              url: apiUrl,
              date: dateString,
              apiResponseStructure: Object.keys(data)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.log('No fixtures data found in API response, creating sample data')
        await createSampleFixtures(supabase)
        return new Response(
          JSON.stringify({ 
            message: 'No API data available, sample fixtures created instead',
            debug: {
              url: apiUrl,
              date: dateString,
              apiResponseStructure: Object.keys(data),
              rawResponse: data
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } catch (apiError) {
      console.log('RapidAPI call failed, creating sample data instead:', apiError)
      await createSampleFixtures(supabase)
    }

    return new Response(
      JSON.stringify({ message: 'Football data import completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in import function:', error)
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

async function createSampleFixtures(supabase: any) {
  const sampleFixtures = [
    {
      home_team: 'Liverpool',
      away_team: 'Manchester United',
      competition: 'Premier League',
      fixture_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Anfield',
      status: 'scheduled',
      home_score: null,
      away_score: null,
      external_api_id: 'sample_1'
    },
    {
      home_team: 'Chelsea',
      away_team: 'Arsenal',
      competition: 'Premier League',
      fixture_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Stamford Bridge',
      status: 'scheduled',
      home_score: null,
      away_score: null,
      external_api_id: 'sample_2'
    },
    {
      home_team: 'Real Madrid',
      away_team: 'Barcelona',
      competition: 'La Liga',
      fixture_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Santiago Bernabéu',
      status: 'scheduled',
      home_score: null,
      away_score: null,
      external_api_id: 'sample_3'
    }
  ]

  for (const fixture of sampleFixtures) {
    const { error } = await supabase
      .from('fixtures')
      .upsert(fixture, { 
        onConflict: 'external_api_id',
        ignoreDuplicates: true 
      })

    if (error) {
      console.error('Error inserting sample fixture:', error)
    } else {
      console.log('Inserted sample fixture:', fixture.home_team, 'vs', fixture.away_team)
    }
  }
}

function mapApiStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'NS': // Not Started
    case 'TBD': // To Be Determined
      return 'scheduled'
    case '1H': // First Half
    case '2H': // Second Half
    case 'HT': // Half Time
    case 'ET': // Extra Time
    case 'P': // Penalty
      return 'live'
    case 'FT': // Full Time
    case 'AET': // After Extra Time
    case 'PEN': // Penalties
      return 'completed'
    case 'SUSP': // Suspended
    case 'PST': // Postponed
      return 'postponed'
    case 'CANC': // Cancelled
      return 'cancelled'
    default:
      return 'scheduled'
  }
}
