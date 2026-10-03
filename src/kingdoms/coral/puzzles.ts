import type { Puzzle } from '../../core/content/types';

/** Hand-written puzzles for Coral Kingdom story moments. */
export const PUZZLES: Record<string, Puzzle> = {
  'otto-riddle': { kind: 'choice', line: 'otto-riddle', choices: ['A map', 'A fish', 'A wave'], answer: 0 },
};
