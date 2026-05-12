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

  const updateAssignment = useCallback(
    (id: string, patch: Partial<FixtureAssignment>) => {
      const result = fixtureAssignmentStore.update(id, patch);
      emit();
      return result;
    },
    []
  );

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

  /** True if a fixture assignment belongs to the user (by id or email). */
  const isAssignmentForUser = useCallback(
    (a: FixtureAssignment, userId?: string, userEmail?: string) => {
      if (!userId && !userEmail) return false;
      if (a.scoutId === userId) return true;
      if (userEmail && a.scoutId.toLowerCase() === userEmail.toLowerCase()) return true;
      const resolved = resolveScout(a.scoutId);
      return !!resolved && resolved.id === userId;
    },
    [resolveScout]
  );

  /** Return the resolved scout id for an assignment (live profile id when possible). */
  const resolvedScoutId = useCallback(
    (a: FixtureAssignment) => resolveScout(a.scoutId)?.id ?? a.scoutId,
    [resolveScout]
  );

  const upsertReport = useCallback((report: MatchReport) => {
    const result = fixtureAssignmentStore.upsertReport(report);
    emit();
    return result;
  }, []);

  const getReportByAssignmentId = useCallback(
    (id: string) => reports.find((r) => r.fixtureAssignmentId === id),
    [reports]
  );

  const getAssignment = useCallback(
    (id: string) => assignments.find((a) => a.id === id),
    [assignments]
  );

  return {
    assignments,
    reports,
    createForFixture,
    removeAssignment,
    updateAssignment,
    upsertReport,
    getReportByAssignmentId,
    getAssignment,
    assignedScoutIdsFor,
    assignmentsForFixture,
    resolveScout,
    resolvedScoutId,
    isAssignmentForUser,
    DEMO_SCOUT_EMAILS,
  };
};
