// main.js — boot and the one loop: input is read every frame, the day
// advances in fixed 1/60 s steps, and the renderer paints what is there.
// The game moves between four screens: title, play, paused and day over.
//
// ?shot=cover|play|rush|end stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY } from './config.js';
import { createInput } from './input.js';
import { updateOrders } from './orders.js';
import * as audio from './audio.js';
import {
  createGameState, startDay, stepGame, isRush,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER,
} from './game.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createGameState();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

let best = readBest();

function runShot(name) {
  const screen = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, screen, best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function beginDay() {
    startDay(state);
    accumulator = 0;
    announce('Playing. Serve the orders before the customers walk out.');
  }

  function endDay() {
    state.newBest = state.coins > best && state.coins > 0;
    if (state.coins > best) {
      best = state.coins;
      saveBest(best);
    }
    announce(`The day is done. You earned $${state.coins} and served ${state.board.served} dishes.`);
  }

  function handleKeys() {
    if (input.consumeKey('m')) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (state.screen === SCREEN_TITLE) {
      if (input.interactPressed()) beginDay();
    } else if (state.screen === SCREEN_PLAY) {
      if (input.consumeKey('p') || input.consumeKey('Escape')) {
        state.screen = SCREEN_PAUSED;
        announce('Paused.');
      }
    } else if (state.screen === SCREEN_PAUSED) {
      if (input.consumeKey('p') || input.consumeKey('Escape') || input.interactPressed()) {
        state.screen = SCREEN_PLAY;
        announce('Playing.');
      }
    } else if (state.screen === SCREEN_OVER) {
      if (input.consumeKey('r') || input.interactPressed()) beginDay();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    if (input.hadGesture()) {
      audio.ensureAudio();
      if (state.screen === SCREEN_PLAY) audio.startMusic();
    }
    handleKeys();

    if (state.screen === SCREEN_TITLE) {
      // The kitchen idles behind the title: orders drift in on their own.
      updateOrders(state.board, STEP, 0);
      accumulator = 0;
    } else if (state.screen === SCREEN_PLAY) {
      const wasRush = isRush(state);
      while (accumulator >= STEP) {
        const event = stepGame(state, input, STEP);
        accumulator -= STEP;
        if (event === 'over') {
          endDay();
          break;
        }
      }
      if (!wasRush && isRush(state) && state.screen === SCREEN_PLAY) {
        announce('Service rush! Tickets arrive faster.');
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(state, state.screen, best);
  }

  // Leaving the tab pauses a running day rather than letting orders walk out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('The Golden Skillet. Press Space or click to start the day.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
