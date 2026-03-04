// ui.js — HTML overlay: toolbar, gauges, speed slider, nav arrows

import { PLANT_TYPES, PLANT_TYPE_LIST } from './plant.js';
import { SUBSTRATE_LIST } from './substrate.js';
import { HARDSCAPE_TYPE_LIST } from './hardscape.js';
import { CARE_TYPES } from './careSystem.js';

export class UI {
  constructor(terrariumManager, timeManager) {
    this.manager = terrariumManager;
    this.timeManager = timeManager;

    this._activeTool = 'place';
    this._selectedPlant = 'fern';
    this._selectedSubstrate = 'tropical';
    this._selectedHardscape = null;
    this._selectedPlantVariant = 0;
    this._selectedHardscapeVariant = 0;

    this._notifBadges = {}; // terrariumIndex → DOM element

    this._initPlantGrid();
    this._initSubstrateGrid();
    this._initHardscapeGrid();
    this._initToolTabs();
    this._initToolItems();
    this._initSpeedButtons();
    this._initNavButtons();
    this._initTerrariumControls();
    this._initCarePanel();
  }

  _initPlantGrid() {
    const grid = document.getElementById('plant-grid');
    PLANT_TYPE_LIST.forEach(pt => {
      const el = document.createElement('div');
      el.className = 'plant-item' + (pt.id === this._selectedPlant ? ' selected' : '');
      el.dataset.plantId = pt.id;
      el.title = pt.description;
      el.textContent = `${pt.emoji} ${pt.name}`;
      const updatePlantLabel = () => {
        const v = this._selectedPlantVariant;
        el.textContent = `${pt.emoji} ${pt.name}` + (v > 0 ? ` [${v}]` : '');
      };
      el.addEventListener('click', () => {
        if (this._selectedPlant === pt.id) {
          this._selectedPlantVariant = (this._selectedPlantVariant + 1) % 4;
        } else {
          this._selectedPlant = pt.id;
          this._selectedHardscape = null;
          this._selectedPlantVariant = 0;
          grid.querySelectorAll('.plant-item').forEach(e => {
            const id = e.dataset.plantId;
            if (id) e.textContent = `${PLANT_TYPES[id].emoji} ${PLANT_TYPES[id].name}`;
            e.classList.remove('selected');
          });
          el.classList.add('selected');
          document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('active'));
          document.querySelector('.tool-item[data-tool="place"]')?.classList.add('active');
          this._activeTool = 'place';
        }
        updatePlantLabel();
      });
      grid.appendChild(el);
    });
  }

  _initSubstrateGrid() {
    const grid = document.getElementById('substrate-grid');
    SUBSTRATE_LIST.forEach(st => {
      const el = document.createElement('div');
      el.className = 'substrate-item' + (st.id === this._selectedSubstrate ? ' selected' : '');
      el.dataset.subId = st.id;

      const swatch = document.createElement('span');
      swatch.className = 'substrate-swatch';
      swatch.style.background = st.color;
      el.appendChild(swatch);
      el.appendChild(document.createTextNode(st.name));

      el.addEventListener('click', () => {
        this._selectedSubstrate = st.id;
        grid.querySelectorAll('.substrate-item').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        // Apply to active terrarium
        const t = this.manager.getActive();
        if (t) t.substrate.changeType(st.id);
      });
      grid.appendChild(el);
    });
  }

  _initHardscapeGrid() {
    const grid = document.getElementById('hardscape-grid');
    HARDSCAPE_TYPE_LIST.forEach(ht => {
      const el = document.createElement('div');
      el.className = 'plant-item' + (ht.id === this._selectedHardscape ? ' selected' : '');
      el.dataset.hardscapeId = ht.id;
      el.title = ht.description;
      el.textContent = `${ht.emoji} ${ht.name}`;
      const updateHardscapeLabel = () => {
        const v = this._selectedHardscapeVariant;
        el.textContent = `${ht.emoji} ${ht.name}` + (v > 0 ? ` [${v}]` : '');
      };
      el.addEventListener('click', () => {
        if (this._selectedHardscape === ht.id) {
          this._selectedHardscapeVariant = (this._selectedHardscapeVariant + 1) % 4;
        } else {
          this._selectedHardscape = ht.id;
          this._selectedPlant = null;
          this._selectedHardscapeVariant = 0;
          grid.querySelectorAll('.plant-item').forEach(e => {
            const id = e.dataset.hardscapeId;
            if (id) e.textContent = `${HARDSCAPE_TYPE_LIST.find(h => h.id === id)?.emoji ?? ''} ${HARDSCAPE_TYPE_LIST.find(h => h.id === id)?.name ?? id}`;
            e.classList.remove('selected');
          });
          el.classList.add('selected');
          document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('active'));
          document.querySelector('.tool-item[data-tool="place"]')?.classList.add('active');
          this._activeTool = 'place';
        }
        updateHardscapeLabel();
      });
      grid.appendChild(el);
    });
  }

  _initToolTabs() {
    document.querySelectorAll('.tool-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        const content = document.getElementById(`tab-${tabName}`);
        if (content) {
          content.classList.remove('hidden');
          content.classList.add('active');
        }
      });
    });
  }

  _initToolItems() {
    document.querySelectorAll('.tool-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('active'));
        item.classList.add('active');
        this._activeTool = item.dataset.tool;
      });
    });
  }

  _initSpeedButtons() {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.timeManager.setSpeed(parseFloat(btn.dataset.speed));
      });
    });
  }

  _initNavButtons() {
    const leftBtn = document.getElementById('nav-left');
    const rightBtn = document.getElementById('nav-right');

    leftBtn.addEventListener('click', () => {
      if (this.manager.navigateLeft()) this._updateNavButtons();
    });

    rightBtn.addEventListener('click', () => {
      if (this.manager.navigateRight()) this._updateNavButtons();
    });

    this._updateNavButtons();
  }

  _updateNavButtons() {
    document.getElementById('nav-left').disabled = !this.manager.canGoLeft();
    document.getElementById('nav-right').disabled = !this.manager.canGoRight();
    const active = this.manager.getActive();
    const pos    = this.manager.terrariums.indexOf(active) + 1;
    const total  = this.manager.terrariums.length;
    document.getElementById('terrarium-counter').textContent = `${pos} / ${total}`;
  }

  _initTerrariumControls() {
    const addBtn = document.getElementById('add-terrarium-btn');
    addBtn.addEventListener('click', () => {
      const t = this.manager.addTerrarium();
      if (!t) return;
      this.manager.navigateTo(this.manager.getSlotOf(t));
      this._updateNavButtons();
      addBtn.disabled = !this.manager.canAddMore();
    });
    addBtn.disabled = !this.manager.canAddMore();
  }

  _initCarePanel() {
    document.getElementById('care-panel-close').addEventListener('click', () => {
      document.getElementById('care-panel').classList.add('hidden');
    });
  }

  // Called every frame to update HUD
  updateHUD() {
    const terrarium = this.manager.getActive();
    if (!terrarium) return;

    document.getElementById('terrarium-name').textContent = terrarium.name;

    const env = terrarium.env;
    const hPct = Math.round(env.humidity);
    const sPct = Math.round(env.soilMoisture);

    document.getElementById('humidity-value').textContent = `${hPct}%`;
    document.getElementById('humidity-fill').style.width = `${hPct}%`;
    document.getElementById('humidity-fill').className = 'gauge-fill' + (hPct < 30 ? ' low' : hPct < 60 ? ' mid' : '');

    document.getElementById('temp-value').textContent = `${env.temperature}°C`;

    document.getElementById('soil-value').textContent = `${sPct}%`;
    document.getElementById('soil-fill').style.width = `${sPct}%`;
    document.getElementById('soil-fill').className = 'gauge-fill' + (sPct < 25 ? ' low' : sPct < 50 ? ' mid' : '');

    this._updateNavButtons();
    this._updateNotifications();
  }

  _updateNotifications() {
    const container = document.getElementById('notifications-container');

    this.manager.terrariums.forEach((terrarium) => {
      const idx = this.manager.getSlotOf(terrarium);
      const count = terrarium.careSystem.getPendingCount();
      let badge = this._notifBadges[idx];

      if (count > 0) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'notif-badge';
          badge.addEventListener('click', () => this._openCarePanel(idx));
          container.appendChild(badge);
          this._notifBadges[idx] = badge;
        }

        // Position the badge based on terrarium screen position
        const screenX = this._terrariumScreenX(idx);
        badge.style.left = `${screenX}px`;
        badge.style.top = '20px';
        badge.textContent = `${count} care needed`;
      } else {
        if (badge) {
          badge.remove();
          delete this._notifBadges[idx];
        }
      }
    });
  }

  _terrariumScreenX(slot) {
    const diff = slot - this.manager.activeIndex;
    return window.innerWidth / 2 + diff * 200;
  }

  _openCarePanel(terrariumIdx) {
    const terrarium = this.manager._slots[terrariumIdx];
    if (!terrarium) return;

    const panel = document.getElementById('care-panel');
    const list = document.getElementById('care-list');
    const title = document.getElementById('care-panel-title');

    title.textContent = `Care Needed — ${terrarium.name}`;
    list.innerHTML = '';

    const events = terrarium.careSystem.getEvents();
    if (events.length === 0) {
      panel.classList.add('hidden');
      return;
    }

    events.forEach(evt => {
      const careType = CARE_TYPES[evt.type];
      if (!careType) return;
      const plant = terrarium.plants.find(p => p.id === evt.plantId);
      const plantName = plant ? plant.type.name : 'Unknown';

      const item = document.createElement('div');
      item.className = 'care-item';
      item.innerHTML = `<span>${careType.icon}</span><span>${plantName}: ${careType.label}</span>`;
      list.appendChild(item);
    });

    panel.classList.remove('hidden');
  }

  getActiveTool() { return this._activeTool; }
  getSelectedPlant() { return this._selectedPlant; }
  getSelectedSubstrate() { return this._selectedSubstrate; }
  getSelectedHardscape() { return this._selectedHardscape; }
  getSelectedPlantVariant() { return this._selectedPlantVariant; }
  getSelectedHardscapeVariant() { return this._selectedHardscapeVariant; }

  hideLoading() {
    const screen = document.getElementById('loading-screen');
    screen.classList.add('hidden');
  }
}
