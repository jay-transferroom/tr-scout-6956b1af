/**
 * LocalStorage-backed mock store for fixture assignments + match reports.
 * Seeded on first read so demo data is stable across reloads.
 */
import type {
  FixtureAssignment,
  MatchReport,
} from "@/types/fixtureAssignment";

const ASSIGNMENTS_KEY = "tr-scout.fixture-assignments.v3";
const REPORTS_KEY = "tr-scout.match-reports.v3";

/** Demo scout identifiers — resolved to live profile ids on the read path. */
export const DEMO_SCOUT_EMAILS = {
  oliver: "scout@demo.com",
  emma: "scout2@demo.com",
  dave: "manager@demo.com",
} as const;

const DEMO_MANAGER = "manager@demo.com";

/**
 * Curated fixtures matching real rows in fixtures_results_2526.
 * Date format MUST match what Supabase returns (ISO with +00:00 offset)
 * because getFixtureId is computed verbatim from match_date_utc.
 */
const seedFixtures = [
  // Upcoming — pending / in_progress
  { home: "Aston Villa", away: "Liverpool", date: "2026-05-17T14:00:00+00:00" },
  { home: "Arsenal", away: "Burnley", date: "2026-05-17T14:00:00+00:00" },
  { home: "Chelsea", away: "Spurs", date: "2026-05-17T14:00:00+00:00" },
  { home: "Man Utd", away: "Nott'm Forest", date: "2026-05-17T14:00:00+00:00" },
  { home: "Newcastle", away: "West Ham", date: "2026-05-17T14:00:00+00:00" },
  { home: "Wolves", away: "Fulham", date: "2026-05-17T14:00:00+00:00" },
  // Completed (with reports)
  { home: "Crystal Palace", away: "Everton", date: "2026-05-09T14:00:00+00:00" },
  { home: "Liverpool", away: "Chelsea", date: "2026-05-09T14:00:00+00:00" },
];

const fixtureId = (f: { home: string; away: string; date: string }) =>
  `${f.home}__${f.away}__${f.date}`.toLowerCase().replace(/[^a-z0-9_]+/g, "-");

const buildSeed = (): { assignments: FixtureAssignment[]; reports: MatchReport[] } => {
  const now = new Date().toISOString();
  const assignments: FixtureAssignment[] = [
    {
      id: "fa-seed-1",
      scoutId: DEMO_SCOUT_EMAILS.oliver,
      fixtureId: fixtureId(seedFixtures[0]),
      status: "pending",
      priority: "high",
      notes: "Focus on the Liverpool front three — pressing triggers and second-ball recovery.",
      deadline: "2026-05-17",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-2",
      scoutId: DEMO_SCOUT_EMAILS.emma,
      fixtureId: fixtureId(seedFixtures[1]),
      status: "pending",
      priority: "medium",
      notes: "Watch Fulham's right-back rotation; assess transition defending.",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-3",
      scoutId: DEMO_SCOUT_EMAILS.oliver,
      fixtureId: fixtureId(seedFixtures[2]),
      status: "in_progress",
      priority: "high",
      deadline: "2026-05-19",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-4",
      scoutId: DEMO_SCOUT_EMAILS.emma,
      fixtureId: fixtureId(seedFixtures[3]),
      status: "pending",
      priority: "low",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-5",
      scoutId: DEMO_SCOUT_EMAILS.dave,
      fixtureId: fixtureId(seedFixtures[4]),
      status: "pending",
      priority: "medium",
      notes: "Brentford set pieces — both sides.",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-6",
      scoutId: DEMO_SCOUT_EMAILS.emma,
      fixtureId: fixtureId(seedFixtures[5]),
      status: "in_progress",
      priority: "medium",
      deadline: "2026-05-22",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
    },
    {
      id: "fa-seed-7",
      scoutId: DEMO_SCOUT_EMAILS.oliver,
      fixtureId: fixtureId(seedFixtures[6]),
      status: "completed",
      priority: "medium",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
      matchReportId: "mr-seed-1",
    },
    {
      id: "fa-seed-8",
      scoutId: DEMO_SCOUT_EMAILS.emma,
      fixtureId: fixtureId(seedFixtures[7]),
      status: "completed",
      priority: "high",
      assignedById: DEMO_MANAGER,
      assignedAt: now,
      matchReportId: "mr-seed-2",
    },
  ];

  const reports: MatchReport[] = [
    {
      id: "mr-seed-1",
      fixtureAssignmentId: "fa-seed-7",
      fixtureId: fixtureId(seedFixtures[6]),
      scoutId: DEMO_SCOUT_EMAILS.oliver,
      overallNotes:
        "End-to-end game; Palace's midfield press disrupted Wolves' build-up consistently. Two stand-out performers worth follow-up.",
      playerObservations: [
        { playerId: "demo-player-1", rating: 8, notes: "Carrying threat from deep, exceptional press resistance." },
        { playerId: "demo-player-2", rating: 7, notes: "Composed in possession, modest defensive output." },
      ],
      status: "submitted",
      submittedAt: now,
    },
    {
      id: "mr-seed-2",
      fixtureAssignmentId: "fa-seed-8",
      fixtureId: fixtureId(seedFixtures[7]),
      scoutId: DEMO_SCOUT_EMAILS.emma,
      overallNotes: "Burnley's wing-backs caught high repeatedly; Everton's #10 dictated tempo.",
      playerObservations: [
        { playerId: "demo-player-3", rating: 9, notes: "Game-changing creator. Recommend follow-up live viewing." },
      ],
      status: "submitted",
      submittedAt: now,
    },
  ];

  return { assignments, reports };
};

const read = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

const write = <T>(key: string, value: T[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const ensureSeeded = () => {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(ASSIGNMENTS_KEY)) {
    const { assignments, reports } = buildSeed();
    write(ASSIGNMENTS_KEY, assignments);
    write(REPORTS_KEY, reports);
  }
};

export const fixtureAssignmentStore = {
  list(): FixtureAssignment[] {
    ensureSeeded();
    return read<FixtureAssignment>(ASSIGNMENTS_KEY);
  },
  listReports(): MatchReport[] {
    ensureSeeded();
    return read<MatchReport>(REPORTS_KEY);
  },
  add(assignment: FixtureAssignment): FixtureAssignment {
    const all = this.list();
    all.push(assignment);
    write(ASSIGNMENTS_KEY, all);
    return assignment;
  },
  update(id: string, patch: Partial<FixtureAssignment>): FixtureAssignment | null {
    const all = this.list();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch };
    write(ASSIGNMENTS_KEY, all);
    return all[idx];
  },
  remove(id: string) {
    write(
      ASSIGNMENTS_KEY,
      this.list().filter((a) => a.id !== id)
    );
  },
  upsertReport(report: MatchReport) {
    const all = this.listReports();
    const idx = all.findIndex((r) => r.id === report.id);
    if (idx === -1) all.push(report);
    else all[idx] = report;
    write(REPORTS_KEY, all);
    return report;
  },
  getReportByAssignmentId(fixtureAssignmentId: string): MatchReport | undefined {
    return this.listReports().find((r) => r.fixtureAssignmentId === fixtureAssignmentId);
  },
  getReportById(id: string): MatchReport | undefined {
    return this.listReports().find((r) => r.id === id);
  },
};

export const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
