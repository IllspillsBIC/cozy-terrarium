// main.js — Bootstrap, resize handler

import { Game } from './game.js';

const INTERNAL_W = 640;
const INTERNAL_H = 360;

let game = null;

function getCanvas() {
  return document.getElementById('game-canvas');
}

function resizeCanvas() {
  const canvas = getCanvas();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const scale = Math.min(vw / INTERNAL_W, vh / INTERNAL_H);
  const displayW = Math.floor(INTERNAL_W * scale);
  const displayH = Math.floor(INTERNAL_H * scale);

  canvas.style.width  = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  canvas.style.position = 'absolute';
  canvas.style.left = `${Math.floor((vw - displayW) / 2)}px`;
  canvas.style.top  = `${Math.floor((vh - displayH) / 2)}px`;
}

function showError(msg) {
  const el = document.getElementById('loading-text');
  if (el) {
    el.textContent = '⚠ ' + msg;
    el.style.color = '#ff6060';
    el.style.fontSize = '13px';
    el.style.maxWidth = '80vw';
    el.style.textAlign = 'center';
    el.style.animation = 'none';
  }
  console.error('[Terrarium] Init error:', msg);
}

// type="module" scripts run after DOM is parsed — no DOMContentLoaded needed
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
getCanvas().addEventListener('contextmenu', e => e.preventDefault());

try {
  game = new Game(getCanvas());
  game.start();
  window._game = game;
} catch (err) {
  showError(err.message || String(err));
  console.error(err);
}
