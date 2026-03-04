// hardscape.js — Hardscape items: rocks, sticks, crystals, driftwood, etc.

import * as THREE from 'three';

export const HARDSCAPE_TYPES = {
  rock: {
    id: 'rock', name: 'Rock', emoji: '🪨',
    palette:    ['#6e6e6e', '#949494', '#b8b8b8', '#2e2e2e', '#d8d8d8'],
    altPalette: ['#8a4e2e', '#b87050', '#d89870', '#3e1a08', '#f0c090'],
    description: 'Smooth rounded granite rock'
  },
  flat_stone: {
    id: 'flat_stone', name: 'Flat Stone', emoji: '🪨',
    palette:    ['#56606a', '#788090', '#9ab0bc', '#242e38', '#c0d4dc'],
    altPalette: ['#786050', '#a08070', '#c8a890', '#382a20', '#e8d0b8'],
    description: 'Flat slate flagstone'
  },
  pebbles: {
    id: 'pebbles', name: 'Pebbles', emoji: '🪨',
    palette:    ['#807060', '#a09080', '#c0b0a0', '#403020', '#dcd0c4'],
    altPalette: ['#507080', '#7090a0', '#90b0bc', '#202e38', '#b0d0dc'],
    description: 'Cluster of smooth pebbles'
  },
  driftwood: {
    id: 'driftwood', name: 'Driftwood', emoji: '🪵',
    palette:    ['#6e4e2c', '#9a6e3c', '#c2924e', '#30200c', '#e0b870'],
    altPalette: ['#3a2818', '#5a4028', '#7a5838', '#180c04', '#9a7848'],
    description: 'Weathered piece of driftwood'
  },
  stick: {
    id: 'stick', name: 'Stick', emoji: '🌿',
    palette:    ['#5a3e1e', '#80582e', '#a87840', '#281808', '#c89e60'],
    altPalette: ['#3a1e0e', '#60301c', '#80482a', '#140806', '#a06040'],
    description: 'Natural twig or branch'
  },
  crystal: {
    id: 'crystal', name: 'Crystal', emoji: '💎',
    palette:    ['#3a3890', '#6060b8', '#8888d8', '#18184a', '#ccccff'],
    altPalette: ['#206040', '#308050', '#50a870', '#0a2818', '#80e090'],
    description: 'Amethyst crystal cluster'
  },
  mossy_rock: {
    id: 'mossy_rock', name: 'Mossy Rock', emoji: '🪨',
    palette:    ['#6e6e6e', '#949494', '#b8b8b8', '#2e2e2e', '#d8d8d8'],
    altPalette: ['#8a5820', '#b07a30', '#d8a050', '#3a2008', '#f0c070'],
    description: 'Rock blanketed in green moss'
  },
  cork_bark: {
    id: 'cork_bark', name: 'Cork Bark', emoji: '🪵',
    palette:    ['#8a6038', '#b08050', '#d0a870', '#3a2010', '#e8c888'],
    altPalette: ['#5e3820', '#8a5530', '#b07848', '#28140a', '#d89860'],
    description: 'Curved piece of cork bark'
  }
};

export const HARDSCAPE_TYPE_LIST = Object.values(HARDSCAPE_TYPES);

// Canvas 128×96 px — logical grid 64×48, 2×2 blocks
const HARDSCAPE_W = 128;
const HARDSCAPE_H = 96;

function makeCanvas(w, h) {
  const c = new OffscreenCanvas(w, h);
  return { canvas: c, ctx: c.getContext('2d') };
}

function b(ctx, gx, gy, color) {
  if (gx < 0 || gx > 63 || gy < 0 || gy > 47) return;
  ctx.fillStyle = color;
  ctx.fillRect(gx * 2, gy * 2, 2, 2);
}

const spriteDrawers = {

  // ── ROCK — large rounded granite boulder ───────────────────────────────
  rock(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 32, cy = 30, rx = 20, ry = 16;

    // Outline ring
    for (let gx = cx - rx - 1; gx <= cx + rx + 1; gx++) {
      for (let gy = cy - ry - 1; gy <= cy + ry + 1; gy++) {
        const dx = gx - cx, dy = gy - cy;
        const outer = dx * dx / (rx + 1) ** 2 + dy * dy / (ry + 1) ** 2;
        const inner = dx * dx / rx ** 2 + dy * dy / ry ** 2;
        if (outer <= 1 && inner > 1) b(ctx, gx, gy, ol);
      }
    }

    // Fill with 3-tone directional shading
    for (let gx = cx - rx; gx <= cx + rx; gx++) {
      for (let gy = cy - ry; gy <= cy + ry; gy++) {
        const dx = gx - cx, dy = gy - cy;
        if (dx * dx / rx ** 2 + dy * dy / ry ** 2 > 1) continue;
        const isHi = dx < -rx * 0.2 && dy < -ry * 0.2;
        const isSh = dx > rx * 0.25 && dy > ry * 0.2;
        b(ctx, gx, gy, isHi ? hi : isSh ? sh : mid);
      }
    }

    // Diagonal crack
    for (let i = 0; i < 10; i++) {
      b(ctx, cx - 6 + i, cy - 4 + Math.floor(i * 0.7), ol);
      b(ctx, cx - 5 + i, cy - 4 + Math.floor(i * 0.7), sh);
    }
    // Small chip
    b(ctx, cx + 12, cy - 2, ol); b(ctx, cx + 13, cy - 1, sh);

    // Specular highlight
    b(ctx, cx - 10, cy - 8, br); b(ctx, cx - 8, cy - 9, br);
    b(ctx, cx - 12, cy - 6, hi);
  },

  // ── FLAT STONE — wide slate flagstone ─────────────────────────────────
  flat_stone(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 32, cy = 38, rx = 26, ry = 7;

    for (let gx = cx - rx - 1; gx <= cx + rx + 1; gx++) {
      for (let gy = cy - ry - 1; gy <= cy + ry + 1; gy++) {
        const dx = gx - cx, dy = gy - cy;
        const outer = dx * dx / (rx + 1) ** 2 + dy * dy / (ry + 1) ** 2;
        const inner = dx * dx / rx ** 2 + dy * dy / ry ** 2;
        if (outer <= 1 && inner > 1) b(ctx, gx, gy, ol);
      }
    }

    for (let gx = cx - rx; gx <= cx + rx; gx++) {
      for (let gy = cy - ry; gy <= cy + ry; gy++) {
        const dx = gx - cx, dy = gy - cy;
        if (dx * dx / rx ** 2 + dy * dy / ry ** 2 > 1) continue;
        b(ctx, gx, gy, dy < -ry * 0.3 ? hi : dy > ry * 0.4 ? sh : mid);
      }
    }

    // Surface cracks
    for (let i = 0; i < 8; i++) b(ctx, cx - 10 + i, cy - 1, ol);
    for (let i = 0; i < 5; i++) b(ctx, cx + 8 + i, cy + 1, sh);
    // Specular glints
    b(ctx, cx - 18, cy - 4, br); b(ctx, cx - 16, cy - 5, br);
    b(ctx, cx + 10, cy - 3, br);
  },

  // ── PEBBLES — cluster of four rounded stones ───────────────────────────
  pebbles(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const stones = [
      { cx: 20, cy: 37, rx: 7, ry: 5, col: mid },
      { cx: 30, cy: 35, rx: 9, ry: 6, col: sh  },
      { cx: 42, cy: 37, rx: 8, ry: 5, col: mid },
      { cx: 33, cy: 41, rx: 6, ry: 4, col: hi  },
    ];

    stones.forEach(({ cx, cy, rx, ry, col }) => {
      for (let gx = cx - rx - 1; gx <= cx + rx + 1; gx++) {
        for (let gy = cy - ry - 1; gy <= cy + ry + 1; gy++) {
          const dx = gx - cx, dy = gy - cy;
          const outer = dx * dx / (rx + 1) ** 2 + dy * dy / (ry + 1) ** 2;
          const inner = dx * dx / rx ** 2 + dy * dy / ry ** 2;
          if (outer <= 1 && inner > 1) b(ctx, gx, gy, ol);
        }
      }
      for (let gx = cx - rx; gx <= cx + rx; gx++) {
        for (let gy = cy - ry; gy <= cy + ry; gy++) {
          const dx = gx - cx, dy = gy - cy;
          if (dx * dx / rx ** 2 + dy * dy / ry ** 2 > 1) continue;
          b(ctx, gx, gy, dx < -rx * 0.3 && dy < -ry * 0.3 ? hi : col);
        }
      }
      b(ctx, cx - Math.floor(rx * 0.5), cy - Math.floor(ry * 0.5), br);
    });
  },

  // ── DRIFTWOOD — weathered curved branch ───────────────────────────────
  driftwood(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    for (let i = 0; i <= 56; i++) {
      const t = i / 56;
      const gx = 4 + i;
      const gy = 39 - Math.round(Math.sin(t * Math.PI) * 10 + Math.sin(t * Math.PI * 2.5) * 2.5);
      const hw = Math.round(1.5 + Math.sin(t * Math.PI) * 3.5);

      b(ctx, gx, gy - hw - 1, ol);
      b(ctx, gx, gy + hw + 1, ol);
      for (let dy = -hw; dy <= hw; dy++) {
        b(ctx, gx, gy + dy, dy < -hw * 0.2 ? hi : dy > hw * 0.5 ? sh : mid);
      }
      // Grain lines
      if (i % 5 === 2) b(ctx, gx, gy - hw + 1, sh);
      if (i % 9 === 4) b(ctx, gx, gy - hw + 2, sh);
    }
    // Knot
    b(ctx, 32, 27, ol); b(ctx, 33, 27, ol);
    b(ctx, 32, 28, sh); b(ctx, 33, 28, sh);
    // End grain
    b(ctx, 4, 40, br); b(ctx, 5, 39, hi);
    b(ctx, 59, 40, br); b(ctx, 60, 39, hi);
  },

  // ── STICK — thin upright twig with two branches ────────────────────────
  stick(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    // Main trunk
    for (let i = 0; i <= 38; i++) {
      const gy = 45 - i;
      const gx = 32 + Math.round(Math.sin(i * 0.15) * 1.5);
      b(ctx, gx - 1, gy, ol);
      b(ctx, gx,     gy, mid);
      b(ctx, gx + 1, gy, sh);
    }
    // Left branch
    for (let i = 0; i < 11; i++) {
      b(ctx, 31 - i, 22 - Math.floor(i * 0.6), ol);
      b(ctx, 31 - i, 23 - Math.floor(i * 0.6), mid);
    }
    // Right branch
    for (let i = 0; i < 9; i++) {
      b(ctx, 33 + i, 17 - Math.floor(i * 0.4), ol);
      b(ctx, 33 + i, 18 - Math.floor(i * 0.4), mid);
    }
    // Tips
    b(ctx, 20, 16, br); b(ctx, 21, 16, br);
    b(ctx, 41, 14, br); b(ctx, 42, 14, br);
    b(ctx, 32, 7, br); b(ctx, 33, 7, br);
    // Bark ridges
    for (let i = 4; i < 36; i += 7) b(ctx, 32, 45 - i, sh);
  },

  // ── CRYSTAL — amethyst cluster ─────────────────────────────────────────
  crystal(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const crystals = [
      { cx: 24, base: 43, h: 22, hw: 4 },
      { cx: 38, base: 43, h: 18, hw: 3 },
      { cx: 16, base: 43, h: 14, hw: 3 },
      { cx: 45, base: 43, h: 11, hw: 2 },
      { cx: 31, base: 43, h: 32, hw: 6 }, // tallest, centred
    ];

    crystals.forEach(({ cx, base, h, hw }) => {
      const tipH = Math.floor(h * 0.32);
      const bodyTop = base - h + tipH;

      // Body
      for (let gy = bodyTop; gy <= base; gy++) {
        b(ctx, cx - hw - 1, gy, ol);
        b(ctx, cx + hw + 1, gy, ol);
        for (let dx = -hw; dx <= hw; dx++) {
          b(ctx, cx + dx, gy, dx < -hw * 0.3 ? sh : dx > hw * 0.3 ? hi : mid);
        }
        // Centre facet line
        if ((gy - bodyTop) % 3 === 0) b(ctx, cx, gy, br);
      }

      // Pointed tip
      for (let i = 0; i < tipH; i++) {
        const gy = base - h + i;
        const w = Math.round((i / tipH) * hw);
        b(ctx, cx - w - 1, gy, ol);
        b(ctx, cx + w + 1, gy, ol);
        for (let dx = -w; dx <= w; dx++) {
          b(ctx, cx + dx, gy, dx < 0 ? sh : dx > 0 ? hi : br);
        }
      }
    });

    // Rock base
    for (let gx = 11; gx <= 51; gx++) {
      b(ctx, gx, 43, '#606060');
      b(ctx, gx, 44, '#484848');
      b(ctx, gx, 45, '#383838');
    }
    b(ctx, 10, 44, ol); b(ctx, 52, 44, ol);
  },

  // ── MOSSY ROCK — granite boulder with moss patches ─────────────────────
  mossy_rock(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const msh = '#3a5a1a', mmid = '#508030', mhi = '#70b048', mol = '#1a2e08';
    const cx = 32, cy = 30, rx = 20, ry = 15;

    // Outline
    for (let gx = cx - rx - 1; gx <= cx + rx + 1; gx++) {
      for (let gy = cy - ry - 1; gy <= cy + ry + 1; gy++) {
        const dx = gx - cx, dy = gy - cy;
        const outer = dx * dx / (rx + 1) ** 2 + dy * dy / (ry + 1) ** 2;
        const inner = dx * dx / rx ** 2 + dy * dy / ry ** 2;
        if (outer <= 1 && inner > 1) b(ctx, gx, gy, ol);
      }
    }

    // Rock fill
    for (let gx = cx - rx; gx <= cx + rx; gx++) {
      for (let gy = cy - ry; gy <= cy + ry; gy++) {
        const dx = gx - cx, dy = gy - cy;
        if (dx * dx / rx ** 2 + dy * dy / ry ** 2 > 1) continue;
        b(ctx, gx, gy, dx < -rx * 0.2 && dy < -ry * 0.2 ? hi : dy > ry * 0.3 ? sh : mid);
      }
    }

    // Moss patches on upper surface
    for (let gx = cx - rx; gx <= cx + rx; gx++) {
      for (let gy = cy - ry; gy <= cy + 2; gy++) {
        const dx = gx - cx, dy = gy - cy;
        if (dx * dx / rx ** 2 + dy * dy / ry ** 2 > 1) continue;
        const noise = Math.sin(gx * 1.3 + 0.5) * Math.cos(gy * 1.7 + 0.3);
        if (noise > 0.18) {
          b(ctx, gx, gy, noise > 0.55 ? mhi : dy < -ry * 0.3 ? mmid : msh);
        }
      }
    }

    // Moss fringe at top edge
    for (let gx = cx - rx + 3; gx <= cx + rx - 3; gx++) {
      const gy = cy - Math.round(ry * Math.sqrt(Math.max(0, 1 - ((gx - cx) / rx) ** 2)));
      if (Math.sin(gx * 2.1) > 0.1) {
        b(ctx, gx, gy - 1, mol);
        b(ctx, gx, gy - 2, mhi);
      }
    }
  },

  // ── CORK BARK — curved piece with ridged texture ───────────────────────
  cork_bark(ctx, palette) {
    const [sh, mid, hi, ol, br] = palette;
    for (let gx = 5; gx <= 59; gx++) {
      const t = (gx - 5) / 54;
      const outerY = 16 - Math.round(Math.sin(t * Math.PI) * 11);
      const thickness = 5 + Math.round(Math.sin(t * Math.PI) * 5);
      const innerY = outerY + thickness;

      b(ctx, gx, outerY - 1, ol);
      b(ctx, gx, innerY + 1, ol);
      for (let gy = outerY; gy <= innerY; gy++) {
        const depth = (gy - outerY) / thickness;
        b(ctx, gx, gy, depth < 0.18 ? hi : depth > 0.7 ? sh : mid);
      }
      // Ridged grooves
      if ((gx % 4) === 1) {
        b(ctx, gx, outerY + 1, sh);
        if (thickness > 6) b(ctx, gx, outerY + 3, sh);
      }
    }
    // End grain
    for (let gy = 17; gy <= 22; gy++) {
      b(ctx, 4, gy, ol);  b(ctx, 5, gy, sh);
      b(ctx, 60, gy, ol); b(ctx, 59, gy, sh);
    }
    // Specular along ridge
    for (let gx = 10; gx <= 55; gx += 4) {
      const t = (gx - 5) / 54;
      const oy = 16 - Math.round(Math.sin(t * Math.PI) * 11);
      b(ctx, gx, oy, br);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HardscapeItem Class
// ─────────────────────────────────────────────────────────────────────────────
export class HardscapeItem {
  constructor(typeId, x, z, options = {}) {
    this.typeId = typeId;
    this.type = HARDSCAPE_TYPES[typeId];
    this.x = x;
    this.z = z;
    this.id = options.id || Math.random().toString(36).slice(2, 9);
    this.variant = options.variant ?? 0;
    this.mesh = null;
  }

  buildMesh() {
    const { canvas, ctx } = makeCanvas(HARDSCAPE_W, HARDSCAPE_H);
    ctx.clearRect(0, 0, HARDSCAPE_W, HARDSCAPE_H);

    const flipH  = (this.variant & 1) === 1;
    const useAlt = (this.variant & 2) === 2;
    const palette = useAlt ? this.type.altPalette : this.type.palette;

    if (flipH) { ctx.save(); ctx.translate(HARDSCAPE_W, 0); ctx.scale(-1, 1); }
    const drawer = spriteDrawers[this.typeId] || spriteDrawers.rock;
    drawer(ctx, palette);
    if (flipH) ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    const aspect = HARDSCAPE_W / HARDSCAPE_H; // 4:3 landscape
    const scale = 0.50;
    const geo = new THREE.PlaneGeometry(scale * aspect, scale);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, alphaTest: 0.1,
      depthWrite: false, side: THREE.DoubleSide
    });

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
      this.mesh.parent?.remove(this.mesh);
    }

    this.mesh = new THREE.Mesh(geo, mat);
    return this.mesh;
  }

  faceCamera(camera) { if (this.mesh) this.mesh.lookAt(camera.position); }

  getState() {
    return { typeId: this.typeId, x: this.x, z: this.z, id: this.id, variant: this.variant };
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
    }
  }
}
