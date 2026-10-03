import type { Puzzle } from '../../core/content/types';

/**
 * Hand-written puzzles for story moments. Everyday gates use the adaptive
 * question banks instead (src/core/puzzles), via { skill, offset }.
 */

export const PUZZLES: Record<string, Puzzle> = {
  // Counted, not calculated: the snowmen are placed in Frosty Peaks before the gate.
  'frost-lock': { kind: 'number', line: 'frost-lock', answer: 4 },
  'owl-riddle': { kind: 'choice', line: 'owl-riddle', choices: ['A door', 'A piano', 'A tree'], answer: 1 },
  'bunny-riddle': { kind: 'choice', line: 'bunny-riddle', choices: ['The sun', 'A shadow', 'A cloud'], answer: 1 },
};
