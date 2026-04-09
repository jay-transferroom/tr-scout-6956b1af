import { ReportTemplate, DEFAULT_RATING_SYSTEMS } from "@/types/report";

export const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "comprehensive-assessment",
    name: "Comprehensive Player Assessment",
    description: "Complete evaluation covering all aspects of player performance",
    defaultTemplate: true,
    defaultRatingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
    sections: [
      {
        id: "overall",
        title: "Overall Assessment",
        isOverall: true,
        fields: [
          {
            id: "overallRating",
            label: "Overall Rating",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
            description: "Overall assessment of the player (1-10 scale)"
          },
          {
            id: "recommendation",
            label: "Recommendation",
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
            label: "Executive Summary",
            type: "text",
            required: true,
            description: "Brief overview of player's strengths and suitability"
          }
        ]
      },
      {
        id: "technical",
        title: "Technical Skills",
        fields: [
          {
            id: "ballControl",
            label: "Ball Control",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "passing",
            label: "Passing",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "shooting",
            label: "Shooting",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "dribbling",
            label: "Dribbling",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          }
        ]
      },
      {
        id: "physical",
        title: "Physical Attributes",
        fields: [
          {
            id: "pace",
            label: "Pace",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "strength",
            label: "Strength",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "stamina",
            label: "Stamina",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "agility",
            label: "Agility",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          }
        ]
      },
      {
        id: "tactical",
        title: "Tactical Awareness",
        fields: [
          {
            id: "positioning",
            label: "Positioning",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "decisionMaking",
            label: "Decision Making",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "tacticalDiscipline",
            label: "Tactical Discipline",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          }
        ]
      },
      {
        id: "mental",
        title: "Mental Attributes",
        fields: [
          {
            id: "mentality",
            label: "Mentality",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "workRate",
            label: "Work Rate",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "leadership",
            label: "Leadership",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          }
        ]
      }
    ]
  },
  {
    id: "youth-development",
    name: "Youth Development Assessment",
    description: "Specialized template for evaluating young players with focus on potential",
    defaultTemplate: false,
    defaultRatingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
    sections: [
      {
        id: "overall",
        title: "Overall Assessment",
        isOverall: true,
        fields: [
          {
            id: "overallRating",
            label: "Overall Rating",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
            description: "Overall assessment of the player (1-10 scale)"
          },
          {
            id: "recommendation",
            label: "Recommendation",
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
            id: "potential",
            label: "Potential Rating",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
            description: "Projected ceiling for development"
          }
        ]
      },
      {
        id: "current-ability",
        title: "Current Ability",
        fields: [
          {
            id: "technicalLevel",
            label: "Technical Level",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          },
          {
            id: "physicalDevelopment",
            label: "Physical Development",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10']
          }
        ]
      },
      {
        id: "development-areas",
        title: "Development Areas",
        fields: [
          {
            id: "strengthsToMaintain",
            label: "Key Strengths to Maintain",
            type: "text",
            required: true
          },
          {
            id: "areasForImprovement",
            label: "Priority Development Areas",
            type: "text",
            required: true
          }
        ]
      }
    ]
  },
  {
    id: "quick-scout",
    name: "Quick Scout Report",
    description: "Streamlined template for rapid player evaluation",
    defaultTemplate: false,
    defaultRatingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
    sections: [
      {
        id: "overall",
        title: "Overall Assessment",
        isOverall: true,
        fields: [
          {
            id: "overallRating",
            label: "Overall Rating",
            type: "rating",
            required: true,
            ratingSystem: DEFAULT_RATING_SYSTEMS['numeric-1-10'],
            description: "Overall assessment of the player (1-10 scale)"
          },
          {
            id: "recommendation",
            label: "Recommendation",
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
          }
        ]
      },
      {
        id: "key-attributes",
        title: "Key Attributes",
        fields: [
          {
            id: "standoutQualities",
            label: "Standout Qualities",
            type: "text",
            required: true
          },
          {
            id: "concerns",
            label: "Main Concerns",
            type: "text",
            required: false
          }
        ]
      }
    ]
  }
];
