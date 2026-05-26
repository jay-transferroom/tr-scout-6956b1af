import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadCustomFixtures, subscribeCustomFixtures } from "@/utils/customFixtures";

export interface Fixture {
  matchweek: number | null;
  match_number: number | null;
  match_date_utc: string;
  match_datetime_london: string | null;
  home_score: number | null;
  away_score: number | null;
  season: string;
  competition: string | null;
  home_team: string;
  away_team: string;
  venue: string | null;
  status: string | null;
  result: string | null;
  source: string | null;
}

export const useFixturesData = () => {
  const [customFixtures, setCustomFixtures] = useState<Fixture[]>(() => loadCustomFixtures());

  useEffect(() => {
    return subscribeCustomFixtures(() => setCustomFixtures(loadCustomFixtures()));
  }, []);

  const query = useQuery({
    queryKey: ['fixtures'],
    queryFn: async (): Promise<Fixture[]> => {
      const { data, error } = await supabase
        .from('fixtures_results_2526')
        .select('*')
        .order('match_date_utc', { ascending: false });

      if (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
      }

      return (data || []) as Fixture[];
    },
  });

  const merged = useMemo(
    () => [...(query.data ?? []), ...customFixtures],
    [query.data, customFixtures]
  );

  return { ...query, data: merged };
};
