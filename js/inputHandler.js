// inputHandler.js — Mouse input, raycasting, tool dispatch

import * as THREE from 'three';

export class InputHandler {
  constructor(canvas, camera, terrariumManager, ui) {
    this.canvas = canvas;
    this.camera = camera;
    this.manager = terrariumManager;
    this.ui = ui;

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._sculpting = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('click', this._onClick.bind(this));
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));

    // Keyboard nav
    window.addEventListener('keydown', this._onKey.bind(this));
  }

  _getNDC(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  _onClick(event) {
    const tool = this.ui.getActiveTool();
    if (tool === 'sculpt') return; // handled in mousedown/move
    if (this.manager.isTransitioning()) return;

    const ndc = this._getNDC(event);
    this._mouse.set(ndc.x, ndc.y);
    this._raycaster.setFromCamera(this._mouse, this.camera);

    const terrarium = this.manager.getActive();
    if (!terrarium) return;

    switch (tool) {
      case 'place':
        this._handlePlace(event, terrarium, ndc);
        break;
      case 'water':
        this._handleWater(terrarium);
        break;
      case 'mist':
        this._handleMist(terrarium);
        break;
      case 'scissors':
      case 'remove':
        this._handlePlantTool(terrarium, tool);
        break;
    }
  }

  _handlePlace(event, terrarium, ndc) {
    const plantTypeId = this.ui.getSelectedPlant();
    const hardscapeTypeId = this.ui.getSelectedHardscape();
    if (!plantTypeId && !hardscapeTypeId) return;

    // Raycast against the substrate surface plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.0);
    const hit = new THREE.Vector3();
    if (!this._raycaster.ray.intersectPlane(plane, hit)) return;

    // Convert to local terrarium space
    const localHit = terrarium.group.worldToLocal(hit.clone());
    const nx = (localHit.x / 4.0) + 0.5;
    const nz = (localHit.z / 3.0) + 0.5;

    if (nx < 0.05 || nx > 0.95 || nz < 0.05 || nz > 0.95) return;

    if (hardscapeTypeId) {
      terrarium.addHardscape(hardscapeTypeId, nx, nz, this.ui.getSelectedHardscapeVariant());
    } else {
      terrarium.addPlant(plantTypeId, nx, nz, this.ui.getSelectedPlantVariant());
    }
  }

  _handleWater(terrarium) {
    // Check if click is on a specific plant, else water whole tank
    const plant = this._getClickedPlant(terrarium);
    if (plant) {
      terrarium.waterPlant(plant);
    } else {
      terrarium.water();
    }
  }

  _handleMist(terrarium) {
    terrarium.mist();
  }

  _handlePlantTool(terrarium, tool) {
    const plant = this._getClickedPlant(terrarium);
    if (plant) {
      if (tool === 'scissors') terrarium.clipLeaf(plant);
      else if (tool === 'remove') terrarium.removePlant(plant);
      return;
    }
    if (tool === 'remove') {
      const item = this._getClickedHardscape(terrarium);
      if (item) terrarium.removeHardscape(item);
    }
  }

  _getClickedPlant(terrarium) {
    const meshes = terrarium.plants.map(p => p.mesh).filter(Boolean);
    const hits = this._raycaster.intersectObjects(meshes);
    if (hits.length === 0) return null;
    const hitMesh = hits[0].object;
    return terrarium.plants.find(p => p.mesh === hitMesh);
  }

  _getClickedHardscape(terrarium) {
    const meshes = terrarium.hardscape.map(h => h.mesh).filter(Boolean);
    const hits = this._raycaster.intersectObjects(meshes);
    if (hits.length === 0) return null;
    const hitMesh = hits[0].object;
    return terrarium.hardscape.find(h => h.mesh === hitMesh);
  }

  _doSculpt(event) {
    const terrarium = this.manager.getActive();
    if (!terrarium?.substrate?.mesh) return;
    const ndc = this._getNDC(event);
    this._mouse.set(ndc.x, ndc.y);
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const hits = this._raycaster.intersectObject(terrarium.substrate.mesh);
    if (!hits.length) return;
    const localHit = terrarium.group.worldToLocal(hits[0].point.clone());
    const dir = event.buttons === 1 ? 1 : event.buttons === 2 ? -1 : 0;
    if (dir === 0) return;
    terrarium.substrate.sculptAtPoint(localHit.x, localHit.z, dir);
  }

  _onMouseDown(event) {
    if (this.ui.getActiveTool() !== 'sculpt') return;
    this._sculpting = true;
    this._doSculpt(event);
  }

  _onMouseMove(event) {
    if (!this._sculpting) return;
    const tool = this.ui.getActiveTool();
    if (tool !== 'sculpt') { this._sculpting = false; return; }
    this._doSculpt(event);
  }

  _onMouseUp() {
    this._sculpting = false;
  }

  _onKey(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (event.shiftKey) {
        event.preventDefault();
        if (event.key === 'ArrowLeft')  this.manager.swingLeft();
        if (event.key === 'ArrowRight') this.manager.swingRight();
      } else {
        if (event.key === 'ArrowLeft')  this.manager.navigateLeft();
        if (event.key === 'ArrowRight') this.manager.navigateRight();
      }
    }
  }
}
