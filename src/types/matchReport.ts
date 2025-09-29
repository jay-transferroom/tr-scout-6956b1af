export interface MatchTemplate {
  id: string;
  name: string;
  description: string;
  depth: 'light' | 'standard' | 'detailed';
  sections: MatchSection[];
  targetAgeGroup?: string;
  targetLevel?: string;
}

export interface MatchSection {
  id: string;
  title: string;
  type: 'context' | 'overview' | 'players' | 'notes';
  fields: MatchField[];
  required?: boolean;
}

export interface MatchField {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'rating' | 'number' | 'datetime' | 'formation' | 'player-list' | 'quick-tags';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface MatchReport {
  id: string;
  templateId: string;
  scoutId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in-progress' | 'completed';
  mode: 'live' | 'replay';
  
  // Match Context
  matchContext: {
    competition: string;
    date: string;
    location: string;
    homeTeam: string;
    awayTeam: string;
    conditions?: string;
    attendance?: number;
  };
  
  // Match Overview
  overview: {
    homeFormation?: string;
    awayFormation?: string;
    tacticalNotes?: string;
    matchQuality?: number;
    keyThemes?: string[];
  };
  
  // Player Assessments
  playerAssessments: PlayerAssessment[];
  
  // General Notes
  generalNotes: {
    keyMoments?: string;
    progressionNotes?: string;
    overallRecommendation?: string;
    additionalNotes?: string;
  };
  
  // Metadata
  totalDuration?: number;
  timestamps?: { [key: string]: number };
}

export interface PlayerAssessment {
  playerId?: string;
  playerName: string;
  team: 'home' | 'away';
  position: string;
  role?: string;
  minutesPlayed: number;
  startingXI: boolean;
  performanceNotes: string;
  rating?: number;
  keyEvents: KeyEvent[];
  substituteInfo?: {
    timeOn?: number;
    timeOff?: number;
    reason?: string;
  };
}

export interface KeyEvent {
  id: string;
  type: 'goal' | 'assist' | 'duel-won' | 'duel-lost' | 'error' | 'key-pass' | 'tackle' | 'interception' | 'foul' | 'card' | 'custom';
  timestamp?: number;
  description?: string;
  impact: 'positive' | 'negative' | 'neutral';
  quickCapture?: boolean;
}

export interface MatchMoment {
  id: string;
  timestamp?: number;
  description: string;
  significance: 'low' | 'medium' | 'high';
  tags?: string[];
}

export const MATCH_TEMPLATES: MatchTemplate[] = [
  {
    id: 'youth-light',
    name: 'Youth Match (Light)',
    description: 'Simplified template for youth matches (U16 and below)',
    depth: 'light',
    targetAgeGroup: 'U16',
    sections: [
      {
        id: 'context',
        title: 'Match Context',
        type: 'context',
        required: true,
        fields: [
          { id: 'competition', label: 'Competition', type: 'text', required: true },
          { id: 'date', label: 'Date', type: 'datetime', required: true },
          { id: 'homeTeam', label: 'Home Team', type: 'text', required: true },
          { id: 'awayTeam', label: 'Away Team', type: 'text', required: true },
          { id: 'location', label: 'Location', type: 'text' },
        ]
      },
      {
        id: 'overview',
        title: 'Match Overview',
        type: 'overview',
        fields: [
          { id: 'matchQuality', label: 'Match Quality', type: 'rating' },
          { id: 'keyThemes', label: 'Key Themes', type: 'quick-tags' },
        ]
      },
      {
        id: 'players',
        title: 'Player Assessments',
        type: 'players',
        fields: [
          { id: 'playerList', label: 'Players to Assess', type: 'player-list' }
        ]
      }
    ]
  },
  {
    id: 'first-team-detailed',
    name: 'First Team (Detailed)',
    description: 'Comprehensive template for first team matches',
    depth: 'detailed',
    targetLevel: 'First Team',
    sections: [
      {
        id: 'context',
        title: 'Match Context',
        type: 'context',
        required: true,
        fields: [
          { id: 'competition', label: 'Competition', type: 'text', required: true },
          { id: 'date', label: 'Date', type: 'datetime', required: true },
          { id: 'homeTeam', label: 'Home Team', type: 'text', required: true },
          { id: 'awayTeam', label: 'Away Team', type: 'text', required: true },
          { id: 'location', label: 'Location', type: 'text', required: true },
          { id: 'conditions', label: 'Weather/Conditions', type: 'dropdown', options: ['Perfect', 'Good', 'Windy', 'Rainy', 'Cold', 'Hot'] },
          { id: 'attendance', label: 'Attendance', type: 'number' },
        ]
      },
      {
        id: 'overview',
        title: 'Match Overview',
        type: 'overview',
        fields: [
          { id: 'homeFormation', label: 'Home Formation', type: 'formation' },
          { id: 'awayFormation', label: 'Away Formation', type: 'formation' },
          { id: 'tacticalNotes', label: 'Tactical Notes', type: 'text' },
          { id: 'matchQuality', label: 'Match Quality', type: 'rating' },
          { id: 'keyThemes', label: 'Key Themes', type: 'quick-tags' },
        ]
      },
      {
        id: 'players',
        title: 'Player Assessments',
        type: 'players',
        fields: [
          { id: 'playerList', label: 'Players to Assess', type: 'player-list' }
        ]
      },
      {
        id: 'notes',
        title: 'General Notes',
        type: 'notes',
        fields: [
          { id: 'keyMoments', label: 'Key Match Moments', type: 'text' },
          { id: 'progressionNotes', label: 'Progression vs Past', type: 'text' },
          { id: 'overallRecommendation', label: 'Overall Recommendation', type: 'text' },
        ]
      }
    ]
  }
];

export const QUICK_EVENT_TYPES = [
  { id: 'goal', label: 'Goal', color: '#22C55E', icon: '⚽' },
  { id: 'assist', label: 'Assist', color: '#3B82F6', icon: '🎯' },
  { id: 'duel-won', label: 'Duel Won', color: '#10B981', icon: '💪' },
  { id: 'duel-lost', label: 'Duel Lost', color: '#EF4444', icon: '❌' },
  { id: 'error', label: 'Error', color: '#DC2626', icon: '🚫' },
  { id: 'key-pass', label: 'Key Pass', color: '#8B5CF6', icon: '🔑' },
  { id: 'tackle', label: 'Tackle', color: '#059669', icon: '🛡️' },
  { id: 'foul', label: 'Foul', color: '#D97706', icon: '⚠️' },
];