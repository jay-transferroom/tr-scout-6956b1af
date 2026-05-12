/**
 * Fixture-level scout assignments.
 *
 * Coexists with player-level assignments (see `usePlayerAssignments`).
 * A scout can be assigned to a player AND to a fixture independently.
 */

export type FixtureAssignmentStatus = "pending" | "in_progress" | "completed";
export type FixtureAssignmentPriority = "low" | "medium" | "high";

export interface FixtureAssignment {
  id: string;
  scoutId: string; // profile id (or demo email when seeded against demo accounts)
  fixtureId: string; // synthesized via getFixtureId(fixture)
  status: FixtureAssignmentStatus;
  priority: FixtureAssignmentPriority;
  notes?: string;
  deadline?: string; // ISO date
  assignedById: string;
  assignedAt: string; // ISO datetime
  matchReportId?: string;
}

export interface PlayerObservation {
  playerId: string;
  /** Snapshot of player metadata at time of report — used for read-only render. */
  playerName?: string;
  playerClub?: string;
  playerPositions?: string[];
  playerImage?: string;
  rating: number; // 1-10
  notes: string;
}

export interface MatchReport {
  id: string;
  fixtureAssignmentId: string;
  fixtureId: string;
  scoutId: string;
  overallNotes: string;
  homeScore?: number | null;
  awayScore?: number | null;
  weather?: string;
  attendance?: number | null;
  playerObservations: PlayerObservation[];
  status: "draft" | "submitted";
  updatedAt?: string;
  submittedAt?: string;
}

/** Stable id for a fixture row (fixtures_results_2526 has no PK). */
export const getFixtureId = (f: {
  home_team: string;
  away_team: string;
  match_date_utc: string;
}): string =>
  `${f.home_team}__${f.away_team}__${f.match_date_utc}`
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-");
