
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  type: 'player' | 'report' | 'ai_recommendation';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  confidence?: number;
  player_id?: string;
  report_id?: string;
  relevanceScore: number;
  metadata: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, limit = 10 } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing search query:', query);

    // Search players with better filtering
    const { data: players, error: playersError } = await supabase
      .from('players_new')
      .select('*')
      .or(`name.ilike.%${query}%,currentteam.ilike.%${query}%,parentteam.ilike.%${query}%,firstnationality.ilike.%${query}%,secondnationality.ilike.%${query}%,firstposition.ilike.%${query}%,secondposition.ilike.%${query}%`)
      .limit(50);

    if (playersError) {
      console.error('Error fetching players:', playersError);
    }

  // Search reports with player data - join with players to get names
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(`
      *,
      players_new!inner(id, name, currentteam, firstposition, secondposition, firstnationality)
    `)
    .limit(20);

  if (reportsError) {
    console.error('Error fetching reports:', reportsError);
  }

  console.log('Found players:', players?.length || 0);
  console.log('Found reports:', reports?.length || 0);

  // Enhanced keyword search with scoring
  const searchResults = performKeywordSearch(query, players || [], reports || [], limit);

    console.log('Search completed, found', searchResults.length, 'results');

    return new Response(
      JSON.stringify({ 
        results: searchResults,
        query,
        totalResults: searchResults.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function performKeywordSearch(query: string, players: any[], reports: any[], limit: number): SearchResult[] {
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(' ').filter(term => term.length > 0);
  const results: SearchResult[] = [];

  // Helper function to calculate relevance score
  function calculateRelevance(text: string, terms: string[]): number {
    const textLower = text.toLowerCase();
    let score = 0;
    
    // Exact phrase match gets highest score
    if (textLower.includes(queryLower)) {
      score += 1.0;
    }
    
    // Individual term matches
    terms.forEach(term => {
      if (textLower.includes(term)) {
        score += 0.3;
      }
    });
    
    return Math.min(score, 1.0);
  }

  // Search players
  players.forEach(player => {
    const positions = [player.firstposition, player.secondposition].filter(Boolean).join(', ') || 'Unknown';
    const club = player.currentteam || player.parentteam || 'Unknown Club';
    const nationality = player.firstnationality || player.secondnationality || 'Unknown';
    
    const searchableText = [
      player.name || '',
      club,
      positions,
      nationality,
      player.age ? `age ${player.age}` : '',
      player.age && player.age < 20 ? 'young prospect under 20' : '',
      player.age && player.age < 23 ? 'prospect' : ''
    ].join(' ');
    
    const relevance = calculateRelevance(searchableText, searchTerms);
    
    if (relevance > 0) {
      results.push({
        type: 'player',
        id: player.id.toString(),
        player_id: player.id.toString(),
        title: player.name || 'Unknown Player',
        subtitle: `${positions} • ${nationality}`,
        description: `${club} • Age ${player.age || 'Unknown'}`,
        confidence: relevance,
        relevanceScore: relevance,
        metadata: { ...player, isPrivatePlayer: false }
      });
    }
  });

  // Search reports
  reports.forEach(report => {
    const playerData = (report as any).players_new;
    const playerName = playerData?.name || `Player ${report.player_id}`;
    const playerInfo = playerData ? `${playerData.firstposition || 'Unknown'} • ${playerData.firstnationality || 'Unknown'}` : 'Unknown';
    
    const searchableText = [
      playerName,
      playerData?.currentteam || '',
      report.status || '',
      'report'
    ].join(' ');
    
    const relevance = calculateRelevance(searchableText, searchTerms);
    
    if (relevance > 0) {
      results.push({
        type: 'report',
        id: report.id,
        report_id: report.id,
        title: `Report: ${playerName}`,
        subtitle: `${report.status || 'Draft'} Report`,
        description: playerInfo,
        confidence: relevance,
        relevanceScore: relevance,
        metadata: report
      });
    }
  });

  // Sort by relevance score and limit results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
