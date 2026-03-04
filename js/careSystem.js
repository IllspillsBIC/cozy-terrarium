// careSystem.js — Care event state machine + notifications

export const CARE_TYPES = {
  NEEDS_WATER:    { id: 'NEEDS_WATER',    icon: '💧', label: 'Needs water',    badge: '💧' },
  NEEDS_HUMIDITY: { id: 'NEEDS_HUMIDITY', icon: '🌫️', label: 'Needs misting',  badge: '🌫️' },
  DEAD_LEAF:      { id: 'DEAD_LEAF',      icon: '✂️', label: 'Dead leaf',      badge: '✂️' },
  DEAD_PLANT:     { id: 'DEAD_PLANT',     icon: '🗑️', label: 'Plant dying',    badge: '🗑️' }
};

export class CareSystem {
  constructor() {
    this.events = []; // Array of { plantId, type, timestamp }
    this._neglectTimers = {}; // plantId → ms neglected
    this._deadLeafChance = 0.15; // 15% per care tick on mature+ plants
  }

  /**
   * Called on care tick (every ~60s). Evaluate all plants in terrarium.
   * @param {Array} plants - Plant instances
   * @param {Object} env - terrarium env state
   */
  evaluate(plants, env) {
    const newEvents = [];

    plants.forEach(plant => {
      if (plant.health <= 0) {
        if (!this._hasEvent(plant.id, 'DEAD_PLANT')) {
          newEvents.push({ plantId: plant.id, type: 'DEAD_PLANT', timestamp: Date.now() });
        }
        return;
      }

      // Check water need
      if (plant.waterLevel < 25) {
        if (!this._hasEvent(plant.id, 'NEEDS_WATER')) {
          newEvents.push({ plantId: plant.id, type: 'NEEDS_WATER', timestamp: Date.now() });
        }
      }

      // Check humidity need
      if (env.humidity < plant.type.minHumidity) {
        if (!this._hasEvent(plant.id, 'NEEDS_HUMIDITY')) {
          newEvents.push({ plantId: plant.id, type: 'NEEDS_HUMIDITY', timestamp: Date.now() });
        }
      }

      // Random dead leaf on mature+ plants
      if (plant.growthProgress >= 60 && Math.random() < this._deadLeafChance) {
        if (!this._hasEvent(plant.id, 'DEAD_LEAF')) {
          newEvents.push({ plantId: plant.id, type: 'DEAD_LEAF', timestamp: Date.now() });
        }
      }
    });

    this.events.push(...newEvents);
    return newEvents;
  }

  /** Process environment tick: neglected plants lose health */
  processNeglect(plants, realDelta) {
    plants.forEach(plant => {
      const neglectEvents = this.events.filter(e => e.plantId === plant.id);
      if (neglectEvents.length > 0) {
        this._neglectTimers[plant.id] = (this._neglectTimers[plant.id] || 0) + realDelta;
        const neglectMs = this._neglectTimers[plant.id];
        // After 2 min neglect, start losing health
        if (neglectMs > 120000) {
          plant.health = Math.max(0, plant.health - 0.5);
        }
      } else {
        this._neglectTimers[plant.id] = 0;
      }
    });
  }

  /** Resolve a care event for a plant (player acted) */
  resolve(plantId, type) {
    this.events = this.events.filter(e => !(e.plantId === plantId && e.type === type));
    // Reset neglect timer if no more events
    if (!this.events.some(e => e.plantId === plantId)) {
      this._neglectTimers[plantId] = 0;
    }
  }

  /** Resolve all events for a plant */
  resolveAll(plantId) {
    this.events = this.events.filter(e => e.plantId !== plantId);
    this._neglectTimers[plantId] = 0;
  }

  /** Get all pending events (optionally for a specific plant) */
  getEvents(plantId = null) {
    if (plantId) return this.events.filter(e => e.plantId === plantId);
    return this.events;
  }

  /** Count of total pending care events */
  getPendingCount() {
    return this.events.length;
  }

  _hasEvent(plantId, type) {
    return this.events.some(e => e.plantId === plantId && e.type === type);
  }
}
