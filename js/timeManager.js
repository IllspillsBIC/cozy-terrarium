// timeManager.js — Game clock with speed multiplier

export class TimeManager {
  constructor() {
    this.speeds = { '1': 1.0, '1.2': 1.2, '1.5': 1.5, '2': 2.0 };
    this.speedMultiplier = 1.0;
    this.gameTime = 0; // accumulated ms (scaled)

    // Interval trackers (real ms elapsed since last tick)
    this._lastGrowthTick = 0;
    this._lastCareTick = 0;
    this._lastEnvTick = 0;
    this._lastSaveTick = 0;

    this.GROWTH_INTERVAL = 30000;   // 30 real-seconds
    this.CARE_INTERVAL   = 60000;   // 60 real-seconds
    this.ENV_INTERVAL    = 10000;   // 10 real-seconds
    this.SAVE_INTERVAL   = 30000;   // 30 real-seconds
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
  }

  /** Called every frame. realDelta = real milliseconds since last frame.
   *  Returns an object of flags indicating which ticks fired this frame. */
  tick(realDelta) {
    const scaled = realDelta * this.speedMultiplier;
    this.gameTime += scaled;

    this._lastGrowthTick += realDelta;
    this._lastCareTick   += realDelta;
    this._lastEnvTick    += realDelta;
    this._lastSaveTick   += realDelta;

    const result = {
      growth: false,
      care:   false,
      env:    false,
      save:   false,
      scaledDelta: scaled
    };

    if (this._lastGrowthTick >= this.GROWTH_INTERVAL / this.speedMultiplier) {
      result.growth = true;
      this._lastGrowthTick = 0;
    }
    if (this._lastCareTick >= this.CARE_INTERVAL / this.speedMultiplier) {
      result.care = true;
      this._lastCareTick = 0;
    }
    if (this._lastEnvTick >= this.ENV_INTERVAL / this.speedMultiplier) {
      result.env = true;
      this._lastEnvTick = 0;
    }
    if (this._lastSaveTick >= this.SAVE_INTERVAL) {
      result.save = true;
      this._lastSaveTick = 0;
    }

    return result;
  }

  getState() {
    return {
      gameTime: this.gameTime,
      speedMultiplier: this.speedMultiplier
    };
  }

  loadState(state) {
    if (!state) return;
    this.gameTime = state.gameTime || 0;
    this.speedMultiplier = state.speedMultiplier || 1.0;
  }
}
