// Team logo utility functions for Supabase Storage

const SUPABASE_STORAGE_URL = "https://xtdrmhrmcmjcrkqtzbxe.supabase.co/storage/v1/object/public/scout_images";

// Map of team names to their logo files in storage
const TEAM_LOGO_MAP: Record<string, string> = {
  // Premier League
  "Arsenal": "/badges/arsenal.svg",
  "Aston Villa": "aston villa.svg", 
  "Brighton & Hove Albion": "brighton & hove albion.svg",
  "Brighton": "brighton & hove albion.svg",
  "Brentford": "brentford.svg",
  "Burnley": "burnley.svg",
  "Chelsea": "/badges/chelsea.svg",
  "Chelsea F.C.": "/badges/chelsea.svg",
  "Crystal Palace": "crystal palace.svg",
  "Everton": "everton.svg",
  "Leeds United": "leeds united.svg",
  "Leicester City": "leicester city.svg",
  "Liverpool": "/badges/liverpool.svg",
  "Manchester City": "/badges/manchester-city.svg",
  "Man City": "/badges/manchester-city.svg",
  "Manchester United": "manchester united.svg",
  "Man Utd": "manchester united.svg",
  "Newcastle United": "newcastle united.svg",
  "Norwich City": "norwich city.svg",
  "Nottingham Forest": "/badges/nottingham-forest.svg",
  "Nottm Forest": "/badges/nottingham-forest.svg",
  "Nott'm Forest": "/badges/nottingham-forest.svg",
  "Fulham": "/badges/fulham.svg",
  "Fulham FC": "/badges/fulham.svg",
  "Sunderland": "/badges/sunderland.svg",
  "Sunderland AFC": "/badges/sunderland.svg",
  "Bournemouth": "/badges/bournemouth.svg",
  "AFC Bournemouth": "/badges/bournemouth.svg",
  "Tottenham Hotspur": "/badges/tottenham-hotspur.svg",
  "Tottenham": "/badges/tottenham-hotspur.svg",
  "Spurs": "/badges/tottenham-hotspur.svg",
  "Watford": "watford.svg",
  "West Ham United": "west ham united.svg",
  "West Ham": "west ham united.svg",
  "Wolverhampton Wanderers": "wolverhampton wanderers.svg",
  "Wolves": "wolverhampton wanderers.svg",
  
  // International clubs
  "AC Milan": "ac milan.svg",
  "Barcelona": "barcelona.svg",
  "Real Madrid": "real madrid.svg", 
  "Paris Saint-Germain": "paris saint-germain.svg",
  "PSG": "paris saint-germain.svg"
};

/**
 * Get the logo URL for a team from Supabase Storage
 * @param teamName - The name of the team
 * @returns The full URL to the team's logo or undefined if not found
 */
export const getTeamLogoUrl = (teamName: string): string | undefined => {
  if (!teamName) return undefined;
  
  // Normalize team name and check for exact match first
  const logoFile = TEAM_LOGO_MAP[teamName];
  if (logoFile) {
    // Check if it's a public path (starts with /)
    if (logoFile.startsWith('/')) {
      return logoFile;
    }
    return `${SUPABASE_STORAGE_URL}/${logoFile}`;
  }
  
  // Try fuzzy matching for partial names
  const normalizedName = teamName.toLowerCase();
  for (const [key, file] of Object.entries(TEAM_LOGO_MAP)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      // Check if it's a public path (starts with /)
      if (file.startsWith('/')) {
        return file;
      }
      return `${SUPABASE_STORAGE_URL}/${file}`;
    }
  }
  
  return undefined;
};

/**
 * Get all available team logos
 * @returns Object mapping team names to logo URLs
 */
export const getAllTeamLogos = (): Record<string, string> => {
  const logos: Record<string, string> = {};
  for (const [teamName, logoFile] of Object.entries(TEAM_LOGO_MAP)) {
    logos[teamName] = `${SUPABASE_STORAGE_URL}/${logoFile}`;
  }
  return logos;
};