// render.js — everything the player sees, painted on one canvas: the
// order board and the clock across the top, the kitchen floor with its
// stations, the chef and what they carry, and the title, pause and
// day-over screens. All art is drawn shapes; the game ships no images.

import {
  CANVAS_W, CANVAS_H, DAY_SECONDS, RUSH_SECONDS, STATIONS, INGREDIENTS, RECIPES,
} from './config.js';
import { isFinished, plateSummary } from './kitchen.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, isRush, timeLeft,
} from './game.js';

const FLOOR_A = '#e8c99a';
const FLOOR_B = '#dfbd85';
const WALL = '#f7ead0';
const BOARD_DARK = '#3a2e22';
const CREAM = '#fff6e3';
const INK = '#3a2e22';
const RED = '#c0392b';
const GREEN = '#2e7d32';
const GOLD = '#e9a319';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

/** One ingredient, drawn at (x, y) as a small picture of itself. */
export function drawIngredient(ctx, kind, state, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 24;
  if (kind === 'bun') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath();
    ctx.ellipse(0, -2 * u, 11 * u, 7 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d99a3f';
    ctx.fillRect(-11 * u, -2 * u, 22 * u, 4 * u);
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-5, -6], [0, -8], [5, -6]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, 1.4 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    const fill = state === 'burnt' ? '#1c1410' : state === 'cooked' ? '#6d3b1f' : state === 'cooking' ? '#8a5a34' : '#d98a7a';
    ctx.fillStyle = fill;
    roundRect(ctx, -11 * u, -6 * u, 22 * u, 12 * u, 5 * u);
    ctx.fill();
    if (state === 'cooked' || state === 'cooking') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.6 * u;
      for (const dx of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.moveTo(dx * u, -5 * u);
        ctx.lineTo(dx * u, 5 * u);
        ctx.stroke();
      }
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-11 * u, 6 * u);
    ctx.lineTo(11 * u, 6 * u);
    ctx.lineTo(0, -8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a17';
    for (const [dx, dy] of [[-4, 1], [3, 2], [0, -3]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, 1.6 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? '#7bc96f' : '#4caf50';
    for (const [dx, dy, r] of [[-6, 2, 6], [5, 3, 6], [0, -4, 7]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    ctx.moveTo(-6 * u, -3 * u);
    ctx.quadraticCurveTo(0, 4 * u, 6 * u, -3 * u);
    ctx.stroke();
  } else if (kind === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = '#e74c3c';
      for (const dx of [-7, 0, 7]) {
        ctx.beginPath();
        ctx.arc(dx * u, 0, 5.5 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f1948a';
      for (const dx of [-7, 0, 7]) {
        ctx.beginPath();
        ctx.arc(dx * u, 0, 2.4 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(0, 1 * u, 10 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.moveTo(0, -8 * u);
      ctx.lineTo(-5 * u, -3 * u);
      ctx.lineTo(5 * u, -3 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(-4 * u, -3 * u, 2.6 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'onion') {
    if (state === 'chopped') {
      ctx.strokeStyle = '#b07cc4';
      ctx.lineWidth = 2.4 * u;
      for (const r of [4, 7, 10]) {
        ctx.beginPath();
        ctx.arc(0, 0, r * u, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#efe3f2';
      ctx.beginPath();
      ctx.arc(0, 1 * u, 10 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b07cc4';
      ctx.lineWidth = 1.6 * u;
      for (const r of [5, 8]) {
        ctx.beginPath();
        ctx.arc(0, 1 * u, r * u, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      ctx.strokeStyle = '#7cb342';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(0, -8 * u);
      ctx.lineTo(0, -12 * u);
      ctx.stroke();
    }
  } else if (kind === 'fries') {
    const fill = state === 'burnt' ? '#1c1410' : state === 'cooked' ? '#f2c14e' : '#f7dc8a';
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath();
    ctx.moveTo(-10 * u, -2 * u);
    ctx.lineTo(10 * u, -2 * u);
    ctx.lineTo(7 * u, 10 * u);
    ctx.lineTo(-7 * u, 10 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fill;
    for (const dx of [-6, -1, 4]) {
      ctx.fillRect((dx - 1.8) * u, -11 * u, 3.6 * u, 11 * u);
    }
  } else if (kind === 'sauce') {
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(0, 0, 9 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5b041';
    ctx.beginPath();
    ctx.arc(-3 * u, -3 * u, 4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The little coloured chip a ticket uses to name one ingredient. */
function drawChip(ctx, kind, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  drawIngredient(ctx, kind, kind === 'patty' || kind === 'fries' ? 'cooked' : 'ready', 0, 0, 20);
  ctx.restore();
}

function drawStationBase(ctx, s, top, body, labelColor = CREAM) {
  ctx.fillStyle = body;
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = top;
  roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, 34, 7);
  ctx.fill();
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 26, 15, labelColor, '800', 'center');
  text(ctx, s.sub, s.x + s.w / 2, s.y + s.h - 8, 11, 'rgba(255,246,227,0.75)', '600', 'center');
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

function drawCookSlots(ctx, slots, x, y, slotW, slotH, kindLabel) {
  slots.forEach((slot, i) => {
    const sx = x + i * (slotW + 10);
    ctx.fillStyle = '#241a12';
    roundRect(ctx, sx, y, slotW, slotH, 8);
    ctx.fill();
    if (slot) {
      const spec = INGREDIENTS[slot.kind];
      drawIngredient(ctx, slot.kind, slot.state, sx + slotW / 2, y + slotH / 2 - 4, 40);
      if (slot.state === 'cooking' || slot.state === 'cooked') {
        const frac = Math.min(1, slot.progress / spec.cookSeconds);
        drawProgressRing(ctx, sx + slotW - 14, y + 14, 9, frac, slot.state === 'cooked' ? GOLD : '#e67e22');
      }
      if (slot.state === 'cooked') text(ctx, 'READY', sx + slotW / 2, y + slotH - 6, 11, GOLD, '800', 'center');
      if (slot.state === 'burnt') text(ctx, 'BURNT!', sx + slotW / 2, y + slotH - 6, 11, '#ff6b5e', '800', 'center');
    } else {
      text(ctx, kindLabel, sx + slotW / 2, y + slotH / 2 + 4, 12, 'rgba(255,246,227,0.4)', '700', 'center');
    }
  });
}

function drawPlate(ctx, items, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc4ae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -1, 34, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Stack the finished items on the plate, newest on top.
  const shown = items.slice(-4);
  shown.forEach((item, i) => {
    const iy = -14 - i * 9;
    drawIngredient(ctx, item.kind, item.state, (i % 2 === 0 ? -8 : 8), iy, 30);
  });
  ctx.restore();
}

function drawChef(ctx, chef, carry, heldPlate, plates) {
  const { x, y } = chef;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron over a warm shirt.
  ctx.fillStyle = '#e2725b';
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  roundRect(ctx, -13, -6, 26, 26, 8);
  ctx.fill();
  // Head and tall chef's hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -22, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  roundRect(ctx, -13, -44, 26, 14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -36, 8, 0, Math.PI * 2);
  ctx.arc(0, -40, 9, 0, Math.PI * 2);
  ctx.arc(8, -36, 8, 0, Math.PI * 2);
  ctx.fill();
  // Face: eyes and a smile, turned the way the chef walks.
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(-5 + chef.facing * 2, -23, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + chef.facing * 2, -23, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(chef.facing * 2, -19, 4, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Walking bob.
  if (chef.walking) ctx.translate(0, Math.sin(performance.now() / 90) * 1.5);
  // What the chef carries, held up over their head.
  carry.forEach((item, i) => {
    drawIngredient(ctx, item.kind, item.state, -14 + i * 28, -58, 26);
  });
  // A plate held out in front, with its dish on it.
  if (heldPlate !== -1 && plates[heldPlate]) {
    ctx.save();
    ctx.translate(chef.facing * 26, -6);
    drawPlate(ctx, plates[heldPlate], 0, 0, 0.85);
    ctx.restore();
  }
  ctx.restore();
}

function drawTickets(ctx, board) {
  const x0 = 300;
  const y0 = 54;
  const cardW = 150;
  const cardH = 62;
  board.tickets.forEach((ticket, i) => {
    const x = x0 + i * (cardW + 10);
    const y = y0;
    const wobble = Math.sin((performance.now() - ticket.bornAt) / 500) * 1.5;
    ctx.save();
    ctx.translate(0, wobble);
    ctx.fillStyle = ticket.patience < 10 ? '#ffe1d6' : CREAM;
    roundRect(ctx, x, y, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = ticket.patience < 10 ? RED : '#c9a86a';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, cardW, cardH, 8);
    ctx.stroke();
    text(ctx, `#${ticket.id} ${ticket.recipe.name}`, x + 8, y + 18, 12, INK, '800');
    text(ctx, `$${ticket.recipe.price}`, x + cardW - 8, y + 18, 12, '#b7791f', '800', 'right');
    ticket.recipe.needs.forEach((kind, j) => {
      drawChip(ctx, kind, x + 18 + j * 26, y + 38);
    });
    // Patience bar: green while there is time, red when the customer is leaving.
    const frac = Math.max(0, ticket.patience / ticket.patienceMax);
    ctx.fillStyle = '#e0d3b8';
    roundRect(ctx, x + 10, y + cardH - 10, cardW - 20, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? GREEN : frac > 0.25 ? '#e67e22' : RED;
    roundRect(ctx, x + 10, y + cardH - 10, (cardW - 20) * frac, 5, 2.5);
    ctx.fill();
    ctx.restore();
  });
  if (board.tickets.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', x0 + 8, y0 + 36, 15, 'rgba(255,246,227,0.65)', '600');
  }
}

function drawKitchen(ctx, state) {
  const { kitchen, board } = state;
  // Floor tiles.
  for (let ty = 0; ty < 6; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * 160, 128 + ty * 100, 160, 100);
    }
  }
  // Wall band and skirting.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, CANVAS_W, 128);
  ctx.fillStyle = '#d9c49a';
  ctx.fillRect(0, 124, CANVAS_W, 4);
  // A row of warm tiles along the wall.
  ctx.fillStyle = '#e8d5ae';
  for (let tx = 0; tx < 16; tx++) {
    ctx.fillRect(tx * 80 + 4, 100, 72, 20);
  }

  // --- Stations ---
  const s = STATIONS;
  // Pantry: seven bins, one per ingredient.
  drawStationBase(ctx, s.pantry, '#8a5a34', '#6b4423');
  const bins = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion', 'fries'];
  bins.forEach((kind, i) => {
    const bx = s.pantry.x + 12 + i * 25;
    ctx.fillStyle = '#a9713f';
    roundRect(ctx, bx, s.pantry.y + 46, 22, 52, 5);
    ctx.fill();
    drawIngredient(ctx, kind, 'raw', bx + 11, s.pantry.y + 68, 20);
  });

  // Chopping board.
  drawStationBase(ctx, s.board, '#c89b6a', '#8a5a34');
  ctx.fillStyle = '#e8c99a';
  roundRect(ctx, s.board.x + 20, s.board.y + 42, s.board.w - 40, 50, 6);
  ctx.fill();
  if (kitchen.board) {
    drawIngredient(ctx, kitchen.board.kind, kitchen.board.state, s.board.x + s.board.w / 2, s.board.y + 66, 44);
    for (let i = 0; i < kitchen.board.chopsLeft; i++) {
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(s.board.x + s.board.w / 2 - 18 + i * 18, s.board.y + 86, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    text(ctx, 'empty board', s.board.x + s.board.w / 2, s.board.y + 76, 12, 'rgba(255,246,227,0.6)', '600', 'center');
  }

  // Grill and fryer, with their cooking slots.
  drawStationBase(ctx, s.grill, '#5a4636', '#3a2e22');
  drawCookSlots(ctx, kitchen.grill, s.grill.x + 14, s.grill.y + 46, 92, 62, 'patty');
  drawStationBase(ctx, s.fryer, '#7a5a1f', '#54401a');
  drawCookSlots(ctx, kitchen.fryer, s.fryer.x + 14, s.fryer.y + 46, 76, 62, 'fries');

  // Sauce pot.
  drawStationBase(ctx, s.sauce, '#b4551f', '#7a3a12');
  ctx.fillStyle = '#3a2e22';
  ctx.beginPath();
  ctx.ellipse(s.sauce.x + s.sauce.w / 2, s.sauce.y + 78, 52, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.ellipse(s.sauce.x + s.sauce.w / 2, s.sauce.y + 74, 44, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5b041';
  ctx.beginPath();
  ctx.ellipse(s.sauce.x + s.sauce.w / 2 - 8, s.sauce.y + 70, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plating counter: three plates, each with its dish so far.
  drawStationBase(ctx, s.plates, '#fdfdf8', '#8a6f4d');
  kitchen.plates.forEach((plate, i) => {
    const px = s.plates.x + 62 + i * 118;
    drawPlate(ctx, plate, px, s.plates.y + 84, 1);
    const match = board.tickets.find((t) => t.recipe.needs.length === plate.length &&
      plate.map((it) => it.kind).sort().join() === [...t.recipe.needs].sort().join());
    if (plate.length > 0) {
      text(ctx, match ? 'READY!' : `${plate.length} item${plate.length > 1 ? 's' : ''}`, px, s.plates.y + 122, 12, match ? GREEN : INK, '800', 'center');
    }
  });

  // Serving window: a hatch with a bell.
  drawStationBase(ctx, s.window, '#2e7d32', '#1e5a24');
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(s.window.x + s.window.w / 2, s.window.y + 66, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b7791f';
  ctx.fillRect(s.window.x + s.window.w / 2 - 18, s.window.y + 80, 36, 5);

  // Trash.
  drawStationBase(ctx, s.trash, '#616161', '#424242');
  ctx.fillStyle = '#757575';
  roundRect(ctx, s.trash.x + s.trash.w / 2 - 26, s.trash.y + 40, 52, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(s.trash.x + s.trash.w / 2 - 30, s.trash.y + 34, 60, 8);

  drawChef(ctx, kitchen.chef, kitchen.carry, kitchen.heldPlate, kitchen.plates);

  // Carried items named, so the player always knows what is in hand.
  if (kitchen.carry.length > 0) {
    const names = kitchen.carry.map((item) => {
      if (item.state === 'burnt') return `${INGREDIENTS[item.kind].label} (burnt)`;
      return INGREDIENTS[item.kind].label;
    }).join(' + ');
    text(ctx, `Carrying: ${names}`, CANVAS_W / 2, 694, 14, INK, '700', 'center');
  }

  // Flash message from the last interaction.
  if (kitchen.flash && performance.now() < kitchen.flashUntil) {
    ctx.fillStyle = 'rgba(58,46,34,0.92)';
    const w = ctx.measureText(kitchen.flash).width + 36;
    roundRect(ctx, CANVAS_W / 2 - w / 2, 632, w, 30, 15);
    ctx.fill();
    text(ctx, kitchen.flash, CANVAS_W / 2, 653, 15, CREAM, '700', 'center');
  }

  // A coin pops up where a serve just landed.
  if (state.lastServe && performance.now() - state.lastServeAt < 1600) {
    const lift = (performance.now() - state.lastServeAt) / 1600;
    text(ctx, `+$${state.lastServe.coins}  (tip $${state.lastServe.tip}, combo x${state.lastServe.combo})`,
      s.window.x + s.window.w / 2, s.window.y - 14 - lift * 24, 16, '#b7791f', '800', 'center');
  }
}

function drawTopBar(ctx, state) {
  const { board } = state;
  const left = timeLeft(state);
  const mins = Math.floor(left / 60);
  const secs = Math.floor(left % 60);
  const clock = `${mins}:${String(secs).padStart(2, '0')}`;
  const rush = isRush(state) && state.screen === SCREEN_PLAY;

  text(ctx, 'THE GOLDEN SKILLET', 24, 32, 20, INK, '800');
  text(ctx, 'run the kitchen · serve before they walk out', 24, 50, 11, '#7a6a52', '600');

  // The day clock: a bar that drains, and big digits.
  const barX = 980;
  const barW = 180;
  ctx.fillStyle = '#e0d3b8';
  roundRect(ctx, barX, 14, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = rush ? RED : GREEN;
  roundRect(ctx, barX, 14, barW * (left / DAY_SECONDS), 12, 6);
  ctx.fill();
  text(ctx, clock, barX + barW / 2, 48, 26, rush ? RED : INK, '800', 'center');
  if (rush) text(ctx, 'RUSH!', barX - 12, 48, 18, RED, '800', 'right');

  text(ctx, `$${state.coins}`, 1180, 36, 26, '#b7791f', '800', 'right');
  text(ctx, `served ${board.served} · lost ${board.lost}`, 1180, 56, 12, '#7a6a52', '600', 'right');
  if (board.combo > 1) {
    text(ctx, `COMBO x${board.combo}`, 880, 36, 18, '#e2725b', '800', 'right');
  }
  if (rush) {
    const pulse = 0.6 + Math.sin(performance.now() / 200) * 0.4;
    ctx.globalAlpha = pulse;
    text(ctx, 'SERVICE RUSH — tickets arrive faster!', CANVAS_W / 2, 148, 18, RED, '800', 'center');
    ctx.globalAlpha = 1;
  }

  drawTickets(ctx, board);
}

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(36,26,18,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'THE GOLDEN SKILLET', CANVAS_W / 2, 220, 64, GOLD, '800', 'center');
  text(ctx, 'A one-chef kitchen, a lunch crowd, and 2½ minutes on the clock.', CANVAS_W / 2, 262, 20, CREAM, '600', 'center');
  const lines = [
    'WASD or arrows — walk the kitchen      E or click — use a station',
    'Pantry — grab ingredients      Board — chop veg (E three times)',
    'Grill & fryer — cook, but watch the ring: golden is ready, black is burnt',
    'Plating counter — build the dish      Serving window — ring the bell',
    'Serve fast for tips. Chain serves for a combo. Mind the clock.',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 330 + i * 32, 17, CREAM, '600', 'center'));
  const blink = 0.55 + Math.sin(performance.now() / 350) * 0.45;
  ctx.globalAlpha = blink;
  text(ctx, 'Press SPACE or click to start the day', CANVAS_W / 2, 540, 24, GOLD, '800', 'center');
  ctx.globalAlpha = 1;
  if (best > 0) text(ctx, `Best day so far: $${best}`, CANVAS_W / 2, 580, 16, CREAM, '600', 'center');
  text(ctx, 'Recipes on the board — Sunrise Stack · Garden Melt · Crispy Basket · Golden Double · Morning Melt', CANVAS_W / 2, 640, 14, 'rgba(255,246,227,0.7)', '600', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(36,26,18,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', CANVAS_W / 2, 360, 56, CREAM, '800', 'center');
  text(ctx, 'Press P to keep cooking', CANVAS_W / 2, 400, 18, CREAM, '600', 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(36,26,18,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'THE DAY IS DONE', CANVAS_W / 2, 200, 52, GOLD, '800', 'center');
  text(ctx, `You earned $${state.coins}`, CANVAS_W / 2, 262, 28, CREAM, '800', 'center');
  // Stars, earned or dim.
  for (let i = 0; i < 3; i++) {
    const x = CANVAS_W / 2 - 90 + i * 90;
    const y = 330;
    ctx.font = '64px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = i < state.stars ? GOLD : 'rgba(255,246,227,0.25)';
    ctx.fillText('★', x, y);
  }
  const need = [60, 120, 180];
  text(ctx, state.stars === 3 ? 'Three stars — a golden day!' : `Next star at $${need[state.stars]}`, CANVAS_W / 2, 380, 18, CREAM, '600', 'center');
  text(ctx, `Served ${state.board.served} dishes · ${state.board.lost} customers walked out · best combo x${state.board.bestCombo}`,
    CANVAS_W / 2, 424, 18, CREAM, '600', 'center');
  if (state.newBest) text(ctx, 'A new best day!', CANVAS_W / 2, 458, 18, GOLD, '800', 'center');
  const blink = 0.55 + Math.sin(performance.now() / 350) * 0.45;
  ctx.globalAlpha = blink;
  text(ctx, 'Press R to run another day', CANVAS_W / 2, 530, 24, GOLD, '800', 'center');
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(state, screen, best) {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawKitchen(ctx, state);
      drawTopBar(ctx, state);
      if (screen === SCREEN_TITLE) drawTitle(ctx, best);
      else if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_OVER) drawOver(ctx, state);
    },
  };
}

export { RECIPES };
