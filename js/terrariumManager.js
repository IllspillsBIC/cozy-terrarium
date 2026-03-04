// terrariumManager.js — Array of terrariums, camera navigation

import * as THREE from 'three';
import { Terrarium } from './terrarium.js';

const SPACING      = 8;
const LERP_SPEED   = 0.08;
const LERP_THRESHOLD = 0.01;
const ORBIT_RADIUS = 7;
const CAM_HEIGHT   = 1.5;
const MAX_SWING    = Math.PI / 4; // 45 degrees

// Three fixed slots: 0 = left, 1 = center, 2 = right.
// Slot positions in world space: slot * SPACING.
const SLOT_COUNT = 3;

export class TerrariumManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    scene.add(this.group);

    this._slots = [null, null, null]; // indexed by slot 0/1/2
    this.activeIndex = 1;             // slot index of active terrarium
    this._targetX = SPACING;          // camera target center x = slot * SPACING
    this._currentX = SPACING;         // lerped camera center x
    this._targetOrbit = 0;            // target orbit angle (radians)
    this._currentOrbit = 0;           // lerped orbit angle
    this._transitioning = false;

    // First terrarium always goes in the center slot (1)
    this._addToSlot(1);
    this.camera.position.set(SPACING, CAM_HEIGHT, ORBIT_RADIUS);
    this.camera.lookAt(SPACING, 0.5, 0);
  }

  // ── Slot helpers ──────────────────────────────────────────────────────────

  /** All non-null terrariums in slot order. */
  get terrariums() {
    return this._slots.filter(Boolean);
  }

  /** The world-space X of the active terrarium center (for lights etc.). */
  get activeCenterX() { return this._targetX; }

  _addToSlot(slot, options = {}) {
    if (slot < 0 || slot >= SLOT_COUNT || this._slots[slot]) return null;
    // Pass slot as position index so group.position.x = slot * SPACING
    const t = new Terrarium(slot, this.camera, options);
    this._slots[slot] = t;
    this.group.add(t.group);
    return t;
  }

  /** Public: add the next terrarium — left first, then right. */
  addTerrarium() {
    if (!this._slots[0]) return this._addToSlot(0);
    if (!this._slots[2]) return this._addToSlot(2);
    return null;
  }

  /** Returns the slot index (0/1/2) of a given terrarium object. */
  getSlotOf(t) { return this._slots.indexOf(t); }

  getActive() { return this._slots[this.activeIndex]; }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateTo(slot) {
    if (slot < 0 || slot >= SLOT_COUNT) return false;
    if (!this._slots[slot]) return false;
    this.activeIndex = slot;
    this._targetX = slot * SPACING;
    this._targetOrbit = 0; // reset swing when changing terrarium
    this._transitioning = true;
    return true;
  }

  navigateLeft() {
    for (let i = this.activeIndex - 1; i >= 0; i--) {
      if (this._slots[i]) return this.navigateTo(i);
    }
    return false;
  }

  navigateRight() {
    for (let i = this.activeIndex + 1; i < SLOT_COUNT; i++) {
      if (this._slots[i]) return this.navigateTo(i);
    }
    return false;
  }

  canGoLeft() {
    for (let i = this.activeIndex - 1; i >= 0; i--) {
      if (this._slots[i]) return true;
    }
    return false;
  }

  canGoRight() {
    for (let i = this.activeIndex + 1; i < SLOT_COUNT; i++) {
      if (this._slots[i]) return true;
    }
    return false;
  }

  canAddMore() { return this._slots.some(s => s === null); }

  // ── Swing (Shift + Arrow) ─────────────────────────────────────────────────

  swingLeft()  { this._targetOrbit = Math.max(this._targetOrbit - MAX_SWING, -MAX_SWING); }
  swingRight() { this._targetOrbit = Math.min(this._targetOrbit + MAX_SWING,  MAX_SWING); }

  // ── Frame update ──────────────────────────────────────────────────────────

  update() {
    const cam = this.camera;

    // Lerp camera center X (terrarium navigation)
    const dx = this._targetX - this._currentX;
    if (Math.abs(dx) > LERP_THRESHOLD) {
      this._currentX += dx * LERP_SPEED;
      this._transitioning = true;
    } else if (this._transitioning) {
      this._currentX = this._targetX;
      this._transitioning = false;
    }

    // Lerp orbit angle (swing view)
    const da = this._targetOrbit - this._currentOrbit;
    if (Math.abs(da) > 0.001) {
      this._currentOrbit += da * LERP_SPEED;
    } else {
      this._currentOrbit = this._targetOrbit;
    }

    // Apply combined position — orbit around the active terrarium center
    cam.position.set(
      this._currentX + Math.sin(this._currentOrbit) * ORBIT_RADIUS,
      CAM_HEIGHT,
      Math.cos(this._currentOrbit) * ORBIT_RADIUS
    );
    cam.lookAt(this._currentX, 0.5, 0);
  }

  isTransitioning() { return this._transitioning; }

  // ── Bulk updates ──────────────────────────────────────────────────────────

  updateBillboards()         { this.terrariums.forEach(t => t.updateBillboards()); }
  growAll(amount)            { this.terrariums.forEach(t => t.growPlants(amount)); }
  decayAll(scaledDelta)      { this.terrariums.forEach(t => t.decayEnvironment(scaledDelta)); }
  evaluateCareAll()          { this.terrariums.forEach(t => t.careSystem.evaluate(t.plants, t.env)); }
  processNeglectAll(delta)   { this.terrariums.forEach(t => t.careSystem.processNeglect(t.plants, delta)); }
  setTopoLinesVisible(v)     { this.terrariums.forEach(t => t.substrate.showTopoLines(v)); }
  setPlacementGridVisible(v) { this.terrariums.forEach(t => t.showPlacementGrid(v)); }

  // ── Persistence ───────────────────────────────────────────────────────────

  getState() {
    return {
      activeIndex: this.activeIndex,
      terrariums: this._slots
        .map((t, slot) => t ? { slot, ...t.getState() } : null)
        .filter(Boolean)
    };
  }

  loadState(state, camera) {
    // Clear all slots
    this._slots.forEach(t => { if (t) { this.group.remove(t.group); t.dispose(); } });
    this._slots = [null, null, null];

    (state.terrariums || []).forEach(ts => {
      const slot = ts.slot ?? 1;
      const t = this._addToSlot(slot, { name: ts.name });
      if (t) t.loadState(ts, camera);
    });

    if (this.terrariums.length === 0) this._addToSlot(1);

    const savedActive = state.activeIndex ?? 1;
    this.activeIndex = this._slots[savedActive] ? savedActive : this._slots.findIndex(Boolean);
    this._targetX = this.activeIndex * SPACING;
    this._currentX = this._targetX;
    this._targetOrbit = 0;
    this._currentOrbit = 0;
    this.camera.position.set(this._targetX, CAM_HEIGHT, ORBIT_RADIUS);
    this.camera.lookAt(this._targetX, 0.5, 0);
  }
}
