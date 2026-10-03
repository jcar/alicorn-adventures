#!/usr/bin/env node
/**
 * Builds the puzzle banks: src/core/puzzles/banks.json (questions + answers)
 * and src/core/puzzles/dialogue.json (the question text, so the voice
 * pipeline can record every one). Deterministic: same output every run.
 *
 *   node tools/make-puzzle-banks.mjs
 *
 * Math questions are generated from story templates; reading and logic
 * questions are written by hand below. Each skill has levels 1..N, with
 * about 10 questions per level.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Small seeded random, so the banks never change unless this file does.
let seed = 20261003;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
/** "1 carrot", "3 carrots". */
const n = (count, [one, many]) => `${count} ${count === 1 ? one : many}`;

const FRIENDS = ['Bunny', 'Fox', 'Owl', 'Dragon', 'Pip'];
const THINGS = [['carrot', 'carrots'], ['berry', 'berries'], ['acorn', 'acorns'], ['flower', 'flowers'], ['star', 'stars'], ['shell', 'shells']];

// ------------------------------------------------------------------ math (number answers)
const MATH = {
  1: () => { const a = int(1, 3), b = int(1, 5 - a); const t = pick(THINGS); return { text: `${pick(FRIENDS)} has ${n(a, t)}. Then ${b} more. How many ${t[1]} now?`, answer: a + b, visual: { a, b, op: '+' } }; },
  2: () => { const a = int(2, 7), b = int(1, 10 - a); const t = pick(THINGS); return { text: `${pick(FRIENDS)} found ${n(a, t)} and then ${b} more. How many ${t[1]} in all?`, answer: a + b, visual: { a, b, op: '+' } }; },
  3: () => { const a = int(4, 10), b = int(1, a - 1); const t = pick(THINGS); const f = pick(FRIENDS); return { text: `${f} had ${n(a, t)}. ${f} gave away ${b}. How many are left?`, answer: a - b, visual: { a, b, op: '-' } }; },
  4: () => {
    const t = pick(THINGS); const f = pick(FRIENDS);
    if (rnd() < 0.5) { const a = int(6, 13), b = int(3, 20 - a); return { text: `${f} has ${n(a, t)}. ${f} finds ${b} more. How many ${t[1]} now?`, answer: a + b, visual: { a, b, op: '+' } }; }
    const a = int(11, 20), b = int(2, 9); return { text: `There were ${n(a, t)}. ${f} took ${b}. How many are left?`, answer: a - b, visual: { a, b, op: '-' } };
  },
  5: () => { const a = int(3, 12), c = int(a + 2, 20); const t = pick(THINGS); const f = pick(FRIENDS); return { text: `${f} has ${n(a, t)}. ${f} wants ${c}. How many more does ${f} need?`, answer: c - a }; },
  6: () => { const g = int(2, 5), n = int(2, 5); const places = [['nests', 'eggs'], ['baskets', 'apples'], ['clouds', 'raindrops'], ['trees', 'birds']]; const [p, t] = pick(places); return { text: `There are ${g} ${p}. Each one has ${n} ${t}. How many ${t} in all?`, answer: g * n }; },
  7: () => { const a = int(5, 15), b = int(2, 8), c = int(1, Math.min(9, a + b - 1)); const t = pick(THINGS); const f = pick(FRIENDS); return { text: `${f} had ${n(a, t)}, found ${b} more, then gave ${c} away. How many now?`, answer: a + b - c }; },
  8: () => {
    const f = pick(FRIENDS);
    if (rnd() < 0.5) { const a = 2 * int(3, 12); return { text: `${f} has ${a} stars and shares them equally with one friend. How many does each get?`, answer: a / 2 }; }
    const a = int(4, 15); return { text: `${f} picked ${a} flowers in the morning and the same number again after lunch. How many flowers in all?`, answer: a * 2 };
  },
};

// ------------------------------------------------------------------ reading (choices; the first choice is right, then shuffled)
const READING = {
  1: [
    ['Which one is a color?', 'blue', 'frog', 'jump'], ['Which one is an animal?', 'owl', 'cup', 'green'], ['Which one can you eat?', 'apple', 'rock', 'shoe'],
    ['Which one is a number?', 'seven', 'tree', 'happy'], ['Which one can fly?', 'bird', 'fish', 'table'], ['Which one is a shape?', 'circle', 'cookie', 'river'],
    ['Which one is in the sky?', 'moon', 'carrot', 'sock'], ['Which one is a fruit?', 'banana', 'pencil', 'snow'], ['Which one makes music?', 'drum', 'bed', 'leaf'],
    ['Which one is hot?', 'sun', 'ice', 'snow'],
  ],
  2: [
    ['Which word rhymes with star?', 'car', 'sun', 'tree'], ['Which word rhymes with cat?', 'hat', 'dog', 'cup'], ['Which word rhymes with moon?', 'spoon', 'star', 'cake'],
    ['Which word rhymes with tree?', 'bee', 'leaf', 'sky'], ['Which word rhymes with fox?', 'box', 'fish', 'hen'], ['Which word rhymes with cake?', 'lake', 'pie', 'bun'],
    ['Which word rhymes with bed?', 'red', 'bad', 'pillow'], ['Which word rhymes with snow?', 'bow', 'cold', 'rain'], ['Which word rhymes with night?', 'light', 'dark', 'moon'],
    ['Which word rhymes with king?', 'ring', 'queen', 'crown'],
  ],
  3: [
    ['Bunny has a green hat. What color is the hat?', 'green', 'red', 'blue'], ['Fox has four berries. How many berries does Fox have?', 'four', 'two', 'six'],
    ['Owl sits in a tall tree. Where does Owl sit?', 'in a tall tree', 'in a pond', 'on a rock'], ['Dragon loves warm soup. What does Dragon love?', 'warm soup', 'cold ice', 'sand'],
    ['Pip sleeps on a soft cloud. What does Pip sleep on?', 'a soft cloud', 'a hard rock', 'a log'], ['The cake is pink and round. What shape is the cake?', 'round', 'square', 'flat'],
    ['Bunny hops to the river to drink. Why does Bunny go to the river?', 'to drink', 'to sleep', 'to sing'], ['The little boat is yellow. What color is the boat?', 'yellow', 'purple', 'black'],
    ['Fox reads a book about stars. What is the book about?', 'stars', 'fish', 'cars'], ['Owl has three blue eggs. What color are the eggs?', 'blue', 'white', 'green'],
  ],
  4: [
    ['Owl is very sleepy. The sun is up. When does Owl like to be awake?', 'at night', 'in the morning', 'at lunch'],
    ['Fox puts on a coat and a scarf. What is the weather like?', 'cold', 'hot', 'sunny and warm'],
    ['Bunny\'s tummy rumbles. Bunny looks for carrots. How does Bunny feel?', 'hungry', 'sleepy', 'scared'],
    ['Dragon opens an umbrella and jumps in puddles. What is the weather?', 'rainy', 'snowy', 'windy'],
    ['Pip smiles and claps. Pip got a present. How does Pip feel?', 'happy', 'sad', 'angry'],
    ['The flowers are drooping. Fox brings a watering can. What do the flowers need?', 'water', 'snow', 'a hat'],
    ['It is dark. Owl lights a lantern. Why does Owl light the lantern?', 'to see', 'to cook', 'to swim'],
    ['Bunny yawns and gets into bed. What will Bunny do next?', 'go to sleep', 'run a race', 'eat lunch'],
    ['The ice cream is melting fast. What is the day like?', 'hot', 'cold', 'dark'],
    ['Dragon cannot reach the top shelf. Dragon gets a stool. Why?', 'to reach higher', 'to sit down', 'to dance'],
  ],
  5: [
    ['I am cold and white. I fall from the sky in winter. What am I?', 'snow', 'rain', 'a leaf'],
    ['I have a face and two hands, but I cannot clap. What am I?', 'a clock', 'a bunny', 'a book'],
    ['I am full of holes, but I can hold water. What am I?', 'a sponge', 'a cup', 'a net'],
    ['I go up when the rain comes down. What am I?', 'an umbrella', 'a balloon', 'a kite'],
    ['I have pages but I am not a tree. What am I?', 'a book', 'a leaf', 'a door'],
    ['I shine in the day and hide at night. What am I?', 'the sun', 'the moon', 'a lamp'],
    ['I have a neck but no head. What am I?', 'a bottle', 'a giraffe', 'a scarf'],
    ['You can catch me, but you cannot throw me. What am I?', 'a cold', 'a ball', 'a fish'],
    ['I have teeth but I never bite. What am I?', 'a comb', 'a dragon', 'a shark'],
    ['The more you take, the more you leave behind. What are they?', 'footsteps', 'cookies', 'pebbles'],
  ],
  6: [
    ['First Fox found a berry. Then Fox ate it. What did Fox do first?', 'found a berry', 'ate a berry', 'went to sleep'],
    ['Owl read a book, then had tea, then went to bed. What did Owl do second?', 'had tea', 'read a book', 'went to bed'],
    ['Bunny planted a seed. It rained for days. Now there is a big carrot. Why did the carrot grow?', 'the rain watered it', 'Bunny painted it', 'the wind blew it'],
    ['Dragon is bigger than Fox, but smaller than the old oak tree. What is the biggest?', 'the old oak tree', 'Dragon', 'Fox'],
    ['Pip wanted to fly home, but the wind was too strong. So Pip waited. Why did Pip wait?', 'the wind was too strong', 'Pip was hungry', 'it was snowing'],
    ['Fox shared the last cookie with Bunny. Bunny gave Fox a hug. Why did Bunny hug Fox?', 'to say thank you', 'because Fox was cold', 'to play tag'],
    ['The pond froze. The ducks could not swim, so they skated. What made the ducks skate?', 'the frozen pond', 'the hot sun', 'a big boat'],
    ['Owl lost her glasses. She looked under the bed and on the shelf, then found them on her head. Where were they?', 'on her head', 'under the bed', 'on the shelf'],
    ['Bunny had five carrots. She gave one to each of her four friends. How many did Bunny keep?', 'one', 'five', 'none'],
    ['It was Dragon\'s birthday. Everyone sang and there was cake. What were they celebrating?', 'Dragon\'s birthday', 'the first snow', 'a new house'],
  ],
};

// ------------------------------------------------------------------ logic (choices; first is right)
const LOGIC = {
  1: [
    ['Red, blue, red, blue, red. What comes next?', 'blue', 'green', 'red'], ['Star, moon, star, moon, star. What comes next?', 'moon', 'sun', 'star'],
    ['Big, small, big, small, big. What comes next?', 'small', 'big', 'tall'], ['Hop, hop, jump, hop, hop. What comes next?', 'jump', 'hop', 'run'],
    ['Cat, dog, cat, dog, cat. What comes next?', 'dog', 'cat', 'fish'], ['Up, down, up, down, up. What comes next?', 'down', 'up', 'left'],
    ['One, two, one, two, one. What comes next?', 'two', 'one', 'three'], ['Sun, sun, rain, sun, sun. What comes next?', 'rain', 'sun', 'snow'],
    ['Pink, pink, blue, pink, pink. What comes next?', 'blue', 'pink', 'yellow'], ['Day, night, day, night, day. What comes next?', 'night', 'day', 'noon'],
  ],
  2: [
    ['1, 2, 3, 4. What number comes next?', '5', '6', '3'], ['2, 4, 6, 8. What number comes next?', '10', '9', '12'], ['5, 6, 7, 8. What number comes next?', '9', '10', '6'],
    ['10, 9, 8, 7. What number comes next?', '6', '8', '5'], ['1, 3, 5, 7. What number comes next?', '9', '8', '10'], ['3, 4, 5, 6. What number comes next?', '7', '8', '5'],
    ['2, 4, 6, 8, 10. What number comes next?', '12', '11', '14'], ['20, 19, 18, 17. What number comes next?', '16', '18', '15'],
    ['0, 2, 4, 6. What number comes next?', '8', '7', '10'], ['4, 5, 6, 7. What number comes next?', '8', '9', '6'],
  ],
  3: [
    ['Which one does not belong? apple, banana, car', 'car', 'apple', 'banana'], ['Which one does not belong? owl, eagle, fish', 'fish', 'owl', 'eagle'],
    ['Which one does not belong? red, blue, chair', 'chair', 'red', 'blue'], ['Which one does not belong? snow, ice, fire', 'fire', 'snow', 'ice'],
    ['Which one does not belong? spoon, fork, sock', 'sock', 'spoon', 'fork'], ['Which one does not belong? two, five, dog', 'dog', 'two', 'five'],
    ['Which one does not belong? rose, tulip, rock', 'rock', 'rose', 'tulip'], ['Which one does not belong? boat, ship, cloud', 'cloud', 'boat', 'ship'],
    ['Which one does not belong? hat, scarf, carrot', 'carrot', 'hat', 'scarf'], ['Which one does not belong? sun, moon, shoe', 'shoe', 'sun', 'moon'],
  ],
  4: [
    ['5, 10, 15, 20. What number comes next?', '25', '21', '30'], ['10, 20, 30, 40. What number comes next?', '50', '45', '60'],
    ['A, B, C, D. What letter comes next?', 'E', 'F', 'A'], ['1, 1, 2, 2, 3, 3. What number comes next?', '4', '3', '5'],
    ['3, 6, 9, 12. What number comes next?', '15', '13', '18'], ['Monday, Tuesday, Wednesday. What day comes next?', 'Thursday', 'Friday', 'Sunday'],
    ['Small, medium, large. If you go back one from large, what is it?', 'medium', 'small', 'tiny'], ['Spring, summer, fall. What season comes next?', 'winter', 'spring', 'summer'],
    ['100, 90, 80, 70. What number comes next?', '60', '65', '50'], ['Z, Y, X, W. What letter comes next?', 'V', 'U', 'A'],
  ],
  5: [
    ['If it rains, Fox takes an umbrella. It is raining. What does Fox take?', 'an umbrella', 'a kite', 'a bucket'],
    ['If the light is red, Bunny stops. The light is red. What does Bunny do?', 'stops', 'runs', 'jumps'],
    ['If Owl is sleepy, Owl goes to bed. Owl is not sleepy. Does Owl go to bed?', 'no', 'yes', 'maybe'],
    ['All the stars in the jar are gold. Pip takes one star from the jar. What color is it?', 'gold', 'silver', 'blue'],
    ['If it snows, Dragon builds a snowman. It is sunny. Does Dragon build a snowman?', 'no', 'yes', 'two of them'],
    ['Every friend who finds a shell gets a sticker. Bunny finds a shell. What does Bunny get?', 'a sticker', 'a shell', 'nothing'],
    ['If the door is blue, it opens to the garden. This door is blue. Where does it open?', 'to the garden', 'to the kitchen', 'to the sky'],
    ['If you plant a seed and water it, it grows. Fox plants a seed but never waters it. Does it grow?', 'no', 'yes', 'it flies'],
    ['When the moon is out, Owl hoots. Owl is hooting. Is the moon out?', 'yes', 'no', 'it is noon'],
    ['Only cats are in the red basket. Is the dog in the red basket?', 'no', 'yes', 'half of it'],
  ],
  6: [
    ['Bunny is taller than Fox. Fox is taller than Pip. Who is the shortest?', 'Pip', 'Bunny', 'Fox'],
    ['Owl is older than Dragon. Dragon is older than Pip. Who is the oldest?', 'Owl', 'Dragon', 'Pip'],
    ['Fox ran faster than Bunny. Bunny ran faster than Owl walked. Who was the slowest?', 'Owl', 'Fox', 'Bunny'],
    ['The red box is heavier than the blue box. The blue box is heavier than the green box. Which is lightest?', 'the green box', 'the red box', 'the blue box'],
    ['Pip woke before Bunny. Bunny woke before Fox. Who woke up last?', 'Fox', 'Pip', 'Bunny'],
    ['Owl, Fox and Bunny stand in a line. Owl is first. Fox is last. Who is in the middle?', 'Bunny', 'Owl', 'Fox'],
    ['Dragon has more stars than Fox. Fox has more stars than Bunny. Who has the most stars?', 'Dragon', 'Fox', 'Bunny'],
    ['The pond is colder than the hill. The cave is colder than the pond. Where is it coldest?', 'the cave', 'the hill', 'the pond'],
    ['Bunny sits left of Fox. Owl sits right of Fox. Who is in the middle?', 'Fox', 'Bunny', 'Owl'],
    ['A blue bird sang before a red bird. A yellow bird sang after the red bird. Which bird sang first?', 'the blue bird', 'the red bird', 'the yellow bird'],
  ],
};

// ------------------------------------------------------------------ build
const banks = { math: {}, reading: {}, logic: {} };
const lines = {};
const shuffle = (right, wrong) => {
  const choices = [right, ...wrong];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return { choices, answer: choices.indexOf(right) };
};

for (const [lvl, make] of Object.entries(MATH)) {
  const seen = new Set();
  banks.math[lvl] = [];
  for (let tries = 0; banks.math[lvl].length < 10 && tries < 500; tries++) {
    const q = make();
    if (seen.has(q.text) || q.answer > 30 || q.answer < 0) continue;
    seen.add(q.text);
    const id = `pz-math-${lvl}-${banks.math[lvl].length + 1}`;
    banks.math[lvl].push({ id, kind: 'number', ...q });
    lines[id] = { speaker: 'narrator', text: q.text };
  }
}
for (const [skill, table] of [['reading', READING], ['logic', LOGIC]]) {
  for (const [lvl, rows] of Object.entries(table)) {
    banks[skill][lvl] = rows.map(([text, right, ...wrong], i) => {
      const id = `pz-${skill}-${lvl}-${i + 1}`;
      lines[id] = { speaker: 'narrator', text };
      return { id, kind: 'choice', text, ...shuffle(right, wrong) };
    });
  }
}

await writeFile(path.join(ROOT, 'src/core/puzzles/banks.json'), JSON.stringify(banks, null, 2) + '\n');
await writeFile(path.join(ROOT, 'src/core/puzzles/dialogue.json'), JSON.stringify(lines, null, 2) + '\n');
const count = Object.values(banks).flatMap((s) => Object.values(s)).flat().length;
console.log(`${count} questions written (${Object.keys(lines).length} voice lines)`);
