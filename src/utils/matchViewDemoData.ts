import { ReportWithPlayer } from "@/types/report";
import { Player } from "@/types/player";

const demoDate = "2026-05-24T15:00:00.000Z";

const udogie: Player = {
  id: "demo-udogie",
  name: "Destiny Udogie",
  club: "Tottenham Hotspur",
  age: 23,
  dateOfBirth: "2002-11-28",
  positions: ["LB", "LWB"],
  dominantFoot: "Left",
  nationality: "Italy",
  contractStatus: "Under Contract",
  region: "Europe",
};

const madueke: Player = {
  id: "demo-madueke",
  name: "Noni Madueke",
  club: "Arsenal",
  age: 24,
  dateOfBirth: "2002-03-10",
  positions: ["RW", "LW"],
  dominantFoot: "Left",
  nationality: "England",
  contractStatus: "Under Contract",
  region: "Europe",
};

const scoutProfile = {
  id: "demo-scout",
  first_name: "Alex",
  last_name: "Morgan",
  email: "alex@demo.com",
  role: "scout" as const,
};

const matchContext = {
  date: demoDate,
  opposition: "Manchester United",
  competition: "Premier League",
  minutesPlayed: 90,
  isManual: true,
  homeTeam: "Brighton & Hove Albion",
  awayTeam: "Manchester United",
};

export const DEMO_MATCH_REPORTS: ReportWithPlayer[] = [
  {
    id: "demo-report-udogie",
    playerId: "demo-udogie",
    templateId: "default",
    scoutId: "demo-scout",
    createdAt: new Date(demoDate),
    updatedAt: new Date(demoDate),
    status: "submitted",
    sections: [
      {
        sectionId: "overall",
        fields: [
          { fieldId: "overall-rating", value: 8 },
          { fieldId: "recommendation", value: "monitor" },
        ],
      },
    ],
    matchContext,
    watchMethod: "Live",
    player: udogie,
    scoutProfile,
  },
  {
    id: "demo-report-madueke",
    playerId: "demo-madueke",
    templateId: "default",
    scoutId: "demo-scout",
    createdAt: new Date(demoDate),
    updatedAt: new Date(demoDate),
    status: "submitted",
    sections: [
      {
        sectionId: "overall",
        fields: [
          { fieldId: "overall-rating", value: 7 },
          { fieldId: "recommendation", value: "add-to-shortlist" },
        ],
      },
    ],
    matchContext,
    watchMethod: "Live",
    player: madueke,
    scoutProfile,
  },
];

export const DEMO_FIXTURE = {
  homeTeam: "Brighton & Hove Albion",
  awayTeam: "Manchester United",
  date: demoDate,
  competition: "Premier League",
};
