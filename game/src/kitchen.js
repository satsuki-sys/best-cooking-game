// kitchen.js — the working kitchen: the chef walks, carries, chops, grills,
// fries and plates. Every interaction starts here, from the nearest station
// the chef can reach, and every cooked thing keeps its own timer so a patty
// left too long comes back black.

import {
  STATIONS, CHEF_START, CHEF_SPEED, CHEF_RADIUS, CARRY_MAX,
  CANVAS_W, CANVAS_H, INGREDIENTS,
} from './config.js';
import { findTicketForPlate, serveTicket } from './orders.js';
import * as audio from './audio.js';

export function createKitchen() {
  return {
    chef: { x: CHEF_START.x, y: CHEF_START.y, facing: 1, walking: false },
    carry: [],
    // The chopping board holds one vegetable and its remaining chops.
    board: null,
    // Two grill slots and two fryer slots; a slot holds {kind, progress}.
    grill: [null, null],
    fryer: [null, null],
    // Three plates on the plating counter; a plate holds finished items.
    plates: [[], [], []],
    // The plate the chef is holding up to the window, or null.
    heldPlate: -1,
    flash: null,
    flashUntil: 0,
  };
}

function stationRects() {
  return Object.entries(STATIONS).map(([id, s]) => ({ id, ...s }));
}

export function nearestStation(chef, mouse) {
  let best = null;
  let bestDist = Infinity;
  for (const s of stationRects()) {
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  // A mouse click names its station; a key press takes the nearest one.
  if (mouse) {
    for (const s of stationRects()) {
      if (mouse.x >= s.x && mouse.x <= s.x + s.w && mouse.y >= s.y && mouse.y <= s.y + s.h) {
        return { station: s, dist: bestDist };
      }
    }
  }
  return { station: best, dist: bestDist };
}

const REACH = 78;

export function moveChef(kitchen, vec, dt) {
  const chef = kitchen.chef;
  if (vec.x === 0 && vec.y === 0) {
    chef.walking = false;
    return;
  }
  chef.walking = true;
  if (vec.x !== 0) chef.facing = vec.x > 0 ? 1 : -1;
  let nx = chef.x + vec.x * CHEF_SPEED * dt;
  let ny = chef.y + vec.y * CHEF_SPEED * dt;
  // The kitchen walls and the order board keep the chef on the floor.
  nx = Math.max(CHEF_RADIUS + 8, Math.min(CANVAS_W - CHEF_RADIUS - 8, nx));
  ny = Math.max(128 + CHEF_RADIUS, Math.min(CANVAS_H - CHEF_RADIUS - 8, ny));
  // Station counters are solid: push the chef out of any overlap.
  for (const s of stationRects()) {
    if (nx + CHEF_RADIUS > s.x && nx - CHEF_RADIUS < s.x + s.w &&
        ny + CHEF_RADIUS > s.y && ny - CHEF_RADIUS < s.y + s.h) {
      const pushLeft = (nx + CHEF_RADIUS) - s.x;
      const pushRight = (s.x + s.w) - (nx - CHEF_RADIUS);
      const pushUp = (ny + CHEF_RADIUS) - s.y;
      const pushDown = (s.y + s.h) - (ny - CHEF_RADIUS);
      const min = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (min === pushLeft) nx = s.x - CHEF_RADIUS;
      else if (min === pushRight) nx = s.x + s.w + CHEF_RADIUS;
      else if (min === pushUp) ny = s.y - CHEF_RADIUS;
      else ny = s.y + s.h + CHEF_RADIUS;
    }
  }
  chef.x = nx;
  chef.y = ny;
}

function flash(kitchen, text) {
  kitchen.flash = text;
  kitchen.flashUntil = performance.now() + 1400;
}

function newItem(kind) {
  return { kind, state: 'raw', chopsLeft: INGREDIENTS[kind].chops || 0 };
}

function finishedName(item) {
  if (item.state === 'burnt') return `${INGREDIENTS[item.kind].label} (burnt)`;
  if (item.kind === 'patty' && item.state === 'cooked') return 'Grilled patty';
  if (item.kind === 'fries' && item.state === 'cooked') return 'Golden fries';
  if (INGREDIENTS[item.kind].chop && item.state === 'chopped') return `Chopped ${INGREDIENTS[item.kind].label.toLowerCase()}`;
  return INGREDIENTS[item.kind].label;
}

// The plating counter holds three plates; the one the chef stands nearest
// is the one they work on, so the player chooses a plate by standing by it.
function plateCenterX(i) {
  const s = STATIONS.plates;
  return s.x + 62 + i * 118;
}

function nearestPlate(kitchen, predicate) {
  let best = -1;
  let bestDist = Infinity;
  kitchen.plates.forEach((plate, i) => {
    if (!predicate(plate)) return;
    const d = Math.abs(kitchen.chef.x - plateCenterX(i));
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}
export function isFinished(item) {
  if (item.state === 'burnt') return false;
  if (INGREDIENTS[item.kind].cook) return item.state === 'cooked';
  if (INGREDIENTS[item.kind].chop) return item.state === 'chopped';
  return true;
}

// The pantry is seven bins in one counter: the bin under the chef's hands
// decides what is picked up.
function pantryKindAt(chef) {
  const s = STATIONS.pantry;
  const bins = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion', 'fries'];
  const rel = Math.max(0, Math.min(0.999, (chef.x - s.x) / s.w));
  return bins[Math.floor(rel * bins.length)];
}

export function interact(kitchen, board, mouse) {
  const { station, dist } = nearestStation(kitchen.chef, mouse);
  if (!station || dist > REACH) {
    flash(kitchen, 'Walk up to a station first!');
    return 'too-far';
  }
  const chef = kitchen.chef;

  if (station.id === 'pantry') {
    if (kitchen.carry.length >= CARRY_MAX) {
      flash(kitchen, 'Hands full — plate something first!');
      audio.playError();
      return 'hands-full';
    }
    const kind = pantryKindAt(chef);
    kitchen.carry.push(newItem(kind));
    audio.playPickup();
    return 'pickup';
  }

  if (station.id === 'board') {
    if (kitchen.board) {
      kitchen.board.chopsLeft -= 1;
      audio.playChop();
      if (kitchen.board.chopsLeft <= 0) {
        kitchen.board.state = 'chopped';
        const done = kitchen.board;
        kitchen.board = null;
        if (kitchen.carry.length < CARRY_MAX) {
          kitchen.carry.push(done);
          audio.playPlace();
        } else {
          kitchen.board = done;
          flash(kitchen, 'Hands full — the chopped veg waits on the board');
        }
      }
      return 'chop';
    }
    const veg = kitchen.carry.find((item) => INGREDIENTS[item.kind].chop && item.state === 'raw');
    if (!veg) {
      flash(kitchen, 'Bring a lettuce, tomato or onion to chop');
      audio.playError();
      return 'need-veg';
    }
    kitchen.carry = kitchen.carry.filter((item) => item !== veg);
    kitchen.board = veg;
    audio.playPlace();
    return 'board';
  }

  if (station.id === 'grill' || station.id === 'fryer') {
    const slots = station.id === 'grill' ? kitchen.grill : kitchen.fryer;
    const want = station.id === 'grill' ? 'patty' : 'fries';
    const idx = slots.findIndex((slot) => slot && slot.state !== 'raw' && slot.state !== 'cooking');
    if (idx !== -1) {
      const done = slots[idx];
      slots[idx] = null;
      if (kitchen.carry.length >= CARRY_MAX) {
        slots[idx] = done;
        flash(kitchen, 'Hands full!');
        audio.playError();
        return 'hands-full';
      }
      kitchen.carry.push(done);
      audio.playPickup();
      return 'take-cooked';
    }
    const raw = kitchen.carry.find((item) => item.kind === want && item.state === 'raw');
    if (!raw) {
      flash(kitchen, `Bring a raw ${want} from the pantry`);
      audio.playError();
      return 'need-raw';
    }
    const free = slots.findIndex((slot) => slot === null);
    if (free === -1) {
      flash(kitchen, 'Both slots are busy!');
      audio.playError();
      return 'slots-full';
    }
    kitchen.carry = kitchen.carry.filter((item) => item !== raw);
    raw.state = 'cooking';
    raw.progress = 0;
    slots[free] = raw;
    audio.playSizzleBurst();
    return 'start-cook';
  }

  if (station.id === 'sauce') {
    if (kitchen.carry.length >= CARRY_MAX) {
      flash(kitchen, 'Hands full!');
      audio.playError();
      return 'hands-full';
    }
    kitchen.carry.push({ kind: 'sauce', state: 'ready', chopsLeft: 0 });
    audio.playPickup();
    return 'pickup';
  }

  if (station.id === 'plates') {
    // Carrying a plate back to the counter sets it down again.
    if (kitchen.heldPlate !== -1) {
      kitchen.heldPlate = -1;
      audio.playPlace();
      return 'return-plate';
    }
    // With empty hands, pick up the plate the chef stands nearest.
    if (kitchen.carry.length === 0 && kitchen.heldPlate === -1) {
      const idx = nearestPlate(kitchen, (plate) => plate.length > 0);
      if (idx !== -1) {
        kitchen.heldPlate = idx;
        audio.playPickup();
        return 'take-plate';
      }
      flash(kitchen, 'Build a dish on a plate first');
      audio.playError();
      return 'empty-plates';
    }
    // Plate what is on top of the chef's hands: the last finished item
    // they picked up, onto the plate they stand nearest.
    const finishedFromTop = [...kitchen.carry].reverse().find(isFinished);
    const item = finishedFromTop;
    if (!item) {
      flash(kitchen, 'Nothing finished to plate — chop it or cook it first');
      audio.playError();
      return 'not-finished';
    }
    const idx = nearestPlate(kitchen, (p) => p.length < 6);
    if (idx === -1) {
      flash(kitchen, 'Every plate is full!');
      audio.playError();
      return 'plates-full';
    }
    const plate = kitchen.plates[idx];
    kitchen.carry = kitchen.carry.filter((x) => x !== item);
    plate.push(item);
    audio.playPlace();
    return 'plate';
  }

  if (station.id === 'window') {
    if (kitchen.heldPlate === -1) {
      flash(kitchen, 'Pick up a finished plate from the plating counter');
      audio.playError();
      return 'need-plate';
    }
    const plate = kitchen.plates[kitchen.heldPlate];
    const ticket = findTicketForPlate(board, plate);
    if (!ticket) {
      flash(kitchen, 'No order wants this dish — check the board!');
      audio.playError();
      board.combo = 0;
      return 'wrong-dish';
    }
    const result = serveTicket(board, ticket);
    kitchen.plates[kitchen.heldPlate] = [];
    kitchen.heldPlate = -1;
    audio.playCoin();
    return { served: result };
  }

  if (station.id === 'trash') {
    if (kitchen.carry.length > 0) {
      kitchen.carry.pop();
      audio.playPlace();
      return 'trash-carry';
    }
    if (kitchen.heldPlate !== -1) {
      kitchen.plates[kitchen.heldPlate] = [];
      kitchen.heldPlate = -1;
      audio.playPlace();
      return 'trash-plate';
    }
    flash(kitchen, 'Nothing to throw away');
    return 'trash-empty';
  }

  return 'none';
}

// Cooking advances; a slot past its burn time turns black and is only good
// for the trash. Returns how many items are on the heat, for the sizzle.
export function updateCooking(kitchen, dt) {
  let onHeat = 0;
  for (const slots of [kitchen.grill, kitchen.fryer]) {
    for (const slot of slots) {
      if (!slot || slot.state === 'burnt') continue;
      onHeat += 1;
      const spec = INGREDIENTS[slot.kind];
      slot.progress += dt;
      if (slot.progress >= spec.burnSeconds) {
        slot.state = 'burnt';
        audio.playError();
      } else if (slot.progress >= spec.cookSeconds) {
        slot.state = 'cooked';
      }
    }
  }
  audio.setSizzleLevel(onHeat);
  return onHeat;
}

export function carriedNames(kitchen) {
  return kitchen.carry.map(finishedName);
}

export function plateSummary(plate) {
  return plate.map(finishedName);
}
