export interface MatchScoutingPlayerDraft {
  notes: string;
  rating: number | null;
  ratings?: Record<string, string>;
}

export interface MatchScoutingDraft {
  homeOrder: string[];
  awayOrder: string[];
  playerDrafts: Record<string, MatchScoutingPlayerDraft>;
}

const MATCH_SCOUTING_DRAFT_PREFIX = "match-scouting-draft:";

export const getMatchScoutingDraftKey = (matchIdentifier: string) => {
  return `${MATCH_SCOUTING_DRAFT_PREFIX}${matchIdentifier}`;
};

export const loadMatchScoutingDraft = (matchIdentifier: string): MatchScoutingDraft | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(getMatchScoutingDraftKey(matchIdentifier));
    if (!rawDraft) return null;

    const parsedDraft = JSON.parse(rawDraft) as Partial<MatchScoutingDraft>;

    return {
      homeOrder: Array.isArray(parsedDraft.homeOrder) ? parsedDraft.homeOrder : [],
      awayOrder: Array.isArray(parsedDraft.awayOrder) ? parsedDraft.awayOrder : [],
      playerDrafts: parsedDraft.playerDrafts && typeof parsedDraft.playerDrafts === "object"
        ? parsedDraft.playerDrafts
        : {},
    };
  } catch (error) {
    console.error("Failed to load match scouting draft:", error);
    return null;
  }
};

export const saveMatchScoutingDraft = (matchIdentifier: string, draft: MatchScoutingDraft) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getMatchScoutingDraftKey(matchIdentifier), JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save match scouting draft:", error);
  }
};

interface MatchScoutingPageUrlOptions {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

export const buildMatchScoutingPageUrl = ({
  homeTeam,
  awayTeam,
  matchDate,
  homeScore,
  awayScore,
}: MatchScoutingPageUrlOptions) => {
  const params = new URLSearchParams({
    homeTeam,
    awayTeam,
    matchDate,
  });

  if (homeScore !== null && homeScore !== undefined) {
    params.set("homeScore", String(homeScore));
  }

  if (awayScore !== null && awayScore !== undefined) {
    params.set("awayScore", String(awayScore));
  }

  return `/match-scouting/report?${params.toString()}`;
};

interface PlayerFullReportUrlOptions {
  playerId: string;
  templateId: string;
  matchDate: string;
  opposition: string;
  competition?: string;
  minutesPlayed?: number;
  watchMethod?: "Live" | "Video" | "Data";
  fixtureId?: string;
  roleContext?: string;
}

export const buildPlayerFullReportUrl = ({
  playerId,
  templateId,
  matchDate,
  opposition,
  competition = "Match Scouting",
  minutesPlayed = 0,
  watchMethod = "Live",
  fixtureId,
  roleContext,
}: PlayerFullReportUrlOptions) => {
  const params = new URLSearchParams({
    playerId,
    templateId,
    matchDate,
    opposition,
    competition,
    minutesPlayed: String(minutesPlayed),
    watchMethod,
  });

  if (fixtureId) {
    params.set("fixtureId", fixtureId);
  }

  if (roleContext) {
    params.set("roleContext", roleContext);
  }

  return `/report-builder?${params.toString()}`;
};
