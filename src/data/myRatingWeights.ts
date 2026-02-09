export interface AttributeWeight {
  id: string;
  label: string;
  weight: number; // percentage within category
}

export interface CategoryWeights {
  id: string;
  label: string;
  weight: number; // 0-100 importance
  tooltip?: string;
  attributes: AttributeWeight[];
}

export type PositionKey = 'GK' | 'CB' | 'RB' | 'LB' | 'DM' | 'CM' | 'AM' | 'W' | 'F';

export const POSITION_LABELS: Record<PositionKey, string> = {
  GK: 'GK', CB: 'CB', RB: 'RB', LB: 'LB', DM: 'DM', CM: 'CM', AM: 'AM', W: 'W', F: 'F',
};

const CM_WEIGHTS: CategoryWeights[] = [
  {
    id: 'goalscoring', label: 'Goalscoring', weight: 35,
    tooltip: 'Measures goal threat from this position',
    attributes: [
      { id: 'goals_90', label: 'Goals /90', weight: 40 },
      { id: 'xg_90', label: 'xG /90', weight: 35 },
      { id: 'finishing_rating', label: 'Finishing Rating', weight: 25 },
    ],
  },
  {
    id: 'creativity', label: 'Creativity', weight: 70,
    tooltip: 'Ability to create chances and assist teammates',
    attributes: [
      { id: 'assists_90', label: 'Assists /90', weight: 30 },
      { id: 'xa_90', label: 'xA /90', weight: 25 },
      { id: 'key_passes_90', label: 'Key Passes /90', weight: 25 },
      { id: 'vision_rating', label: 'Vision Rating', weight: 20 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 80,
    tooltip: 'Ability to move the ball up the pitch effectively',
    attributes: [
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 30 },
      { id: 'prog_passes_90', label: 'Prog. Passes /90', weight: 30 },
      { id: 'dribbling_rating', label: 'Dribbling Rating', weight: 25 },
      { id: 'carry_distance_90', label: 'Carry Distance /90', weight: 15 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 70,
    tooltip: 'Intensity and effectiveness of pressing actions',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 35 },
      { id: 'tackles_won_90', label: 'Tackles Won /90', weight: 25 },
      { id: 'interceptions_90', label: 'Interceptions /90', weight: 20 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 20 },
    ],
  },
  {
    id: 'defending', label: 'Defending', weight: 60,
    tooltip: 'Defensive contribution and positioning',
    attributes: [
      { id: 'tackles_90', label: 'Tackles /90', weight: 30 },
      { id: 'def_interceptions_90', label: 'Interceptions /90', weight: 25 },
      { id: 'blocks_90', label: 'Blocks /90', weight: 20 },
      { id: 'positioning_rating', label: 'Positioning Rating', weight: 25 },
    ],
  },
  {
    id: 'aerial', label: 'Aerial', weight: 50,
    tooltip: 'Aerial presence and effectiveness in duels',
    attributes: [
      { id: 'aerial_win_pct', label: 'Aerial Win %', weight: 45 },
      { id: 'headed_goals', label: 'Headed Goals', weight: 25 },
      { id: 'aerial_duels_90', label: 'Aerial Duels /90', weight: 30 },
    ],
  },
];

const GK_WEIGHTS: CategoryWeights[] = [
  {
    id: 'shot_stopping', label: 'Shot Stopping', weight: 85,
    tooltip: 'Core ability to prevent goals from shots',
    attributes: [
      { id: 'save_pct', label: 'Save %', weight: 35 },
      { id: 'psxg_diff', label: 'PSxG +/-', weight: 35 },
      { id: 'reflexes_rating', label: 'Reflexes Rating', weight: 30 },
    ],
  },
  {
    id: 'distribution', label: 'Distribution', weight: 65,
    tooltip: 'Passing and distribution quality',
    attributes: [
      { id: 'pass_completion', label: 'Pass Completion %', weight: 30 },
      { id: 'long_pass_pct', label: 'Long Pass Accuracy', weight: 35 },
      { id: 'goal_kicks', label: 'Goal Kick Distance', weight: 35 },
    ],
  },
  {
    id: 'commanding', label: 'Commanding Area', weight: 60,
    tooltip: 'Control of the penalty area and set-piece situations',
    attributes: [
      { id: 'crosses_claimed', label: 'Crosses Claimed %', weight: 40 },
      { id: 'sweeper_actions', label: 'Sweeper Actions /90', weight: 30 },
      { id: 'aerial_ability', label: 'Aerial Ability Rating', weight: 30 },
    ],
  },
];

const CB_WEIGHTS: CategoryWeights[] = [
  {
    id: 'defending', label: 'Defending', weight: 85,
    tooltip: 'Core defensive metrics',
    attributes: [
      { id: 'tackles_90', label: 'Tackles /90', weight: 25 },
      { id: 'interceptions_90', label: 'Interceptions /90', weight: 25 },
      { id: 'blocks_90', label: 'Blocks /90', weight: 20 },
      { id: 'clearances_90', label: 'Clearances /90', weight: 15 },
      { id: 'positioning_rating', label: 'Positioning Rating', weight: 15 },
    ],
  },
  {
    id: 'aerial', label: 'Aerial', weight: 75,
    tooltip: 'Aerial dominance and heading ability',
    attributes: [
      { id: 'aerial_win_pct', label: 'Aerial Win %', weight: 50 },
      { id: 'headed_goals', label: 'Headed Goals', weight: 20 },
      { id: 'aerial_duels_90', label: 'Aerial Duels /90', weight: 30 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 60,
    tooltip: 'Ball-playing ability from the back',
    attributes: [
      { id: 'prog_passes_90', label: 'Prog. Passes /90', weight: 35 },
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 30 },
      { id: 'pass_completion', label: 'Pass Completion %', weight: 35 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 50,
    tooltip: 'Defensive pressing intensity',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 50 },
      { id: 'tackles_won_90', label: 'Tackles Won /90', weight: 50 },
    ],
  },
];

const FULLBACK_WEIGHTS: CategoryWeights[] = [
  {
    id: 'defending', label: 'Defending', weight: 65,
    tooltip: 'Defensive contribution from wide areas',
    attributes: [
      { id: 'tackles_90', label: 'Tackles /90', weight: 30 },
      { id: 'interceptions_90', label: 'Interceptions /90', weight: 30 },
      { id: 'blocks_90', label: 'Blocks /90', weight: 20 },
      { id: 'positioning_rating', label: 'Positioning Rating', weight: 20 },
    ],
  },
  {
    id: 'creativity', label: 'Creativity', weight: 70,
    tooltip: 'Chance creation from wide positions',
    attributes: [
      { id: 'assists_90', label: 'Assists /90', weight: 30 },
      { id: 'xa_90', label: 'xA /90', weight: 25 },
      { id: 'crosses_90', label: 'Crosses /90', weight: 25 },
      { id: 'key_passes_90', label: 'Key Passes /90', weight: 20 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 75,
    tooltip: 'Ball carrying and advancing play',
    attributes: [
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 35 },
      { id: 'prog_passes_90', label: 'Prog. Passes /90', weight: 30 },
      { id: 'carry_distance_90', label: 'Carry Distance /90', weight: 35 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 60,
    tooltip: 'Work rate and pressing contribution',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 40 },
      { id: 'tackles_won_90', label: 'Tackles Won /90', weight: 30 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 30 },
    ],
  },
];

const DM_WEIGHTS: CategoryWeights[] = [
  {
    id: 'defending', label: 'Defending', weight: 80,
    tooltip: 'Defensive shielding and ball-winning',
    attributes: [
      { id: 'tackles_90', label: 'Tackles /90', weight: 25 },
      { id: 'interceptions_90', label: 'Interceptions /90', weight: 30 },
      { id: 'blocks_90', label: 'Blocks /90', weight: 20 },
      { id: 'positioning_rating', label: 'Positioning Rating', weight: 25 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 75,
    tooltip: 'Pressing intensity and ball recovery',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 35 },
      { id: 'tackles_won_90', label: 'Tackles Won /90', weight: 30 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 35 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 65,
    tooltip: 'Ability to progress the ball from deep',
    attributes: [
      { id: 'prog_passes_90', label: 'Prog. Passes /90', weight: 40 },
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 30 },
      { id: 'pass_completion', label: 'Pass Completion %', weight: 30 },
    ],
  },
  {
    id: 'aerial', label: 'Aerial', weight: 55,
    tooltip: 'Aerial presence in midfield',
    attributes: [
      { id: 'aerial_win_pct', label: 'Aerial Win %', weight: 50 },
      { id: 'aerial_duels_90', label: 'Aerial Duels /90', weight: 50 },
    ],
  },
];

const AM_WEIGHTS: CategoryWeights[] = [
  {
    id: 'creativity', label: 'Creativity', weight: 85,
    tooltip: 'Chance creation and final third playmaking',
    attributes: [
      { id: 'assists_90', label: 'Assists /90', weight: 25 },
      { id: 'xa_90', label: 'xA /90', weight: 25 },
      { id: 'key_passes_90', label: 'Key Passes /90', weight: 30 },
      { id: 'vision_rating', label: 'Vision Rating', weight: 20 },
    ],
  },
  {
    id: 'goalscoring', label: 'Goalscoring', weight: 65,
    tooltip: 'Goal threat from attacking midfield',
    attributes: [
      { id: 'goals_90', label: 'Goals /90', weight: 40 },
      { id: 'xg_90', label: 'xG /90', weight: 35 },
      { id: 'finishing_rating', label: 'Finishing Rating', weight: 25 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 70,
    tooltip: 'Dribbling and carrying ability',
    attributes: [
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 35 },
      { id: 'dribbling_rating', label: 'Dribbling Rating', weight: 35 },
      { id: 'carry_distance_90', label: 'Carry Distance /90', weight: 30 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 50,
    tooltip: 'Pressing from high positions',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 50 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 50 },
    ],
  },
];

const WINGER_WEIGHTS: CategoryWeights[] = [
  {
    id: 'goalscoring', label: 'Goalscoring', weight: 70,
    tooltip: 'Goal threat from wide positions',
    attributes: [
      { id: 'goals_90', label: 'Goals /90', weight: 40 },
      { id: 'xg_90', label: 'xG /90', weight: 35 },
      { id: 'finishing_rating', label: 'Finishing Rating', weight: 25 },
    ],
  },
  {
    id: 'creativity', label: 'Creativity', weight: 75,
    tooltip: 'Crossing, assists and chance creation',
    attributes: [
      { id: 'assists_90', label: 'Assists /90', weight: 25 },
      { id: 'xa_90', label: 'xA /90', weight: 25 },
      { id: 'crosses_90', label: 'Crosses /90', weight: 25 },
      { id: 'key_passes_90', label: 'Key Passes /90', weight: 25 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 80,
    tooltip: 'Dribbling and carrying down the flank',
    attributes: [
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 30 },
      { id: 'dribbling_rating', label: 'Dribbling Rating', weight: 35 },
      { id: 'carry_distance_90', label: 'Carry Distance /90', weight: 35 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 55,
    tooltip: 'Defensive work rate from wide areas',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 50 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 50 },
    ],
  },
];

const FORWARD_WEIGHTS: CategoryWeights[] = [
  {
    id: 'goalscoring', label: 'Goalscoring', weight: 90,
    tooltip: 'Primary goal-scoring ability',
    attributes: [
      { id: 'goals_90', label: 'Goals /90', weight: 35 },
      { id: 'xg_90', label: 'xG /90', weight: 30 },
      { id: 'finishing_rating', label: 'Finishing Rating', weight: 20 },
      { id: 'shot_accuracy', label: 'Shot Accuracy %', weight: 15 },
    ],
  },
  {
    id: 'creativity', label: 'Creativity', weight: 50,
    tooltip: 'Link-up play and chance creation',
    attributes: [
      { id: 'assists_90', label: 'Assists /90', weight: 35 },
      { id: 'xa_90', label: 'xA /90', weight: 30 },
      { id: 'key_passes_90', label: 'Key Passes /90', weight: 35 },
    ],
  },
  {
    id: 'aerial', label: 'Aerial', weight: 60,
    tooltip: 'Aerial threat and hold-up play',
    attributes: [
      { id: 'aerial_win_pct', label: 'Aerial Win %', weight: 40 },
      { id: 'headed_goals', label: 'Headed Goals', weight: 35 },
      { id: 'aerial_duels_90', label: 'Aerial Duels /90', weight: 25 },
    ],
  },
  {
    id: 'pressing', label: 'Pressing', weight: 55,
    tooltip: 'Pressing from the front',
    attributes: [
      { id: 'pressures_90', label: 'Pressures /90', weight: 50 },
      { id: 'work_rate_rating', label: 'Work Rate Rating', weight: 50 },
    ],
  },
  {
    id: 'progression', label: 'Progression', weight: 45,
    tooltip: 'Dribbling and movement in the final third',
    attributes: [
      { id: 'prog_carries_90', label: 'Prog. Carries /90', weight: 40 },
      { id: 'dribbling_rating', label: 'Dribbling Rating', weight: 60 },
    ],
  },
];

export const DEFAULT_POSITION_WEIGHTS: Record<PositionKey, CategoryWeights[]> = {
  GK: GK_WEIGHTS,
  CB: CB_WEIGHTS,
  RB: FULLBACK_WEIGHTS,
  LB: FULLBACK_WEIGHTS,
  DM: DM_WEIGHTS,
  CM: CM_WEIGHTS,
  AM: AM_WEIGHTS,
  W: WINGER_WEIGHTS,
  F: FORWARD_WEIGHTS,
};

// Deep clone utility
export function clonePositionWeights(
  weights: Record<PositionKey, CategoryWeights[]>
): Record<PositionKey, CategoryWeights[]> {
  return JSON.parse(JSON.stringify(weights));
}

/**
 * Compute "My Rating" for a player based on the user's category/attribute weights.
 * Derives a weighted composite from the player's existing ratings, influenced by the weights.
 */
export function computeMyRating(
  player: { transferroomRating?: number | null; futureRating?: number | null; age?: number },
  weights: CategoryWeights[]
): number | null {
  const baseRating = player.transferroomRating;
  const potential = player.futureRating;
  if (!baseRating && !potential) return null;

  const base = baseRating || 0;
  const pot = potential || base;

  const totalCategoryWeight = weights.reduce((sum, c) => sum + c.weight, 0);
  if (totalCategoryWeight === 0) return null;

  let weightedScore = 0;
  let usedWeight = 0;

  for (const category of weights) {
    if (category.weight === 0) continue;
    const catAvgAttrWeight = category.attributes.length > 0
      ? category.attributes.reduce((s, a) => s + a.weight, 0) / category.attributes.length / 100
      : 0.5;

    let categoryScore: number;
    if (category.id === 'potential') {
      const ageBonus = player.age ? Math.max(0, (28 - player.age) * 0.5) : 0;
      categoryScore = pot * catAvgAttrWeight + ageBonus;
    } else {
      categoryScore = base * catAvgAttrWeight;
    }

    weightedScore += categoryScore * category.weight;
    usedWeight += category.weight;
  }

  const result = usedWeight > 0 ? weightedScore / usedWeight : 0;
  return Math.min(100, Math.max(0, Math.round(result * 10) / 10));
}
