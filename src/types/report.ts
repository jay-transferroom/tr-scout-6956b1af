import { Player } from "./player";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  defaultTemplate?: boolean;
  defaultRatingSystem?: RatingSystem; // Added default rating system
  isMatchTemplate?: boolean; // Added for match templates
  originalMatchTemplate?: any; // Added for match templates
}

export interface ReportSection {
  id: string;
  title: string;
  fields: ReportField[];
  optional?: boolean;
}

export type ReportFieldType = 'rating' | 'text' | 'dropdown' | 'checkbox' | 'number';

export interface ReportField {
  id: string;
  label: string;
  type: ReportFieldType;
  required?: boolean;
  options?: string[] | number[];
  ratingSystem?: RatingSystem;
  description?: string;
}

export type RatingSystemType = 'numeric-1-5' | 'numeric-1-10' | 'letter' | 'custom-tags' | 'percentage';

export interface RatingSystem {
  type: RatingSystemType;
  values: Array<{
    value: string | number;
    label?: string;
    color?: string;
    description?: string;
  }>;
}

export interface Report {
  id: string;
  playerId: string;
  templateId: string;
  scoutId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
  sections: ReportSectionData[];
  matchContext?: {
    fixtureId?: string;
    date: string;
    opposition: string;
    competition: string;
    minutesPlayed: number;
    conditions?: string;
    roleContext?: string;
  };
  tags?: string[];
  flaggedForReview?: boolean;
  requirementProfile?: RequirementProfile;
}

export interface ReportWithPlayer extends Report {
  player: Player;
  scoutProfile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: 'scout' | 'recruitment';
  };
}

export interface ReportSectionData {
  sectionId: string;
  fields: {
    fieldId: string;
    value: any;
    notes?: string;
  }[];
}

// New interfaces for template editing
export interface RatingOption {
  value: string | number;
  label?: string;
  color?: string;
  description?: string;
}

// New interface for player requirements
export interface RequirementProfile {
  id: string;
  name: string;
  description?: string;
  requiredPositions: string[];
  ageRange?: {
    min?: number;
    max?: number;
  };
  preferredRegions?: string[];
  requiredAttributes?: {
    attributeName: string;
    minRating: number | string;
  }[];
  notes?: string;
  squad?: 'first-team' | 'under-21' | 'under-18' | 'academy' | 'reserves';
  priority?: 'high' | 'medium' | 'low';
  deadline?: string;
}

export const DEFAULT_RATING_SYSTEMS: Record<RatingSystemType, RatingSystem> = {
  'numeric-1-5': {
    type: 'numeric-1-5',
    values: Array.from({ length: 5 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`,
      description: i < 2 ? "Below average" : i < 3 ? "Average" : i < 4 ? "Good" : "Excellent",
      color: i < 2 ? "#EF4444" : i < 3 ? "#EAB308" : i < 4 ? "#84CC16" : "#22C55E"
    }))
  },
  'numeric-1-10': {
    type: 'numeric-1-10',
    values: Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`,
      description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent",
      color: i < 3 ? "#EF4444" : i < 6 ? "#EAB308" : i < 8 ? "#84CC16" : "#22C55E" 
    }))
  },
  'letter': {
    type: 'letter',
    values: [
      { value: "A", label: "Elite", color: "#22C55E" },
      { value: "B", label: "Very Good", color: "#84CC16" },
      { value: "C", label: "Average", color: "#EAB308" },
      { value: "D", label: "Below Average", color: "#F97316" },
      { value: "E", label: "Poor", color: "#EF4444" },
    ]
  },
  'custom-tags': {
    type: 'custom-tags',
    values: [
      { value: "Elite", color: "#22C55E" },
      { value: "Good", color: "#84CC16" },
      { value: "Average", color: "#EAB308" },
      { value: "Raw", color: "#F97316" },
      { value: "Poor", color: "#EF4444" },
    ]
  },
  'percentage': {
    type: 'percentage',
    values: []
  }
};
