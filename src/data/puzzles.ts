/**
 * Number locks and riddles. The question is a dialogue line, so it's shown
 * and read aloud like everything else. Questions get harder area by area.
 */
export type Puzzle =
  | { kind: 'number'; line: string; answer: number }
  | { kind: 'choice'; line: string; choices: string[]; answer: number };

export const NUMBER_MAX = 20;

export const PUZZLES: Record<string, Puzzle> = {
  'woods-lock': { kind: 'number', line: 'woods-lock', answer: 5 },
  'meadow-lock': { kind: 'number', line: 'meadow-lock', answer: 5 },
  'waterfall-lock': { kind: 'number', line: 'waterfall-lock', answer: 6 },
  'clouds-lock': { kind: 'number', line: 'clouds-lock', answer: 7 },
  // Counted, not calculated: the snowmen are placed in Frosty Peaks before the gate.
  'frost-lock': { kind: 'number', line: 'frost-lock', answer: 4 },
  'owl-riddle': { kind: 'choice', line: 'owl-riddle', choices: ['A door', 'A piano', 'A tree'], answer: 1 },
  'fox-math': { kind: 'number', line: 'fox-math', answer: 5 },
  'bunny-riddle': { kind: 'choice', line: 'bunny-riddle', choices: ['The sun', 'A shadow', 'A cloud'], answer: 1 },
};
