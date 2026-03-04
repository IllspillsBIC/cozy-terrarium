// terrarium.js — Individual terrarium: glass box, plants, env

import * as THREE from 'three';
import { Plant, PLANT_TYPES } from './plant.js';
import { Substrate, SUB_W, SUB_D, SUB_SURFACE_Y } from './substrate.js';
import { CareSystem } from './careSystem.js';
import { HardscapeItem, HARDSCAPE_TYPES } from './hardscape.js';

const GLASS_W = 5.175;
const GLASS_H = 4.025;
const GLASS_D = 3.45;
const GLASS_T = 0.06;

// Substrate top surface approximate Y (matches substrate.js SUB_BASE_Y + SUB_BASE_H)
const SUBSTRATE_TOP_Y = -(GLASS_H / 2) + 0.65; // = -1.3625

// Placement grid
const PLACE_COLS = 20;
const PLACE_ROWS = 12;
const CELL_W = SUB_W / PLACE_COLS;  // ~0.2415
const CELL_D = SUB_D / PLACE_ROWS;  // ~0.2683
const GRID_Y  = SUB_SURFACE_Y + 0.025; // slightly above substrate surface

let _terrariumCounter = 1;

export class Terrarium {
  constructor(index, camera, options = {}) {
    this.index = index;
    this.camera = camera;
    this.name = options.name || `Terrarium ${_terrariumCounter++}`;
    this.group = new THREE.Group();
    this.group.position.x = index * 8;
    this.group.position.y = 0.7325; // sit base on desk surface (desk top y = -1.40)

    this.plants = [];
    this.hardscape = [];
    this._placementCounter = 0;
    this._occupiedCells = new Set(); // keys: "col,row"
    this._gridMesh = null;
    this.substrate = new Substrate(options.substrateType || 'tropical');
    this.careSystem = new CareSystem();

    this.env = {
      humidity:     options.humidity     ?? 60,
      temperature:  options.temperature  ?? 22,
      soilMoisture: options.soilMoisture ?? 70,
      lightLevel:   80
    };

    this._plantsGroup = new THREE.Group();
    this._hardscapeGroup = new THREE.Group();
    this._substrateGroup = new THREE.Group();

    this._buildGlass();
    this._buildFrame();
    this._buildSubstrate();
    this._buildPlacementGrid();
    this.group.add(this._hardscapeGroup);
    this.group.add(this._plantsGroup);
  }

  // ── Glass panels ──────────────────────────────────────────────────────────

  _buildGlass() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaddcc,
      transparent: true,
      opacity: 0.15,
      roughness: 0.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const opaqueMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.9
    });

    // Back wall
    const back = this._makePanel(GLASS_W, GLASS_H, GLASS_T, glassMat);
    back.position.set(0, 0, -GLASS_D / 2);
    this.group.add(back);

    // Left wall
    const left = this._makePanel(GLASS_T, GLASS_H, GLASS_D, glassMat);
    left.position.set(-GLASS_W / 2, 0, 0);
    this.group.add(left);

    // Right wall
    const right = this._makePanel(GLASS_T, GLASS_H, GLASS_D, glassMat);
    right.position.set(GLASS_W / 2, 0, 0);
    this.group.add(right);

    // Top panel (open lid kept semi-transparent so light goes through)
    const top = this._makePanel(GLASS_W, GLASS_T, GLASS_D, glassMat);
    top.position.set(0, GLASS_H / 2, 0);
    this.group.add(top);

    // Opaque bottom base
    const bottom = this._makePanel(GLASS_W + 0.1, GLASS_T * 4, GLASS_D + 0.1, opaqueMat);
    bottom.position.set(0, -GLASS_H / 2, 0);
    bottom.receiveShadow = true;
    this.group.add(bottom);
  }

  _makePanel(w, h, d, mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  // ── Frame ─────────────────────────────────────────────────────────────────

  _buildFrame() {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a, roughness: 0.8, metalness: 0.1
    });
    const t = 0.09;
    const hw = GLASS_W / 2, hh = GLASS_H / 2, hd = GLASS_D / 2;

    const edges = [
      // 4 vertical pillars
      { s: [t, GLASS_H + t, t], p: [-hw, 0, -hd] },
      { s: [t, GLASS_H + t, t], p: [ hw, 0, -hd] },
      { s: [t, GLASS_H + t, t], p: [-hw, 0,  hd] },
      { s: [t, GLASS_H + t, t], p: [ hw, 0,  hd] },
      // top horizontal rails
      { s: [GLASS_W + t, t, t], p: [0,  hh, -hd] },
      { s: [GLASS_W + t, t, t], p: [0,  hh,  hd] },
      { s: [t, t, GLASS_D + t], p: [-hw, hh,  0] },
      { s: [t, t, GLASS_D + t], p: [ hw, hh,  0] },
      // bottom horizontal rails
      { s: [GLASS_W + t, t, t], p: [0, -hh, -hd] },
      { s: [GLASS_W + t, t, t], p: [0, -hh,  hd] },
      { s: [t, t, GLASS_D + t], p: [-hw, -hh, 0] },
      { s: [t, t, GLASS_D + t], p: [ hw, -hh, 0] },
    ];

    edges.forEach(({ s, p }) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...s), frameMat);
      mesh.position.set(...p);
      this.group.add(mesh);
    });
  }

  // ── Substrate ─────────────────────────────────────────────────────────────

  _buildSubstrate() {
    this.group.add(this._substrateGroup);
    const subGroup = this.substrate.build();
    this._substrateGroup.add(subGroup);
  }

  // ── Placement Grid ────────────────────────────────────────────────────────

  _buildPlacementGrid() {
    const verts = [];
    const hw = SUB_W / 2, hd = SUB_D / 2;
    const y = GRID_Y;
    for (let c = 0; c <= PLACE_COLS; c++) {
      const x = -hw + c * CELL_W;
      verts.push(x, y, -hd,  x, y, hd);
    }
    for (let r = 0; r <= PLACE_ROWS; r++) {
      const z = -hd + r * CELL_D;
      verts.push(-hw, y, z,  hw, y, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff, opacity: 0.20, transparent: true, depthWrite: false
    });
    this._gridMesh = new THREE.LineSegments(geo, mat);
    this._gridMesh.visible = false;
    this.group.add(this._gridMesh);
  }

  showPlacementGrid(v) { if (this._gridMesh) this._gridMesh.visible = v; }

  /** Convert local-space x/z (within terrarium group) to grid col/row. */
  hitToCell(lx, lz) {
    const col = Math.floor((lx + SUB_W / 2) / CELL_W);
    const row = Math.floor((lz + SUB_D / 2) / CELL_D);
    return {
      col: Math.max(0, Math.min(PLACE_COLS - 1, col)),
      row: Math.max(0, Math.min(PLACE_ROWS - 1, row))
    };
  }

  /** Convert grid cell to normalized 0..1 position. */
  cellToNorm(col, row) {
    return {
      nx: (col + 0.5) / PLACE_COLS,
      nz: (row + 0.5) / PLACE_ROWS
    };
  }

  isCellFree(col, row) { return !this._occupiedCells.has(`${col},${row}`); }

  _occupyCell(col, row) { this._occupiedCells.add(`${col},${row}`); }
  _freeCell(col, row)   { this._occupiedCells.delete(`${col},${row}`); }

  // ── Plants ────────────────────────────────────────────────────────────────

  /**
   * Add a plant at normalised terrarium position.
   * @param {string} typeId - plant type id
   * @param {number} nx - 0..1 across width
   * @param {number} nz - 0..1 across depth
   * @param {number} variant - variant index
   * @param {number|null} col - grid column (computed from nx if null)
   * @param {number|null} row - grid row (computed from nz if null)
   */
  addPlant(typeId, nx, nz, variant = 0, col = null, row = null) {
    if (!PLANT_TYPES[typeId]) return null;

    // Snap to grid
    if (col === null || row === null) {
      const lx = (nx - 0.5) * SUB_W;
      const lz = (nz - 0.5) * SUB_D;
      const cell = this.hitToCell(lx, lz);
      col = cell.col; row = cell.row;
    }
    if (!this.isCellFree(col, row)) return null;
    const { nx: snx, nz: snz } = this.cellToNorm(col, row);

    const x = (snx - 0.5) * (GLASS_W - 0.6);
    const z = (snz - 0.5) * (GLASS_D - 0.5);

    const plant = new Plant(typeId, x, z, { variant, col, row, cellW: CELL_W, cellD: CELL_D });
    const mesh = plant.buildMesh(this.camera);

    const surfY = this.substrate.getSurfaceY(snx, snz);
    if (plant.type.flat) {
      mesh.position.set(x, surfY + 0.01, z);
    } else {
      const spriteHalfH = (0.5 + plant.getStageFloat() * 0.8) / 2;
      mesh.position.set(x, surfY + spriteHalfH, z);
    }
    mesh.renderOrder = ++this._placementCounter;

    this._plantsGroup.add(mesh);
    this.plants.push(plant);
    this._occupyCell(col, row);
    return plant;
  }

  removePlant(plant) {
    const idx = this.plants.indexOf(plant);
    if (idx < 0) return;
    this.plants.splice(idx, 1);
    if (plant.col !== null && plant.row !== null) this._freeCell(plant.col, plant.row);
    this._plantsGroup.remove(plant.mesh);
    this.careSystem.resolveAll(plant.id);
    plant.dispose();
  }

  // ── Hardscape ─────────────────────────────────────────────────────────────

  addHardscape(typeId, nx, nz, variant = 0, col = null, row = null) {
    if (!HARDSCAPE_TYPES[typeId]) return null;

    if (col === null || row === null) {
      const lx = (nx - 0.5) * SUB_W;
      const lz = (nz - 0.5) * SUB_D;
      const cell = this.hitToCell(lx, lz);
      col = cell.col; row = cell.row;
    }
    if (!this.isCellFree(col, row)) return null;
    const { nx: snx, nz: snz } = this.cellToNorm(col, row);

    const x = (snx - 0.5) * (GLASS_W - 0.6);
    const z = (snz - 0.5) * (GLASS_D - 0.5);

    const item = new HardscapeItem(typeId, x, z, { variant, col, row, cellW: CELL_W, cellD: CELL_D });
    const mesh = item.buildMesh();

    const surfY = this.substrate.getSurfaceY(snx, snz);
    if (item.type.flat) {
      mesh.position.set(x, surfY + 0.008, z);
    } else {
      mesh.position.set(x, surfY + 0.25, z);
    }
    mesh.renderOrder = ++this._placementCounter;

    this._hardscapeGroup.add(mesh);
    this.hardscape.push(item);
    this._occupyCell(col, row);
    return item;
  }

  removeHardscape(item) {
    const idx = this.hardscape.indexOf(item);
    if (idx < 0) return;
    this.hardscape.splice(idx, 1);
    if (item.col !== null && item.row !== null) this._freeCell(item.col, item.row);
    this._hardscapeGroup.remove(item.mesh);
    item.dispose();
  }

  // ── Environment actions ───────────────────────────────────────────────────

  water() {
    this.env.soilMoisture = Math.min(100, this.env.soilMoisture + 25);
    this.plants.forEach(p => {
      p.waterLevel = Math.min(100, p.waterLevel + 30);
      this.careSystem.resolve(p.id, 'NEEDS_WATER');
    });
  }

  mist() {
    this.env.humidity = Math.min(100, this.env.humidity + 20);
    this.plants.forEach(p => this.careSystem.resolve(p.id, 'NEEDS_HUMIDITY'));
  }

  waterPlant(plant) {
    plant.waterLevel = Math.min(100, plant.waterLevel + 40);
    this.env.soilMoisture = Math.min(100, this.env.soilMoisture + 10);
    this.careSystem.resolve(plant.id, 'NEEDS_WATER');
  }

  clipLeaf(plant) {
    this.careSystem.resolve(plant.id, 'DEAD_LEAF');
    plant.health = Math.min(100, plant.health + 5);
  }

  // ── Simulation ────────────────────────────────────────────────────────────

  decayEnvironment(scaledDelta) {
    const dtSec = scaledDelta / 1000;
    const drain = this.substrate.type.drainRate;
    this.env.humidity     = Math.max(0, this.env.humidity     - 0.4  * dtSec);
    this.env.soilMoisture = Math.max(0, this.env.soilMoisture - drain * dtSec * 60);
    this.plants.forEach(p => {
      p.waterLevel = Math.max(0, p.waterLevel - 0.2 * dtSec);
    });
  }

  growPlants(baseAmount) {
    this.plants.forEach(p => {
      if (p.health <= 0) return;
      const waterMod = p.waterLevel / 100;
      const humidMod = this.env.humidity >= p.type.minHumidity ? 1.0 : 0.4;
      p.grow(baseAmount * waterMod * humidMod);

      // Update plant mesh position to match growth scale
      if (p.mesh) {
        const normX = (p.x / (GLASS_W - 0.6)) + 0.5;
        const normZ = (p.z / (GLASS_D - 0.5)) + 0.5;
        const surfY = this.substrate.getSurfaceY(normX, normZ);
        if (p.type.flat) {
          p.mesh.position.y = surfY + 0.01;
        } else {
          const spriteHalfH = (0.5 + p.getStageFloat() * 0.8) / 2;
          p.mesh.position.y = surfY + spriteHalfH;
        }
      }
    });
  }

  updateBillboards() {
    this.plants.forEach(p => p.faceCamera(this.camera));
    this.hardscape.forEach(h => h.faceCamera(this.camera));
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  getState() {
    return {
      name: this.name,
      substrate: this.substrate.getState(),
      plants: this.plants.map(p => p.getState()),
      hardscape: this.hardscape.map(h => h.getState()),
      env: { ...this.env }
    };
  }

  loadState(state) {
    if (!state) return;
    this.name = state.name || this.name;
    if (state.env) Object.assign(this.env, state.env);

    if (state.substrate) this.substrate.loadState(state.substrate);

    if (Array.isArray(state.plants)) {
      state.plants.forEach(ps => {
        if (!PLANT_TYPES[ps.typeId]) return;
        const nx = (ps.x / (GLASS_W - 0.6)) + 0.5;
        const nz = (ps.z / (GLASS_D - 0.5)) + 0.5;
        const savedCol = ps.col ?? null;
        const savedRow = ps.row ?? null;
        const plant = this.addPlant(ps.typeId, nx, nz, ps.variant ?? 0, savedCol, savedRow);
        if (!plant) return;
        plant.growthProgress = ps.growthProgress ?? 0;
        plant.health         = ps.health         ?? 100;
        plant.waterLevel     = ps.waterLevel      ?? 70;
        plant.careState      = ps.careState       || 'HEALTHY';
        plant.id             = ps.id              || plant.id;
        plant.updateSprite();
      });
    }

    if (Array.isArray(state.hardscape)) {
      state.hardscape.forEach(hs => {
        if (!HARDSCAPE_TYPES[hs.typeId]) return;
        const nx = (hs.x / (GLASS_W - 0.6)) + 0.5;
        const nz = (hs.z / (GLASS_D - 0.5)) + 0.5;
        const savedCol = hs.col ?? null;
        const savedRow = hs.row ?? null;
        const item = this.addHardscape(hs.typeId, nx, nz, hs.variant ?? 0, savedCol, savedRow);
        if (item) item.id = hs.id;
      });
    }
  }

  dispose() {
    this.plants.forEach(p => p.dispose());
    this.hardscape.forEach(h => h.dispose());
    this.substrate.dispose();
  }
}
