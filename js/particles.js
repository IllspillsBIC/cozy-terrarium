// particles.js — Dust motes, ambient particles

import * as THREE from 'three';

function makeCircleSprite(size = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const r = size / 2;
  const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, 'rgba(255,240,200,1)');
  grd.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export class ParticleSystem {
  constructor(count = 220) {
    this.count = count;
    this.group = new THREE.Group();

    this._positions  = new Float32Array(count * 3);
    this._velocities = new Float32Array(count * 3);
    this._phases     = new Float32Array(count);

    this._initParticles();
    this._buildMesh();
  }

  _initParticles() {
    for (let i = 0; i < this.count; i++) {
      this._resetParticle(i, true);
      this._phases[i] = Math.random() * Math.PI * 2;
    }
  }

  _resetParticle(i, randomY = false) {
    const j = i * 3;
    this._positions[j]   = -22 + Math.random() * 56;         // x: full room -22 to 34
    this._positions[j+1] = randomY ? -3 + Math.random() * 10 : -3.0;
    this._positions[j+2] = -2 + Math.random() * 4;           // z depth range

    this._velocities[j]   = (Math.random() - 0.5) * 0.002;
    this._velocities[j+1] = 0.0008 + Math.random() * 0.0025; // upward drift
    this._velocities[j+2] = (Math.random() - 0.5) * 0.001;
  }

  _buildMesh() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.04,
      map: makeCircleSprite(8),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  // speed: current timeManager.speedMultiplier — scales particle movement
  update(time, speed = 1) {
    const pos = this._positions;
    const vel = this._velocities;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      const phase = this._phases[i];
      pos[j]   += (vel[j]   + Math.sin(time * 0.3  + phase) * 0.0005) * speed;
      pos[j+1] +=  vel[j+1] * speed;
      pos[j+2] += (vel[j+2] + Math.cos(time * 0.25 + phase) * 0.0004) * speed;

      if (pos[j+1] > 7.5 || pos[j] < -24 || pos[j] > 36) {
        this._resetParticle(i, false);
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
