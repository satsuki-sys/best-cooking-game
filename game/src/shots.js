// shots.js — the screenshot scenes behind ?shot=cover|play|rush|end.
// Each one plays the real rules forward from a fresh day — walking the chef
// to each station and pressing E through the real interact() — so the frame
// is what a real game looks like at that moment, and the same steps always
// give the same frame. No randomness is used while staging.

import { RECIPES, STATIONS } from './config.js';
import { createKitchen, interact, updateCooking } from './kitchen.js';
import { createOrderBoard, makeTicket } from './orders.js';
import { SCREEN_PLAY, SCREEN_OVER, starsFor } from './game.js';

const STEP = 0.1;

/** Stand the chef at (x, y) — the shot's camera move, not a game move. */
function stand(kitchen, x, y) {
  kitchen.chef.x = x;
  kitchen.chef.y = y;
}

/** Press E at the station the chef stands by. */
function act(kitchen, board) {
  return interact(kitchen, board, null);
}

/** Let the grill and fryer run for `seconds` of game time. */
function cookFor(kitchen, seconds) {
  for (let t = 0; t < seconds; t += STEP) updateCooking(kitchen, STEP);
}

// Where the chef stands to reach each station (just outside its counter,
// in the aisle — never inside another station's reach).
const SPOT = {
  pantry: (bin) => ({ x: STATIONS.pantry.x + (bin + 0.5) * (STATIONS.pantry.w / 7), y: 324 }),
  grill: { x: 360, y: 324 },
  fryer: { x: 594, y: 324 },
  sauce: { x: 791, y: 324 },
  plates: { x: 1077, y: 356 },
  board: { x: 122, y: 406 },
  window: { x: 1077, y: 568 },
};

// Pantry bins, left to right: bun, patty, lettuce, tomato, cheese, onion, fries.
const BIN = { bun: 0, patty: 1, lettuce: 2, tomato: 3, cheese: 4, onion: 5, fries: 6 };

function takeFromPantry(kitchen, board, kind) {
  const spot = SPOT.pantry(BIN[kind]);
  stand(kitchen, spot.x, spot.y);
  return act(kitchen, board);
}

function useStation(kitchen, board, name) {
  const spot = SPOT[name];
  stand(kitchen, spot.x, spot.y);
  return act(kitchen, board);
}

// The three plates on the plating counter, left to right.
const PLATE_SPOTS = [
  { x: 960, y: 356 },
  { x: 1078, y: 356 },
  { x: 1196, y: 356 },
];

/** Plate what the chef carries onto plate `n` (0, 1 or 2). */
function plateOnto(kitchen, board, n) {
  const spot = PLATE_SPOTS[n];
  stand(kitchen, spot.x, spot.y);
  return act(kitchen, board);
}

/**
 * The cover scene: three tickets on the board, a Sunrise Stack mid-assembly
 * on plate one (bun, grilled patty, cheese — the chopped lettuce still in
 * the chef's hands), a Crispy Basket finished on plate two and ready to
 * serve, a patty on the grill, a tomato half-chopped on the board.
 */
function stageCover(state) {
  const { kitchen, board } = state;
  state.elapsed = 45;
  state.coins = 38;
  board.tickets = [
    makeTicket(RECIPES[0], 30),
    makeTicket(RECIPES[1], 20),
    makeTicket(RECIPES[2], 42),
  ];

  takeFromPantry(kitchen, board, 'bun');
  plateOnto(kitchen, board, 0);
  takeFromPantry(kitchen, board, 'patty');
  useStation(kitchen, board, 'grill');
  cookFor(kitchen, 7);
  useStation(kitchen, board, 'grill');
  plateOnto(kitchen, board, 0);
  takeFromPantry(kitchen, board, 'cheese');
  plateOnto(kitchen, board, 0);
  takeFromPantry(kitchen, board, 'lettuce');
  useStation(kitchen, board, 'board');
  act(kitchen, board);
  act(kitchen, board);
  act(kitchen, board);
  takeFromPantry(kitchen, board, 'patty');
  useStation(kitchen, board, 'grill');
  takeFromPantry(kitchen, board, 'fries');
  useStation(kitchen, board, 'fryer');
  cookFor(kitchen, 5.5);
  useStation(kitchen, board, 'fryer');
  plateOnto(kitchen, board, 1);
  useStation(kitchen, board, 'sauce');
  plateOnto(kitchen, board, 1);
  takeFromPantry(kitchen, board, 'tomato');
  useStation(kitchen, board, 'board');
  act(kitchen, board);
  // End by the chopping board, chopped lettuce still in hand: the dish is
  // one ingredient from done.
  stand(kitchen, SPOT.board.x, SPOT.board.y);
  return SCREEN_PLAY;
}

/**
 * Mid-day: the same kitchen a minute later — four tickets, a combo going,
 * both grill slots working, the fryer going, the chef mid-chop.
 */
function stagePlay(state) {
  stageCover(state);
  const { kitchen, board } = state;
  state.elapsed = 82;
  state.coins = 96;
  board.served = 5;
  board.combo = 3;
  board.bestCombo = 3;
  board.tickets.push(makeTicket(RECIPES[3], 25));
  takeFromPantry(kitchen, board, 'patty');
  useStation(kitchen, board, 'grill');
  cookFor(kitchen, 2);
  // One more chop on the tomato waiting on the board.
  useStation(kitchen, board, 'board');
  return SCREEN_PLAY;
}

/**
 * The service rush: the last half-minute, four impatient tickets, a full
 * Sunrise Stack in the chef's hands at the serving window, the grill and
 * fryer both loaded.
 */
function stageRush(state) {
  stageCover(state);
  const { kitchen, board } = state;
  state.elapsed = 126;
  state.coins = 152;
  board.served = 8;
  board.combo = 4;
  board.bestCombo = 4;
  board.tickets = [
    makeTicket(RECIPES[0], 9),
    makeTicket(RECIPES[3], 14),
    makeTicket(RECIPES[1], 18),
    makeTicket(RECIPES[2], 12),
  ];
  // Finish the Sunrise Stack on plate 0, then pick that plate up and
  // carry it to the window.
  plateOnto(kitchen, board, 0);
  stand(kitchen, PLATE_SPOTS[0].x, PLATE_SPOTS[0].y);
  act(kitchen, board);
  takeFromPantry(kitchen, board, 'patty');
  useStation(kitchen, board, 'grill');
  takeFromPantry(kitchen, board, 'fries');
  useStation(kitchen, board, 'fryer');
  cookFor(kitchen, 2);
  stand(kitchen, SPOT.window.x, SPOT.window.y);
  return SCREEN_PLAY;
}

/** The day is done: the score, the stars, and what the day came to. */
function stageEnd(state) {
  state.elapsed = 150;
  state.coins = 172;
  state.board.served = 9;
  state.board.lost = 2;
  state.board.bestCombo = 4;
  state.stars = starsFor(172);
  state.newBest = true;
  return SCREEN_OVER;
}

/**
 * Set `state` to the named scene (cover, play, rush or end; any other name
 * is cover) and return the screen to draw over it.
 */
export function stageShot(name, state) {
  state.kitchen = createKitchen();
  state.board = createOrderBoard();
  state.elapsed = 0;
  state.coins = 0;
  state.stars = 0;
  state.newBest = false;
  state.lastServe = null;
  state.rushShown = false;
  state.screen = SCREEN_PLAY;
  if (name === 'play') return stagePlay(state);
  if (name === 'rush') return stageRush(state);
  if (name === 'end') return stageEnd(state);
  return stageCover(state);
}
