// orders.js — the order board: tickets arrive, wait, and walk out. A ticket
// names a recipe and carries its own patience; serving the matching plate
// before patience runs out earns the price plus a tip, and a streak of good
// serves raises the combo.

import { RECIPES, MAX_TICKETS, patienceFor, spawnIntervalFor } from './config.js';

let ticketId = 1;

export function makeTicket(recipe, patience) {
  return {
    id: ticketId++,
    recipe,
    patience,
    patienceMax: patience,
    // A slow wobble so the ticket card feels alive on the board.
    bornAt: performance.now(),
  };
}

export function createOrderBoard() {
  return {
    tickets: [],
    spawnIn: 2.5,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
  };
}

// Pick the next recipe. Early on the board favours quick dishes; the double
// patty only shows once the chef has found their feet.
export function pickRecipe(elapsed, served) {
  const pool = RECIPES.filter((r) => (r.id === 'golden-double' ? served >= 2 : true));
  return pool[Math.floor(Math.random() * pool.length)];
}

export function updateOrders(board, dt, elapsed) {
  const fresh = [];
  for (const ticket of board.tickets) {
    ticket.patience -= dt;
    if (ticket.patience > 0) fresh.push(ticket);
  }
  const lostNow = board.tickets.length - fresh.length;
  if (lostNow > 0) {
    board.lost += lostNow;
    board.combo = 0;
  }
  board.tickets = fresh;

  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.tickets.length < MAX_TICKETS) {
    board.tickets.push(makeTicket(pickRecipe(elapsed, board.served), patienceFor(elapsed)));
    board.spawnIn = spawnIntervalFor(elapsed);
    return true;
  }
  if (board.spawnIn <= 0) board.spawnIn = 2;
  return false;
}

// The plate's finished items, as a sorted list of names, must equal the
// recipe's list exactly. Burnt food never counts.
export function plateMatchesRecipe(plateItems, recipe) {
  const have = plateItems.map((item) => item.kind).sort();
  const want = [...recipe.needs].sort();
  if (have.length !== want.length) return false;
  return have.every((kind, i) => kind === want[i]);
}

export function findTicketForPlate(board, plateItems) {
  return board.tickets.find((ticket) => plateMatchesRecipe(plateItems, ticket.recipe));
}

// Coins for a serve: the dish price, a tip worth up to half the price for
// serving early, and the combo multiplier.
export function serveTicket(board, ticket) {
  board.tickets = board.tickets.filter((t) => t.id !== ticket.id);
  board.served += 1;
  board.combo += 1;
  board.bestCombo = Math.max(board.bestCombo, board.combo);
  const early = Math.max(0, ticket.patience / ticket.patienceMax);
  const tip = Math.round(ticket.recipe.price * 0.5 * early);
  const comboMult = 1 + Math.min(board.combo - 1, 2) * 0.25;
  const coins = Math.round((ticket.recipe.price + tip) * comboMult);
  return { coins, tip, combo: board.combo };
}
