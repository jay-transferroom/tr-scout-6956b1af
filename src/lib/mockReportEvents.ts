// Prototype-only event surface for "report submitted" auto-transitions.
// Real backends would emit these from the server; here we dispatch from
// mock UI actions (e.g. clicking Submit in MatchScoutingPanel).

import type { RuleTrigger } from "@/hooks/usePipelineColumns";

export const MOCK_REPORT_SUBMITTED_EVENT = "mock:report-submitted";

export interface MockReportSubmittedDetail {
  playerIds: string[];
  // Which trigger this submission represents. The match-scouting panel
  // emits "data_report_submitted" by default for the prototype.
  trigger: Extract<RuleTrigger, "data_report_submitted" | "video_report_submitted">;
}

export const emitMockReportSubmitted = (detail: MockReportSubmittedDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MockReportSubmittedDetail>(MOCK_REPORT_SUBMITTED_EVENT, { detail }),
  );
};
