// substrate.js — Substrate layers, sculpting, CanvasTexture

import * as THREE from 'three';

export const SUBSTRATE_TYPES = {
  tropical: {
    id: 'tropical', name: 'Tropical Soil', color: '#7a5030',
    darkColor: '#4e2e18',
    moistureRetention: 0.9, drainRate: 0.02
  },
  sand: {
    id: 'sand', name: 'Desert Sand', color: '#d4b078',
    darkColor: '#a88040',
    moistureRetention: 0.2, drainRate: 0.08
  },
  gravel: {
    id: 'gravel', name: 'Gravel', color: '#8a8878',
    darkColor: '#5a5850',
    moistureRetention: 0.1, drainRate: 0.12
  },
  moss_sub: {
    id: 'moss_sub', name: 'Sphagnum Moss', color: '#4a7828',
    darkColor: '#2a4e10',
    moistureRetention: 0.95, drainRate: 0.01
  },
  coco: {
    id: 'coco', name: 'Coco Coir', color: '#8a5030',
    darkColor: '#5a2e10',
    moistureRetention: 0.85, drainRate: 0.025
  }
};

export const SUBSTRATE_LIST = Object.values(SUBSTRATE_TYPES);

const GRID_W = 20;
const GRID_D = 8;

export const SUB_W      = 4.83;
export const SUB_D      = 3.22;
const SUB_BASE_Y = -2.0125;
export const SUB_SURFACE_Y = -1.3625; // substrate top surface Y in terrarium local space
const SUB_BASE_H = 0.65;
const SLOPE_FRONT_H = SUB_BASE_H * 0.10;  // 0.065 — very thin front edge
const SLOPE_REAR_H  = SUB_BASE_H * 1.30;  // 0.845 — tall rear edge

// Height range used for topo normalisation
const TOPO_MIN_H = SLOPE_FRONT_H;
const TOPO_MAX_H = SLOPE_REAR_H + 0.35;

export class Substrate {
  constructor(typeId = 'tropical') {
    this.typeId = typeId;
    this.type = SUBSTRATE_TYPES[typeId] || SUBSTRATE_TYPES.tropical;
    this.heightMap = new Float32Array(GRID_W * GRID_D).fill(0.0);
    this.mesh = null;
    this._canvas = null;
    this._ctx = null;
    this._texture = null;
    // Side curtain meshes (fill substrate volume seen through glass)
    this._leftSide  = null;
    this._rightSide = null;
    this._backSide  = null;
    this._frontSide = null;
    this._sideMat   = null;
    // Topographic overlay
    this._topoCanvas  = null;
    this._topoCtx     = null;
    this._topoTexture = null;
    this._topoMesh    = null;
  }

  changeType(typeId) {
    this.typeId = typeId;
    this.type = SUBSTRATE_TYPES[typeId] || SUBSTRATE_TYPES.tropical;
    this._updateTexture();
    if (this._sideMat) {
      const old = this._sideMat.map;
      this._sideMat.map = this._makeProfileTex();
      this._sideMat.needsUpdate = true;
      old?.dispose();
    }
  }

  build() {
    // ── Top-surface texture ────────────────────────────────────────────────
    this._canvas = document.createElement('canvas');
    this._canvas.width  = 256;
    this._canvas.height = 128;
    this._ctx = this._canvas.getContext('2d');
    this._updateTexture();

    // ── Topo canvas ────────────────────────────────────────────────────────
    this._topoCanvas = document.createElement('canvas');
    this._topoCanvas.width  = 256;
    this._topoCanvas.height = 128;
    this._topoCtx = this._topoCanvas.getContext('2d');
    this._topoTexture = new THREE.CanvasTexture(this._topoCanvas);
    this._topoTexture.magFilter = THREE.LinearFilter;
    this._topoTexture.minFilter = THREE.LinearFilter;

    const group = new THREE.Group();

    // ── Top surface ────────────────────────────────────────────────────────
    const topGeo = new THREE.PlaneGeometry(SUB_W, SUB_D, GRID_W - 1, GRID_D - 1);
    topGeo.rotateX(-Math.PI / 2);
    const topMat = new THREE.MeshStandardMaterial({
      map: this._texture, roughness: 1.0, metalness: 0.0
    });
    this.mesh = new THREE.Mesh(topGeo, topMat);
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, SUB_BASE_Y, 0);
    this._applyHeightMap();
    group.add(this.mesh);

    // ── Topo overlay (shares same geometry object as top surface) ──────────
    const topoMat = new THREE.MeshBasicMaterial({
      map: this._topoTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this._topoMesh = new THREE.Mesh(topGeo, topoMat);
    this._topoMesh.position.set(0, SUB_BASE_Y, 0);
    this._topoMesh.visible = false;
    this._topoMesh.renderOrder = 1;
    group.add(this._topoMesh);

    // ── Side curtain material (shared by all four curtains) ────────────────
    this._sideMat = new THREE.MeshStandardMaterial({
      map: this._makeProfileTex(),
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0
    });

    // ── Build all four side curtains ───────────────────────────────────────
    this._leftSide  = this._buildSide('left');
    this._rightSide = this._buildSide('right');
    this._backSide  = this._buildSide('back');
    this._frontSide = this._buildSide('front');

    group.add(this._leftSide);
    group.add(this._rightSide);
    group.add(this._backSide);
    group.add(this._frontSide);

    return group;
  }

  // ── Side curtain construction ─────────────────────────────────────────────

  _buildSide(which) {
    const mesh = new THREE.Mesh(this._buildSideGeo(which), this._sideMat);
    mesh.position.set(0, SUB_BASE_Y, 0);
    return mesh;
  }

  _buildSideGeo(which) {
    let count, getPos, getTopY;

    if (which === 'left' || which === 'right') {
      // Spans GRID_D rows along Z (back → front)
      count = GRID_D;
      const col  = which === 'left' ? 0 : GRID_W - 1;
      const xPos = which === 'left' ? -SUB_W / 2 : SUB_W / 2;
      getPos  = i => ({ x: xPos, z: -SUB_D / 2 + (i / (GRID_D - 1)) * SUB_D });
      getTopY = i => {
        const t = i / (GRID_D - 1);
        return SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t +
               this.heightMap[i * GRID_W + col] * 0.35;
      };
    } else {
      // 'back' or 'front': spans GRID_W cols along X (left → right)
      count = GRID_W;
      const row  = which === 'back' ? 0 : GRID_D - 1;
      const zPos = which === 'back' ? -SUB_D / 2 : SUB_D / 2;
      const t = row / (GRID_D - 1);
      const base = SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t;
      getPos  = i => ({ x: -SUB_W / 2 + (i / (GRID_W - 1)) * SUB_W, z: zPos });
      getTopY = i => base + this.heightMap[row * GRID_W + i] * 0.35;
    }

    const verts = count * 2; // bottom + top per column
    const pos = new Float32Array(verts * 3);
    const nrm = new Float32Array(verts * 3);
    const uv  = new Float32Array(verts * 2);
    const idx = [];

    for (let i = 0; i < count; i++) {
      const p = getPos(i);
      const topY = getTopY(i);
      const u = i / (count - 1);
      const bi = i * 2, ti = i * 2 + 1;

      // Bottom vertex (y = 0 in local space = SUB_BASE_Y world)
      pos[bi * 3]     = p.x;  pos[bi * 3 + 1] = 0;    pos[bi * 3 + 2] = p.z;
      nrm[bi * 3 + 1] = 0;
      uv[bi * 2]      = u;    uv[bi * 2 + 1]  = 0;

      // Top vertex
      pos[ti * 3]     = p.x;  pos[ti * 3 + 1] = topY; pos[ti * 3 + 2] = p.z;
      nrm[ti * 3 + 1] = 0;
      uv[ti * 2]      = u;    uv[ti * 2 + 1]  = 1;

      if (i < count - 1) {
        const b0 = i * 2, t0 = i * 2 + 1, b1 = (i + 1) * 2, t1 = (i + 1) * 2 + 1;
        // DoubleSide material — winding order is cosmetic but kept consistent
        idx.push(b0, b1, t1, b0, t1, t0);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(nrm, 3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(uv,  2));
    geo.setIndex(idx);
    return geo;
  }

  // ── Update side curtain top vertices to match height map ─────────────────

  _updateSideMeshes() {
    if (!this._leftSide) return;

    // Left side: col = 0
    this._updateSideTop(this._leftSide.geometry, GRID_D, i => {
      const t = i / (GRID_D - 1);
      return SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t +
             this.heightMap[i * GRID_W] * 0.35;
    });

    // Right side: col = GRID_W - 1
    this._updateSideTop(this._rightSide.geometry, GRID_D, i => {
      const t = i / (GRID_D - 1);
      return SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t +
             this.heightMap[i * GRID_W + (GRID_W - 1)] * 0.35;
    });

    // Back side: row = 0
    this._updateSideTop(this._backSide.geometry, GRID_W, i =>
      SLOPE_REAR_H + this.heightMap[i] * 0.35
    );

    // Front side: row = GRID_D - 1
    this._updateSideTop(this._frontSide.geometry, GRID_W, i =>
      SLOPE_FRONT_H + this.heightMap[(GRID_D - 1) * GRID_W + i] * 0.35
    );
  }

  _updateSideTop(geo, count, getTopY) {
    const pos = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.setY(i * 2 + 1, getTopY(i)); // odd indices are top vertices
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // ── Profile texture for side curtains ─────────────────────────────────────

  _makeProfileTex() {
    const canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const col  = this.type.color;
    const dark = this.type.darkColor;
    const r0 = parseInt(col.slice(1, 3), 16);
    const g0 = parseInt(col.slice(3, 5), 16);
    const b0 = parseInt(col.slice(5, 7), 16);

    // Vertical gradient: dark at bottom → main color → lighter at top
    const grad = ctx.createLinearGradient(0, 64, 0, 0);
    grad.addColorStop(0,   dark);
    grad.addColorStop(0.4, col);
    grad.addColorStop(1,   this._lighten(col, 20));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 64);

    // Noise speckles
    for (let i = 0; i < 200; i++) {
      const nx = Math.random() * 256;
      const ny = Math.random() * 64;
      const bright = (Math.random() - 0.5) * 28;
      ctx.fillStyle = `rgb(${clamp(r0+bright)},${clamp(g0+bright)},${clamp(b0+bright)})`;
      ctx.fillRect(nx, ny, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _lighten(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }

  // ── Top-surface texture ───────────────────────────────────────────────────

  _updateTexture() {
    if (!this._ctx) return;
    const ctx = this._ctx;
    const w = 256, h = 128;
    ctx.clearRect(0, 0, w, h);

    const col = this.type.color;
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, h);

    const r = parseInt(col.slice(1, 3), 16);
    const g = parseInt(col.slice(3, 5), 16);
    const b = parseInt(col.slice(5, 7), 16);
    for (let i = 0; i < 300; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const bright = (Math.random() - 0.5) * 30;
      ctx.fillStyle = `rgb(${clamp(r+bright)},${clamp(g+bright)},${clamp(b+bright)})`;
      ctx.fillRect(nx, ny, 2, 2);
    }
    ctx.fillStyle = `rgba(${r + 30},${g + 30},${b + 30},0.4)`;
    ctx.fillRect(0, 0, w, 3);

    if (this._texture) {
      this._texture.needsUpdate = true;
    } else {
      this._texture = new THREE.CanvasTexture(this._canvas);
      this._texture.magFilter = THREE.NearestFilter;
      this._texture.minFilter = THREE.NearestFilter;
    }
  }

  // ── Topographic overlay ───────────────────────────────────────────────────

  showTopoLines(visible) {
    if (!this._topoMesh) return;
    this._topoMesh.visible = visible;
    if (visible) this._updateTopoTexture();
  }

  _updateTopoTexture() {
    if (!this._topoCtx) return;
    const ctx = this._topoCtx;
    const W = 256, H = 128;
    const imgData = ctx.createImageData(W, H);
    const d = imgData.data;

    // Sample normalised total height at every pixel
    const hPx = new Float32Array(W * H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        hPx[py * W + px] = this._sampleNormH(
          px / (W - 1) * (GRID_W - 1),
          py / (H - 1) * (GRID_D - 1)
        );
      }
    }

    // Contour lines: detect zero-crossings for each iso-level
    const levels = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (const level of levels) {
      const isMajor = (Math.round(level * 10) % 2 === 0);
      const alpha = isMajor ? 230 : 160;
      for (let py = 0; py < H - 1; py++) {
        for (let px = 0; px < W - 1; px++) {
          const h  = hPx[py * W + px];
          const hr = hPx[py * W + px + 1];
          const hd = hPx[(py + 1) * W + px];
          if ((h - level) * (hr - level) < 0 || (h - level) * (hd - level) < 0) {
            const i4 = (py * W + px) * 4;
            d[i4]     = 255;
            d[i4 + 1] = 255;
            d[i4 + 2] = 200;
            d[i4 + 3] = alpha;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    if (this._topoTexture) this._topoTexture.needsUpdate = true;
  }

  // Bilinear sample of total surface height, normalised to 0-1
  _sampleNormH(gx, gy) {
    const gx0 = Math.min(GRID_W - 2, Math.floor(Math.max(0, gx)));
    const gy0 = Math.min(GRID_D - 2, Math.floor(Math.max(0, gy)));
    const gx1 = gx0 + 1, gy1 = gy0 + 1;
    const fx = gx - gx0, fy = gy - gy0;

    const h = (r, c) => {
      const t = r / (GRID_D - 1);
      return SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t +
             this.heightMap[r * GRID_W + c] * 0.35;
    };

    const val = h(gy0, gx0) * (1 - fx) * (1 - fy) +
                h(gy0, gx1) * fx       * (1 - fy) +
                h(gy1, gx0) * (1 - fx) * fy       +
                h(gy1, gx1) * fx       * fy;

    return (val - TOPO_MIN_H) / (TOPO_MAX_H - TOPO_MIN_H);
  }

  // ── Height map ────────────────────────────────────────────────────────────

  _applyHeightMap() {
    if (!this.mesh) return;
    const pos = this.mesh.geometry.attributes.position;
    for (let row = 0; row < GRID_D; row++) {
      const t = row / (GRID_D - 1);
      const baseH = SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t;
      for (let col = 0; col < GRID_W; col++) {
        const vIdx = row * GRID_W + col;
        pos.setY(vIdx, baseH + this.heightMap[vIdx] * 0.35);
      }
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this._updateSideMeshes();
    if (this._topoMesh?.visible) this._updateTopoTexture();
  }

  getSurfaceY(normX, normZ = 0.5) {
    const col = Math.round(Math.max(0, Math.min(1, normX)) * (GRID_W - 1));
    const row = Math.round(Math.max(0, Math.min(1, normZ)) * (GRID_D - 1));
    const t = row / (GRID_D - 1);
    const baseH = SLOPE_REAR_H + (SLOPE_FRONT_H - SLOPE_REAR_H) * t;
    return SUB_BASE_Y + baseH + this.heightMap[row * GRID_W + col] * 0.35;
  }

  sculpt(normX, normZ, dir) {
    const colF = normX * (GRID_W - 1);
    const rowF = normZ * (GRID_D - 1);
    const radius = 1.5;   // finer brush (was 2.5)
    for (let row = 0; row < GRID_D; row++) {
      for (let col = 0; col < GRID_W; col++) {
        const dist = Math.sqrt((col - colF) ** 2 + (row - rowF) ** 2);
        if (dist < radius) {
          const idx = row * GRID_W + col;
          this.heightMap[idx] = Math.max(0, Math.min(1,
            this.heightMap[idx] + dir * (1 - dist / radius) * 0.025  // finer step (was 0.08)
          ));
        }
      }
    }
    this._applyHeightMap();
    this._updateTexture();
  }

  sculptAtPoint(localX, localZ, dir) {
    const normX = (localX + SUB_W / 2) / SUB_W;
    const normZ = (localZ + SUB_D / 2) / SUB_D;
    this.sculpt(normX, normZ, dir);
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  getState() {
    return { typeId: this.typeId, heightMap: Array.from(this.heightMap) };
  }

  loadState(state) {
    if (!state) return;
    this.typeId = state.typeId || 'tropical';
    this.type = SUBSTRATE_TYPES[this.typeId] || SUBSTRATE_TYPES.tropical;
    if (state.heightMap) {
      const expected = GRID_W * GRID_D;
      const arr = new Float32Array(expected).fill(0);
      for (let i = 0; i < Math.min(state.heightMap.length, expected); i++) {
        arr[i] = state.heightMap[i];
      }
      this.heightMap = arr;
    }
    this._applyHeightMap();
    this._updateTexture();
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose(); // also disposes _topoMesh geometry (shared)
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
    }
    [this._leftSide, this._rightSide, this._backSide, this._frontSide].forEach(m => {
      m?.geometry.dispose();
    });
    this._sideMat?.map?.dispose();
    this._sideMat?.dispose();
    if (this._topoMesh) {
      // geometry already disposed above; just dispose the material
      this._topoMesh.material.map?.dispose();
      this._topoMesh.material.dispose();
    }
    this._texture?.dispose();
    this._topoTexture?.dispose();
  }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
