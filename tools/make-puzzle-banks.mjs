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
  // Tens and ones (bigger numbers: the lock goes to 99, and ↑ ↓ jump by ten).
  9: () => {
    const f = pick(FRIENDS); const t = pick(THINGS); const r = rnd();
    if (r < 0.4) { const tens = int(1, 6), ones = int(0, 9); return { text: `${f} has ${tens} ${tens === 1 ? 'bag' : 'bags'} of 10 ${t[1]} and ${ones} more. How many ${t[1]} is that?`, answer: tens * 10 + ones, max: 99 }; }
    if (r < 0.7) { const a = 10 * int(1, 5), b = 10 * int(1, 4); return { text: `${f} has ${a} ${t[1]} and finds ${b} more. How many ${t[1]} now?`, answer: a + b, max: 99 }; }
    const ones = int(0, 5), a = 10 * int(2, 6) + ones, b = int(1, 9 - ones); return { text: `What is ${a} plus ${b}?`, answer: a + b, max: 99 };
  },
  10: () => {
    const f = pick(FRIENDS); const t = pick(THINGS); const r = rnd();
    if (r < 0.4) {
      let a, b;
      do { a = int(12, 39); b = int(11, 39); } while ((a % 10) + (b % 10) < 10 || a + b > 80);
      return { text: `${f} has ${a} ${t[1]}. ${f} finds ${b} more. How many ${t[1]} now?`, answer: a + b, max: 99 };
    }
    if (r < 0.7) {
      const a = int(35, 89); const b = 10 * int(1, Math.floor(a / 10) - 1) + int(0, a % 10);
      return { text: `There were ${a} ${t[1]}. ${f} gave away ${b}. How many are left?`, answer: a - b, max: 99 };
    }
    const g = int(2, 9), each = pick([5, 10]); const [p, th] = pick([['boxes', 'cupcakes'], ['jars', 'candies'], ['bags', 'gumdrops'], ['trays', 'cookies']]);
    return { text: `There are ${g} ${p} with ${each} ${th} in each. How many ${th} in all?`, answer: g * each, max: 99 };
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
  // Short stories: find the detail, or notice what is NOT there.
  7: [
    ['Bunny planted three seeds. She watered them every day. Soon, tall sunflowers grew. What did Bunny plant?', 'seeds', 'carrots', 'trees'],
    ['Fox lost his red scarf at the lake. Owl found it in the reeds and brought it back. Where did Owl find the scarf?', 'in the reeds', 'in a tree', 'at the market'],
    ['It was raining, so Pip stayed inside. Pip read a book about the moon. Why did Pip stay inside?', 'it was raining', 'Pip was sleepy', 'it was dark'],
    ['Marina swam to the reef. She saw a crab, a starfish and a little blue fish. Which one did Marina NOT see?', 'a whale', 'a crab', 'a starfish'],
    ['Dragon baked a cake for Owl. He put pink frosting and seven candles on top. What color was the frosting?', 'pink', 'blue', 'yellow'],
    ['Otto dropped his shiny pebble in the river, and it sank. Grandma Tide helped him find it. What did Otto drop?', 'a shiny pebble', 'a shell', 'a fish'],
    ['The snowman had a carrot nose and a green hat. Then the sun came out, and the snowman melted. What made the snowman melt?', 'the sun', 'the wind', 'the rain'],
    ['Fox and Bunny went to the meadow. Fox picked berries. Bunny picked flowers for her mom. Who were the flowers for?', "Bunny's mom", 'Fox', 'Owl'],
    ['Captain Crab looked for his hat under his bed and in his chest. At last he found it on his own head! Where was the hat?', 'on his head', 'under the bed', 'in the chest'],
    ['Pip saw three stars. Then a cloud covered one of them. How many stars could Pip still see?', 'two', 'three', 'one'],
  ],
  // What happened first, last, or next? And what probably happened?
  8: [
    ['Owl woke up, ate breakfast, and then flew to school. What did Owl do first?', 'woke up', 'ate breakfast', 'flew to school'],
    ['Bunny dug a hole, put in a seed, and then watered it. What did Bunny do last?', 'watered it', 'dug a hole', 'put in a seed'],
    ['Before the party, Dragon blew up balloons. After the party, he swept the floor. When did Dragon sweep?', 'after the party', 'before the party', 'at breakfast'],
    ['Marina found a pearl. First she showed Otto, and then she gave it to Grandma Tide. Who saw the pearl first?', 'Otto', 'Grandma Tide', 'Captain Crab'],
    ['Fox put on his boots and his raincoat, and took his umbrella. What was the weather probably like?', 'rainy', 'sunny and hot', 'very windy'],
    ['Pip yawned and rubbed her eyes. The moon was high in the sky. What will Pip probably do next?', 'go to sleep', 'eat lunch', 'go swimming'],
    ['The ice cream sat in the sun for too long. Now there is a sticky puddle. What happened to the ice cream?', 'it melted', 'it froze', 'it flew away'],
    ['First the caterpillar ate lots of leaves. Then it made a cocoon. What came out of the cocoon at the end?', 'a butterfly', 'a bird', 'a frog'],
    ['Owl read the map, crossed the bridge, and then climbed the hill. What did Owl do just before climbing the hill?', 'crossed the bridge', 'read the map', 'took a nap'],
    ['Bunny had ten carrots in her basket. At lunch she shared them all with her friends. How many carrots were left in the basket?', 'none', 'ten', 'five'],
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
  // Two clues: rule things out.
  7: [
    ['I am a bird. I hoot at night. Who am I?', 'an owl', 'a fox', 'a fish'],
    ['The boxes are red, blue and green. My box is not red. It is not blue. What color is my box?', 'green', 'red', 'blue'],
    ["Pip's pet is a cat, a dog or a fish. It is not a cat. It does not bark. What is Pip's pet?", 'a fish', 'a cat', 'a dog'],
    ['My number is bigger than 5 and smaller than 7. What is my number?', '6', '5', '8'],
    ['Someone ate the berries. It was not Bunny. It was not Owl. Only Bunny, Owl and Fox were there. Who ate the berries?', 'Fox', 'Bunny', 'Owl'],
    ['It is round. It is not a ball. It is a fruit. What is it?', 'an orange', 'a ball', 'a banana'],
    ['My number is between 3 and 5. What is my number?', '4', '3', '5'],
    ['Dragon has more than 2 stars but fewer than 4. How many stars does Dragon have?', '3', '2', '4'],
    ['The cakes are chocolate, lemon and strawberry. My cake is not chocolate. It is not lemon. Which cake is mine?', 'strawberry', 'chocolate', 'lemon'],
    ['Fox lives in the house on the left, the middle or the right. It is not on the left. It is not in the middle. Where does Fox live?', 'on the right', 'on the left', 'in the middle'],
  ],
  // Three clues, and if-then thinking.
  8: [
    ['Owl, Fox and Bunny each have one fruit: an apple, a pear or a plum. Owl has the apple. Fox does not have the plum. What does Bunny have?', 'the plum', 'the pear', 'the apple'],
    ['Bunny, Fox and Pip stand in a line. Fox is first. Pip is not last. Who is last?', 'Bunny', 'Pip', 'Fox'],
    ['When it rains, the frogs sing. Today the frogs are not singing. Is it raining?', 'no', 'yes', 'it is snowing'],
    ['Every dragon in the cave is green. Sparky is a dragon in the cave. What color is Sparky?', 'green', 'red', 'blue'],
    ['My number is bigger than 10 and smaller than 15. It is even, and it is not 12. What is my number?', '14', '12', '13'],
    ['Marina, Otto and Crab each have a shell: pink, white or striped. Marina has the pink one. Crab does not have the white one. Which shell does Otto have?', 'the white one', 'the striped one', 'the pink one'],
    ['Fox is taller than Bunny. Owl is taller than Fox. Pip is shorter than Bunny. Who is the tallest?', 'Owl', 'Fox', 'Pip'],
    ['All the stars in the jar are gold. Pip takes one star out of the jar. What color is it?', 'gold', 'silver', 'blue'],
    ['Owl, Dragon and Fox sit on a bench. Dragon is in the middle. Owl is on the left. Who is on the right?', 'Fox', 'Owl', 'Dragon'],
    ['Bunny has 2 more carrots than Fox. Fox has 3 carrots. How many carrots does Bunny have?', '5', '3', '1'],
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

// Levels added later are built in a second pass, so the seeded randomness of
// everything before stays exactly the same (same questions, same answer order).
const ORIGINAL = { math: 8, reading: 6, logic: 6 };
const mathLevel = (lvl, make) => {
  const seen = new Set();
  banks.math[lvl] = [];
  for (let tries = 0; banks.math[lvl].length < 10 && tries < 500; tries++) {
    const q = make();
    if (seen.has(q.text) || q.answer > (q.max ?? 30) || q.answer < 0) continue;
    seen.add(q.text);
    const id = `pz-math-${lvl}-${banks.math[lvl].length + 1}`;
    banks.math[lvl].push({ id, kind: 'number', ...q });
    lines[id] = { speaker: 'narrator', text: q.text };
  }
};
const choiceLevel = (skill, lvl, rows) => {
  banks[skill][lvl] = rows.map(([text, right, ...wrong], i) => {
    const id = `pz-${skill}-${lvl}-${i + 1}`;
    lines[id] = { speaker: 'narrator', text };
    return { id, kind: 'choice', text, ...shuffle(right, wrong) };
  });
};
for (const later of [false, true]) {
  const isNew = (skill, lvl) => Number(lvl) > ORIGINAL[skill];
  for (const [lvl, make] of Object.entries(MATH)) if (isNew('math', lvl) === later) mathLevel(lvl, make);
  for (const [skill, table] of [['reading', READING], ['logic', LOGIC]])
    for (const [lvl, rows] of Object.entries(table)) if (isNew(skill, lvl) === later) choiceLevel(skill, lvl, rows);
}

await writeFile(path.join(ROOT, 'src/core/puzzles/banks.json'), JSON.stringify(banks, null, 2) + '\n');
await writeFile(path.join(ROOT, 'src/core/puzzles/dialogue.json'), JSON.stringify(lines, null, 2) + '\n');
const count = Object.values(banks).flatMap((s) => Object.values(s)).flat().length;
console.log(`${count} questions written (${Object.keys(lines).length} voice lines)`);
