// game.js — Core game state, loop, save/load

import { TimeManager } from './timeManager.js';
import { SceneManager } from './scene.js';
import { Room } from './room.js';
import { WeatherSystem } from './weather.js';
import { TerrariumManager } from './terrariumManager.js';
import { ParticleSystem } from './particles.js';
import { UI } from './ui.js';
import { InputHandler } from './inputHandler.js';

const SAVE_KEY = 'terrarium_save';
const SAVE_VERSION = 1;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this._lastTime = null;
    this._animId = null;
    this._running = false;
    this._time = 0; // seconds elapsed (for animations)

    this._init();
  }

  _init() {
    const step = (name, fn) => {
      try { fn(); }
      catch (e) { throw new Error(`[${name}] ${e.message}`); }
    };

    step('SceneManager', () => { this.sceneManager = new SceneManager(this.canvas); });
    step('TimeManager',  () => { this.timeManager  = new TimeManager(); });
    step('Weather',      () => { this.weather = new WeatherSystem(); });
    step('Room',         () => { this.room = new Room(this.sceneManager.scene, this.weather); });
    step('TerrariumManager', () => {
      this.terrariumManager = new TerrariumManager(
        this.sceneManager.scene,
        this.sceneManager.camera
      );
    });
    step('Particles', () => {
      this.particles = new ParticleSystem(330);
      this.sceneManager.scene.add(this.particles.group);
    });
    step('UI',    () => { this.ui = new UI(this.terrariumManager, this.timeManager); });
    step('Input', () => {
      this.input = new InputHandler(
        this.canvas,
        this.sceneManager.camera,
        this.terrariumManager,
        this.ui
      );
    });

    this._load();
    this.ui.hideLoading();
  }

  start() {
    this._running = true;
    this._lastTime = performance.now();
    this._loop();
  }

  stop() {
    this._running = false;
    if (this._animId) cancelAnimationFrame(this._animId);
  }

  _loop() {
    if (!this._running) return;
    this._animId = requestAnimationFrame(this._loop.bind(this));

    const now = performance.now();
    const realDelta = Math.min(now - this._lastTime, 100); // cap at 100ms
    this._lastTime = now;
    this._time += realDelta / 1000;

    const ticks = this.timeManager.tick(realDelta);

    // Game logic ticks
    if (ticks.growth) {
      this.terrariumManager.growAll(5); // 5% growth per tick
    }

    if (ticks.care) {
      this.terrariumManager.evaluateCareAll();
    }

    if (ticks.env) {
      // Pass scaled delta (already accounts for speed) to decay
      this.terrariumManager.decayAll(ticks.scaledDelta);
    }

    if (ticks.save) {
      this._save();
    }

    // Neglect processing every frame (tiny increment)
    this.terrariumManager.processNeglectAll(realDelta);

    // Visual updates
    this.terrariumManager.setTopoLinesVisible(this.ui.getActiveTool() === 'sculpt');
    this.terrariumManager.update();         // camera lerp
    this.terrariumManager.updateBillboards(); // face-camera
    this.weather.update(this._time);        // sky animation
    this.room.update(this._time);           // curtains + window texture dirty
    this.sceneManager.setTerrariumLightX(this.sceneManager.camera.position.x); // spot follows active
    this.particles.update(this._time, this.timeManager.speedMultiplier); // dust motes
    this.ui.updateHUD();                    // overlay HUD

    // Render
    this.sceneManager.render();
  }

  _save() {
    try {
      const data = {
        version: SAVE_VERSION,
        ...this.terrariumManager.getState(),
        ...this.timeManager.getState()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  _load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) return;

      this.timeManager.loadState({ gameTime: data.gameTime, speedMultiplier: data.speedMultiplier });
      this.terrariumManager.loadState(data, this.sceneManager.camera);
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  // Public save trigger (for manual save)
  save() { this._save(); }
}
