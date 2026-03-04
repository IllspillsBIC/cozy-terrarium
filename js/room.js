// room.js — Background room objects + ambient animations
// Style: Stardew Valley cozy interior — warm wood planks, wainscoting, personal touches

import * as THREE from 'three';

function makeTexture(draw, w = 64, h = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export class Room {
  constructor(scene, weatherSystem) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this._curtains = [];
    this._weather = weatherSystem || null;
    this._windowTex = null;
    this._shaftMesh = null;
    this._buildRoom();
  }

  _buildRoom() {
    this._buildWall();
    this._buildFloor();
    this._buildDesk();
    this._buildWindow();
    this._buildCurtains();
    this._buildBookshelf();
    this._buildLamp();
    this._buildRug();
    this._buildWallArt();
    this._buildDeskItems();
    this._buildTableDecor();
    this._buildWallDecor();
    this._buildFloorPlants();
    this._buildAtmosphere();
  }

  // ── Wall — horizontal wood planks + wainscoting ──────────────────────────
  _buildWall() {
    const tex = makeTexture((ctx, w, h) => {
      const chairRailY = Math.floor(h * 0.52); // chair rail ~halfway up

      // ── Upper wall: horizontal wood planks ──
      const plankH = 20;
      const plankColors = ['#9a6224', '#8a5218', '#aa722c', '#9a621e'];
      for (let y = 0; y < chairRailY; y++) {
        const pi = Math.floor(y / plankH) % plankColors.length;
        const isGroove = (y % plankH) === plankH - 1;
        ctx.fillStyle = isGroove ? '#4a2208' : plankColors[pi];
        ctx.fillRect(0, y, w, 1);
      }
      // Grain streaks within planks
      for (let y = 0; y < chairRailY; y += plankH) {
        for (let gx = 0; gx < w; gx += 36 + Math.floor(Math.sin(y + gx) * 16)) {
          ctx.fillStyle = 'rgba(90,50,5,0.18)';
          ctx.fillRect(gx, y + 1, 1 + Math.floor(Math.sin(gx * 0.3) * 3), plankH - 2);
        }
      }

      // ── Chair rail ──
      ctx.fillStyle = '#f0e0a0';
      ctx.fillRect(0, chairRailY, w, 6);
      ctx.fillStyle = '#c8a050';
      ctx.fillRect(0, chairRailY + 6, w, 4);
      ctx.fillStyle = '#a07830';
      ctx.fillRect(0, chairRailY + 10, w, 2);

      // ── Lower wainscoting: darker wood with recessed panels ──
      ctx.fillStyle = '#6a4018';
      ctx.fillRect(0, chairRailY + 12, w, h - chairRailY - 12);

      const numPanels = 8;
      const panelW = Math.floor(w / numPanels);
      for (let p = 0; p < numPanels; p++) {
        const px = p * panelW + 6;
        const pw = panelW - 12;
        const pTop = chairRailY + 20;
        const pBot = h - 16;
        // Outer shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, pTop, pw, pBot - pTop);
        // Panel face (slightly lighter)
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(px + 4, pTop + 4, pw - 8, pBot - pTop - 8);
        // Panel highlight edge (top-left)
        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        ctx.fillRect(px + 4, pTop + 4, pw - 8, 2);
        ctx.fillRect(px + 4, pTop + 4, 2, pBot - pTop - 8);
      }

      // ── Baseboard ──
      ctx.fillStyle = '#f0e0a0';
      ctx.fillRect(0, h - 12, w, 6);
      ctx.fillStyle = '#b89040';
      ctx.fillRect(0, h - 6,  w, 6);
    }, 1024, 512);

    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1);
    const geo = new THREE.PlaneGeometry(56, 20);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(6, 3, -5);
    this.group.add(wall);
  }

  // ── Floor ─────────────────────────────────────────────────────────────────
  _buildFloor() {
    const tex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) {
        ctx.fillStyle = y % 32 === 0 ? '#6e4824' : '#5a3818';
        ctx.fillRect(0, y, w, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, y, w, 1);
        // grain
        for (let gx = 0; gx < w; gx += 24) {
          ctx.fillStyle = 'rgba(80,40,10,0.15)';
          ctx.fillRect(gx, y + 1, 1, 15);
        }
      }
    }, 256, 128);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 2);

    const geo = new THREE.PlaneGeometry(56, 12);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(6, -3.5, 2);
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  // ── Desk ──────────────────────────────────────────────────────────────────
  _buildDesk() {
    const woodTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#6a4820';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? 'rgba(120,70,10,0.3)' : 'rgba(60,30,0,0.2)';
        ctx.fillRect(0, y, w, 4);
      }
      // Top surface highlight
      ctx.fillStyle = 'rgba(255,200,80,0.08)';
      ctx.fillRect(0, 0, w, 8);
    }, 128, 64);
    const mat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });

    const topGeo = new THREE.BoxGeometry(50, 0.3, 5);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.set(5, -1.55, 0.5);
    top.castShadow = true;
    top.receiveShadow = true;
    this.group.add(top);

    // Desk apron (front panel below surface)
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.9 });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(50, 0.4, 0.1), apronMat);
    apron.position.set(5, -1.85, 2.95);
    this.group.add(apron);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x4a3010, roughness: 0.9 });
    [[-20, 2.5], [-20, -1.5], [30, 2.5], [30, -1.5]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 0.3), legMat);
      leg.position.set(x, -2.55, z);
      this.group.add(leg);
    });
  }

  // ── Window ────────────────────────────────────────────────────────────────
  _buildWindow() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a5420, roughness: 0.6 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.2, 0.15), frameMat);
    frame.position.set(-7, 2.1, -4.88);
    this.group.add(frame);

    const sillMat = new THREE.MeshStandardMaterial({ color: 0x9a7030, roughness: 0.6 });
    const sill = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.5), sillMat);
    sill.position.set(-7, -0.4, -4.65);
    this.group.add(sill);

    // Live animated sky via WeatherSystem canvas
    if (this._weather) {
      this._windowTex = new THREE.CanvasTexture(this._weather.getCanvas());
      this._windowTex.magFilter = THREE.NearestFilter;
      this._windowTex.minFilter = THREE.NearestFilter;
    } else {
      this._windowTex = makeTexture((ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1a6dbf'); g.addColorStop(1, '#7abde8');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }, 128, 192);
    }
    const glassMat = new THREE.MeshBasicMaterial({ map: this._windowTex, side: THREE.DoubleSide });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 4.6), glassMat);
    glass.position.set(-7, 2.1, -4.83);
    this.group.add(glass);

    // Window dividers in front of glass
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x6a4418, roughness: 0.5 });
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.1, 0.09), crossMat);
    hBar.position.set(-7, 2.1, -4.79);
    this.group.add(hBar);
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.8, 0.09), crossMat);
    vBar.position.set(-7, 2.1, -4.79);
    this.group.add(vBar);

    const innerSill = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.35), sillMat);
    innerSill.position.set(-7, -0.4, -4.65);
    this.group.add(innerSill);

    // Small potted plant on sill
    const potMat = new THREE.MeshStandardMaterial({ color: 0xb05828, roughness: 0.8 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.22, 7), potMat);
    pot.position.set(-6.4, -0.2, -4.62);
    this.group.add(pot);
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x286812, roughness: 0.9 });
    const plantBall = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), plantMat);
    plantBall.position.set(-6.4, 0.1, -4.62);
    this.group.add(plantBall);

    // Cat silhouette sitting on sill
    const catMat = new THREE.MeshStandardMaterial({ color: 0x180a04, roughness: 1.0 });
    const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), catMat);
    catBody.scale.set(1.3, 0.95, 0.85);
    catBody.position.set(-7.65, -0.18, -4.58);
    this.group.add(catBody);
    const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), catMat);
    catHead.position.set(-7.65, 0.10, -4.58);
    this.group.add(catHead);
    [-0.07, 0.07].forEach(dx => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 4), catMat);
      ear.position.set(-7.65 + dx, 0.25, -4.58);
      this.group.add(ear);
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.40, 6), catMat);
    tail.rotation.z = 0.9;
    tail.position.set(-7.95, -0.10, -4.58);
    this.group.add(tail);

    // Light shaft — opacity driven by time of day in update()
    const shaftTex = makeTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(255,240,160,0.32)');
      grad.addColorStop(0.6, 'rgba(255,230,140,0.10)');
      grad.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    }, 256, 128);
    const shaftMat = new THREE.MeshBasicMaterial({
      map: shaftTex, transparent: true, opacity: 0.0,
      side: THREE.DoubleSide, depthWrite: false
    });
    this._shaftMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), shaftMat);
    this._shaftMesh.position.set(-4.5, 1.5, -2.5);
    this._shaftMesh.rotation.y = Math.PI * 0.1;
    this.group.add(this._shaftMesh);
  }

  // ── Bookshelf ─────────────────────────────────────────────────────────────
  _buildBookshelf() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e10, roughness: 0.9 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.5, 0.85), woodMat);
    shelf.position.set(7, 0.5, -4.52);
    this.group.add(shelf);

    // Shelf boards (visible horizontal lines)
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x5a3c18, roughness: 0.85 });
    [-1.5, -0.3, 0.9, 2.1].forEach(sy => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.8), boardMat);
      board.position.set(7, sy + 0.5 - 0.5, -4.52);
      this.group.add(board);
    });

    const bookColors = [
      '#c04030','#d06020','#3858c0','#288040','#a02880',
      '#c0a818','#186888','#c05040','#5040a0','#28a050',
      '#d84020','#3898c8'
    ];
    const shelfYPositions = [-1.5, -0.3, 0.9, 2.1];

    shelfYPositions.forEach((sy, si) => {
      let bx = -1.8;
      let slotIdx = 0;

      // Leave a gap at right end of top two shelves for trinkets
      const maxBx = (si >= 2) ? 1.0 : 1.8;

      while (bx < maxBx) {
        const bw = 0.18 + Math.floor(slotIdx * 0.07) % 0.2;
        const bh = 0.65 + (slotIdx % 3) * 0.12;
        const col = bookColors[slotIdx % bookColors.length];
        const bMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
        const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.5), bMat);
        book.position.set(7 + bx + bw / 2, sy + 0.5 + bh / 2 - 0.5, -4.22);
        book.rotation.y = (slotIdx % 5 === 0) ? 0.08 : 0;
        this.group.add(book);
        bx += bw + 0.025;
        slotIdx++;
      }

      // Decorative item on top-two shelves (right side)
      if (si === 2) {
        // Small clay pot / vase
        const vaseMat = new THREE.MeshStandardMaterial({ color: 0xc07038, roughness: 0.8 });
        const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.35, 8), vaseMat);
        vase.position.set(7 + 1.45, sy + 0.5 + 0.18, -4.22);
        this.group.add(vase);
      }
      if (si === 3) {
        // Small clock face
        const clockTex = makeTexture((ctx, cw, ch) => {
          ctx.fillStyle = '#f8f0d8';
          ctx.fillRect(0, 0, cw, ch);
          ctx.strokeStyle = '#5a3010';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, cw - 2, ch - 2);
          // Clock face circle
          ctx.strokeStyle = '#4a2810';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cw / 2, ch / 2, cw * 0.38, 0, Math.PI * 2);
          ctx.stroke();
          // Hour marks
          for (let m = 0; m < 12; m++) {
            const a = (m / 12) * Math.PI * 2 - Math.PI / 2;
            const r1 = cw * 0.33, r2 = cw * 0.38;
            ctx.beginPath();
            ctx.moveTo(cw / 2 + Math.cos(a) * r1, ch / 2 + Math.sin(a) * r1);
            ctx.lineTo(cw / 2 + Math.cos(a) * r2, ch / 2 + Math.sin(a) * r2);
            ctx.strokeStyle = '#6a3818';
            ctx.lineWidth = m % 3 === 0 ? 2 : 1;
            ctx.stroke();
          }
          // Hands (set to ~10:10)
          ctx.strokeStyle = '#2a1008';
          ctx.lineWidth = 2;
          // Hour hand
          const ha = (-Math.PI / 2) + (10 / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cw / 2, ch / 2);
          ctx.lineTo(cw / 2 + Math.cos(ha) * cw * 0.22, ch / 2 + Math.sin(ha) * ch * 0.22);
          ctx.stroke();
          // Minute hand
          ctx.lineWidth = 1;
          const ma = (-Math.PI / 2) + (2 / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cw / 2, ch / 2);
          ctx.lineTo(cw / 2 + Math.cos(ma) * cw * 0.30, ch / 2 + Math.sin(ma) * ch * 0.30);
          ctx.stroke();
          ctx.fillStyle = '#c04020';
          ctx.beginPath();
          ctx.arc(cw / 2, ch / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }, 64, 64);

        const clockMat = new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.5 });
        const clock = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), clockMat);
        clock.position.set(7 + 1.45, sy + 0.5 + 0.28, -4.18);
        this.group.add(clock);
      }
    });
  }

  // ── Lamp ──────────────────────────────────────────────────────────────────
  _buildLamp() {
    // One lamp directly between T1 (x=0) and T2 (x=8), one between T2 and T3 (x=16)
    this._makeLamp(4, -1.4);
    this._makeLamp(12, -1.4);
  }

  _makeLamp(cx, cz) {
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x9a7030, roughness: 0.4, metalness: 0.5
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.1, 10), brassMat);
    base.position.set(cx, -1.4, cz);
    this.group.add(base);
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 10), brassMat);
    weight.position.set(cx, -1.28, cz);
    this.group.add(weight);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.6, 8), brassMat);
    pole.position.set(cx, -0.05, cz);
    this.group.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), brassMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(cx + 0.18, 1.25, cz);
    this.group.add(arm);

    const shadeTex = makeTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#d4b050');
      grad.addColorStop(1, '#a87c28');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(x, 0, 1, h);
      }
      ctx.fillStyle = 'rgba(255,220,120,0.3)';
      ctx.fillRect(0, h - 12, w, 12);
    }, 128, 64);

    const shadeMat = new THREE.MeshStandardMaterial({
      map: shadeTex, roughness: 0.7, side: THREE.DoubleSide,
      emissive: 0x443010, emissiveIntensity: 0.35
    });
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 10, 1, true), shadeMat);
    shade.position.set(cx, 1.28, cz);
    shade.rotation.x = Math.PI;
    this.group.add(shade);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfff0a0, transparent: true, opacity: 0.85
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), glowMat);
    glow.position.set(cx, 0.94, cz);
    glow.rotation.x = -Math.PI / 2;
    this.group.add(glow);

    // Warm point light under each lamp shade
    const bulb = new THREE.PointLight(0xffe080, 0.88, 8.5, 1.5);
    bulb.position.set(cx, 0.90, cz);
    this.group.add(bulb);
  }

  // ── Rug ───────────────────────────────────────────────────────────────────
  _buildRug() {
    const rugTex = makeTexture((ctx, w, h) => {
      // Deep burgundy base
      ctx.fillStyle = '#6a2818';
      ctx.fillRect(0, 0, w, h);

      // Concentric rectangle pattern (Stardew-style rug)
      const layers = [
        { inset: 4,  color: '#8a3828' },
        { inset: 12, color: '#7a2c20' },
        { inset: 18, color: '#c07840' },
        { inset: 22, color: '#8a3828' },
        { inset: 28, color: '#6a2818' },
        { inset: 32, color: '#c07840' },
      ];
      layers.forEach(({ inset, color }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      });

      // Inner diamond motif
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = '#d09850';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 28); ctx.lineTo(cx + 40, cy);
      ctx.lineTo(cx, cy + 28); ctx.lineTo(cx - 40, cy);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(200,140,60,0.3)';
      ctx.fill();
      // Center dot
      ctx.fillStyle = '#d09850';
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();

      // Corner motifs
      [[12,12],[w-12,12],[12,h-12],[w-12,h-12]].forEach(([x,y]) => {
        ctx.strokeStyle = '#d09850';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      });
    }, 256, 128);

    const geo = new THREE.PlaneGeometry(14, 5.5);
    const mat = new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 });
    const rug = new THREE.Mesh(geo, mat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, -3.48, 1.5);
    this.group.add(rug);
  }

  // ── Curtains ──────────────────────────────────────────────────────────────
  _buildCurtains() {
    const curtainTex = makeTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0,   '#a86830');
      grad.addColorStop(0.25,'#c88840');
      grad.addColorStop(0.5, '#d89850');
      grad.addColorStop(0.75,'#b87838');
      grad.addColorStop(1,   '#986028');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Vertical fold shadows (coarser = more fabric feel)
      for (let x = 0; x < w; x += 6) {
        const depth = Math.sin(x * 0.7) * 0.12 + 0.04;
        ctx.fillStyle = `rgba(0,0,0,${depth.toFixed(2)})`;
        ctx.fillRect(x, 0, 1, h);
      }
      // Subtle horizontal gather lines at top
      for (let y = 0; y < 24; y += 6) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, y, w, 1);
      }
    }, 64, 256);

    const mat = new THREE.MeshStandardMaterial({
      map: curtainTex, roughness: 0.95, side: THREE.DoubleSide
    });
    const leftGeo  = new THREE.PlaneGeometry(1.4, 5.4);
    const rightGeo = new THREE.PlaneGeometry(1.4, 5.4);

    this._leftCurtain = new THREE.Mesh(leftGeo, mat);
    this._leftCurtain.position.set(-8.3, 2.1, -4.82);
    this.group.add(this._leftCurtain);

    this._rightCurtain = new THREE.Mesh(rightGeo, mat.clone());
    this._rightCurtain.position.set(-5.7, 2.1, -4.82);
    this.group.add(this._rightCurtain);

    // Curtain rod
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.4, metalness: 0.5 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 8), rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(-7, 4.7, -4.82);
    this.group.add(rod);
    // Rod finials
    [-9.3, -4.7].forEach(rx => {
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), rodMat);
      fin.position.set(rx, 4.7, -4.82);
      this.group.add(fin);
    });
  }

  // ── Wall art — small framed painting ──────────────────────────────────────
  _buildWallArt() {
    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a5020, roughness: 0.6, metalness: 0.1 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.7, 0.1), frameMat);
    frame.position.set(-1.5, 4.2, -4.92);
    this.group.add(frame);

    // Painting canvas — a tiny stylized terrarium/nature scene
    const paintTex = makeTexture((ctx, w, h) => {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#a8c8e8');
      sky.addColorStop(1, '#d8e8f0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Rolling hills
      ctx.fillStyle = '#5a9030';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.quadraticCurveTo(w * 0.25, h * 0.35, w * 0.5, h * 0.50);
      ctx.quadraticCurveTo(w * 0.75, h * 0.62, w, h * 0.48);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

      // Darker foreground grass
      ctx.fillStyle = '#3a7018';
      ctx.fillRect(0, Math.floor(h * 0.72), w, h);

      // Tree (left)
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(Math.floor(w * 0.12), Math.floor(h * 0.38), 3, Math.floor(h * 0.35));
      ctx.fillStyle = '#2a6818';
      ctx.beginPath();
      ctx.arc(Math.floor(w * 0.135), Math.floor(h * 0.35), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8828';
      ctx.beginPath();
      ctx.arc(Math.floor(w * 0.12), Math.floor(h * 0.30), 6, 0, Math.PI * 2);
      ctx.fill();

      // Tree (right)
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(Math.floor(w * 0.72), Math.floor(h * 0.42), 2, Math.floor(h * 0.30));
      ctx.fillStyle = '#285820';
      ctx.beginPath();
      ctx.arc(Math.floor(w * 0.73), Math.floor(h * 0.38), 6, 0, Math.PI * 2);
      ctx.fill();

      // Sun (top-right)
      ctx.fillStyle = '#f8d040';
      ctx.beginPath();
      ctx.arc(Math.floor(w * 0.82), Math.floor(h * 0.18), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(248,208,64,0.4)';
      ctx.beginPath();
      ctx.arc(Math.floor(w * 0.82), Math.floor(h * 0.18), 10, 0, Math.PI * 2);
      ctx.fill();

      // Pixel art clouds
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      [[w * 0.3, h * 0.14], [w * 0.55, h * 0.08]].forEach(([cx, cy]) => {
        [[0,0],[10,0],[20,0],[4,-8],[14,-8],[10,-14]].forEach(([dx, dy]) => {
          ctx.fillRect(cx + dx - 4, cy + dy - 4, 12, 12);
        });
      });

      // Pixel border
      ctx.strokeStyle = '#c8a860';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }, 192, 128);

    const paintMat = new THREE.MeshStandardMaterial({ map: paintTex, roughness: 0.5 });
    const painting = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), paintMat);
    painting.position.set(-1.5, 4.2, -4.87);
    this.group.add(painting);
  }

  // ── Small desk items ───────────────────────────────────────────────────────
  _buildDeskItems() {
    // Coffee mug (left side of desk)
    const mugMat = new THREE.MeshStandardMaterial({ color: 0x4878c0, roughness: 0.6 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.28, 10), mugMat);
    mug.position.set(-12, -1.38, 0.2);
    this.group.add(mug);
    // Mug handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x4878c0, roughness: 0.6 });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 6, 8, Math.PI), handleMat);
    handle.position.set(-12.18, -1.38, 0.2);
    handle.rotation.y = Math.PI / 2;
    this.group.add(handle);
    // Liquid in mug
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x4a2808 });
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.set(-12, -1.26, 0.2);
    this.group.add(coffee);

    // Small notebook / papers on desk
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf5eed8, roughness: 0.9 });
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.9), paperMat);
    paper.position.set(-10, -1.54, 0.3);
    paper.rotation.y = 0.15;
    this.group.add(paper);
    // Lines on notebook
    const linesMat = new THREE.MeshStandardMaterial({ color: 0xc8b890, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.025), linesMat);
      line.position.set(-10, -1.52, 0.12 + i * 0.18);
      line.rotation.y = 0.15;
      this.group.add(line);
    }

    // Pencil
    const pencilMat = new THREE.MeshStandardMaterial({ color: 0xe8b820, roughness: 0.6 });
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6), pencilMat);
    pencil.rotation.z = Math.PI / 2;
    pencil.position.set(-10, -1.52, -0.15);
    this.group.add(pencil);
  }

  // ── Table decorations — household items spread left-to-right across desk ────
  // VISIBILITY RULE: camera FOV ≈ ±5.8 world-units from active terrarium x.
  //   T1(x=0) sees x≈[-5.8,5.8]. T2(x=8) sees x≈[2.2,13.8]. T3(x=16) sees x≈[10.2,21.8]
  //   Items MUST be at z ≥ -0.5 (front/mid desk) to avoid occlusion by terrarium frames.
  _buildTableDecor() {

    // ── CAT sleeping — 2× scale, breathing animation + sleep Zs ─────────────
    {
      const catMat  = new THREE.MeshStandardMaterial({ color: 0xb87848, roughness: 0.88 });
      const catDark = new THREE.MeshStandardMaterial({ color: 0x784820, roughness: 0.88 });
      const catPink = new THREE.MeshStandardMaterial({ color: 0xd09090, roughness: 0.9 });

      // Group pivot = old body centre; lifted so 2× body still rests on desk.
      // body half-height at 2× = 0.32 × 0.40 × 2 = 0.256 → pivot_y = -1.40 + 0.256 = -1.144
      this._catGroup = new THREE.Group();
      this._catGroup.scale.set(2, 2, 2);
      this._catGroup.position.set(-4.9, -1.144, 0.0); // slight right shift from -5.2
      this.group.add(this._catGroup);

      // Adds mesh at original absolute coords; converts to local relative to old body centre
      const addCat = (mesh, ax, ay, az) => {
        mesh.position.set(ax + 5.2, ay + 1.27, az);
        this._catGroup.add(mesh);
      };

      // Body
      this._catBodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), catMat);
      this._catBodyMesh.scale.set(1.05, 0.40, 0.82);
      addCat(this._catBodyMesh, -5.2, -1.27, 0.0);
      // Head resting on body toward camera
      const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.148, 8, 6), catMat);
      catHead.scale.set(1.0, 0.88, 1.0);
      addCat(catHead, -4.92, -1.21, 0.28);
      // Ears
      [[-0.06, 0.05], [0.06, 0.05]].forEach(([dx, dz]) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.090, 4), catMat);
        ear.rotation.z = dx * 1.3;
        addCat(ear, -4.92 + dx, -1.10, 0.28 + dz);
        const iEar = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.052, 4), catPink);
        iEar.rotation.z = dx * 1.3;
        addCat(iEar, -4.92 + dx * 0.6, -1.103, 0.28 + dz);
      });
      // Tail curled around body
      const catTail = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.036, 6, 14, Math.PI * 1.3), catMat);
      catTail.rotation.x = Math.PI / 2;
      catTail.rotation.z = 0.30;
      addCat(catTail, -5.00, -1.358, 0.0);
      // Tabby stripes
      for (let si = 0; si < 4; si++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.028, 0.40), catDark);
        addCat(stripe, -5.34 + si * 0.14, -1.22, 0.0);
      }
      // Closed eyes
      [-0.046, 0.046].forEach(dx => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.007), catDark);
        addCat(eye, -4.92 + dx, -1.192, 0.43);
      });
      // Nose
      const catNose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0xd06878, roughness: 0.9 }));
      catNose.scale.set(1.2, 0.65, 0.7);
      addCat(catNose, -4.92, -1.204, 0.435);
      // Paws tucked at front
      [-0.09, 0.09].forEach(dx => {
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4),
          new THREE.MeshStandardMaterial({ color: 0xc28858, roughness: 0.88 }));
        paw.scale.set(1.0, 0.46, 1.3);
        addCat(paw, -4.92 + dx, -1.36, 0.44);
      });

      // ── Sleep Z sprites ─────────────────────────────────────────────────
      // Head world pos at 2× group (-4.9,-1.144,0):
      //   head_local = (0.28, 0.06, 0.28) → world (-4.34, -1.024, 0.56)
      //   head top ≈ y = -0.764
      const makeZTex = text => {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx2d = c.getContext('2d');
        ctx2d.font = 'bold 42px sans-serif';
        ctx2d.fillStyle = '#ffffc0';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(text, 32, 32);
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.LinearFilter;
        return tex;
      };
      this._catZs = [
        { size: 0.10, text: 'z' },
        { size: 0.14, text: 'Z' },
        { size: 0.09, text: 'z' },
      ].map((cfg, i) => {
        const mat = new THREE.MeshBasicMaterial({
          map: makeZTex(cfg.text), transparent: true, opacity: 0,
          depthWrite: false, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.size, cfg.size), mat);
        this.group.add(mesh);
        return { mesh, phase: i / 3 };
      });
    }

    // ── CELL PHONE lying flat (x≈-3.5, z≈1.5) ───────────────────────────────
    // Visible from T1 view. Occasionally lights up with notification.
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.35, metalness: 0.3 });
    // Phone body (lying flat on desk)
    const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.014, 0.58), phoneMat);
    phoneBody.position.set(-3.5, -1.393, 1.5);
    this.group.add(phoneBody);
    // Thin metal frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x909098, roughness: 0.2, metalness: 0.8 });
    [[0.148, 0, 0.580], [-0.148, 0, 0.580]].forEach(([sx, sy, sz]) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.020, sz), frameMat);
      edge.position.set(-3.5 + sx, -1.386, 1.5);
      this.group.add(edge);
    });
    [[0.30, 0, 0.008], [0.30, 0, -0.008]].forEach(([sx, sy, dz]) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.020, 0.008), frameMat);
      edge.position.set(-3.5, -1.386, 1.5 + dz * 36);
      this.group.add(edge);
    });
    // Screen (top face — dark by default, lights up via animation)
    this._phoneScreenMat = new THREE.MeshStandardMaterial({
      color: 0x060810, roughness: 0.1, emissive: 0x000000, emissiveIntensity: 0
    });
    const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.53), this._phoneScreenMat);
    phoneScreen.rotation.x = -Math.PI / 2;
    phoneScreen.position.set(-3.5, -1.385, 1.5);
    this.group.add(phoneScreen);
    // Notification banner (small colored strip near top of screen, fades in)
    this._phoneNotifMat = new THREE.MeshBasicMaterial({
      color: 0x3366ff, transparent: true, opacity: 0.0, depthWrite: false
    });
    const notifBar = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.10), this._phoneNotifMat);
    notifBar.rotation.x = -Math.PI / 2;
    notifBar.position.set(-3.5, -1.383, 1.32);
    this.group.add(notifBar);
    // Subtle glow light from screen
    this._phoneLight = new THREE.PointLight(0x3355ff, 0.0, 2.0, 2.0);
    this._phoneLight.position.set(-3.5, -1.25, 1.5);
    this.group.add(this._phoneLight);

    // ── HOT MUG with animated steam (between T1/T2, x≈4.0, z≈1.15) ──────────
    // Sits ~a mug-width in front of the keys (z=0.8) and candle (z=0.9)
    const hotMugMat = new THREE.MeshStandardMaterial({
      color: 0xc87840, roughness: 0.65, emissive: 0x1a0a00, emissiveIntensity: 0.18
    });
    const hotMug = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.28, 10), hotMugMat);
    hotMug.position.set(4.0, -1.26, 1.15);
    this.group.add(hotMug);
    const hotHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.022, 6, 8, Math.PI), hotMugMat);
    hotHandle.position.set(3.82, -1.26, 1.15);
    hotHandle.rotation.y = Math.PI / 2;
    this.group.add(hotHandle);
    const teaSurface = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10),
      new THREE.MeshStandardMaterial({ color: 0x7a3818, roughness: 0.4 }));
    teaSurface.rotation.x = -Math.PI / 2;
    teaSurface.position.set(4.0, -1.12, 1.15);
    this.group.add(teaSurface);
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4a868, roughness: 0.75 }));
    saucer.position.set(4.0, -1.405, 1.15);
    this.group.add(saucer);
    // Steam puffs (animated)
    this._steamPuffs = [];
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.036 + i * 0.016, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0xeeeedd, transparent: true, opacity: 0.0, depthWrite: false })
      );
      const bx = 4.0 + (i - 1) * 0.055;
      puff.position.set(bx, -1.10, 1.15);
      this.group.add(puff);
      this._steamPuffs.push({ mesh: puff, baseY: -1.10, baseX: bx, phase: i * 0.95 });
    }

    // ── HOUSE KEYS on key ring (gap T1/T2, x≈4.2, z≈0.8) ────────────────────
    // Visible from T1 and T2 views. Keys made larger for readability.
    const kRingMat = new THREE.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.25, metalness: 0.9 });
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 7, 14), kRingMat);
    keyRing.rotation.x = -Math.PI / 2;
    keyRing.position.set(4.2, -1.384, 0.8);
    this.group.add(keyRing);
    // Brass house key
    const k1M = new THREE.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.25, metalness: 0.9 });
    const k1Stem = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.22), k1M);
    k1Stem.position.set(4.00, -1.382, 0.68);
    this.group.add(k1Stem);
    const k1Bow = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.014, 6, 10), k1M);
    k1Bow.rotation.x = -Math.PI / 2;
    k1Bow.position.set(4.00, -1.382, 0.545);
    this.group.add(k1Bow);
    // Teeth notch on key
    [0.62, 0.67, 0.73, 0.79].forEach(z => {
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.010, 0.020), k1M);
      notch.position.set(4.016, -1.378, z);
      this.group.add(notch);
    });
    // Silver key, angled slightly
    const k2M = new THREE.MeshStandardMaterial({ color: 0xb4b8c0, roughness: 0.18, metalness: 0.95 });
    const k2Stem = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.19), k2M);
    k2Stem.rotation.y = 0.30;
    k2Stem.position.set(4.22, -1.381, 0.87);
    this.group.add(k2Stem);
    const k2Bow = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 10), k2M);
    k2Bow.rotation.x = -Math.PI / 2;
    k2Bow.rotation.z = 0.30;
    k2Bow.position.set(4.24, -1.381, 0.99);
    this.group.add(k2Bow);
    // Colorful key fob on ring
    const fobMesh = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.007, 0.088),
      new THREE.MeshStandardMaterial({ color: 0x2050a8, roughness: 0.6 }));
    fobMesh.position.set(4.30, -1.382, 0.77);
    this.group.add(fobMesh);

    // ── LOOSE CHANGE — scattered coins (gap T1/T2, x≈5.5, z≈0.5–0.9) ─────────
    // Visible from T1 and T2 views.
    const goldCoin = new THREE.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.25, metalness: 0.9 });
    const silvCoin = new THREE.MeshStandardMaterial({ color: 0xb0b4c0, roughness: 0.20, metalness: 0.95 });
    const copCoin  = new THREE.MeshStandardMaterial({ color: 0xb06028, roughness: 0.30, metalness: 0.8 });
    [
      { x: 5.42, z: 0.52, r: 0.072, mat: goldCoin },
      { x: 5.60, z: 0.68, r: 0.055, mat: silvCoin },
      { x: 5.28, z: 0.75, r: 0.062, mat: silvCoin },
      { x: 5.70, z: 0.45, r: 0.068, mat: goldCoin },
      { x: 5.50, z: 0.88, r: 0.048, mat: copCoin  },
      { x: 5.38, z: 0.56, r: 0.040, mat: copCoin  },
    ].forEach(({ x, z, r, mat }) => {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.011, 11), mat);
      coin.position.set(x, -1.3945, z);
      this.group.add(coin);
    });

    // ── SEED JAR — small glass jar (gap T1/T2, x≈3.5, z≈1.4) ────────────────
    // At front of gap, clearly visible from T1 and T2.
    const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.090, 0.24, 12),
      new THREE.MeshPhysicalMaterial({ color: 0xaaccaa, transparent: true, opacity: 0.52, roughness: 0.04 }));
    jarBody.position.set(3.5, -1.28, 1.4);
    this.group.add(jarBody);
    const jarLid = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.094, 0.044, 12),
      new THREE.MeshStandardMaterial({ color: 0x8a6030, roughness: 0.55 }));
    jarLid.position.set(3.5, -1.148, 1.4);
    this.group.add(jarLid);
    const jarSeeds = new THREE.Mesh(new THREE.CylinderGeometry(0.080, 0.080, 0.075, 12),
      new THREE.MeshStandardMaterial({ color: 0x6a4820, roughness: 1.0 }));
    jarSeeds.position.set(3.5, -1.352, 1.4);
    this.group.add(jarSeeds);

    // ── WALLET (gap T2/T3, x≈11.5, z≈1.2) ───────────────────────────────────
    // Visible from T2 and T3 views.
    const walletMat = new THREE.MeshStandardMaterial({ color: 0x2a1408, roughness: 0.82 });
    const walletBody = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.034, 0.28), walletMat);
    walletBody.position.set(11.5, -1.383, 1.2);
    walletBody.rotation.y = 0.18;
    this.group.add(walletBody);
    // Stitching line
    const stitchMat = new THREE.MeshStandardMaterial({ color: 0x6a4a28, roughness: 1.0 });
    const stitchLine = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.006, 0.005), stitchMat);
    stitchLine.position.set(11.5, -1.365, 1.196);
    stitchLine.rotation.y = 0.18;
    this.group.add(stitchLine);
    // Card peeking out of wallet
    const cardMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f8, roughness: 0.65 });
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.006, 0.14), cardMat);
    card.position.set(11.5, -1.362, 1.19);
    card.rotation.y = 0.18;
    this.group.add(card);
    const cardStripe = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.007, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x2040a0, roughness: 0.6 }));
    cardStripe.position.set(11.5, -1.360, 1.208);
    cardStripe.rotation.y = 0.18;
    this.group.add(cardStripe);
    // Clasp
    const clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 8),
      new THREE.MeshStandardMaterial({ color: 0xc8a030, roughness: 0.3, metalness: 0.7 }));
    clasp.rotation.z = Math.PI / 2;
    clasp.position.set(11.5, -1.364, 1.195);
    this.group.add(clasp);

    // ── SPRAY BOTTLE (gap T2/T3, x≈12.5, z≈0.6) ─────────────────────────────
    // Visible from T2 and T3 views.
    const sprMat = new THREE.MeshStandardMaterial({ color: 0x508848, roughness: 0.5 });
    const sprBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.082, 0.36, 9), sprMat);
    sprBody.position.set(12.5, -1.22, 0.6);
    this.group.add(sprBody);
    const sprNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.065, 0.065, 9), sprMat);
    sprNeck.position.set(12.5, -1.04, 0.6);
    this.group.add(sprNeck);
    const sprHead = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.060, 0.072), sprMat);
    sprHead.position.set(12.5, -0.972, 0.6);
    this.group.add(sprHead);
    const sprNoz = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.10, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.5 }));
    sprNoz.rotation.z = -Math.PI / 2;
    sprNoz.position.set(-12.448, -0.972, 0.6);
    sprNoz.position.x = 12.448 + 0.10 / 2; // nozzle extends to the left
    this.group.add(sprNoz);

    // ── ALARM CLOCK (right of T3, x≈19.5, z≈0.9) ────────────────────────────
    // Visible from T3 view. Case faces camera (+z direction).
    const clkCase = new THREE.Mesh(new THREE.CylinderGeometry(0.130, 0.135, 0.078, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.75 }));
    clkCase.rotation.x = Math.PI / 2;   // flat caps face ±z; front cap faces camera
    clkCase.position.set(19.5, -1.358, 0.9);
    this.group.add(clkCase);
    const clkFace = new THREE.Mesh(new THREE.CircleGeometry(0.122, 14),
      new THREE.MeshStandardMaterial({ color: 0xf5eed8, roughness: 0.65,
        emissive: 0x554428, emissiveIntensity: 0.12 }));
    clkFace.position.set(19.5, -1.358, 0.941); // front face toward camera
    this.group.add(clkFace);
    // Hour markers (12 dots)
    for (let m = 0; m < 12; m++) {
      const a = (m / 12) * Math.PI * 2 - Math.PI / 2;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.009, 5),
        new THREE.MeshBasicMaterial({ color: 0x2a1800 }));
      dot.position.set(19.5 + Math.cos(a) * 0.098, -1.358 + Math.sin(a) * 0.098, 0.942);
      this.group.add(dot);
    }
    const clkHMat = new THREE.MeshStandardMaterial({ color: 0x1a0800 });
    const clkHour = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.074, 0.005), clkHMat);
    clkHour.position.set(19.5, -1.358, 0.943);
    clkHour.rotation.z = -0.52;
    this.group.add(clkHour);
    const clkMin = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.102, 0.005), clkHMat);
    clkMin.position.set(19.5, -1.358, 0.943);
    clkMin.rotation.z = 1.10;
    this.group.add(clkMin);
    // Legs (two small feet)
    [-0.072, 0.072].forEach(dx => {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.75 }));
      leg.position.set(19.5 + dx, -1.435, 0.9);
      this.group.add(leg);
    });
    // Bell tops (two gold hemispheres)
    [-0.074, 0.074].forEach(dx => {
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.034, 7, 4),
        new THREE.MeshStandardMaterial({ color: 0x9a7030, roughness: 0.35, metalness: 0.6 }));
      bell.position.set(19.5 + dx, -1.248, 0.9);
      this.group.add(bell);
    });

    // ── INCENSE holder + animated smoke (x≈20.5, z≈0.3) — already visible ────
    const holderMat = new THREE.MeshStandardMaterial({ color: 0x3a2208, roughness: 0.88 });
    const holderBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.042, 0.108), holderMat);
    holderBase.position.set(20.5, -1.379, 0.3);
    this.group.add(holderBase);
    [-0.30, 0.30].forEach(dx => {
      const end = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.068, 0.108), holderMat);
      end.position.set(20.5 + dx, -1.362, 0.3);
      this.group.add(end);
    });
    const ashGroove = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.006, 0.062),
      new THREE.MeshStandardMaterial({ color: 0xa09080, roughness: 1.0 }));
    ashGroove.position.set(20.5, -1.353, 0.3);
    this.group.add(ashGroove);
    const incStick = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.58, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a1808, roughness: 0.9 }));
    incStick.rotation.z = Math.PI / 2;
    incStick.position.set(20.5, -1.338, 0.3);
    this.group.add(incStick);
    const ashTip = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.038, 5),
      new THREE.MeshStandardMaterial({ color: 0xbcb4a8, roughness: 1.0 }));
    ashTip.rotation.z = Math.PI / 2;
    ashTip.position.set(20.77, -1.338, 0.3);
    this.group.add(ashTip);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.011, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xff5010, transparent: true, opacity: 0.9 }));
    ember.position.set(20.79, -1.332, 0.3);
    this.group.add(ember);
    this._incenseTip = ember;
    const incLight = new THREE.PointLight(0xff4010, 0.20, 1.6, 2.0);
    incLight.position.set(20.79, -1.30, 0.3);
    this.group.add(incLight);
    this._incenseLight = incLight;
    this._incenseSmoke = [];
    for (let si = 0; si < 5; si++) {
      const maxOp = 0.16 - si * 0.022;
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.016 + si * 0.011, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0xd0c8bc, transparent: true, opacity: 0.0, depthWrite: false })
      );
      wisp.position.set(20.79, -1.322 + si * 0.105, 0.3);
      this.group.add(wisp);
      this._incenseSmoke.push({ mesh: wisp, baseY: -1.322 + si * 0.105, baseX: 20.79, phase: si * 0.62, maxOp });
    }
  }

  // ── Wall decorations — poster, photos, paintings ──────────────────────────
  _buildWallDecor() {
    const WZ = -4.87; // wall face z (just in front of the wall plane)

    // ── Botanical poster (left side, between window and existing painting) ──
    const posterTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f5edd8'; ctx.fillRect(0, 0, w, h);
      // Paper grain
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = `rgba(140,110,70,${0.02 + Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // Double border
      ctx.strokeStyle = '#5a3820'; ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.lineWidth = 1; ctx.strokeRect(9, 9, w - 18, h - 18);
      // Title
      ctx.fillStyle = '#3a2010'; ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace'; ctx.fillText('BOTANICA', w / 2, 25);
      ctx.font = '6px monospace';      ctx.fillText('Illustrated Studies', w / 2, 34);
      // Central stem
      ctx.strokeStyle = '#3a6820'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w / 2, h - 18); ctx.lineTo(w / 2, h * 0.32); ctx.stroke();
      // Alternating fronds
      [[0.84,-1,20],[0.76,1,18],[0.67,-1,16],[0.59,1,14],[0.51,-1,12],[0.43,1,10],[0.37,-1,9]].forEach(([ty, side, len]) => {
        const y = h * ty, x = w / 2;
        ctx.strokeStyle = '#4a8830'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + side * len * 0.6, y - 3, x + side * len, y - 9);
        ctx.stroke();
        for (let j = 1; j <= 3; j++) {
          const t = j / 4;
          ctx.fillStyle = j % 2 === 0 ? '#5a9840' : '#3a7828';
          ctx.beginPath();
          ctx.ellipse(x + side * len * t * 0.9, y + (y - 9 - y) * t - 2, 3.5, 2, side * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      // Top spray
      for (let i = -2; i <= 2; i++) {
        ctx.strokeStyle = '#5a9840'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w / 2, h * 0.33);
        ctx.quadraticCurveTo(w / 2 + i * 6, h * 0.24, w / 2 + i * 12, h * 0.18 - Math.abs(i) * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#5a3820'; ctx.font = '5px monospace';
      ctx.fillText('Pteridophyta — Plate I', w / 2, h - 13);
      ctx.fillText('1893', w / 2, h - 5);
    }, 96, 130);

    const pFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e0e06, roughness: 0.7 });
    const pFrame = new THREE.Mesh(new THREE.BoxGeometry(1.66, 2.26, 0.09), pFrameMat);
    pFrame.position.set(-4.6, 4.3, WZ - 0.04);
    this.group.add(pFrame);
    const posterMat = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.55 });
    const posterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 1.95), posterMat);
    posterMesh.position.set(-4.6, 4.3, WZ);
    this.group.add(posterMesh);

    // ── Photo cluster (3 small framed photos, center-right of wall) ──────────
    const photos = [
      // Photo A — cozy coffee mug
      { x: -1.0, y: 6.0, rz: -0.06, pw: 72, ph: 58,
        draw(ctx, w, h) {
          ctx.fillStyle = '#f0e8d8'; ctx.fillRect(0, 0, w, h);
          // Table surface
          ctx.fillStyle = '#c8a870'; ctx.fillRect(0, Math.floor(h * 0.62), w, h);
          // Mug body
          ctx.fillStyle = '#dcc8a8';
          ctx.fillRect(Math.floor(w * 0.35), Math.floor(h * 0.28), Math.floor(w * 0.3), Math.floor(h * 0.38));
          ctx.fillStyle = '#c4a888';
          ctx.fillRect(Math.floor(w * 0.35), Math.floor(h * 0.28), Math.floor(w * 0.3), 4);
          // Coffee surface
          ctx.fillStyle = '#6a3818';
          ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.35, w * 0.13, 4, 0, 0, Math.PI * 2); ctx.fill();
          // Handle arc
          ctx.strokeStyle = '#c4a888'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(w * 0.675, h * 0.44, 7, -1.1, 1.1); ctx.stroke();
          // Steam wisps
          ctx.strokeStyle = 'rgba(210,195,175,0.55)'; ctx.lineWidth = 1.2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(w * 0.42 + i * 8, h * 0.26);
            ctx.quadraticCurveTo(w * 0.38 + i * 8, h * 0.18, w * 0.43 + i * 8, h * 0.10);
            ctx.stroke();
          }
          // Vignette
          const v = ctx.createRadialGradient(w/2, h/2, w*0.1, w/2, h/2, w*0.75);
          v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(50,25,5,0.28)');
          ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        }
      },
      // Photo B — rainy window view
      { x: 2.0, y: 6.0, rz: 0.05, pw: 62, ph: 74,
        draw(ctx, w, h) {
          const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
          sky.addColorStop(0, '#b8ccd8'); sky.addColorStop(1, '#dce8f0');
          ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.75);
          ctx.fillStyle = '#6a8850'; ctx.fillRect(0, Math.floor(h * 0.72), w, h);
          ctx.fillStyle = '#3a5830'; ctx.fillRect(0, Math.floor(h * 0.84), w, h);
          // Tree
          ctx.fillStyle = '#2e4828';
          ctx.fillRect(Math.floor(w*0.20), Math.floor(h*0.36), 5, Math.floor(h*0.38));
          ctx.beginPath(); ctx.arc(w*0.225, h*0.33, 10, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(w*0.18,  h*0.27, 7,  0, Math.PI*2); ctx.fill();
          // Window frame overlay
          ctx.strokeStyle = '#c8bfa8'; ctx.lineWidth = 5;
          ctx.strokeRect(0, 0, w, h);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, h*0.5); ctx.lineTo(w, h*0.5); ctx.stroke();
          // Rain drops
          ctx.fillStyle = 'rgba(160,190,220,0.5)';
          [[w*0.2,h*0.14],[w*0.72,h*0.08],[w*0.42,h*0.3],[w*0.82,h*0.22],[w*0.12,h*0.4]].forEach(([rx,ry]) => {
            ctx.beginPath(); ctx.ellipse(rx, ry, 1.4, 3.0, 0.2, 0, Math.PI*2); ctx.fill();
          });
        }
      },
      // Photo C — plant close-up
      { x: 2.65, y: 4.35, rz: -0.03, pw: 66, ph: 56,
        draw(ctx, w, h) {
          ctx.fillStyle = '#e4ede0'; ctx.fillRect(0, 0, w, h);
          // Soft bokeh blobs
          ['rgba(150,195,130,0.22)','rgba(175,215,155,0.16)','rgba(130,175,110,0.20)'].forEach((c, i) => {
            ctx.fillStyle = c; ctx.beginPath();
            ctx.arc(w*(0.18+i*0.32), h*(0.28+i*0.12), 14+i*5, 0, Math.PI*2); ctx.fill();
          });
          // Terracotta pot
          ctx.fillStyle = '#c07848';
          ctx.beginPath();
          ctx.moveTo(w*0.36,h*0.92); ctx.lineTo(w*0.64,h*0.92);
          ctx.lineTo(w*0.60,h*0.62); ctx.lineTo(w*0.40,h*0.62); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#a86038';
          ctx.fillRect(Math.floor(w*0.33), Math.floor(h*0.58), Math.ceil(w*0.34), Math.ceil(h*0.07));
          // Leaves
          [[-0.02,0.56,-0.4,13],[0.1,0.48,-0.85,11],[0.12,0.42,0.65,11],
           [0,0.32,-0.12,15],[-0.12,0.37,-1.15,9],[0.14,0.36,1.05,9]].forEach(([px,py,angle,size], i) => {
            ctx.fillStyle = i%2===0 ? '#3a8828' : '#4a9835';
            ctx.save(); ctx.translate(w*(0.5+px), h*py); ctx.rotate(angle);
            ctx.beginPath(); ctx.ellipse(0, -size*0.5, size*0.32, size*0.52, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
          });
          // Vignette
          const v = ctx.createRadialGradient(w/2,h/2,8, w/2,h/2,w*0.8);
          v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.2)');
          ctx.fillStyle = v; ctx.fillRect(0,0,w,h);
        }
      }
    ];

    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 });
    photos.forEach(({ x, y, rz, pw, ph, draw }) => {
      const tex = makeTexture(draw, pw, ph);
      const ww = pw / 50, wh = ph / 50;
      // Dark frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.20, wh + 0.20, 0.06), darkFrameMat);
      frame.position.set(x, y, WZ - 0.04); frame.rotation.z = rz;
      this.group.add(frame);
      // White mat
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(ww + 0.08, wh + 0.08),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7 }));
      mat.position.set(x, y, WZ + 0.005); mat.rotation.z = rz;
      this.group.add(mat);
      // Photo surface
      const img = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      img.position.set(x, y, WZ + 0.01); img.rotation.z = rz;
      this.group.add(img);
    });

    // ── Abstract painting — Rothko-style (right side, past bookshelf) ─────────
    const rothkoTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#100808'; ctx.fillRect(0, 0, w, h);
      // Top band — deep crimson
      const b1 = ctx.createLinearGradient(0, 0, 0, h * 0.44);
      b1.addColorStop(0, '#781020'); b1.addColorStop(0.65, '#b82030'); b1.addColorStop(1, 'rgba(140,24,36,0.3)');
      ctx.fillStyle = b1; ctx.fillRect(10, 6, w - 20, Math.floor(h * 0.46));
      // Middle band — amber
      const b2 = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.72);
      b2.addColorStop(0, 'rgba(185,110,18,0.4)'); b2.addColorStop(0.35, '#c07820');
      b2.addColorStop(0.7, '#d08830'); b2.addColorStop(1, 'rgba(165,95,15,0.35)');
      ctx.fillStyle = b2; ctx.fillRect(10, Math.floor(h*0.40), w-20, Math.floor(h*0.33));
      // Bottom band — warm ochre
      const b3 = ctx.createLinearGradient(0, h * 0.66, 0, h);
      b3.addColorStop(0, 'rgba(130,75,10,0.45)'); b3.addColorStop(0.45, '#9a5c14');
      b3.addColorStop(1, '#6a3a0c');
      ctx.fillStyle = b3; ctx.fillRect(10, Math.floor(h*0.67), w-20, Math.floor(h*0.28));
      // Left/right edge vignette
      const ev = ctx.createLinearGradient(0, 0, w, 0);
      ev.addColorStop(0, 'rgba(8,4,2,0.40)'); ev.addColorStop(0.07, 'rgba(8,4,2,0)');
      ev.addColorStop(0.93, 'rgba(8,4,2,0)'); ev.addColorStop(1, 'rgba(8,4,2,0.40)');
      ctx.fillStyle = ev; ctx.fillRect(0, 0, w, h);
    }, 192, 130);

    const rFrameMat = new THREE.MeshStandardMaterial({ color: 0x0e0806, roughness: 0.5, metalness: 0.15 });
    const rFrame = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.60, 0.12), rFrameMat);
    rFrame.position.set(11.0, 3.5, WZ - 0.05);
    this.group.add(rFrame);
    const rothkoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.36),
      new THREE.MeshStandardMaterial({ map: rothkoTex, roughness: 0.38 }));
    rothkoMesh.position.set(11.0, 3.5, WZ);
    this.group.add(rothkoMesh);
    // Small brass label plaque
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xb08030, roughness: 0.25, metalness: 0.75 }));
    plaque.position.set(11.0, 2.66, WZ);
    this.group.add(plaque);

    // ── RIGHT-SIDE WALL ART (x ≈ 13 – 26) ───────────────────────────────────
    // Carefully positioned so nothing overlaps.

    // 1. Vintage mountain travel poster — x=13.8, y=4.5
    //    Frame footprint: x 12.75–14.85, y 3.025–5.975
    const mountainTex = makeTexture((ctx, w, h) => {
      // Aged paper
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#f0e8d0'); bg.addColorStop(1, '#e8dcc0');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // Outer border
      ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.lineWidth = 1; ctx.strokeRect(8, 8, w - 16, h - 16);
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 14, 0, h * 0.6);
      sky.addColorStop(0, '#7ab0d8'); sky.addColorStop(1, '#c8dff0');
      ctx.fillStyle = sky; ctx.fillRect(10, 14, w - 20, Math.floor(h * 0.62) - 14);
      // Snow peaks
      const peaks = [[w*0.18,h*0.28],[w*0.35,h*0.18],[w*0.52,h*0.24],[w*0.68,h*0.15],[w*0.84,h*0.22]];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(10, h * 0.52);
      peaks.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(w - 10, h * 0.5); ctx.lineTo(w - 10, h * 0.62); ctx.lineTo(10, h * 0.62);
      ctx.closePath(); ctx.fill();
      // Shadow on peaks
      ctx.fillStyle = '#c0d8e8';
      ctx.beginPath(); ctx.moveTo(w*0.35, h*0.18);
      ctx.lineTo(w*0.44, h*0.38); ctx.lineTo(w*0.52, h*0.24); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w*0.68, h*0.15);
      ctx.lineTo(w*0.76, h*0.36); ctx.lineTo(w*0.84, h*0.22); ctx.closePath(); ctx.fill();
      // Forest silhouette
      ctx.fillStyle = '#284820';
      ctx.fillRect(10, Math.floor(h * 0.58), w - 20, Math.floor(h * 0.12));
      for (let tx = 12; tx < w - 12; tx += 7) {
        const th = 10 + Math.floor(Math.sin(tx * 0.9) * 5);
        ctx.beginPath(); ctx.moveTo(tx, h * 0.6);
        ctx.lineTo(tx + 3.5, h * 0.6 - th); ctx.lineTo(tx + 7, h * 0.6);
        ctx.closePath(); ctx.fill();
      }
      // Meadow
      ctx.fillStyle = '#4a7828'; ctx.fillRect(10, Math.floor(h*0.68), w - 20, h - Math.floor(h*0.68) - 10);
      // Title text
      ctx.fillStyle = '#1a0c06'; ctx.textAlign = 'center';
      ctx.font = 'bold 9px monospace'; ctx.fillText('ALPINE', w/2, h*0.82);
      ctx.font = 'bold 11px monospace'; ctx.fillText('RETREAT', w/2, h*0.88);
      ctx.font = '5px monospace'; ctx.fillStyle = '#5a3820';
      ctx.fillText('SUMMER SEASON', w/2, h*0.94);
    }, 110, 155);
    this.group.add((() => {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.95, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.6 }));
      fm.position.set(13.8, 4.5, WZ - 0.05); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 2.6),
        new THREE.MeshStandardMaterial({ map: mountainTex, roughness: 0.55 }));
      pm.position.set(13.8, 4.5, WZ); return pm;
    })());

    // 2. Small pastoral landscape photo — x=16.3, y=5.5
    //    Frame footprint: x 15.725–16.875, y 5.025–5.975
    const landscapeTex = makeTexture((ctx, w, h) => {
      // Golden hour sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#f0c060'); sky.addColorStop(0.5, '#f8d880'); sky.addColorStop(1, '#e8f0a0');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // Rolling hill
      ctx.fillStyle = '#5a8830';
      ctx.beginPath(); ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w*0.3, h*0.42, w*0.6, h*0.55);
      ctx.quadraticCurveTo(w*0.8, h*0.62, w, h*0.5);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a6018';
      ctx.fillRect(0, Math.floor(h * 0.78), w, h);
      // Tree
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(Math.floor(w*0.72), Math.floor(h*0.38), 3, Math.floor(h*0.4));
      ctx.fillStyle = '#284810';
      ctx.beginPath(); ctx.arc(w*0.735, h*0.33, 8, 0, Math.PI*2); ctx.fill();
      // Sun
      ctx.fillStyle = '#f8d820';
      ctx.beginPath(); ctx.arc(w*0.18, h*0.15, 7, 0, Math.PI*2); ctx.fill();
      // Warm vignette
      const v = ctx.createRadialGradient(w/2,h/2,5, w/2,h/2,w*0.7);
      v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(80,40,0,0.3)');
      ctx.fillStyle = v; ctx.fillRect(0,0,w,h);
    }, 58, 46);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.93, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 }));
      fm.position.set(16.3, 5.5, WZ - 0.04); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.03, 0.81),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7 }));
      wm.position.set(16.3, 5.5, WZ + 0.005); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.87, 0.65),
        new THREE.MeshStandardMaterial({ map: landscapeTex, roughness: 0.5 }));
      pm.position.set(16.3, 5.5, WZ + 0.01); this.group.add(pm);
    }

    // 3. Small cat-in-window photo — x=18.0, y=4.25
    //    Frame footprint: x 17.5–18.5, y 3.75–4.75
    const catPhotoTex = makeTexture((ctx, w, h) => {
      // Warm backlight window
      const bg = ctx.createRadialGradient(w*0.5, h*0.4, 2, w*0.5, h*0.35, w*0.65);
      bg.addColorStop(0, '#f8e898'); bg.addColorStop(0.5, '#e0c870'); bg.addColorStop(1, '#988040');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // Window frame
      ctx.fillStyle = '#6a5030';
      ctx.fillRect(0, 0, w, 4); ctx.fillRect(0, h-4, w, 4);
      ctx.fillRect(0, 0, 4, h); ctx.fillRect(w-4, 0, 4, h);
      ctx.fillRect(w/2-2, 0, 4, h); ctx.fillRect(0, h*0.48-2, w, 4);
      // Cat silhouette
      ctx.fillStyle = '#0e0806';
      // Body
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.68, w*0.2, h*0.16, 0, 0, Math.PI*2); ctx.fill();
      // Head
      ctx.beginPath(); ctx.arc(w*0.5, h*0.46, w*0.14, 0, Math.PI*2); ctx.fill();
      // Ears
      ctx.beginPath(); ctx.moveTo(w*0.38, h*0.36); ctx.lineTo(w*0.34, h*0.25); ctx.lineTo(w*0.44, h*0.35); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w*0.62, h*0.36); ctx.lineTo(w*0.66, h*0.25); ctx.lineTo(w*0.56, h*0.35); ctx.fill();
      // Tail curl
      ctx.strokeStyle = '#0e0806'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w*0.7, h*0.72);
      ctx.quadraticCurveTo(w*0.88, h*0.65, w*0.82, h*0.52); ctx.stroke();
      // Eye glints
      ctx.fillStyle = 'rgba(255,220,50,0.7)';
      ctx.beginPath(); ctx.ellipse(w*0.44, h*0.44, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*0.56, h*0.44, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
    }, 50, 50);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 }));
      fm.position.set(18.0, 4.25, WZ - 0.04); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.7 }));
      wm.position.set(18.0, 4.25, WZ + 0.005); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.74),
        new THREE.MeshStandardMaterial({ map: catPhotoTex, roughness: 0.5 }));
      pm.position.set(18.0, 4.25, WZ + 0.01); this.group.add(pm);
    }

    // 4. Watercolour flowers painting — x=20.5, y=4.3
    //    Frame footprint: x 19.5–21.5, y 3.525–5.075
    const flowersTex = makeTexture((ctx, w, h) => {
      // Soft cream background with watercolour wash
      ctx.fillStyle = '#f8f4ec'; ctx.fillRect(0, 0, w, h);
      const wash = ctx.createLinearGradient(0, 0, w, h);
      wash.addColorStop(0, 'rgba(220,235,225,0.4)'); wash.addColorStop(1, 'rgba(240,220,230,0.3)');
      ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
      // Stems
      ctx.strokeStyle = '#4a7030'; ctx.lineWidth = 1.5;
      [[w*0.28,h*0.88,w*0.22,h*0.5],[w*0.45,h*0.9,w*0.42,h*0.45],[w*0.62,h*0.88,w*0.65,h*0.48],
       [w*0.75,h*0.85,w*0.8,h*0.55],[w*0.15,h*0.9,w*0.12,h*0.6]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo((x1+x2)/2+8, (y1+y2)/2, x2,y2); ctx.stroke();
      });
      // Leaves
      ctx.fillStyle = 'rgba(70,120,55,0.55)';
      [[w*0.32,h*0.7,-0.5],[w*0.24,h*0.65,0.6],[w*0.55,h*0.68,-0.3],[w*0.7,h*0.72,0.4]].forEach(([lx,ly,a]) => {
        ctx.save(); ctx.translate(lx,ly); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0,-8,4,11,0,0,Math.PI*2); ctx.fill(); ctx.restore();
      });
      // Flowers — pinks, lavender, white, peach
      const flowers = [
        {cx:w*0.28,cy:h*0.46,r:9,petals:5,col:'rgba(220,120,150,0.75)',center:'#f8d820'},
        {cx:w*0.44,cy:h*0.42,r:11,petals:6,col:'rgba(180,140,210,0.70)',center:'#fff8a0'},
        {cx:w*0.65,cy:h*0.44,r:10,petals:5,col:'rgba(240,175,185,0.72)',center:'#f8e060'},
        {cx:w*0.78,cy:h*0.50,r:7, petals:5,col:'rgba(210,155,175,0.65)',center:'#f0d050'},
        {cx:w*0.14,cy:h*0.55,r:8, petals:6,col:'rgba(235,210,220,0.68)',center:'#f8e880'},
        {cx:w*0.52,cy:h*0.30,r:6, petals:5,col:'rgba(170,125,200,0.60)',center:'#fff0a0'},
      ];
      flowers.forEach(({cx,cy,r,petals,col,center}) => {
        for (let p=0;p<petals;p++) {
          const a=(p/petals)*Math.PI*2;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*r*0.7, cy+Math.sin(a)*r*0.7, r*0.44, r*0.62, a, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = center;
        ctx.beginPath(); ctx.arc(cx, cy, r*0.25, 0, Math.PI*2); ctx.fill();
      });
    }, 115, 90);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.56, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x7a5828, roughness: 0.6, metalness: 0.05 }));
      fm.position.set(20.5, 4.3, WZ - 0.05); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.28),
        new THREE.MeshStandardMaterial({ map: flowersTex, roughness: 0.45 }));
      pm.position.set(20.5, 4.3, WZ); this.group.add(pm);
    }

    // 5. Botanical etching print — x=23.3, y=4.8
    //    Frame footprint: x 22.55–24.05, y 3.8–5.8
    const etchingTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f2ead8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, w-10, h-10);
      ctx.lineWidth = 0.5; ctx.strokeRect(9, 9, w-18, h-18);
      // Title
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = '7px monospace'; ctx.fillText('BOTANICAL', w/2, 22);
      ctx.font = '5px monospace'; ctx.fillText('STUDIES — PLATE IV', w/2, 30);
      // Central large leaf cluster
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 1.2;
      // Main stem
      ctx.beginPath(); ctx.moveTo(w/2, h-18); ctx.lineTo(w/2, h*0.32); ctx.stroke();
      // Alternate pinnate leaves up the stem
      for (let i = 0; i < 6; i++) {
        const y = h * (0.85 - i * 0.1);
        const side = i % 2 === 0 ? 1 : -1;
        const len = 18 - i * 1.5;
        ctx.beginPath(); ctx.moveTo(w/2, y);
        ctx.quadraticCurveTo(w/2 + side*len*0.55, y - 4, w/2 + side*len, y - 10); ctx.stroke();
        // Leaf outline at tip
        ctx.beginPath();
        ctx.ellipse(w/2 + side*len*0.82, y - 8, 5, 3, side * 0.5, 0, Math.PI*2); ctx.stroke();
        // Midrib
        ctx.strokeStyle = 'rgba(46,30,10,0.4)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(w/2 + side*2, y - 1);
        ctx.lineTo(w/2 + side*len*0.75, y - 8); ctx.stroke();
        ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 1.2;
      }
      // Top spray
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(w/2, h*0.33);
        ctx.quadraticCurveTo(w/2 + i*6, h*0.23, w/2 + i*11, h*0.18); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w/2+i*10, h*0.18, 3, 2, i*0.3, 0, Math.PI*2); ctx.stroke();
      }
      // Root detail at base
      for (let r = -2; r <= 2; r++) {
        ctx.beginPath(); ctx.moveTo(w/2, h-18);
        ctx.quadraticCurveTo(w/2 + r*8, h-12, w/2 + r*12, h-9); ctx.stroke();
      }
      // Caption
      ctx.fillStyle = '#2e1e0a'; ctx.font = '5px monospace';
      ctx.fillText('Dryopteris filix-mas', w/2, h-12);
      ctx.fillText('Male Fern', w/2, h-5);
    }, 90, 125);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.02, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x0e0806, roughness: 0.5, metalness: 0.1 }));
      fm.position.set(23.3, 4.8, WZ - 0.05); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.80),
        new THREE.MeshStandardMaterial({ color: 0xf8f4e8, roughness: 0.8 }));
      wm.position.set(23.3, 4.8, WZ + 0.003); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.56),
        new THREE.MeshStandardMaterial({ map: etchingTex, roughness: 0.55 }));
      pm.position.set(23.3, 4.8, WZ + 0.01); this.group.add(pm);
    }

    // 6. Small abstract colour-field painting — x=25.8, y=5.0
    //    Frame footprint: x 25.15–26.45, y 4.35–5.65
    const abstractTex = makeTexture((ctx, w, h) => {
      // Deep teal base
      ctx.fillStyle = '#1a3840'; ctx.fillRect(0, 0, w, h);
      // Teal band
      const t1 = ctx.createLinearGradient(0, 0, 0, h*0.42);
      t1.addColorStop(0, '#1c4a54'); t1.addColorStop(0.7, '#2a6878'); t1.addColorStop(1,'rgba(30,80,90,0.2)');
      ctx.fillStyle = t1; ctx.fillRect(6, 4, w-12, Math.floor(h*0.45));
      // Coral/salmon band
      const t2 = ctx.createLinearGradient(0, h*0.38, 0, h*0.72);
      t2.addColorStop(0,'rgba(200,90,70,0.25)'); t2.addColorStop(0.4,'#c85a48'); t2.addColorStop(1,'rgba(180,70,55,0.2)');
      ctx.fillStyle = t2; ctx.fillRect(6, Math.floor(h*0.40), w-12, Math.floor(h*0.32));
      // Warm cream bottom
      const t3 = ctx.createLinearGradient(0, h*0.66, 0, h);
      t3.addColorStop(0,'rgba(210,185,140,0.2)'); t3.addColorStop(0.5,'#c8a870'); t3.addColorStop(1,'#a88850');
      ctx.fillStyle = t3; ctx.fillRect(6, Math.floor(h*0.68), w-12, Math.floor(h*0.28));
      // Edge vignette
      const ev = ctx.createLinearGradient(0,0,w,0);
      ev.addColorStop(0,'rgba(8,16,20,0.45)'); ev.addColorStop(0.12,'rgba(8,16,20,0)');
      ev.addColorStop(0.88,'rgba(8,16,20,0)'); ev.addColorStop(1,'rgba(8,16,20,0.45)');
      ctx.fillStyle = ev; ctx.fillRect(0,0,w,h);
    }, 80, 80);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.32, 0.10),
        new THREE.MeshStandardMaterial({ color: 0x080404, roughness: 0.4, metalness: 0.2 }));
      fm.position.set(25.8, 5.0, WZ - 0.05); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.08),
        new THREE.MeshStandardMaterial({ map: abstractTex, roughness: 0.35 }));
      pm.position.set(25.8, 5.0, WZ); this.group.add(pm);
      // Small brass plaque
      const lp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xb08030, roughness: 0.25, metalness: 0.75 }));
      lp.position.set(25.8, 4.28, WZ);
      this.group.add(lp);
    }

    // ── ADDITIONAL WALL DECOR — fills remaining gaps ──────────────────────────

    // A. Natural history toad print — x=-3.2, y=2.1 (below Botanica poster)
    const toadTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f0ead6'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = 'bold 7px monospace'; ctx.fillText('NATURAL HISTORY', w / 2, 15);
      ctx.font = '5px monospace'; ctx.fillText('Bufo bufo — Common Toad', w / 2, h - 6);
      // Body
      ctx.fillStyle = '#6a7830';
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.56, w * 0.22, h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      // Spots
      ctx.fillStyle = '#3a4418';
      [[w * 0.4, h * 0.5], [w * 0.58, h * 0.54], [w * 0.48, h * 0.64], [w * 0.62, h * 0.63]].forEach(([bx, by]) => {
        ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill();
      });
      // Eyes
      ctx.fillStyle = '#d0a820';
      ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.46, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.6, h * 0.46, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0804';
      ctx.beginPath(); ctx.arc(w * 0.4, h * 0.46, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.6, h * 0.46, 1.5, 0, Math.PI * 2); ctx.fill();
      // Legs
      ctx.strokeStyle = '#3a4418'; ctx.lineWidth = 1.5;
      [[w * 0.28, h * 0.72], [w * 0.72, h * 0.72]].forEach(([lx, ly]) => {
        ctx.beginPath(); ctx.moveTo(w / 2, h * 0.7); ctx.lineTo(lx, ly); ctx.stroke();
      });
    }, 72, 60);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.75, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 }));
      fm.position.set(-3.2, 2.1, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.60),
        new THREE.MeshStandardMaterial({ map: toadTex, roughness: 0.55 }));
      pm.position.set(-3.2, 2.1, WZ); this.group.add(pm);
    }

    // B. "Home Sweet Home" embroidery hoop — x=-0.8, y=2.5
    const crossStitchTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#e8dfc8'; ctx.fillRect(0, 0, w, h);
      for (let gx = 0; gx < w; gx += 4) for (let gy = 0; gy < h; gy += 4) {
        ctx.fillStyle = 'rgba(160,130,80,0.07)';
        ctx.fillRect(gx, gy, 1, 4); ctx.fillRect(gx, gy, 4, 1);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c02020'; ctx.font = 'bold 9px monospace';
      ctx.fillText('HOME', w / 2, h * 0.36);
      ctx.fillStyle = '#38781e'; ctx.font = '7px monospace';
      ctx.fillText('sweet', w / 2, h * 0.52);
      ctx.fillStyle = '#c02020'; ctx.font = 'bold 9px monospace';
      ctx.fillText('HOME', w / 2, h * 0.68);
      [[0.18, 0.2], [0.82, 0.2], [0.18, 0.82], [0.82, 0.82]].forEach(([fx, fy]) => {
        ctx.fillStyle = '#c02020';
        ctx.beginPath(); ctx.arc(w * fx, h * fy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38781e';
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          ctx.beginPath(); ctx.arc(w * fx + dx * 5, h * fy + dy * 5, 2, 0, Math.PI * 2); ctx.fill();
        });
      });
    }, 64, 64);
    {
      const hoopMat = new THREE.MeshStandardMaterial({ color: 0x7a5020, roughness: 0.6, metalness: 0.1 });
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 20), hoopMat);
      hoop.position.set(-0.8, 2.5, WZ - 0.02); this.group.add(hoop);
      const pm = new THREE.Mesh(new THREE.CircleGeometry(0.40, 20),
        new THREE.MeshStandardMaterial({ map: crossStitchTex, roughness: 0.8 }));
      pm.position.set(-0.8, 2.5, WZ + 0.005); this.group.add(pm);
    }

    // C. Antique world map parchment — x=0.5, y=4.0 (left of photo cluster)
    const mapTex = makeTexture((ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#e8d8a0'); bg.addColorStop(1, '#d8c488');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(100,70,20,0.20)'; ctx.lineWidth = 0.5;
      for (let lx = 0; lx < w; lx += 12) { ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, h); ctx.stroke(); }
      for (let ly = 0; ly < h; ly += 12) { ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke(); }
      ctx.fillStyle = 'rgba(100,130,60,0.6)';
      [[w * 0.25, h * 0.4, 18, 12], [w * 0.55, h * 0.38, 14, 10], [w * 0.68, h * 0.45, 10, 14],
       [w * 0.35, h * 0.62, 8, 6], [w * 0.18, h * 0.58, 7, 8]].forEach(([cx, cy, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = 'rgba(80,40,10,0.7)'; ctx.textAlign = 'center';
      ctx.font = 'bold 7px monospace'; ctx.fillText('N', w * 0.88, h * 0.14);
      ctx.strokeStyle = 'rgba(80,40,10,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w * 0.88, h * 0.22, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a2008'; ctx.font = '6px monospace';
      ctx.fillText('MAPPA MUNDI', w / 2, h - 6);
    }, 70, 76);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.10, 1.20, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x5a3010, roughness: 0.7, metalness: 0.05 }));
      fm.position.set(0.5, 4.0, WZ - 0.04); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 1.06),
        new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.8 }));
      wm.position.set(0.5, 4.0, WZ + 0.003); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.90),
        new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.5 }));
      pm.position.set(0.5, 4.0, WZ + 0.01); this.group.add(pm);
    }

    // D. Pinned luna moth study — x=0.5, y=5.8 (above photo cluster)
    const mothTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f4eedd'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = '5px monospace'; ctx.fillText('Actias luna', w / 2, h - 8);
      // Body
      ctx.fillStyle = '#384830';
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.5, 3, 9, 0, 0, Math.PI * 2); ctx.fill();
      // Wings
      ctx.fillStyle = 'rgba(100,160,90,0.8)';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.38);
      ctx.quadraticCurveTo(w * 0.18, h * 0.22, w * 0.12, h * 0.52);
      ctx.quadraticCurveTo(w * 0.22, h * 0.66, w / 2, h * 0.54);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.38);
      ctx.quadraticCurveTo(w * 0.82, h * 0.22, w * 0.88, h * 0.52);
      ctx.quadraticCurveTo(w * 0.78, h * 0.66, w / 2, h * 0.54);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,150,0.6)';
      ctx.beginPath(); ctx.arc(w * 0.25, h * 0.44, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.75, h * 0.44, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#384830'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w / 2 - 2, h * 0.32); ctx.quadraticCurveTo(w * 0.35, h * 0.18, w * 0.3, h * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2 + 2, h * 0.32); ctx.quadraticCurveTo(w * 0.65, h * 0.18, w * 0.7, h * 0.12); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,80,80,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w / 2, h * 0.14); ctx.lineTo(w / 2, h * 0.36); ctx.stroke();
      ctx.fillStyle = 'rgba(80,80,80,0.7)';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.12, 2, 0, Math.PI * 2); ctx.fill();
    }, 64, 56);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.75, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 }));
      fm.position.set(0.5, 5.8, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.58),
        new THREE.MeshStandardMaterial({ map: mothTex, roughness: 0.55 }));
      pm.position.set(0.5, 5.8, WZ); this.group.add(pm);
    }

    // E. "GROW THINGS" wooden plank sign — x=3.7, y=2.8
    const growSignTex = makeTexture((ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#8a5a28'); bg.addColorStop(1, '#6a4018');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 6) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, y, w, 1); }
      for (let gx = 0; gx < w; gx += 22) { ctx.fillStyle = 'rgba(60,30,0,0.1)'; ctx.fillRect(gx, 0, 1, h); }
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#f0e0b0'; ctx.textAlign = 'center';
      ctx.font = 'bold 11px monospace'; ctx.fillText('GROW THINGS', w / 2, h * 0.58);
      ctx.font = '5px monospace'; ctx.fillStyle = '#c8a870';
      ctx.fillText('& be happy', w / 2, h * 0.82);
    }, 80, 36);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.52, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x4a2808, roughness: 0.9 }));
      fm.position.set(3.7, 2.8, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.38),
        new THREE.MeshStandardMaterial({ map: growSignTex, roughness: 0.8 }));
      pm.position.set(3.7, 2.8, WZ); this.group.add(pm);
    }

    // F. "SEEDS & SPROUTS" vintage tin poster — x=4.3, y=4.6 (left of bookshelf)
    const seedsTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#1e4028'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#c8a840'; ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.lineWidth = 1; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.strokeStyle = 'rgba(100,170,80,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(w / 2, h * 0.48, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c8a840';
      for (let sa = 0; sa < Math.PI * 2; sa += Math.PI / 4) {
        ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(sa) * 9, h * 0.48 + Math.sin(sa) * 9, 3, 2, sa, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#f0d060';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.48, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f0d060'; ctx.textAlign = 'center';
      ctx.font = 'bold 7px monospace'; ctx.fillText('SEEDS', w / 2, 20);
      ctx.font = '5px monospace'; ctx.fillText('& SPROUTS', w / 2, 29);
      ctx.fillStyle = '#c8a840'; ctx.font = '5px monospace';
      ctx.fillText('est. 1887', w / 2, h - 8);
    }, 52, 64);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.92, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x0a1e0e, roughness: 0.5, metalness: 0.3 }));
      fm.position.set(4.3, 4.6, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.76),
        new THREE.MeshStandardMaterial({ map: seedsTex, roughness: 0.4 }));
      pm.position.set(4.3, 4.6, WZ); this.group.add(pm);
    }

    // G. Insect collection board — x=-2.2, y=5.5 (moved above T1)
    const insectTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f0e8d0'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = 'bold 6px monospace'; ctx.fillText('INSECT STUDY', w / 2, 16);
      const bugs = [
        { x: w * 0.22, y: h * 0.52, col: '#6a4820', wCol: 'rgba(180,150,100,0.7)', r: 5 },
        { x: w * 0.5,  y: h * 0.5,  col: '#184028', wCol: 'rgba(80,160,100,0.75)', r: 6 },
        { x: w * 0.78, y: h * 0.52, col: '#280820', wCol: 'rgba(160,80,120,0.7)',  r: 5 },
      ];
      bugs.forEach(({ x, y, col, wCol, r }) => {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.4, r, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = wCol;
        ctx.beginPath(); ctx.ellipse(x - r * 0.9, y, r, r * 0.65,  0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + r * 0.9, y, r, r * 0.65, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.9); ctx.lineTo(x - r * 0.8, y - r * 1.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.9); ctx.lineTo(x + r * 0.8, y - r * 1.8); ctx.stroke();
      });
      ctx.fillStyle = '#2e1e0a'; ctx.font = '4px monospace';
      ctx.fillText('Coleoptera', w * 0.22, h - 8);
      ctx.fillText('Lepidoptera', w * 0.5,  h - 8);
      ctx.fillText('Hemiptera',  w * 0.78, h - 8);
    }, 100, 60);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.90, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.7 }));
      fm.position.set(-2.8, 5.8, WZ - 0.04); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.78),
        new THREE.MeshStandardMaterial({ color: 0xf8f4ee, roughness: 0.8 }));
      wm.position.set(-2.8, 5.8, WZ + 0.003); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.64),
        new THREE.MeshStandardMaterial({ map: insectTex, roughness: 0.55 }));
      pm.position.set(-2.8, 5.8, WZ + 0.01); this.group.add(pm);
    }

    // H. Geometric moonrise print — x=2.5, y=5.5 (moved above T1, right of luna moth)
    const moonTex = makeTexture((ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0a0818'); bg.addColorStop(1, '#1a1830');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,200,0.8)';
      [[w*0.15,h*0.12],[w*0.82,h*0.08],[w*0.45,h*0.18],[w*0.68,h*0.25],[w*0.28,h*0.3],[w*0.92,h*0.35]].forEach(([sx,sy]) => {
        ctx.fillRect(sx, sy, 1, 1);
      });
      ctx.fillStyle = '#f8e8a0';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.45, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,160,0.25)';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.45, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200,180,80,0.4)';
      [[w*0.44,h*0.38,4],[w*0.56,h*0.50,3],[w*0.48,h*0.52,2]].forEach(([cx,cy,cr]) => {
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#0a0818';
      ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(w * 0.12, h * 0.68); ctx.lineTo(w * 0.25, h * 0.82);
      ctx.lineTo(w * 0.38, h * 0.62); ctx.lineTo(w * 0.52, h * 0.75);
      ctx.lineTo(w * 0.65, h * 0.58); ctx.lineTo(w * 0.78, h * 0.72);
      ctx.lineTo(w * 0.90, h * 0.60); ctx.lineTo(w, h * 0.70);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    }, 88, 70);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.40, 1.10, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x080606, roughness: 0.4, metalness: 0.2 }));
      fm.position.set(6.5, 5.0, WZ - 0.05); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.20, 0.90),
        new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.35 }));
      pm.position.set(6.5, 5.0, WZ); this.group.add(pm);
    }

    // I. Field sketch journal page — x=13.8, y=2.4 (below Alpine poster)
    const sketchTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f4eed8'; ctx.fillRect(0, 0, w, h);
      for (let ly = 14; ly < h; ly += 8) {
        ctx.fillStyle = 'rgba(100,130,200,0.14)'; ctx.fillRect(0, ly, w, 1);
      }
      ctx.fillStyle = 'rgba(200,100,100,0.28)'; ctx.fillRect(18, 0, 1, h);
      ctx.strokeStyle = 'rgba(40,20,5,0.65)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.85); ctx.lineTo(w * 0.42, h * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.42, h * 0.5, 10, -Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.42, h * 0.53, 10, 3, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(30,15,0,0.55)'; ctx.font = '5px monospace'; ctx.textAlign = 'left';
      ctx.fillText('Amanita?',  w * 0.54, h * 0.30);
      ctx.fillText('spore→wht', w * 0.54, h * 0.42);
      ctx.fillText('v. toxic!!',w * 0.54, h * 0.54);
    }, 90, 54);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.75, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x2e1e08, roughness: 0.8 }));
      fm.position.set(13.8, 2.4, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.58),
        new THREE.MeshStandardMaterial({ map: sketchTex, roughness: 0.65 }));
      pm.position.set(13.8, 2.4, WZ); this.group.add(pm);
    }

    // J. Narrow mushroom species chart — x=15.3, y=4.2 (between Alpine and pastoral)
    const mushroomChartTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f0ead8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1808'; ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = '5px monospace'; ctx.fillText('FUNGI', w / 2, 13);
      [
        { y: h * 0.28, col: '#c04020', spots: true },
        { y: h * 0.54, col: '#8a6020', spots: false },
        { y: h * 0.78, col: '#484828', spots: false },
      ].forEach(({ y, col, spots }) => {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(w / 2, y, 8, -Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w / 2, y, 8, 3, 0, 0, Math.PI); ctx.fill();
        if (spots) {
          ctx.fillStyle = '#f8f0e0';
          [[w*0.38,y-4],[w*0.55,y-6],[w*0.62,y-2]].forEach(([sx,sy]) => {
            ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
          });
        }
        ctx.fillStyle = '#d8c8a0'; ctx.fillRect(w / 2 - 2, y, 4, 7);
      });
    }, 36, 100);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.80, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.8 }));
      fm.position.set(15.3, 4.2, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 1.60),
        new THREE.MeshStandardMaterial({ map: mushroomChartTex, roughness: 0.6 }));
      pm.position.set(15.3, 4.2, WZ); this.group.add(pm);
    }

    // K. "WILD THINGS" chalkboard sign — x=17.8, y=3.0 (below cat photo)
    const chalkTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#1a2818'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(220,215,200,0.55)'; ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      for (let i = 0; i < 150; i++) {
        ctx.fillStyle = `rgba(220,215,200,${0.01 + Math.random() * 0.03})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random(), 1);
      }
      ctx.fillStyle = 'rgba(240,235,215,0.85)'; ctx.textAlign = 'center';
      ctx.font = 'bold 8px monospace'; ctx.fillText('WILD THINGS', w / 2, h * 0.38);
      ctx.font = '5px monospace'; ctx.fillStyle = 'rgba(180,210,160,0.8)';
      ctx.fillText('grow here', w / 2, h * 0.58);
      ctx.strokeStyle = 'rgba(140,190,120,0.5)'; ctx.lineWidth = 1;
      [w * 0.18, w * 0.82].forEach(lx => {
        ctx.beginPath(); ctx.moveTo(lx, h * 0.68);
        ctx.quadraticCurveTo(lx + 8, h * 0.52, lx, h * 0.42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx, h * 0.68);
        ctx.quadraticCurveTo(lx - 8, h * 0.52, lx, h * 0.42); ctx.stroke();
      });
    }, 88, 46);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.75, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.8 }));
      fm.position.set(17.8, 3.0, WZ - 0.05); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.58),
        new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.9 }));
      pm.position.set(17.8, 3.0, WZ); this.group.add(pm);
    }

    // M. Leaf watercolour print — x=-3.8, y=6.1 (upper-left above T1, new filler)
    const leafWaterTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f8f2e4'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#7a5828'; ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.lineWidth = 1; ctx.strokeRect(7, 7, w - 14, h - 14);
      // Main leaf
      ctx.fillStyle = '#5a9840';
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.18);
      ctx.quadraticCurveTo(w * 0.82, h * 0.42, w * 0.5, h * 0.80);
      ctx.quadraticCurveTo(w * 0.18, h * 0.42, w * 0.5, h * 0.18);
      ctx.fill();
      // Midrib
      ctx.strokeStyle = '#3a7020'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.80); ctx.lineTo(w * 0.5, h * 0.20); ctx.stroke();
      // Side veins
      ctx.lineWidth = 0.8;
      [[0.62, 0.3], [0.72, 0.45], [0.68, 0.6], [0.38, 0.3], [0.28, 0.45], [0.32, 0.6]].forEach(([tx, ty]) => {
        ctx.beginPath(); ctx.moveTo(w * 0.5, h * ty); ctx.lineTo(w * tx, h * (ty - 0.1)); ctx.stroke();
      });
      // Small leaf pair
      ctx.fillStyle = '#7ab858';
      ctx.beginPath(); ctx.ellipse(w * 0.32, h * 0.68, 7, 4, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.68, h * 0.68, 7, 4, 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2010'; ctx.textAlign = 'center'; ctx.font = '5px monospace';
      ctx.fillText('Monstera deliciosa', w / 2, h - 8);
    }, 68, 80);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.10, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x6a4010, roughness: 0.8 }));
      fm.position.set(-3.9, 6.3, WZ - 0.04); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.92),
        new THREE.MeshStandardMaterial({ map: leafWaterTex, roughness: 0.6 }));
      pm.position.set(-3.9, 6.3, WZ); this.group.add(pm);
    }

    // N. Macramé wall hanging — x=-1.5, y=3.6 (center-left T1, textile filler)
    const macrameTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#e8dfc8'; ctx.fillRect(0, 0, w, h);
      // Wooden rod at top
      ctx.fillStyle = '#7a4818';
      ctx.fillRect(4, 6, w - 8, 5);
      // Knotted rope strands
      const strandCol = '#c8a870';
      const darkCol = '#a88858';
      const numStrands = 6;
      const sw = (w - 12) / numStrands;
      for (let s = 0; s < numStrands; s++) {
        const sx = 6 + s * sw + sw / 2;
        ctx.strokeStyle = strandCol; ctx.lineWidth = 1.5;
        // vertical strand
        ctx.beginPath(); ctx.moveTo(sx, 11); ctx.lineTo(sx, h - 20); ctx.stroke();
        // knot bumps
        for (let k = 0; k < 4; k++) {
          const ky = 18 + k * 12;
          ctx.fillStyle = k % 2 === 0 ? strandCol : darkCol;
          ctx.beginPath(); ctx.ellipse(sx, ky, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Cross knot lines
      ctx.strokeStyle = strandCol; ctx.lineWidth = 1;
      [22, 34, 46].forEach(ky => {
        for (let s = 0; s < numStrands - 1; s++) {
          const x1 = 6 + s * sw + sw / 2;
          const x2 = 6 + (s + 1) * sw + sw / 2;
          ctx.beginPath(); ctx.moveTo(x1, ky); ctx.lineTo(x2, ky); ctx.stroke();
        }
      });
      // Fringe at bottom
      ctx.strokeStyle = strandCol; ctx.lineWidth = 1;
      for (let f = 0; f < 14; f++) {
        const fx = 6 + f * ((w - 12) / 13);
        const fl = 10 + Math.sin(f * 1.3) * 5;
        ctx.beginPath(); ctx.moveTo(fx, h - 20); ctx.lineTo(fx + (Math.sin(f) * 2), h - 8 + fl * 0.3); ctx.stroke();
      }
    }, 56, 72);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xe0d4b8, roughness: 1.0 }));
      fm.position.set(-3.1, 3.5, WZ - 0.02); this.group.add(fm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.90),
        new THREE.MeshStandardMaterial({ map: macrameTex, roughness: 0.9 }));
      pm.position.set(-3.1, 3.5, WZ + 0.005); this.group.add(pm);
    }

    // O. Ceramic sun disc — x=2.0, y=3.2 (right side T1, circular wall art)
    const sunDiscTex = makeTexture((ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#c8885a'; ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) / 2 - 2, 0, Math.PI * 2); ctx.fill();
      // Ray spokes
      ctx.strokeStyle = '#e8a870'; ctx.lineWidth = 3;
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const r0 = Math.min(w, h) * 0.25, r1 = Math.min(w, h) * 0.44;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
        ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        ctx.stroke();
      }
      // Face
      ctx.fillStyle = '#f0c090';
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9a5030'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.22, 0, Math.PI * 2); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#5a2808';
      ctx.beginPath(); ctx.ellipse(cx - 5, cy - 3, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 5, cy - 3, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      // Smile
      ctx.strokeStyle = '#5a2808'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy + 1, 5, 0.1, Math.PI - 0.1); ctx.stroke();
      // Rim highlight
      ctx.strokeStyle = '#e8b080'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) / 2 - 3, 0, Math.PI * 2); ctx.stroke();
    }, 60, 60);
    {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20),
        new THREE.MeshStandardMaterial({ map: sunDiscTex, roughness: 0.7 }));
      disc.position.set(1.2, 2.5, WZ + 0.005); this.group.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x9a5828, roughness: 0.6 }));
      rim.position.set(1.2, 2.5, WZ); this.group.add(rim);
    }

    // L. Herbarium pressed leaves — x=22.0, y=3.5 (between flowers and etching)
    const herbariumTex = makeTexture((ctx, w, h) => {
      ctx.fillStyle = '#f0ebd8'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2e1e0a'; ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#1e1006'; ctx.textAlign = 'center';
      ctx.font = '5px monospace'; ctx.fillText('HERBARIUM', w / 2, 15);
      [
        { cx: w*0.38, cy: h*0.38, a: -0.4, col: '#8a7028', sw: 9,  sh: 14 },
        { cx: w*0.60, cy: h*0.35, a:  0.5, col: '#6a5820', sw: 8,  sh: 12 },
        { cx: w*0.45, cy: h*0.58, a: -0.2, col: '#7a6030', sw: 10, sh: 16 },
        { cx: w*0.55, cy: h*0.72, a:  0.3, col: '#5a4820', sw: 7,  sh: 11 },
        { cx: w*0.30, cy: h*0.65, a: -0.6, col: '#8a6828', sw: 6,  sh: 10 },
      ].forEach(({ cx, cy, a, col, sw, sh }) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(0, 0, sw, sh, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, sh); ctx.lineTo(0, -sh); ctx.stroke();
        ctx.restore();
      });
      ctx.fillStyle = '#e8dfc8';
      ctx.fillRect(Math.floor(w * 0.3), h - 16, Math.floor(w * 0.4), 10);
      ctx.fillStyle = '#2e1e0a'; ctx.font = '4px monospace';
      ctx.fillText('1924', w / 2, h - 9);
    }, 54, 76);
    {
      const fm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.20, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.7, metalness: 0.05 }));
      fm.position.set(22.0, 3.5, WZ - 0.04); this.group.add(fm);
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.63, 1.08),
        new THREE.MeshStandardMaterial({ color: 0xf8f4e8, roughness: 0.9 }));
      wm.position.set(22.0, 3.5, WZ + 0.003); this.group.add(wm);
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.96),
        new THREE.MeshStandardMaterial({ map: herbariumTex, roughness: 0.65 }));
      pm.position.set(22.0, 3.5, WZ + 0.01); this.group.add(pm);
    }
  }

  // ── Floor-standing plants against back wall ────────────────────────────────
  _buildFloorPlants() {
    // Floor at y=-3.5. Desk top at y=-1.40. Wall at z=-4.87.
    // Plants stand at z=-4.35, floor base y=-3.5, tops visible above desk.
    const PZ = -4.35;
    const FLOOR_Y = -3.5;

    // Helper: make a plant mesh (transparent canvas plane facing camera)
    const makePlant = (texFn, tw, th, pw, ph, x) => {
      const tex = makeTexture(texFn, tw, th);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(pw, ph),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
      );
      mesh.position.set(x, FLOOR_Y + ph / 2, PZ);
      this.group.add(mesh);
    };

    // ── 1. Monstera (bushy, left of T1) ──────────────────────────────────────
    makePlant((ctx, w, h) => {
      // Large fenestrated leaves radiating from base
      const leaves = [
        { cx: w*0.5, cy: h*0.55, rx: w*0.34, ry: h*0.28, a: 0,    col: '#0e2e0a' },
        { cx: w*0.3, cy: h*0.48, rx: w*0.28, ry: h*0.22, a:-0.5,  col: '#133510' },
        { cx: w*0.72,cy: h*0.46, rx: w*0.26, ry: h*0.21, a: 0.5,  col: '#0e2e0a' },
        { cx: w*0.2, cy: h*0.32, rx: w*0.22, ry: h*0.18, a:-0.9,  col: '#0a2008' },
        { cx: w*0.82,cy: h*0.30, rx: w*0.22, ry: h*0.18, a: 0.9,  col: '#0a2008' },
        { cx: w*0.5, cy: h*0.35, rx: w*0.26, ry: h*0.20, a: 0.1,  col: '#133510' },
        { cx: w*0.38,cy: h*0.22, rx: w*0.20, ry: h*0.16, a:-0.6,  col: '#183e12' },
        { cx: w*0.64,cy: h*0.20, rx: w*0.20, ry: h*0.16, a: 0.6,  col: '#183e12' },
      ];
      leaves.forEach(({ cx, cy, rx, ry, a, col }) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        // Fenestration holes
        ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.globalCompositeOperation = 'destination-out';
        [[-rx*0.3, -ry*0.15], [rx*0.3, -ry*0.15], [0, ry*0.1]].forEach(([hx, hy]) => {
          ctx.beginPath(); ctx.ellipse(hx, hy, rx*0.13, ry*0.20, 0, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
        // Midrib
        ctx.strokeStyle = '#061804'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(0, -ry); ctx.stroke();
        ctx.restore();
      });
      // Stems from base
      ctx.strokeStyle = '#0a1e08'; ctx.lineWidth = 3;
      [[-0.35,0.8,-0.6,0.55], [0,0.9,0,0.3], [0.35,0.8,0.6,0.55]].forEach(([x1f,y1f,x2f,y2f]) => {
        ctx.beginPath(); ctx.moveTo(w*0.5+w*x1f*0.1, h*0.98); ctx.lineTo(w*0.5+w*x2f*0.35, h*y2f); ctx.stroke();
      });
      // Pot
      ctx.fillStyle = '#b07050';
      ctx.beginPath(); ctx.moveTo(w*0.38,h*0.98); ctx.lineTo(w*0.62,h*0.98); ctx.lineTo(w*0.58,h*0.88); ctx.lineTo(w*0.42,h*0.88); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c88060';
      ctx.fillRect(w*0.36, h*0.88, w*0.28, h*0.04);
    }, 160, 220, 3.5, 5.0, -3.0);

    // ── 2. Snake Plant (Sansevieria, between T1 and T2) ───────────────────────
    makePlant((ctx, w, h) => {
      // Multiple tall upright pointed leaves with banding
      const leafData = [
        { x: w*0.38, ww: w*0.15, h0: h*0.18, col: '#2a6828', band: '#3a8038' },
        { x: w*0.54, ww: w*0.13, h0: h*0.12, col: '#2a6828', band: '#3a8038' },
        { x: w*0.50, ww: w*0.16, h0: h*0.08, col: '#204e20', band: '#2a6828' },
        { x: w*0.44, ww: w*0.12, h0: h*0.22, col: '#3a8038', band: '#4a9048' },
        { x: w*0.58, ww: w*0.10, h0: h*0.30, col: '#2a6028', band: '#386030' },
      ];
      leafData.forEach(({ x, ww, h0, col, band }) => {
        const leafH = h * 0.78 - h0;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x, h0);
        ctx.quadraticCurveTo(x + ww * 0.5, h0 - 6, x + ww * 0.5, h0);
        ctx.lineTo(x + ww, h * 0.85);
        ctx.lineTo(x, h * 0.85);
        ctx.closePath();
        ctx.fill();
        // Horizontal banding
        ctx.fillStyle = band;
        for (let b = 0; b < 6; b++) {
          const by = h0 + leafH * (b / 6) + 3;
          const bw = ww * (1 - b / 7);
          ctx.fillRect(x + (ww - bw) / 2, by, bw, 2);
        }
        // Yellow edge stripe
        ctx.strokeStyle = '#c8b820'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, h * 0.85);
        ctx.lineTo(x + 2, h0 + 4);
        ctx.stroke();
      });
      // Pot
      ctx.fillStyle = '#a06840';
      ctx.beginPath(); ctx.moveTo(w*0.34,h*0.88); ctx.lineTo(w*0.66,h*0.88); ctx.lineTo(w*0.60,h*0.98); ctx.lineTo(w*0.40,h*0.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b87848';
      ctx.fillRect(w*0.30, h*0.86, w*0.40, h*0.04);
    }, 110, 200, 2.0, 4.5, 6.0);

    // ── 3. ZZ Plant (clustered arching stems, between T2 and T3) ─────────────
    makePlant((ctx, w, h) => {
      // Dark glossy arching stems with oval leaflets
      const stems = [
        { sx: w*0.5, a: -0.5, len: h*0.52, side: -1 },
        { sx: w*0.5, a:  0,   len: h*0.62, side:  1 },
        { sx: w*0.5, a:  0.5, len: h*0.50, side: -1 },
        { sx: w*0.5, a: -0.3, len: h*0.58, side:  1 },
        { sx: w*0.5, a:  0.3, len: h*0.44, side: -1 },
      ];
      stems.forEach(({ sx, a, len, side }) => {
        // Draw stem as quadratic curve
        const ex = sx + Math.sin(a) * len * 0.9;
        const ey = h * 0.85 - len;
        const cpx = sx + side * len * 0.4;
        const cpy = h * 0.85 - len * 0.5;
        ctx.strokeStyle = '#1a3818'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, h * 0.85); ctx.quadraticCurveTo(cpx, cpy, ex, ey); ctx.stroke();
        // Leaflets along stem
        for (let l = 0; l < 7; l++) {
          const t = (l + 1) / 8;
          const lx = sx + (cpx - sx) * t * 2 > ex ? ex : sx + (ex - sx) * t;
          const ly = h * 0.85 + (ey - h * 0.85) * t;
          const flip = l % 2 === 0 ? 1 : -1;
          ctx.fillStyle = l < 3 ? '#1a4818' : '#2a6030';
          ctx.beginPath(); ctx.ellipse(lx + flip * 8, ly, 8, 5, a + flip * 0.5, 0, Math.PI * 2); ctx.fill();
          // Leaf shine
          ctx.fillStyle = 'rgba(180,220,160,0.25)';
          ctx.beginPath(); ctx.ellipse(lx + flip * 7, ly - 1, 4, 2, a + flip * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      });
      // Pot
      ctx.fillStyle = '#606870';
      ctx.beginPath(); ctx.moveTo(w*0.36,h*0.87); ctx.lineTo(w*0.64,h*0.87); ctx.lineTo(w*0.60,h*0.98); ctx.lineTo(w*0.40,h*0.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#787e88';
      ctx.fillRect(w*0.33, h*0.85, w*0.34, h*0.04);
    }, 130, 190, 2.5, 4.0, 12.0);

    // ── 4. Bird of Paradise (Strelitzia, right corner beyond T3) ─────────────
    makePlant((ctx, w, h) => {
      // Large paddle-shaped leaves on long petioles
      const leaves = [
        { px: w*0.5, ang: -0.6, pw: w*0.22, ph: h*0.55, col: '#1e5828', vein: '#2a7838' },
        { px: w*0.5, ang:  0.0, pw: w*0.24, ph: h*0.65, col: '#1e5828', vein: '#2a7838' },
        { px: w*0.5, ang:  0.6, pw: w*0.20, ph: h*0.50, col: '#265030', vein: '#386038' },
        { px: w*0.5, ang: -1.1, pw: w*0.18, ph: h*0.45, col: '#183820', vein: '#204828' },
        { px: w*0.5, ang:  1.1, pw: w*0.18, ph: h*0.45, col: '#183820', vein: '#204828' },
      ];
      leaves.forEach(({ px, ang, pw, ph, col, vein }) => {
        ctx.save();
        ctx.translate(px, h * 0.82);
        ctx.rotate(ang - Math.PI / 2);
        // Petiole
        ctx.strokeStyle = '#2a4820'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, ph * 0.35); ctx.stroke();
        // Leaf blade
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, ph * 0.35);
        ctx.quadraticCurveTo(-pw / 2, ph * 0.55, -pw * 0.45, ph * 0.85);
        ctx.quadraticCurveTo(-pw * 0.15, ph, 0, ph * 0.95);
        ctx.quadraticCurveTo(pw * 0.15, ph, pw * 0.45, ph * 0.85);
        ctx.quadraticCurveTo(pw / 2, ph * 0.55, 0, ph * 0.35);
        ctx.fill();
        // Midrib
        ctx.strokeStyle = vein; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, ph * 0.35); ctx.lineTo(0, ph * 0.95); ctx.stroke();
        // Characteristic tears/splits in leaf
        ctx.globalCompositeOperation = 'destination-out';
        [ph*0.55, ph*0.7, ph*0.82].forEach(sy => {
          ctx.fillStyle = 'rgba(0,0,0,1)';
          ctx.beginPath(); ctx.ellipse(pw * 0.28, sy, pw * 0.06, ph * 0.04, 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(-pw * 0.28, sy, pw * 0.06, ph * 0.04, -0.3, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      });
      // Structural stem cluster at base
      ctx.fillStyle = '#3a5828';
      ctx.beginPath(); ctx.ellipse(w*0.5, h*0.84, w*0.08, h*0.04, 0, 0, Math.PI*2); ctx.fill();
      // Pot (terracotta)
      ctx.fillStyle = '#b86840';
      ctx.beginPath(); ctx.moveTo(w*0.32,h*0.88); ctx.lineTo(w*0.68,h*0.88); ctx.lineTo(w*0.62,h*0.98); ctx.lineTo(w*0.38,h*0.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d08050';
      ctx.fillRect(w*0.28, h*0.86, w*0.44, h*0.04);
    }, 160, 256, 3.2, 5.5, 20.0);
  }

  // ── Extra atmosphere — candles, fairy lights, hanging plant, cat eyes ─────
  _buildAtmosphere() {
    this._candleLights = [];

    const waxMat  = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.95 });
    const waxDark = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.95 });

    // Two candles on the desk — one between T1/T2 (front), one between T2/T3 (front)
    [[3.8, 0.9], [12.2, 0.9]].forEach(([cx, cz], i) => {
      const cy = -1.22; // center of candle body above desk

      // Wax body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.38, 8), i === 0 ? waxMat : waxDark);
      body.position.set(cx, cy, cz);
      this.group.add(body);

      // Wax drip pool on desk
      const drip = new THREE.Mesh(new THREE.CircleGeometry(0.075, 8), waxMat);
      drip.rotation.x = -Math.PI / 2;
      drip.position.set(cx, -1.395, cz);
      this.group.add(drip);

      // Outer flame (orange)
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8820, transparent: true, opacity: 0.88 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 6), flameMat);
      flame.position.set(cx, cy + 0.24, cz);
      this.group.add(flame);

      // Inner flame (bright yellow)
      const innerMat = new THREE.MeshBasicMaterial({ color: 0xfff8a0, transparent: true, opacity: 0.95 });
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.06, 6), innerMat);
      inner.position.set(cx, cy + 0.255, cz);
      this.group.add(inner);

      // Candle point light
      const light = new THREE.PointLight(0xff7010, 0.66, 4.5, 2.0);
      light.position.set(cx, cy + 0.3, cz);
      this.group.add(light);
      this._candleLights.push({ light, flame, inner, phase: i * 1.7 });
    });

    // Fairy string lights along top of bookshelf
    const glowGeo = new THREE.SphereGeometry(0.048, 6, 4);
    const colors = [0xfffaaa, 0xffddaa, 0xaaddff, 0xffaacc, 0xaaffcc];
    for (let i = 0; i < 11; i++) {
      const bx = 5.2 + (i / 10) * 3.6;
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.9 });
      const bulb = new THREE.Mesh(glowGeo, mat);
      bulb.position.set(bx, 3.56, -4.14);
      this.group.add(bulb);
      // Tiny wire between bulbs
      if (i > 0) {
        const wireMat = new THREE.LineBasicMaterial({ color: 0x3a2808, transparent: true, opacity: 0.6 });
        const pts = [
          new THREE.Vector3(5.2 + ((i - 1) / 10) * 3.6, 3.56 + Math.sin(i * 0.8) * 0.04, -4.14),
          new THREE.Vector3(bx, 3.56, -4.14)
        ];
        const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat);
        this.group.add(wire);
      }
    }
    // Soft fairy light glow over bookshelf
    const fairyAmb = new THREE.PointLight(0xfffce0, 0.34, 5.5);
    fairyAmb.position.set(7.0, 3.4, -4.2);
    this.group.add(fairyAmb);

    // Hanging ivy planter on wall (between window and painting)
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x4a2808, roughness: 0.8, metalness: 0.3 });
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.25), bracketMat);
    bracket.position.set(-3.8, 4.6, -4.9);
    this.group.add(bracket);
    const ivyPotMat = new THREE.MeshStandardMaterial({ color: 0x8a4820, roughness: 0.85 });
    const ivyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.22, 8), ivyPotMat);
    ivyPot.position.set(-3.8, 4.35, -4.82);
    this.group.add(ivyPot);
    const ivyMat = new THREE.MeshStandardMaterial({ color: 0x2a6010, roughness: 0.9 });
    // Draping vine strands
    [[-0.12, 0.04, -0.45], [0.06, 0.08, -0.55], [-0.05, -0.02, -0.62],
     [0.13, 0.06, -0.50],  [-0.09, -0.05, -0.70]].forEach(([vx, vz, dropY], k) => {
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.45 + k * 0.06, 4), ivyMat);
      vine.rotation.z = vx * 1.2;
      vine.position.set(-3.8 + vx, 4.35 + dropY * 0.5, -4.82 + vz * 0.1);
      this.group.add(vine);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07 + k * 0.01, 5, 4), ivyMat);
      leaf.scale.set(1, 0.5, 1);
      leaf.position.set(-3.8 + vx * 1.6, 4.35 + dropY * 0.88, -4.82 + vz * 0.15);
      this.group.add(leaf);
    });

    // Cat glowing eyes (matches cat position -7.65 from _buildWindow)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd4b010, transparent: true, opacity: 0.75 });
    [-0.055, 0.055].forEach(dx => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 4), eyeMat);
      eye.position.set(-7.65 + dx, 0.12, -4.52);
      this.group.add(eye);
    });
    // Subtle amber glow from cat's eyes
    const catGlow = new THREE.PointLight(0xd4a010, 0.14, 0.9);
    catGlow.position.set(-7.65, 0.10, -4.50);
    this.group.add(catGlow);

    // Extra mood: faint warm fill light near terrariums (fireplace-adjacent feel)
    const moodLight = new THREE.PointLight(0xff5510, 0.18, 12);
    moodLight.position.set(-9, 0, 3);
    this.group.add(moodLight);

    // ── Desk fill lights — brighten table surface in non-spotlight zones ──────
    // Spotlights illuminate directly under x=0, 8, 16. Fill the rest.
    [{ x: -13, z: 0.2 }, { x: 4, z: 0.2 }, { x: 12, z: 0.2 }, { x: 22, z: 0.2 }].forEach(({ x, z }) => {
      const fl = new THREE.PointLight(0xffd080, 0.58, 8.0, 1.5);
      fl.position.set(x, -0.5, z);
      this.group.add(fl);
    });
  }

  // ── Animate ───────────────────────────────────────────────────────────────
  update(time) {
    if (this._windowTex) this._windowTex.needsUpdate = true;
    if (this._shaftMesh) {
      this._shaftMesh.material.opacity = 0.38;
    }

    // Candle flicker
    if (this._candleLights) {
      this._candleLights.forEach(c => {
        const f = Math.sin(time * 9.1 + c.phase) * 0.07
                + Math.sin(time * 17.3 + c.phase * 2.1) * 0.04
                + Math.sin(time * 4.2  + c.phase) * 0.03;
        c.light.intensity = 0.78 + f;
        c.flame.rotation.y = Math.sin(time * 6 + c.phase) * 0.18;
        c.inner.rotation.y = Math.sin(time * 8 + c.phase) * 0.12;
      });
    }

    // Cell phone — lights up every ~11 seconds for ~3 seconds
    if (this._phoneScreenMat) {
      const PCYCLE = 11.0;
      const pt = time % PCYCLE;
      const pAlpha = pt < 0.4 ? pt / 0.4
                   : pt < 2.6 ? 1.0
                   : pt < 3.0 ? (3.0 - pt) / 0.4
                   : 0.0;
      this._phoneScreenMat.emissive.setHex(pAlpha > 0.05 ? 0x1838d0 : 0x000000);
      this._phoneScreenMat.emissiveIntensity = pAlpha * 0.9;
      if (this._phoneLight)    this._phoneLight.intensity    = pAlpha * 0.38;
      if (this._phoneNotifMat) this._phoneNotifMat.opacity   = Math.max(0, pAlpha - 0.1) * 0.92;
    }

    // Hot mug steam
    if (this._steamPuffs) {
      const CYCLE = 2.2;
      this._steamPuffs.forEach(p => {
        const t = ((time + p.phase * CYCLE) % CYCLE) / CYCLE;
        p.mesh.position.y = p.baseY + t * 0.28;
        p.mesh.position.x = p.baseX + Math.sin(time * 1.8 + p.phase * 2.4) * 0.036;
        const op = t < 0.25 ? (t / 0.25) * 0.26 : (1 - t) / 0.75 * 0.26;
        p.mesh.material.opacity = Math.max(0, op);
      });
    }

    // Incense smoke
    if (this._incenseSmoke) {
      const ICYCLE = 3.6;
      this._incenseSmoke.forEach((s, i) => {
        const t = ((time * 0.65 + s.phase * ICYCLE) % ICYCLE) / ICYCLE;
        s.mesh.position.y = s.baseY + t * 0.45;
        s.mesh.position.x = s.baseX + Math.sin(time * 0.9 + s.phase * 1.5) * (0.028 + i * 0.018);
        const op = t < 0.2 ? (t / 0.2) * s.maxOp : (1 - t) / 0.8 * s.maxOp;
        s.mesh.material.opacity = Math.max(0, op);
      });
    }
    // Incense ember flicker
    if (this._incenseLight) {
      const ef = Math.sin(time * 11.4) * 0.028 + Math.sin(time * 7.8) * 0.018;
      this._incenseLight.intensity = 0.20 + ef;
      if (this._incenseTip) this._incenseTip.material.opacity = 0.90 + ef;
    }

    // Cat breathing — gentle body scale pulse
    if (this._catBodyMesh) {
      this._catBodyMesh.scale.y = 0.40 + Math.sin(time * 1.2) * 0.033;
    }

    // Sleep Z's — rise from above cat's head, drift right, fade in/out
    if (this._catZs) {
      const ZCYCLE = 3.5;
      this._catZs.forEach(z => {
        const t = (time / ZCYCLE + z.phase) % 1;
        // head world x≈-4.34 (group -4.9 + 2*0.28), y top≈-0.764, z≈0.56
        z.mesh.position.set(-4.34 + t * 0.14, -0.70 + t * 0.80, 0.68);
        const op = t < 0.18 ? t / 0.18 : t > 0.70 ? (1 - t) / 0.30 : 1;
        z.mesh.material.opacity = Math.max(0, op * 0.85);
      });
    }

    if (this._leftCurtain) {
      this._leftCurtain.position.x  = -8.3 + Math.sin(time * 0.38) * 0.06;
      this._leftCurtain.rotation.z  =  Math.sin(time * 0.28) * 0.022;
    }
    if (this._rightCurtain) {
      this._rightCurtain.position.x = -5.7 + Math.sin(time * 0.38 + 0.6) * 0.06;
      this._rightCurtain.rotation.z =  Math.sin(time * 0.32 + 1.2) * 0.022;
    }
  }
}
