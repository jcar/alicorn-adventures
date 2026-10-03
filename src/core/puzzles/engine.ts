import banksJson from './banks.json';

/**
 * The adaptive puzzle engine. Each player has a level in four skills.
 * Two first-try wins in a row move a skill up; a puzzle that took several
 * tries moves it down. Wrong answers never cost anything.
 */
export type SkillId = 'math' | 'reading' | 'logic' | 'memory';

export const SKILLS: { id: SkillId; name: string; max: number; about: string }[] = [
  { id: 'math', name: 'Math', max: 8, about: 'adding, taking away, groups, two steps' },
  { id: 'reading', name: 'Reading', max: 6, about: 'words, rhymes, stories, riddles' },
  { id: 'logic', name: 'Logic', max: 6, about: 'patterns, odd-one-out, if-then, ordering' },
  { id: 'memory', name: 'Memory', max: 6, about: 'crystal tunes from 3 to 8 notes' },
];

export interface SkillState { level: number; streak: number }
export type Skills = Record<SkillId, SkillState>;

/** One question, ready for the puzzle screen. `line` is its voice line id. */
export type Question =
  | { kind: 'number'; id: string; text: string; line: string; answer: number; visual?: { a: number; b: number; op: '+' | '-' } }
  | { kind: 'choice'; id: string; text: string; line: string; choices: string[]; answer: number };

type BankItem = { id: string; kind: 'number' | 'choice'; text: string; answer: number; choices?: string[]; visual?: { a: number; b: number; op: '+' | '-' } };
const BANKS = banksJson as unknown as Record<'math' | 'reading' | 'logic', Record<string, BankItem[]>>;

export const maxLevel = (skill: SkillId) => SKILLS.find((s) => s.id === skill)!.max;

/** Starting levels: gentle for a new player, further along for someone who's been playing a while. */
export function defaultSkills(experienced = false): Skills {
  const lvl = experienced ? { math: 4, reading: 3, logic: 3, memory: 3 } : { math: 2, reading: 2, logic: 1, memory: 1 };
  return Object.fromEntries(SKILLS.map((s) => [s.id, { level: lvl[s.id], streak: 0 }])) as Skills;
}

/** The level a puzzle should use: the player's level plus the spot's offset, kept in range. */
export function levelFor(skills: Skills, skill: SkillId, offset = 0) {
  return Math.max(1, Math.min(maxLevel(skill), skills[skill].level + offset));
}

/** Memory: how many notes the crystal tune has. */
export const tuneLength = (level: number) => level + 2;

/** A question from the bank, avoiding the ones asked most recently. */
export function pickQuestion(skill: Exclude<SkillId, 'memory'>, level: number, recent: string[] = [], rand = Math.random): Question {
  const bank = BANKS[skill][String(level)] ?? BANKS[skill]['1'];
  const fresh = bank.filter((q) => !recent.includes(q.id));
  const q = (fresh.length ? fresh : bank)[Math.floor(rand() * (fresh.length || bank.length))];
  return q.kind === 'number'
    ? { kind: 'number', id: q.id, text: q.text, line: q.id, answer: q.answer, visual: q.visual }
    : { kind: 'choice', id: q.id, text: q.text, line: q.id, choices: q.choices!, answer: q.answer };
}

/** Update a skill after a puzzle. firstTry = solved with no wrong answers. */
export function adapt(state: SkillState, result: { firstTry: boolean; misses: number }, max: number): SkillState {
  if (result.firstTry) {
    const streak = state.streak + 1;
    return streak >= 2 ? { level: Math.min(max, state.level + 1), streak: 0 } : { level: state.level, streak };
  }
  if (result.misses >= 2) return { level: Math.max(1, state.level - 1), streak: 0 };
  return { level: state.level, streak: 0 };
}

/** Every question in a skill's bank (for tests and the voice pipeline). */
export const bankOf = (skill: Exclude<SkillId, 'memory'>) => BANKS[skill];
