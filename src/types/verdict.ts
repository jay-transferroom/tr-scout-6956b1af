
export type VerdictType = 
  | 'recommend-signing'
  | 'add-to-shortlist' 
  | 'monitor'
  | 'further-scouting'
  | 'with-reservations'
  | 'not-recommended';

export interface VerdictOption {
  value: VerdictType;
  label: string;
  icon: string;
  color: string;
  /** Solid hex used by the unified RecommendationBadge presentation. */
  hexColor: string;
  description: string;
}

export const VERDICT_OPTIONS: VerdictOption[] = [
  {
    value: 'recommend-signing',
    label: 'Recommend for signing',
    icon: '✅',
    color: 'text-green-600 bg-green-50 border-green-200',
    hexColor: '#16A34A',
    description: 'Strong recommendation to proceed with signing this player'
  },
  {
    value: 'add-to-shortlist',
    label: 'Add to shortlist',
    icon: '📥',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    hexColor: '#2563EB',
    description: 'Player should be added to our shortlist for future consideration'
  },
  {
    value: 'monitor',
    label: 'Monitor',
    icon: '👁',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    hexColor: '#7C3AED',
    description: 'Continue monitoring player development and performance'
  },
  {
    value: 'further-scouting',
    label: 'Further scouting required',
    icon: '🧪',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    hexColor: '#EA580C',
    description: 'More scouting assessment needed before making a decision'
  },
  {
    value: 'with-reservations',
    label: 'With reservations',
    icon: '⚠️',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hexColor: '#CA8A04',
    description: 'Some concerns exist that need to be addressed'
  },
  {
    value: 'not-recommended',
    label: 'Not recommended',
    icon: '❌',
    color: 'text-red-600 bg-red-50 border-red-200',
    hexColor: '#DC2626',
    description: 'Do not recommend pursuing this player'
  }
];

export const getVerdictOption = (value: string): VerdictOption | null => {
  return VERDICT_OPTIONS.find(option => option.value === value) || null;
};

export const getVerdictDisplay = (value: string | null): string => {
  if (!value) return '';
  const option = getVerdictOption(value);
  return option ? `${option.icon} ${option.label}` : value;
};
