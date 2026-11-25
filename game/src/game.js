// game.js — the working day: one state object holds the kitchen, the order
// board, the clock and the coins, and stepGame advances it one frame at a
// time. Screens live here so the renderer and the loop agree on them.

import { DAY_SECONDS, STARS } from './config.js';
import { createKitchen, moveChef, interact, updateCooking } from './kitchen.js';
import { createOrderBoard, updateOrders } from './orders.js';
import * as audio from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** A fresh day: empty kitchen, empty board, the clock at zero, no coins yet. */
export function createGameState() {
  return {
    kitchen: createKitchen(),
    board: createOrderBoard(),
    elapsed: 0,
    coins: 0,
    screen: SCREEN_TITLE,
    newBest: false,
    stars: 0,
    lastServe: null,
    lastServeAt: 0,
    rushShown: false,
  };
}

/** Start (or restart) the day from scratch. */
export function startDay(state) {
  state.kitchen = createKitchen();
  state.board = createOrderBoard();
  state.elapsed = 0;
  state.coins = 0;
  state.screen = SCREEN_PLAY;
  state.stars = 0;
  state.lastServe = null;
  state.rushShown = false;
  audio.startMusic();
}

/** Stars for the coins earned when the day ends. */
export function starsFor(coins) {
  let stars = 0;
  for (const row of STARS) {
    if (coins >= row.coins) stars = Math.max(stars, row.stars);
  }
  return stars;
}

/**
 * Advance one frame of a running day. Movement and the interact key are read
 * in the loop and handed in here; cooking, orders and the clock advance here.
 * Returns 'over' when the day just ended, 'ticket' when a new order arrived.
 */
export function stepGame(state, input, dt) {
  if (state.screen !== SCREEN_PLAY) return null;
  state.elapsed += dt;

  moveChef(state.kitchen, input.moveVector(), dt);

  if (input.interactPressed()) {
    const clicked = input.mouseClicked();
    const result = interact(state.kitchen, state.board, clicked ? input.mousePos() : null);
    if (result && result.served) {
      state.coins += result.served.coins;
      state.lastServe = result.served;
      state.lastServeAt = performance.now();
    }
  }

  updateCooking(state.kitchen, dt);
  const spawned = updateOrders(state.board, dt, state.elapsed);
  if (spawned) audio.playDing();

  if (state.elapsed >= DAY_SECONDS) {
    state.screen = SCREEN_OVER;
    state.stars = starsFor(state.coins);
    audio.stopMusic();
    return 'over';
  }
  return spawned ? 'ticket' : null;
}

/** True while the last half-minute of the day is running. */
export function isRush(state) {
  return state.elapsed >= DAY_SECONDS - 30;
}

/** Seconds left on the clock, never below zero. */
export function timeLeft(state) {
  return Math.max(0, DAY_SECONDS - state.elapsed);
}
