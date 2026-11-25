// input.js — keyboard and mouse for The Golden Skillet. WASD or arrows move
// the chef, E or Space interacts with the nearest station, M mutes, R restarts
// after the day ends. A mouse click interacts with the station under the
// cursor when the chef stands close enough to reach it.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };
  let interactQueued = false;
  let anyGesture = false;

  function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(k);
    keys.add(k);
    anyGesture = true;
    if (k === 'e' || e.key === ' ') interactQueued = true;
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(keyName(e));
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    mouse.clicked = true;
    interactQueued = true;
    anyGesture = true;
  });

  return {
    // A unit movement vector from the keys held down right now.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    interactPressed() {
      const hit = interactQueued;
      interactQueued = false;
      return hit;
    },
    // A key pressed since the last frame, consumed once.
    consumeKey(k) {
      if (pressed.has(k)) {
        pressed.delete(k);
        return true;
      }
      return false;
    },
    mouseClicked() {
      const hit = mouse.clicked;
      mouse.clicked = false;
      return hit;
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    // True once the player has pressed anything at all.
    hadGesture() {
      return anyGesture;
    },
  };
}
