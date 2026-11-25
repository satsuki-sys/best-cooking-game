// config.js — the facts of The Golden Skillet: its recipes, its ingredients,
// the shape of the kitchen and the tuning of a working day. Nothing here moves;
// kitchen.js moves, orders.js tickets, render.js draws.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const DAY_SECONDS = 150;
export const RUSH_SECONDS = 30;
export const BEST_KEY = 'golden-skillet-best';

// How long a ticket waits before the customer walks out, and how fast new
// tickets arrive. Both tighten as the day goes on.
export function patienceFor(elapsed) {
  return Math.max(32, 48 - elapsed * 0.06);
}
export function spawnIntervalFor(elapsed) {
  const base = Math.max(8, 15 - elapsed * 0.045);
  return elapsed > DAY_SECONDS - RUSH_SECONDS ? base * 0.55 : base;
}

// An ingredient the chef can carry. kind is what it is, state is what has
// been done to it, chop is how many chops a raw vegetable still needs.
export const INGREDIENTS = {
  bun: { label: 'Bun', chop: false, cook: false },
  patty: { label: 'Patty', chop: false, cook: true, cookSeconds: 6, burnSeconds: 11 },
  cheese: { label: 'Cheese', chop: false, cook: false },
  lettuce: { label: 'Lettuce', chop: true, chops: 3, cook: false },
  tomato: { label: 'Tomato', chop: true, chops: 3, cook: false },
  onion: { label: 'Onion', chop: true, chops: 3, cook: false },
  fries: { label: 'Fries', chop: false, cook: true, cookSeconds: 5, burnSeconds: 9 },
  sauce: { label: 'Sauce', chop: false, cook: false },
};

// A recipe is the list of finished items a plate must hold, in any order.
// Two patties means the list holds 'patty' twice.
export const RECIPES = [
  {
    id: 'sunrise-stack',
    name: 'Sunrise Stack',
    price: 14,
    needs: ['bun', 'patty', 'cheese', 'lettuce'],
    blurb: 'The house classic',
  },
  {
    id: 'garden-melt',
    name: 'Garden Melt',
    price: 16,
    needs: ['bun', 'patty', 'tomato', 'onion', 'sauce'],
    blurb: 'Fresh from the board',
  },
  {
    id: 'crispy-basket',
    name: 'Crispy Basket',
    price: 10,
    needs: ['fries', 'sauce'],
    blurb: 'Quick and golden',
  },
  {
    id: 'golden-double',
    name: 'Golden Double',
    price: 20,
    needs: ['bun', 'patty', 'patty', 'cheese', 'tomato'],
    blurb: 'Two patties, no hurry',
  },
  {
    id: 'morning-melt',
    name: 'Morning Melt',
    price: 12,
    needs: ['bun', 'cheese', 'tomato', 'sauce'],
    blurb: 'No grill, all glow',
  },
];

// The kitchen floor plan. Each station is a rectangle the chef walks up to
// and a label the player reads at a glance.
export const STATIONS = {
  pantry: { x: 24, y: 150, w: 196, h: 150, label: 'PANTRY', sub: 'grab what you need' },
  board: { x: 24, y: 430, w: 196, h: 130, label: 'CHOPPING BOARD', sub: 'chop veg — press E 3 times' },
  grill: { x: 252, y: 150, w: 220, h: 150, label: 'GRILL', sub: 'patties — watch them brown' },
  fryer: { x: 504, y: 150, w: 180, h: 150, label: 'FRYER', sub: 'fries — golden, never black' },
  sauce: { x: 716, y: 150, w: 150, h: 150, label: 'SAUCE POT', sub: 'a ladle of sunshine' },
  plates: { x: 898, y: 150, w: 358, h: 190, label: 'PLATING COUNTER', sub: 'build the dish here' },
  window: { x: 898, y: 380, w: 358, h: 130, label: 'SERVING WINDOW', sub: 'serve the finished plate' },
  trash: { x: 504, y: 430, w: 180, h: 130, label: 'TRASH', sub: 'dump what went wrong' },
};

export const CHEF_START = { x: 640, y: 640 };
export const CHEF_SPEED = 265;
export const CHEF_RADIUS = 24;
export const CARRY_MAX = 2;
export const MAX_TICKETS = 4;

export const STARS = [
  { coins: 180, stars: 3 },
  { coins: 120, stars: 2 },
  { coins: 60, stars: 1 },
];
