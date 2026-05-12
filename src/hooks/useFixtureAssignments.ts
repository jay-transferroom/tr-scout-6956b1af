import { useCallback, useEffect, useState } from "react";
import {
  fixtureAssignmentStore,
  newId,
} from "@/utils/mockFixtureAssignments";
import type {
  FixtureAssignment,
  FixtureAssignmentPriority,
  MatchReport,
} from "@/types/fixtureAssignment";

const EVENT = "tr-scout:fixture-assignments-changed";

const emit = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
};

export const useFixtureAssignments = () => {
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

  const assignedScoutIdsFor = useCallback(
    (fixtureId: string) =>
      assignments.filter((a) => a.fixtureId === fixtureId).map((a) => a.scoutId),
    [assignments]
  );

  return {
    assignments,
    reports,
    createForFixture,
    assignedScoutIdsFor,
  };
};
