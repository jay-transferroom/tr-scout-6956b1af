
import { useEffect, useState } from 'react';
import { useDataImport } from './useDataImport';
import { supabase } from '@/integrations/supabase/client';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<string>('Checking data...');
  const { importPremierLeagueData, importLeagueData } = useDataImport();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        setInitializationStatus('Checking existing data...');
        
        // Check if we have any teams data (any league) to avoid re-import loops
        const { data: existingTeams, error } = await supabase
          .from('teams')
          .select('id')
          .limit(1);

        console.log('Teams query result:', { existingTeams, error });

        if (error) {
          console.error('Error checking existing data:', error);
          setInitializationStatus('Error checking data - continuing anyway');
          setIsInitialized(true);
          return;
        }

        // If no Premier League teams exist, import data
        if (!existingTeams || existingTeams.length === 0) {
          setInitializationStatus('No data found. Importing Premier League data...');
          console.log('No Premier League data found, starting import...');
          
          try {
            const result = await importLeagueData('Premier League', false);
            
            if (result.success) {
              setInitializationStatus(`Import complete! ${result.teams} teams, ${result.players} players imported.`);
              console.log('Import successful:', result);
            } else {
              setInitializationStatus('Import failed, but app will continue to work');
              console.log('Import failed but continuing');
            }
          } catch (importError) {
            console.error('Import error:', importError);
            setInitializationStatus('Import failed, but app will continue to work');
          }
        } else {
          console.log('Premier League data already exists, skipping import');
          setInitializationStatus('Data already available');
        }

      } catch (error) {
        console.error('App initialization error:', error);
        setInitializationStatus('Initialization failed, but app will continue');
      } finally {
        console.log('App initialization complete, setting initialized to true');
        setIsInitialized(true);
      }
    };

    // Add a timeout to ensure app doesn't hang indefinitely
    const timeoutId = setTimeout(() => {
      console.log('Initialization timeout - forcing app to initialize');
      setInitializationStatus('Initialization timeout - continuing anyway');
      setIsInitialized(true);
    }, 10000); // 10 second timeout

    initializeApp().then(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  return {
    isInitialized,
    initializationStatus
  };
};
