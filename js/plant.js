// plant.js — Plant class + 10 plant types + sprite generators
// Style: Stardew Valley — distinct silhouettes, dark outlines, 3-tone shading

import * as THREE from 'three';

export const PLANT_TYPES = {
  fern: {
    id: 'fern', name: 'Fern', emoji: '🌿',
    minHumidity: 60, waterNeed: 'medium', growthRate: 1.0,
    palette:    ['#2e6e14', '#4a9e28', '#78cc4a', '#0e3006', '#a8e870'],
    altPalette: ['#7a5218', '#b07828', '#d8a848', '#2a1808', '#f0cc78'],
    description: 'Loves humid environments'
  },
  echeveria: {
    id: 'echeveria', name: 'Succulent', emoji: '🌵',
    minHumidity: 20, waterNeed: 'low', growthRate: 0.5,
    palette:    ['#4a7c6e', '#6eac98', '#9ed4c0', '#1e3c34', '#c8f0e4'],
    altPalette: ['#7a4868', '#b07098', '#d8a0c0', '#301828', '#f8d8ec'],
    description: 'Drought tolerant beauty'
  },
  moss: {
    id: 'moss', name: 'Moss', emoji: '🍃',
    flat: true,
    minHumidity: 70, waterNeed: 'high', growthRate: 1.5,
    palette:    ['#246010', '#3a9020', '#60be38', '#0c2e06', '#90e050'],
    altPalette: ['#708010', '#a0bc20', '#c8e040', '#283008', '#e8f860'],
    description: 'Soft carpet plant, loves moisture'
  },
  pothos: {
    id: 'pothos', name: 'Pothos', emoji: '🌱',
    minHumidity: 40, waterNeed: 'medium', growthRate: 1.0,
    palette:    ['#2a6e1e', '#46a030', '#78d050', '#0e3008', '#d0e890'],
    altPalette: ['#1e5018', '#347828', '#58b040', '#0a1e08', '#b0e890'],
    description: 'Hardy trailing vine'
  },
  mushroom: {
    id: 'mushroom', name: 'Mushroom', emoji: '🍄',
    minHumidity: 80, waterNeed: 'high', growthRate: 0.6,
    palette:    ['#904818', '#c87030', '#e8a860', '#481808', '#fff4e0'],
    altPalette: ['#384870', '#5870a0', '#7898cc', '#141c30', '#c0d4f0'],
    description: 'Needs darkness and moisture'
  },
  tillandsia: {
    id: 'tillandsia', name: 'Air Plant', emoji: '🌾',
    minHumidity: 50, waterNeed: 'mist', growthRate: 0.4,
    palette:    ['#4a7888', '#6ea8b8', '#9cd0d8', '#1e3c48', '#c8eef8'],
    altPalette: ['#8a7430', '#b8a048', '#d8c868', '#302808', '#f0e888'],
    description: 'No soil needed, just mist'
  },
  oxalis: {
    id: 'oxalis', name: 'Oxalis', emoji: '☘️',
    minHumidity: 45, waterNeed: 'medium', growthRate: 1.0,
    palette:    ['#5a1880', '#8838b8', '#b868e0', '#28085a', '#e0a8ff'],
    altPalette: ['#881828', '#c03048', '#e86878', '#300808', '#ffa8b8'],
    description: 'Purple shamrock leaves'
  },
  bamboo: {
    id: 'bamboo', name: 'Bamboo', emoji: '🎋',
    minHumidity: 50, waterNeed: 'medium', growthRate: 1.8,
    palette:    ['#5a8010', '#88b820', '#b8e030', '#283808', '#e0f870'],
    altPalette: ['#284808', '#3c7018', '#60a428', '#0e1e03', '#98e848'],
    description: 'Grows tall and fast'
  },
  pitcher: {
    id: 'pitcher', name: 'Pitcher Plant', emoji: '🌺',
    minHumidity: 85, waterNeed: 'high', growthRate: 0.5,
    palette:    ['#981818', '#cc3838', '#ee7070', '#480808', '#78cc48'],
    altPalette: ['#441090', '#6828c0', '#9060e0', '#160840', '#b880f8'],
    description: 'Carnivorous, loves wet conditions'
  },
  begonia: {
    id: 'begonia', name: 'Begonia', emoji: '🌸',
    minHumidity: 60, waterNeed: 'medium', growthRate: 1.0,
    palette:    ['#a81838', '#d84060', '#f890a8', '#580818', '#ffe0ec'],
    altPalette: ['#a84018', '#d86030', '#f09058', '#401808', '#ffbf90'],
    description: 'Beautiful flowering plant'
  }
};

export const PLANT_TYPE_LIST = Object.values(PLANT_TYPES);
export const STAGES = { seedling: 0, juvenile: 25, mature: 60, elder: 100 };

// Quadrupled to 384×576 — logical grid is 96×144 (4px per cell)
const SPRITE_W = 384;
const SPRITE_H = 576;

function makeCanvas(w, h) {
  const c = new OffscreenCanvas(w, h);
  return { canvas: c, ctx: c.getContext('2d') };
}

// Draw a 4×4 pixel block at logical grid position (gx, gy).
// Grid is 96 wide × 144 tall — 4px per cell.
function b(ctx, gx, gy, color) {
  if (gx < 0 || gx > 95 || gy < 0 || gy > 143) return;
  ctx.fillStyle = color;
  ctx.fillRect(gx * 4, gy * 4, 4, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRITE DRAWERS
// Each receives (ctx, stage 0..1). Logical grid: 96×144, 2px per cell.
// Convention: base of plant at gy=143, grows upward.
// ─────────────────────────────────────────────────────────────────────────────
const spriteDrawers = {

  // ── FERN — wide spreading fan of fronds with pinnate leaflets ───────────
  fern(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 48, base = 143;
    const stemH = Math.floor(12 + stage * 72);
    const fronds = 3 + Math.floor(stage * 7);

    // Roots / base shadow
    b(ctx, cx - 4, base, ol); b(ctx, cx + 4, base, ol);
    b(ctx, cx - 6, base - 1, ol); b(ctx, cx + 6, base - 1, ol);

    // Central stem with shading
    for (let i = 0; i <= stemH; i++) {
      const col = i < 8 ? sh : i < stemH * 0.5 ? mid : mid;
      b(ctx, cx - 1, base - i, i < 6 ? sh : ol);
      b(ctx, cx,     base - i, col);
      b(ctx, cx + 1, base - i, i < stemH * 0.6 ? mid : hi);
    }

    // Fronds radiate outward in a fan
    for (let f = 0; f < fronds; f++) {
      const t = fronds === 1 ? 0.5 : f / (fronds - 1);
      const angleDeg = -65 + t * 130;
      const rad = angleDeg * Math.PI / 180;
      const insertY = base - Math.floor(stemH * (0.20 + t * 0.65));
      const fLen = Math.floor(16 + stage * 32 - Math.abs(t - 0.5) * 16);

      for (let step = 1; step <= fLen; step++) {
        const ratio = step / fLen;
        const gx = Math.round(cx + Math.sin(rad) * step * 1.3);
        const gy = Math.round(insertY - Math.abs(Math.cos(rad)) * step * 0.9);
        // Outline pixel above frond
        b(ctx, gx, gy - 1, ol);
        const color = ratio < 0.2 ? sh : ratio < 0.65 ? mid : hi;
        b(ctx, gx, gy, color);
        // Pinnate leaflets: small side branches off frond
        if (step > 3 && step < fLen - 2 && step % 4 === 0) {
          const perpX = Math.round(Math.cos(rad));
          const perpY = Math.round(-Math.sin(rad) * 0.5);
          const lColor = ratio < 0.5 ? mid : hi;
          for (let ls = 1; ls <= 4; ls++) {
            b(ctx, gx + perpX * ls, gy + perpY * ls - 1, ol);
            b(ctx, gx + perpX * ls, gy + perpY * ls, lColor);
            b(ctx, gx - perpX * ls, gy - perpY * ls - 1, ol);
            b(ctx, gx - perpX * ls, gy - perpY * ls, lColor);
          }
        }
        if (step === fLen) b(ctx, gx, gy, br);
      }
      b(ctx, cx + (t < 0.5 ? -3 : 3), insertY + 3, ol);
    }
    // Top crown tip
    b(ctx, cx - 2, base - stemH - 3, ol);
    b(ctx, cx + 2, base - stemH - 3, ol);
    b(ctx, cx,     base - stemH - 4, br);
  },

  // ── ECHEVERIA — fat rosette succulent with pointed tip petals ────────────
  echeveria(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 48;
    const cy = Math.floor(112 - stage * 28);
    const layers = 1 + Math.floor(stage * 3);

    for (let L = layers; L >= 0; L--) {
      const petalCount = 5 + L * 2;
      const r = 4.8 + L * 8.4;
      const color = L === 0 ? br : L === 1 ? hi : L === 2 ? mid : sh;
      const outlineR = r + 4.8;

      for (let p = 0; p < petalCount; p++) {
        const ang = (p / petalCount) * Math.PI * 2;

        // Outline ring
        const opx = Math.round(cx + Math.cos(ang) * outlineR);
        const opy = Math.round(cy + Math.sin(ang) * outlineR * 0.52);
        b(ctx, opx, opy, ol);
        b(ctx, opx + Math.round(Math.cos(ang)), opy, ol);

        // Fill petal with radial gradient shading
        for (let s = Math.max(0, (L - 1) * 4); s <= r; s += 0.8) {
          const px = Math.round(cx + Math.cos(ang) * s);
          const py = Math.round(cy + Math.sin(ang) * s * 0.52);
          const isHighlight = Math.cos(ang) < -0.25 && Math.sin(ang) < 0;
          const isMid = s > r * 0.3 && s < r * 0.7;
          b(ctx, px, py, isHighlight && s > r * 0.55 ? hi : isMid ? color : color);
        }

        // Petal crease line
        if (L === layers && stage > 0.3) {
          const crx = Math.round(cx + Math.cos(ang) * r * 0.6);
          const cry = Math.round(cy + Math.sin(ang) * r * 0.6 * 0.52);
          b(ctx, crx, cry, sh);
        }
      }
    }

    // Dew drops / center detail
    b(ctx, cx - 2, cy, hi); b(ctx, cx + 2, cy, hi);
    b(ctx, cx, cy - 4, hi); b(ctx, cx, cy + 2, mid);
    b(ctx, cx, cy, br);
    // Root nub
    for (let dx = -4; dx <= 4; dx++) b(ctx, cx + dx, 130 + Math.floor(stage * 10), ol);
  },

  // ── MOSS — wide low bumpy carpet with surface texture ────────────────────
  moss(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const base = 143;
    const maxH = Math.floor(12 + stage * 40);

    for (let col = 0; col < 90; col++) {
      const bumpH = Math.max(4, maxH + Math.round(
        Math.sin(col * 0.85 + 0.7) * stage * 14 +
        Math.sin(col * 0.32 + 1.1) * stage * 6
      ));
      for (let row = 0; row < bumpH; row++) {
        const gy = base - row;
        let color;
        if (row === bumpH - 1)       color = br;
        else if (row > bumpH * 0.70) color = hi;
        else if (row > bumpH * 0.45) color = mid;
        else if (row > bumpH * 0.20) color = mid;
        else                          color = sh;
        b(ctx, col + 3, gy, color);
      }
      // Surface texture dots on top layer
      if (stage > 0.3 && col % 5 === 2) {
        b(ctx, col + 3, base - bumpH + 1, br);
      }
      b(ctx, col + 3, base - bumpH, ol);
    }
    // Bottom edge outline
    for (let col = 0; col < 90; col++) b(ctx, col + 3, base + 1, ol);
    b(ctx, 0, base, ol); b(ctx, 95, base, ol);
  },

  // ── POTHOS — heart-shaped leaves on winding vine with variegation ────────
  pothos(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 48, base = 143;
    const vineH = Math.floor(20 + stage * 96);
    const leafCount = 2 + Math.floor(stage * 6);

    // Vine with 2-pixel width
    for (let i = 0; i <= vineH; i++) {
      const vx = cx + Math.round(Math.sin(i * 0.45) * 5);
      b(ctx, vx - 3, base - i, ol);
      b(ctx, vx + 3, base - i, ol);
      b(ctx, vx - 1, base - i, sh);
      b(ctx, vx,     base - i, mid);
      b(ctx, vx + 1, base - i, sh);
    }

    for (let l = 0; l < leafCount; l++) {
      const t = (l + 1) / (leafCount + 1);
      const gy = Math.round(base - t * vineH);
      const stemOx = Math.round(Math.sin(gy * 0.45) * 5);
      const side = l % 2 === 0 ? 1 : -1;
      const lSize = 8 + Math.floor(stage * 10);
      const lx = cx + stemOx + side * (lSize + 4);
      const ly = gy;

      // Outline — two rounded top lobes + pointed bottom
      for (let lobe = -1; lobe <= 1; lobe += 2) {
        for (let dx = 0; dx <= lSize + 1; dx++) {
          for (let dy = 0; dy <= lSize + 1; dy++) {
            if (dx * dx + dy * dy > (lSize + 1.5) * (lSize + 1.5)) continue;
            b(ctx, lx + lobe * dx, ly - dy, ol);
          }
        }
      }
      // Fill rounded top lobes
      for (let lobe = -1; lobe <= 1; lobe += 2) {
        for (let dx = 0; dx <= lSize - 1; dx++) {
          for (let dy = 0; dy <= lSize - 1; dy++) {
            if (dx * dx + dy * dy > lSize * lSize) continue;
            const isHi = dy > lSize * 0.55 && lobe < 0;
            b(ctx, lx + lobe * dx, ly - dy, isHi ? hi : mid);
          }
        }
      }
      // Pointed lower portion
      for (let dy = 0; dy <= lSize; dy++) {
        const w2 = Math.round((1 - dy / lSize) * lSize);
        for (let dx = -w2; dx <= w2; dx++) {
          b(ctx, lx + dx, ly + dy, dy === lSize ? ol : sh);
        }
      }
      // Central vein
      for (let vy = -lSize + 2; vy <= lSize - 2; vy++) {
        b(ctx, lx, ly + vy, vy < 0 ? hi : mid);
      }
      // Side veins
      if (stage > 0.25) {
        for (let vi = 1; vi <= 3; vi++) {
          const voy = -Math.floor(lSize * 0.3 * vi);
          for (let vd = 1; vd <= 4; vd++) {
            b(ctx, lx + vd, ly + voy - vd, hi);
            b(ctx, lx - vd, ly + voy - vd, hi);
          }
        }
      }
      // Gold variegation patches
      if (stage > 0.4 && l % 3 === 0) {
        b(ctx, lx - 3, ly - 4, '#d4e860'); b(ctx, lx - 2, ly - 4, '#d4e860');
        b(ctx, lx - 1, ly - 7, '#d4e860'); b(ctx, lx,     ly - 8, '#d4e860');
        b(ctx, lx + 2, ly - 5, '#d4e860');
      }
    }
  },

  // ── MUSHROOM — classic toadstool with dome cap, spots, and gills ────────
  mushroom(ctx, stage, palette) {
    const [sh, mid, hi, ol, cr] = palette;
    const cx = 48, base = 143;
    const stemH = Math.floor(16 + stage * 32);
    const capR  = Math.floor(16 + stage * 28);
    const capH  = Math.floor(12 + stage * 20);
    const capY  = base - stemH;
    const sw = 8;

    // Stem outline
    for (let dy = 0; dy <= stemH; dy++) {
      b(ctx, cx - sw - 3, base - dy, ol);
      b(ctx, cx + sw + 3, base - dy, ol);
      for (let dx = -sw; dx <= sw; dx++) {
        const shade = dx < -sw + 3 ? sh : dx > sw - 3 ? hi : cr;
        b(ctx, cx + dx, base - dy, shade);
      }
    }
    // Stem base ring
    for (let dx = -sw - 3; dx <= sw + 3; dx++) b(ctx, cx + dx, base + 1, ol);
    // Skirt (veil remnant) around lower stem
    if (stage > 0.3) {
      const skirtY = base - Math.floor(stemH * 0.35);
      for (let dx = -(sw + 4); dx <= sw + 4; dx++) b(ctx, cx + dx, skirtY, ol);
      for (let dx = -(sw + 3); dx <= sw + 3; dx++) b(ctx, cx + dx, skirtY + 1, sh);
      for (let dx = -(sw + 2); dx <= sw + 2; dx++) b(ctx, cx + dx, skirtY - 1, sh);
    }
    // Gill ring
    for (let dx = -sw; dx <= sw; dx++) b(ctx, cx + dx, capY, sh);
    // Gills visible under cap edge
    if (stage > 0.2) {
      for (let dx = -sw; dx <= sw; dx += 3) {
        b(ctx, cx + dx, capY + 2, sh);
      }
    }

    // Cap outline
    for (let dx = -(capR + 3); dx <= capR + 3; dx++) {
      const maxDY = Math.round(Math.sqrt(Math.max(0, (capR + 3) ** 2 - dx ** 2)) * capH / (capR + 3));
      b(ctx, cx + dx, capY - maxDY, ol);
    }
    for (let dx = -(capR + 3); dx <= capR + 3; dx++) b(ctx, cx + dx, capY + 1, ol);

    // Cap fill with 3-tone shading
    for (let dx = -capR; dx <= capR; dx++) {
      const maxDY = Math.round(Math.sqrt(Math.max(0, capR ** 2 - dx ** 2)) * capH / capR);
      for (let dy = 0; dy <= maxDY; dy++) {
        const isTop  = dy > maxDY * 0.50;
        const isLeft = dx < -capR * 0.15;
        b(ctx, cx + dx, capY - dy, (isTop && isLeft) ? hi : isTop ? mid : sh);
      }
    }
    // Cap edge gradient (darker underside)
    for (let dx = -capR; dx <= capR; dx++) {
      b(ctx, cx + dx, capY - 1, sh);
    }

    // Spots
    const spotCount = 2 + Math.floor(stage * 4);
    const spotAngles = [Math.PI * 0.5, Math.PI * 0.18, Math.PI * 0.82, Math.PI * 0.32, Math.PI * 0.68, Math.PI * 0.5 - 0.2];
    for (let s = 0; s < Math.min(spotCount, spotAngles.length); s++) {
      const ang = spotAngles[s];
      const sr  = capR * 0.52;
      const sx  = cx + Math.round(Math.cos(ang - Math.PI / 2) * sr);
      const sy  = capY - Math.round(Math.abs(Math.sin(ang - Math.PI / 2)) * capH * 0.44) - 4;
      // Spot outline + fill (2×2 spot)
      b(ctx, sx - 2, sy, ol); b(ctx, sx + 2, sy, ol);
      b(ctx, sx, sy - 2, ol); b(ctx, sx, sy + 2, ol);
      b(ctx, sx - 1, sy + 1, cr); b(ctx, sx, sy + 1, cr); b(ctx, sx + 1, sy + 1, cr);
      b(ctx, sx - 1, sy,     cr); b(ctx, sx, sy,     cr); b(ctx, sx + 1, sy,     cr);
      b(ctx, sx, sy - 1, hi);
    }
  },

  // ── TILLANDSIA — spiky silvery air plant with bloom spike ────────────────
  tillandsia(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const cx = 48, base = 132;
    const leafCount = 8 + Math.floor(stage * 10);
    const maxLen = Math.floor(20 + stage * 48);

    for (let l = 0; l < leafCount; l++) {
      const baseAng = (l / leafCount) * Math.PI * 2;
      const len = Math.floor(maxLen * (0.50 + (l % 4) * 0.12 + stage * 0.3));
      const color = l % 3 === 0 ? sh : l % 3 === 1 ? mid : hi;

      let prevGx = cx, prevGy = base;
      for (let step = 1; step <= len; step++) {
        const t = step / len;
        const gx = Math.round(cx + Math.cos(baseAng) * step * 0.9);
        const gy = Math.round(base - Math.abs(Math.sin(baseAng)) * step * 0.5 - step * 0.4 * t);
        if (gx !== prevGx || gy !== prevGy) {
          // Outline along one side
          b(ctx, gx + Math.round(Math.cos(baseAng + Math.PI / 2)), gy, ol);
          b(ctx, gx, gy, step === len ? br : color);
          // Silver sheen highlight on upper leaves
          if (l % 5 === 0 && step < len * 0.6) {
            b(ctx, gx + Math.round(Math.cos(baseAng - Math.PI / 2)), gy, hi);
          }
          prevGx = gx; prevGy = gy;
        }
      }
    }

    // Bloom spike (mature+)
    if (stage > 0.55) {
      const spkH = Math.floor((stage - 0.55) * 60);
      for (let i = 0; i < spkH; i++) {
        b(ctx, cx - 1, base - i, ol);
        b(ctx, cx,     base - i, '#d060c0');
        b(ctx, cx + 1, base - i, '#f090e0');
      }
      // Flower bracts
      for (let bi = 0; bi < 4; bi++) {
        const by = base - Math.floor(spkH * (0.35 + bi * 0.18));
        const side = bi % 2 === 0 ? 1 : -1;
        for (let bj = 0; bj < 6; bj++) {
          b(ctx, cx + side * (bj + 2), by - bj, ol);
          b(ctx, cx + side * (bj + 2), by - bj + 1, '#e070d0');
        }
      }
    }

    // Dense base cluster
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = 0; dy <= 4; dy++) {
        b(ctx, cx + dx, base - dy, dy === 0 ? ol : hi);
      }
    }
  },

  // ── OXALIS — trefoil with heart leaflets on long stems ──────────────────
  oxalis(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const base = 143;
    const stemCount = 1 + Math.floor(stage * 5);

    for (let s = 0; s < stemCount; s++) {
      const t = stemCount === 1 ? 0.5 : s / (stemCount - 1);
      const sx = Math.floor(24 + t * 48);
      const stemH = Math.floor(24 + stage * 56);

      // Stem with slight curve
      for (let i = 0; i <= stemH; i++) {
        const wx = sx + Math.round(Math.sin(i * 0.18) * 2);
        b(ctx, wx - 2, base - i, ol);
        b(ctx, wx + 2, base - i, ol);
        b(ctx, wx,     base - i, sh);
        b(ctx, wx + 1, base - i, mid);
      }

      const tx = sx, ty = base - stemH - 4;
      for (let lf = 0; lf < 3; lf++) {
        const ang = (lf / 3) * Math.PI * 2 - Math.PI / 2;
        const lx = Math.round(tx + Math.cos(ang) * 11);
        const ly = Math.round(ty + Math.sin(ang) * 7);

        // Heart-leaf outline (doubled offsets)
        b(ctx, lx - 8, ly,      ol); b(ctx, lx + 8, ly,      ol);
        b(ctx, lx - 4, ly - 8,  ol); b(ctx, lx + 4, ly - 8,  ol);
        b(ctx, lx,     ly - 8,  ol);
        b(ctx, lx - 4, ly + 8,  ol); b(ctx, lx + 4, ly + 8,  ol);
        b(ctx, lx,     ly + 8,  ol);
        b(ctx, lx - 8, ly + 4,  ol); b(ctx, lx + 8, ly + 4,  ol);
        b(ctx, lx - 6, ly - 6,  ol); b(ctx, lx + 6, ly - 6,  ol);
        b(ctx, lx - 6, ly + 6,  ol); b(ctx, lx + 6, ly + 6,  ol);

        // Fill — 3 tones
        b(ctx, lx - 4, ly - 4, hi);  b(ctx, lx - 2, ly - 4, hi);  b(ctx, lx,     ly - 4, hi);
        b(ctx, lx + 2, ly - 4, mid); b(ctx, lx - 4, ly - 2, hi);  b(ctx, lx - 2, ly - 2, hi);
        b(ctx, lx,     ly - 2, mid); b(ctx, lx + 2, ly - 2, mid); b(ctx, lx + 4, ly - 2, sh);
        b(ctx, lx - 4, ly,     mid); b(ctx, lx - 2, ly,     mid); b(ctx, lx,     ly,     mid);
        b(ctx, lx + 2, ly,     sh);  b(ctx, lx + 4, ly,     sh);
        b(ctx, lx - 4, ly + 2, sh);  b(ctx, lx - 2, ly + 2, sh);  b(ctx, lx,     ly + 2, sh);
        b(ctx, lx + 2, ly + 2, sh);  b(ctx, lx - 2, ly + 4, sh);  b(ctx, lx,     ly + 4, sh);

        // Fold notch at center top
        b(ctx, lx, ly - 4, ol);
        // Vein
        b(ctx, lx, ly - 2, hi); b(ctx, lx, ly, hi); b(ctx, lx, ly + 2, mid);
      }
      // Fold: leaves close at night (elder stage visual hint)
      if (stage >= 0.9) b(ctx, tx - 2, ty - 4, br);
    }
  },

  // ── BAMBOO — segmented stalks with nodes, sheath, and leaves ────────────
  bamboo(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    const base = 143;
    const totalH = Math.floor(24 + stage * 112);
    const segH   = 28;

    const stalks = stage > 0.15
      ? [{ cx: 40, scale: 1.0 }, { cx: 58, scale: 0.75 }]
      : [{ cx: 48, scale: 1.0 }];

    stalks.forEach(({ cx, scale }) => {
      const sH    = Math.floor(totalH * scale);
      const sSegs = Math.ceil(sH / segH);
      const hw    = scale > 0.8 ? 8 : 5;

      // Outline column
      for (let dy = 0; dy <= sH; dy++) {
        b(ctx, cx - hw - 2, base - dy, ol);
        b(ctx, cx + hw + 2, base - dy, ol);
      }
      for (let dx = -hw - 2; dx <= hw + 2; dx++) {
        b(ctx, cx + dx, base + 1,      ol);
        b(ctx, cx + dx, base - sH - 2, ol);
      }

      // Segments with alternating color + sheath detail
      for (let seg = 0; seg < sSegs; seg++) {
        const segTop    = Math.min(seg * segH, sH);
        const segBottom = Math.min((seg + 1) * segH - 1, sH);
        const segColor  = seg % 2 === 0 ? mid : sh;
        for (let dy = segTop; dy <= segBottom; dy++) {
          // Left shadow, right highlight
          b(ctx, cx - hw, base - dy, sh);
          for (let dx = -hw + 1; dx <= hw - 1; dx++) b(ctx, cx + dx, base - dy, segColor);
          b(ctx, cx + hw, base - dy, hi);
        }
        // Node ring between segments
        if (segBottom < sH) {
          for (let dx = -hw - 2; dx <= hw + 2; dx++) b(ctx, cx + dx, base - segBottom,     ol);
          for (let dx = -hw;     dx <= hw;     dx++) b(ctx, cx + dx, base - segBottom - 1, sh);
          for (let dx = -hw - 1; dx <= hw + 1; dx++) b(ctx, cx + dx, base - segBottom + 1, sh);
        }
      }

      // Leaves at upper 60% of stalk
      const leafStart = Math.floor(sSegs * 0.38);
      for (let seg = leafStart; seg < sSegs; seg++) {
        const leafGY  = base - seg * segH - 10;
        const side    = seg % 2 === 0 ? 1 : -1;
        const leafLen = 16 + Math.floor(stage * 8);
        // Leaf base nub
        b(ctx, cx + side * (hw + 3), leafGY, ol);
        b(ctx, cx + side * (hw + 2), leafGY - 1, sh);
        // Leaf blade
        for (let j = 0; j < leafLen; j++) {
          const lx = cx + side * (j + hw + 3);
          const ly = leafGY - Math.floor(j * 0.55);
          b(ctx, lx, ly - 1, ol);
          b(ctx, lx, ly,     j === 0 ? sh : j < leafLen * 0.5 ? mid : j < leafLen - 2 ? hi : br);
          b(ctx, lx, ly + 1, ol);
        }
        b(ctx, cx + side * (leafLen + hw + 3), leafGY - Math.floor(leafLen * 0.55), ol);
        // Second overlapping leaf
        if (stage > 0.4 && seg < sSegs - 1) {
          const l2GY = leafGY - 6;
          for (let j = 0; j < leafLen - 4; j++) {
            const lx = cx + side * (j + hw + 5);
            const ly = l2GY - Math.floor(j * 0.4);
            b(ctx, lx, ly, j < leafLen * 0.5 ? sh : mid);
          }
        }
      }
    });
  },

  // ── PITCHER PLANT — tapered tube with lid, veins, and liquid ────────────
  pitcher(ctx, stage, palette) {
    const [sh, mid, hi, ol, ac] = palette;
    const cx = 48, base = 143;
    const tubeH = Math.floor(24 + stage * 72);
    const hw    = 8;
    const topGY = base - tubeH;

    // Side leaves
    if (stage > 0.08) {
      const leafCount = 1 + Math.floor(stage * 3);
      for (let l = 0; l < leafCount; l++) {
        const side     = l % 2 === 0 ? 1 : -1;
        const leafBase = base - 20 - l * 24;
        const leafLen  = 16 + Math.floor(stage * 8);
        // Outline
        for (let j = 0; j < leafLen; j++) {
          const lx = cx + side * (j + hw + 6);
          const ly = leafBase - Math.floor(j * 0.55);
          b(ctx, lx, ly - 3, ol);
          b(ctx, lx, ly - 1, j < 6 ? sh : j < leafLen - 2 ? mid : ol);
          b(ctx, lx, ly,     j < 6 ? sh : j < leafLen - 2 ? mid : ol);
        }
        // Leaf vein
        for (let j = 2; j < leafLen - 2; j++) {
          b(ctx, cx + side * (j + hw + 6), leafBase - Math.floor(j * 0.55) - 2, hi);
        }
      }
    }

    // Tube (tapers wider at base)
    for (let dy = 0; dy <= tubeH; dy++) {
      const taper = Math.round((1 - dy / tubeH) * 6);
      const w = hw + taper;
      b(ctx, cx - w - 3, base - dy, ol);
      b(ctx, cx + w + 3, base - dy, ol);
      for (let dx = -w; dx <= w; dx++) {
        const atEdge = dx < -w + 3 || dx > w - 3;
        const shade = atEdge ? (dx < 0 ? sh : hi) : (dy / tubeH > 0.65) ? mid : sh;
        b(ctx, cx + dx, base - dy, shade);
      }
    }
    for (let dx = -(hw + 8); dx <= hw + 8; dx++) b(ctx, cx + dx, base + 1, ol);

    // Ribbed texture / veining on tube surface
    for (let dy = 14; dy < tubeH - 10; dy++) {
      if (dy % 16 < 8) {
        b(ctx, cx - 2, base - dy, sh);
        b(ctx, cx + 2, base - dy, hi);
      }
      if (dy % 12 < 5 && stage > 0.3) {
        const taper = Math.round((1 - dy / tubeH) * 6);
        b(ctx, cx - hw - taper + 4, base - dy, mid);
        b(ctx, cx + hw + taper - 4, base - dy, mid);
      }
    }

    // Red/crimson blush pattern
    if (stage > 0.4) {
      for (let dy = Math.floor(tubeH * 0.3); dy < tubeH; dy += 3) {
        b(ctx, cx - 4, base - dy, '#aa2020');
        b(ctx, cx + 5, base - dy, '#aa2020');
      }
    }

    // Liquid pool at bottom
    const liqH = Math.floor(10 + stage * 12);
    for (let dy = 0; dy < liqH; dy++) {
      const taper = Math.round((1 - dy / tubeH) * 6);
      for (let dx = -(hw + taper - 2); dx <= hw + taper - 2; dx++) {
        b(ctx, cx + dx, base - dy, dy === liqH - 1 ? '#50bb60' : ac);
      }
    }
    // Liquid surface highlight
    b(ctx, cx - hw - 1, base - liqH, ol);
    b(ctx, cx + hw + 1, base - liqH, ol);
    for (let dx = -hw + 2; dx <= hw - 2; dx++) b(ctx, cx + dx, base - liqH, '#a0ffb0');

    // Opening rim
    for (let dx = -(hw + 8); dx <= hw + 8; dx++) b(ctx, cx + dx, topGY, ol);
    for (let dx = -(hw + 6); dx <= hw + 6; dx++) {
      b(ctx, cx + dx, topGY + 1, dx < 0 ? hi : mid);
      b(ctx, cx + dx, topGY + 2, sh);
    }

    // Peristome teeth
    for (let tx = -(hw + 4); tx <= hw + 4; tx += 4) {
      b(ctx, cx + tx, topGY - 2, ol);
      b(ctx, cx + tx, topGY - 1, hi);
    }

    // Lid / operculum
    b(ctx, cx - 12, topGY - 4,  ol); b(ctx, cx - 8,  topGY - 8,  sh);
    b(ctx, cx - 4,  topGY - 12, mid); b(ctx, cx,     topGY - 12, hi);
    b(ctx, cx + 4,  topGY - 10, mid); b(ctx, cx + 8,  topGY - 4,  ol);
    b(ctx, cx,      topGY - 16, ol);
    // Lid fill
    for (let lx = -6; lx <= 6; lx++) b(ctx, cx + lx, topGY - 8, lx < 0 ? mid : sh);
  },

  // ── BEGONIA — asymmetric round leaves + pink flower clusters ─────────────
  begonia(ctx, stage, palette) {
    const [sh, mid, hi, ol, br] = palette;
    // Green leaf colors separate from pink flower palette
    const lsh = '#246e10', lmid = '#3a9e20', lhi = '#70cc40', lol = '#0c3006';
    const cx = 48, base = 143;
    const leafCount = 2 + Math.floor(stage * 5);

    for (let l = 0; l < leafCount; l++) {
      const side = l % 2 === 0 ? 1 : -1;
      const lx   = cx + side * (4 + Math.floor(l / 2) * 12);
      const ly   = base - 20 - Math.floor(l * 14 * stage);
      const bigR = 12 + Math.floor(stage * 8);
      const smR  =  8 + Math.floor(stage * 4);

      // Stem
      const stemLen = Math.abs(ly - base);
      for (let i = 0; i < stemLen; i++) {
        b(ctx, lx - 1, base - i, lol);
        b(ctx, lx,     base - i, lsh);
        b(ctx, lx + 1, base - i, lmid);
      }

      // Big lobe — filled circle
      for (let dx = -bigR - 2; dx <= bigR + 2; dx++) {
        for (let dy = -bigR - 2; dy <= bigR + 2; dy++) {
          if (dx * dx + dy * dy > (bigR + 2) ** 2) continue;
          if (dx * dx + dy * dy > bigR ** 2) { b(ctx, lx + side * dx, ly - dy, lol); continue; }
          const isHi  = dy > bigR * 0.25 && dx < 0;
          const isLo  = dy > bigR * 0.4;
          b(ctx, lx + side * dx, ly - dy, isHi ? lhi : isLo ? lmid : lsh);
        }
      }
      // Smaller lobe (asymmetric ear)
      for (let dx = 0; dx <= smR + 2; dx++) {
        for (let dy = -smR - 2; dy <= smR + 2; dy++) {
          if (dx * dx + dy * dy > (smR + 2) ** 2) continue;
          if (dx * dx + dy * dy > smR ** 2) { b(ctx, lx - side * dx, ly - dy, lol); continue; }
          b(ctx, lx - side * dx, ly - dy, lmid);
        }
      }

      // Leaf veins — main + branching
      for (let i = -bigR + 3; i <= bigR - 3; i++) b(ctx, lx + side * i, ly, lhi);
      if (stage > 0.2) {
        for (let vi = 1; vi <= 4; vi++) {
          const vox = Math.floor(bigR * 0.2 * vi) * side;
          for (let vd = 1; vd <= 5; vd++) {
            b(ctx, lx + vox + side * vd, ly - vd * 2, lhi);
            b(ctx, lx + vox + side * vd, ly + vd,     lhi);
          }
        }
      }
      // Silver sheen spots on leaves (mature)
      if (stage > 0.5 && l % 2 === 0) {
        b(ctx, lx + side * 3, ly - 5, '#c8e8c8');
        b(ctx, lx + side * 6, ly - 8, '#c8e8c8');
        b(ctx, lx + side * 2, ly - 11, '#c8e8c8');
      }
    }

    // Flower clusters (mature+)
    if (stage > 0.5) {
      const flowerCount = 1 + Math.floor((stage - 0.5) * 8);
      for (let f = 0; f < flowerCount; f++) {
        const ft = flowerCount === 1 ? 0.5 : f / (flowerCount - 1);
        const fx = Math.floor(20 + ft * 56);
        const fy = base - Math.floor(40 + stage * 72) - (f % 2) * 16;

        // Flower stalk
        for (let fsi = 0; fsi < 8; fsi++) b(ctx, fx, fy + fsi, lsh);

        // 5-petal flower (larger petals)
        const petalOffsets = [
          [0, -8], [0, 8], [-8, 0], [8, 0],
          [-5, -5], [5, -5], [-5, 5], [5, 5]
        ];
        petalOffsets.forEach(([px, py], i) => {
          // Petal outline
          b(ctx, fx + px - 3, fy + py,     ol);
          b(ctx, fx + px + 3, fy + py,     ol);
          b(ctx, fx + px,     fy + py - 3, ol);
          b(ctx, fx + px,     fy + py + 3, ol);
          // Petal fill
          for (let pdx = -2; pdx <= 2; pdx++) {
            for (let pdy = -2; pdy <= 2; pdy++) {
              b(ctx, fx + px + pdx, fy + py + pdy,
                py < 0 ? hi : px < 0 ? mid : sh);
            }
          }
        });
        // Yellow center
        for (let cdx = -2; cdx <= 2; cdx++) {
          for (let cdy = -2; cdy <= 2; cdy++) {
            b(ctx, fx + cdx, fy + cdy, cdx === 0 && cdy === 0 ? '#f8e820' : '#f8d020');
          }
        }
        // Stamens
        b(ctx, fx - 2, fy - 4, '#f8e820'); b(ctx, fx + 2, fy - 4, '#f8e820');
        b(ctx, fx - 3, fy,     '#f8e820'); b(ctx, fx + 3, fy,     '#f8e820');
      }
    }
  }

};

function drawFlatMoss(ctx, stage, palette) {
  const [sh, mid, hi, ol, br] = palette;
  const W = SPRITE_W, H = SPRITE_H;
  // Background base color
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);
  // Mossy blobs — varying sizes scattered over the canvas
  const rng = (n) => ((n * 6271 + 1) % 997) / 997;
  const count = Math.floor(60 + stage * 100);
  for (let i = 0; i < count; i++) {
    const rx = rng(i * 3 + 1) * W;
    const ry = rng(i * 3 + 2) * H;
    const r = (8 + rng(i * 3 + 3) * 24) * (0.5 + stage * 0.5);
    const col = (i % 3 === 0) ? hi : (i % 3 === 1) ? mid : sh;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(rx, ry, r * 1.2, r * 0.8, rng(i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Dark outline specks
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = ol;
    ctx.fillRect(
      Math.floor(rng(i * 7 + 5) * W),
      Math.floor(rng(i * 7 + 6) * H),
      3, 3
    );
  }
  // Bright tips
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = br;
    ctx.fillRect(
      Math.floor(rng(i * 11 + 7) * W),
      Math.floor(rng(i * 11 + 8) * H),
      2, 2
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plant Class
// ─────────────────────────────────────────────────────────────────────────────
export class Plant {
  constructor(typeId, x, z, options = {}) {
    this.typeId = typeId;
    this.type = PLANT_TYPES[typeId];
    this.x = x;
    this.z = z;
    this.growthProgress = options.growthProgress || 0;
    this.health = options.health || 100;
    this.waterLevel = options.waterLevel || 70;
    this.careState = options.careState || 'HEALTHY';
    this.id = options.id || Math.random().toString(36).slice(2, 9);
    this.variant = options.variant ?? 0;
    this.col = options.col ?? null;
    this.row = options.row ?? null;
    this.cellW = options.cellW ?? 0.24;
    this.cellD = options.cellD ?? 0.27;
    this._stage = -1;
    this.mesh = null;
  }

  getStage() {
    if (this.growthProgress >= 100) return 'elder';
    if (this.growthProgress >= 60)  return 'mature';
    if (this.growthProgress >= 25)  return 'juvenile';
    return 'seedling';
  }

  getStageFloat() { return this.growthProgress / 100; }

  _drawSprite(ctx) {
    ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
    const flipH  = (this.variant & 1) === 1;
    const useAlt = (this.variant & 2) === 2;
    const palette = useAlt ? this.type.altPalette : this.type.palette;
    if (this.type.flat) {
      drawFlatMoss(ctx, this.getStageFloat(), palette);
      return;
    }
    if (flipH) { ctx.save(); ctx.translate(SPRITE_W, 0); ctx.scale(-1, 1); }
    const drawer = spriteDrawers[this.typeId] || spriteDrawers.fern;
    drawer(ctx, this.getStageFloat(), palette);
    if (flipH) ctx.restore();
    if (this.health < 30) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#5a2808';
      ctx.fillRect(0, 0, SPRITE_W, SPRITE_H);
      ctx.globalAlpha = 1.0;
    }
  }

  buildMesh(camera) {
    const { canvas, ctx } = makeCanvas(SPRITE_W, SPRITE_H);
    this._drawSprite(ctx);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    let geo, mat;
    if (this.type.flat) {
      // Flat carpet — horizontal plane, sized to cell footprint stored on plant
      const cw = this.cellW || 0.24;
      const cd = this.cellD || 0.27;
      geo = new THREE.PlaneGeometry(cw, cd);
      mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, alphaTest: 0.05,
        depthWrite: false, side: THREE.DoubleSide
      });
    } else {
      const scale = 0.5 + this.getStageFloat() * 0.8;
      geo = new THREE.PlaneGeometry(scale * (SPRITE_W / SPRITE_H), scale);
      mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, alphaTest: 0.1,
        depthWrite: false, side: THREE.DoubleSide
      });
    }

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
      this.mesh.parent?.remove(this.mesh);
    }

    this.mesh = new THREE.Mesh(geo, mat);
    if (this.type.flat) this.mesh.rotation.x = -Math.PI / 2;
    this._camera = camera;
    this._stage = this.getStage();
    return this.mesh;
  }

  updateSprite() {
    if (!this.mesh) return;
    const { canvas, ctx } = makeCanvas(SPRITE_W, SPRITE_H);
    this._drawSprite(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    const oldTex = this.mesh.material.map;
    this.mesh.material.map = tex;
    this.mesh.material.needsUpdate = true;
    oldTex?.dispose();

    if (this.type.flat) {
      const cw = this.cellW || 0.24;
      const cd = this.cellD || 0.27;
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(cw, cd);
    } else {
      const scale = 0.5 + this.getStageFloat() * 0.8;
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(scale * (SPRITE_W / SPRITE_H), scale);
    }
    this._stage = this.getStage();
  }

  faceCamera(camera) { if (this.mesh) this.mesh.lookAt(camera.position); }

  grow(amount) {
    const prev = this.getStage();
    this.growthProgress = Math.min(100, this.growthProgress + amount * (this.type.growthRate || 1.0));
    if (this.getStage() !== prev) this.updateSprite();
  }

  getState() {
    return {
      typeId: this.typeId, x: this.x, z: this.z,
      growthProgress: this.growthProgress, health: this.health,
      waterLevel: this.waterLevel, careState: this.careState,
      id: this.id, variant: this.variant,
      col: this.col ?? null, row: this.row ?? null
    };
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
    }
  }
}
