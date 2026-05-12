/**
 * Unified view over player-level + fixture-level assignments for the current user.
 * Used by /assigned-players to render both kinds in one sorted list.
 */
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyScoutingTasks, type ScoutingAssignmentWithDetails } from "@/hooks/useScoutingAssignments";
import { useFixtureAssignments } from "@/hooks/useFixtureAssignments";
import { useFixturesData, type Fixture } from "@/hooks/useFixturesData";
import { getFixtureId, type FixtureAssignment } from "@/types/fixtureAssignment";

export type NormalizedStatus = "pending" | "in_progress" | "completed" | "reviewed";

export interface UnifiedAssignment {
  id: string;
  kind: "player" | "fixture";
  status: NormalizedStatus;
  rawStatus: string;
  priority: string;
  deadline?: string;
  assignedAt: string;
  /** Sort key (epoch ms): kickoff for fixtures, deadline-or-created for players. */
  sortKey: number;
  player?: ScoutingAssignmentWithDetails;
  fixtureAssignment?: FixtureAssignment;
  fixture?: Fixture;
}

const normalizePlayerStatus = (s: string): NormalizedStatus => {
  if (s === "assigned") return "pending";
  if (s === "in_progress") return "in_progress";
  if (s === "reviewed") return "reviewed";
  return "completed";
};

export const useUnifiedAssignments = () => {
  const { user, profile } = useAuth();
  const { data: playerAssignments = [], isLoading: playerLoading } = useMyScoutingTasks();
  const { assignments: fixtureAssignments, isAssignmentForUser } = useFixtureAssignments();
  const { data: fixtures = [], isLoading: fixturesLoading } = useFixturesData();

  const fixtureMap = useMemo(() => {
    const m = new Map<string, Fixture>();
    fixtures.forEach((f) => m.set(getFixtureId(f), f));
    return m;
  }, [fixtures]);

  const myFixtureAssignments = useMemo(() => {
    const email = (profile as any)?.email ?? user?.email;
    return fixtureAssignments.filter((a) =>
      isAssignmentForUser(a, user?.id, email)
    );
  }, [fixtureAssignments, isAssignmentForUser, user, profile]);

  const items = useMemo<UnifiedAssignment[]>(() => {
    const playerItems: UnifiedAssignment[] = playerAssignments.map((a) => ({
      id: `player-${a.id}`,
      kind: "player",
      status: normalizePlayerStatus(a.status),
      rawStatus: a.status,
      priority: a.priority,
      deadline: a.deadline,
      assignedAt: a.created_at,
      sortKey: new Date(a.deadline ?? a.created_at).getTime(),
      player: a,
    }));
    const fixtureItems: UnifiedAssignment[] = myFixtureAssignments.map((a) => {
      const f = fixtureMap.get(a.fixtureId);
      return {
        id: `fixture-${a.id}`,
        kind: "fixture",
        status: a.status as NormalizedStatus,
        rawStatus: a.status,
        priority: a.priority,
        deadline: a.deadline,
        assignedAt: a.assignedAt,
        sortKey: f
          ? new Date(f.match_date_utc).getTime()
          : a.deadline
          ? new Date(a.deadline).getTime()
          : new Date(a.assignedAt).getTime(),
        fixtureAssignment: a,
        fixture: f,
      };
    });
    return [...playerItems, ...fixtureItems].sort((x, y) => x.sortKey - y.sortKey);
  }, [playerAssignments, myFixtureAssignments, fixtureMap]);

  const stats = useMemo(() => {
    const make = (filter: (i: UnifiedAssignment) => boolean) => {
      const list = items.filter(filter);
      return {
        total: list.length,
        player: list.filter((i) => i.kind === "player").length,
        fixture: list.filter((i) => i.kind === "fixture").length,
      };
    };
    return {
      total: make(() => true),
      pending: make((i) => i.status === "pending"),
      inProgress: make((i) => i.status === "in_progress"),
      completed: make((i) => i.status === "completed" || i.status === "reviewed"),
    };
  }, [items]);

  return {
    items,
    stats,
    isLoading: playerLoading || fixturesLoading,
  };
};
