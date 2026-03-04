// scene.js — Three.js scene, camera, renderer, lights

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass }      from 'three/addons/postprocessing/BokehPass.js';

const INTERNAL_W = 1280;
const INTERNAL_H = 720;

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupLights();
    this._setupTerrariumLight();
    this._setupPostProcessing();
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false
    });
    this.renderer.setPixelRatio(1.0);
    this.renderer.setSize(INTERNAL_W, INTERNAL_H, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.setClearColor(0x1a1008, 1);
    this.renderer.toneMapping = THREE.NoToneMapping;
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a1008, 11, 36);
  }

  _setupCamera() {
    const aspect = INTERNAL_W / INTERNAL_H;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 1.5, 7);
    this.camera.lookAt(0, 0.5, 0);
  }

  _setupLights() {
    // Low ambient so the background recedes into shadow — table lights carry the foreground
    const ambient = new THREE.AmbientLight(0xFFF5E0, 0.286);
    this.ambientLight = ambient;
    this.scene.add(ambient);

    // Directional — kept soft so it doesn't flood the background wall equally
    this.dirLight = new THREE.DirectionalLight(0xFFE8C0, 0.462);
    this.dirLight.position.set(-3, 5, 3);
    this.dirLight.castShadow = true;
    this.scene.add(this.dirLight);

    // Desk lamp — warm point, right side
    this.lampLight = new THREE.PointLight(0xFF9933, 0.924, 20);
    this.lampLight.position.set(4, 4, 2);
    this.scene.add(this.lampLight);

    // Table fill — medium yellow, illuminates desk surface + terrariums with falloff
    // Short distance keeps the light from washing out the background wall
    this.tableLight = new THREE.PointLight(0xFFDD66, 1.98, 11, 1.5);
    this.tableLight.position.set(0, 3.5, 1.0);
    this.scene.add(this.tableLight);
  }

  // ── Per-terrarium fixed overhead spots (one per slot, never move) ────────
  _setupTerrariumLight() {
    // Three fixed slots at x = 0, 8, 16 (slot * SPACING)
    const SLOT_X = [0, 8, 16];

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.105,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.33,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    const coneGeo = new THREE.CylinderGeometry(0.06, 2.8, 8.0, 18, 1, true);
    const poolGeo = new THREE.CircleGeometry(2.4, 24);

    this._terrariumSpots = SLOT_X.map(sx => {
      const spot = new THREE.SpotLight(0xFFFFFF, 7.425, 22, Math.PI / 9, 0.30, 1.6);
      spot.position.set(sx, 6.5, -0.02);
      spot.target.position.set(sx, -1.5, -0.52);
      this.scene.add(spot);
      this.scene.add(spot.target);

      const cone = new THREE.Mesh(coneGeo, coneMat.clone());
      cone.position.set(sx, 6.5 - 4.0, -0.27);
      this.scene.add(cone);

      const pool = new THREE.Mesh(poolGeo, poolMat.clone());
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(sx, -1.50, -0.52);
      this.scene.add(pool);

      return { spot, cone, pool };
    });

    // Soft side fills — follow active terrarium for general desk illumination
    this._leftFill = new THREE.PointLight(0xFFEECC, 0.77, 9, 1.5);
    this._leftFill.position.set(-3.5, 1.5, 1.5);
    this.scene.add(this._leftFill);

    this._rightFill = new THREE.PointLight(0xFFEECC, 0.77, 9, 1.5);
    this._rightFill.position.set(3.5, 1.5, 1.5);
    this.scene.add(this._rightFill);
  }

  // ── Depth-of-field post-processing ───────────────────────────────────────
  _setupPostProcessing() {
    try {
      this._composer = new EffectComposer(this.renderer);
      this._composer.addPass(new RenderPass(this.scene, this.camera));
      // Very subtle bokeh — background (z=-5, dist≈12) gets slight softness
      // while terrariums (z≈0, dist≈7) stay sharp
      this._bokehPass = new BokehPass(this.scene, this.camera, {
        focus:    7.2,
        aperture: 0.00012,
        maxblur:  0.0030,
        width:    INTERNAL_W,
        height:   INTERNAL_H
      });
      this._composer.addPass(this._bokehPass);
    } catch (e) {
      console.warn('Post-processing unavailable, falling back to direct render:', e.message);
      this._composer = null;
    }
  }

  // ── Dynamic light updates ─────────────────────────────────────────────────
  setTimeOfDay(brightness) {
    // Indoor scene always has warm fill from lamp + candles + terrarium spot.
    // brightness only adds/removes the window sunlight on top.
    this.ambientLight.intensity = 0.462 + brightness * 0.198; // min 0.462, max 0.66
    this.dirLight.intensity     = 0.198 + brightness * 0.715; // min 0.198 (moonlight), max 0.913
    // Room lamp gets brighter at night to compensate for lost daylight
    this.lampLight.intensity    = 0.605 + (1.0 - brightness) * 0.385;

    // Terrarium spots more dramatic at night
    if (this._terrariumSpots) {
      const spotI    = 1.0  + (1.0 - brightness) * 1.2;
      const coneOpac = 0.030 + (1.0 - brightness) * 0.060;
      const poolOpac = 0.09  + (1.0 - brightness) * 0.14;
      this._terrariumSpots.forEach(({ spot, cone, pool }) => {
        spot.intensity          = spotI;
        cone.material.opacity   = coneOpac;
        pool.material.opacity   = poolOpac;
      });
    }

    if (brightness > 0.7) {
      this.dirLight.color.set(0xFFE8C0);
    } else if (brightness > 0.15) {
      const t = (brightness - 0.15) / 0.55;
      this.dirLight.color.setRGB(1.0, 0.45 + t * 0.50, 0.15 + t * 0.60);
    } else {
      this.dirLight.color.setRGB(0.55, 0.50, 0.70); // soft indoor night tint
    }
  }

  // Called from game loop — moves fill lights with the active terrarium
  setTerrariumLightX(x) {
    if (this.tableLight)   this.tableLight.position.x   = x;
    if (this._leftFill)    this._leftFill.position.x    = x - 3.5;
    if (this._rightFill)   this._rightFill.position.x   = x + 3.5;
  }

  render() {
    if (this._composer) {
      this._composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  addToScene(obj)    { this.scene.add(obj); }
  removeFromScene(obj) { this.scene.remove(obj); }

  setCameraX(x) {
    this.camera.position.x = x;
    this.camera.lookAt(x, 0.5, 0);
  }
}
