import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fixtureAssignmentStore,
  newId,
  DEMO_SCOUT_EMAILS,
} from "@/utils/mockFixtureAssignments";
import type {
  FixtureAssignment,
  FixtureAssignmentPriority,
  MatchReport,
} from "@/types/fixtureAssignment";
import { useScouts, type Scout } from "@/hooks/useScouts";

const EVENT = "tr-scout:fixture-assignments-changed";

const emit = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
};

export const useFixtureAssignments = () => {
  const { data: scouts = [] } = useScouts();
  const [assignments, setAssignments] = useState<FixtureAssignment[]>(() =>
    fixtureAssignmentStore.list()
  );
  const [reports, setReports] = useState<MatchReport[]>(() =>
    fixtureAssignmentStore.listReports()
  );

  useEffect(() => {
    const refresh = () => {
      setAssignments(fixtureAssignmentStore.list());
      setReports(fixtureAssignmentStore.listReports());
    };
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  /** Map seeded demo-email scoutIds to live profile ids when available. */
  const scoutByKey = useMemo(() => {
    const byEmail = new Map<string, Scout>();
    const byId = new Map<string, Scout>();
    scouts.forEach((s) => {
      byId.set(s.id, s);
      if (s.email) byEmail.set(s.email.toLowerCase(), s);
    });
    return { byEmail, byId };
  }, [scouts]);

  const resolveScout = useCallback(
    (scoutId: string): Scout | undefined => {
      return (
        scoutByKey.byId.get(scoutId) ??
        scoutByKey.byEmail.get(scoutId.toLowerCase())
      );
    },
    [scoutByKey]
  );

  const createForFixture = useCallback(
    (input: {
      fixtureId: string;
      scoutIds: string[];
      priority: FixtureAssignmentPriority;
      notes?: string;
      deadline?: string;
      assignedById: string;
    }): FixtureAssignment[] => {
      const created: FixtureAssignment[] = input.scoutIds.map((scoutId) => ({
        id: newId("fa"),
        scoutId,
        fixtureId: input.fixtureId,
        status: "pending",
        priority: input.priority,
        notes: input.notes,
        deadline: input.deadline,
        assignedById: input.assignedById,
        assignedAt: new Date().toISOString(),
      }));
      created.forEach((a) => fixtureAssignmentStore.add(a));
      emit();
      return created;
    },
    []
  );

  const removeAssignment = useCallback((id: string) => {
    fixtureAssignmentStore.remove(id);
    emit();
  }, []);

  const assignmentsForFixture = useCallback(
    (fixtureId: string) =>
      assignments.filter((a) => a.fixtureId === fixtureId),
    [assignments]
  );

  const assignedScoutIdsFor = useCallback(
    (fixtureId: string) =>
      assignments
        .filter((a) => a.fixtureId === fixtureId)
        .map((a) => {
          const resolved = resolveScout(a.scoutId);
          return resolved?.id ?? a.scoutId;
        }),
    [assignments, resolveScout]
  );

  return {
    assignments,
    reports,
    createForFixture,
    removeAssignment,
    assignedScoutIdsFor,
    assignmentsForFixture,
    resolveScout,
    DEMO_SCOUT_EMAILS,
  };
};
