// audio.js — every sound in The Golden Skillet is synthesized with WebAudio,
// so the game ships no audio files at all. A chop is a short filtered thump,
// a sizzle is looped noise, a serve is a coin arpeggio, and the music is a
// small bass-and-pluck loop that starts on the first gesture.

let ctx = null;
let musicTimer = null;
let sizzleGain = null;
let sizzleSource = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playChop() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  osc.type = 'square';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function playPickup() {
  tone(520, 0.08, 'sine', 0.15, 0, 760);
}

export function playPlace() {
  tone(300, 0.09, 'triangle', 0.18, 0, 210);
}

export function playDing() {
  tone(880, 0.35, 'sine', 0.2);
  tone(1318, 0.4, 'sine', 0.14, 0.07);
}

export function playCoin() {
  tone(988, 0.1, 'square', 0.1);
  tone(1319, 0.14, 'square', 0.1, 0.08);
  tone(1760, 0.22, 'square', 0.08, 0.16);
}

export function playError() {
  tone(220, 0.16, 'sawtooth', 0.12, 0, 160);
  tone(160, 0.2, 'sawtooth', 0.1, 0.12, 110);
}

export function playSizzleBurst() {
  if (!ctx || muted) return;
  const dur = 0.5;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 5200;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.value = 0.22;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

// A soft looping sizzle while anything cooks, fading with the number of
// items on the heat.
export function setSizzleLevel(level) {
  if (!ctx) return;
  if (level > 0 && !sizzleSource) {
    const dur = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    sizzleSource = ctx.createBufferSource();
    sizzleSource.buffer = buffer;
    sizzleSource.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4800;
    filter.Q.value = 0.5;
    sizzleGain = ctx.createGain();
    sizzleGain.gain.value = 0;
    sizzleSource.connect(filter).connect(sizzleGain).connect(ctx.destination);
    sizzleSource.start();
  }
  if (sizzleGain) {
    sizzleGain.gain.setTargetAtTime(muted ? 0 : Math.min(0.12, level * 0.06), ctx.currentTime, 0.2);
  }
  if (level <= 0 && sizzleSource) {
    const src = sizzleSource;
    const gain = sizzleGain;
    sizzleSource = null;
    sizzleGain = null;
    if (gain) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    setTimeout(() => { try { src.stop(); } catch (_) { /* already stopped */ } }, 400);
  }
}

const BASS_LINE = [130.81, 98, 110, 146.83, 130.81, 98, 164.81, 196];
const PLUCK_LINE = [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 587.33];

export function startMusic() {
  if (!ctx || musicTimer) return;
  let step = 0;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const bass = BASS_LINE[step % BASS_LINE.length];
    tone(bass, 0.42, 'triangle', 0.1);
    const pluck = PLUCK_LINE[step % PLUCK_LINE.length];
    if (pluck) tone(pluck, 0.22, 'sine', 0.06);
    step++;
  }, 300);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function toggleMute() {
  muted = !muted;
  if (muted) setSizzleLevel(0);
  return muted;
}

export function isMuted() {
  return muted;
}
