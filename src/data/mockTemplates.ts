import { ReportTemplate } from "@/types/report";

// Create a single match scouting template
const createMatchScoutingTemplate = (): ReportTemplate => ({
  id: `match-scouting`,
  name: `Match Scouting Report`,
  description: `Comprehensive match analysis with configurable depth - capture live or replay observations`,
  defaultTemplate: false,
  defaultRatingSystem: {
    type: "numeric-1-10",
    values: Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}`,
      description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
    })),
  },
  sections: [
    {
      id: "match-redirect",
      title: "Match Scouting",
      fields: [
        {
          id: "redirectToMatch",
          label: "Redirect to Match Scouting",
          type: "text",
          required: false,
          description: "This will redirect to the match scouting interface with template options"
        }
      ]
    }
  ],
  isMatchTemplate: true,
  originalMatchTemplate: null
});

export const mockTemplates: ReportTemplate[] = [
  {
    id: "t1",
    name: "Standard Scouting Report",
    description: "Complete assessment for professional players",
    defaultTemplate: true,
    defaultRatingSystem: {
      type: "numeric-1-10",
      values: Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}`,
        description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
      })),
    },
    sections: [
      {
        id: "overall",
        title: "Overall Rating",
        fields: [
          {
            id: "overallRating",
            label: "Overall Player Rating",
            type: "rating",
            required: true,
            description: "Comprehensive evaluation of the player's abilities",
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "overallAssessment",
            label: "Overall Assessment",
            type: "text",
            required: true,
            description: "Summary of the player's strengths, weaknesses and potential",
          },
        ],
      },
      {
        id: "technical",
        title: "Technical Attributes",
        fields: [
          {
            id: "ballControl",
            label: "Ball Control",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "passing",
            label: "Passing Range & Accuracy",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "shooting",
            label: "Shooting Technique",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "dribbling",
            label: "Dribbling & Ball Manipulation",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "technicalNotes",
            label: "Technical Notes",
            type: "text",
            required: false,
          },
        ],
      },
      {
        id: "physical",
        title: "Physical Attributes",
        fields: [
          {
            id: "pace",
            label: "Pace & Acceleration",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "strength",
            label: "Physical Strength",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "stamina",
            label: "Stamina & Endurance",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "agility",
            label: "Agility & Balance",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "physicalNotes",
            label: "Physical Notes",
            type: "text",
            required: false,
          },
        ],
      },
      {
        id: "tactical",
        title: "Tactical & Mental",
        fields: [
          {
            id: "positioning",
            label: "Positioning & Awareness",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "decisionMaking",
            label: "Decision Making",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "workRate",
            label: "Work Rate & Attitude",
            type: "rating",
            required: true,
            ratingSystem: {
              type: "numeric-1-10",
              values: Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
                description: i < 3 ? "Below standard" : i < 6 ? "Average" : i < 8 ? "Good" : "Excellent"
              })),
            },
          },
          {
            id: "tacticalNotes",
            label: "Tactical Notes",
            type: "text",
            required: false,
          },
        ],
      },
      {
        id: "recommendation",
        title: "Recommendation",
        fields: [
          {
            id: "verdict",
            label: "Verdict",
            type: "dropdown",
            required: true,
            options: [
              "Sign / Proceed to next stage",
              "Monitor / Track Further", 
              "Further Scouting Required",
              "Concerns / With Reservations",
              "Do Not Pursue"
            ],
            description: "Final recommendation based on assessment"
          },
          {
            id: "summary",
            label: "Summary Notes",
            type: "text",
            required: true,
          },
        ],
      },
    ],
  },
  // Add single match scouting template
  createMatchScoutingTemplate(),
];