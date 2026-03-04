// weather.js — Local time + weather animated sky renderer

export class WeatherSystem {
  constructor() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = 128;
    this._canvas.height = 192;
    this._ctx = this._canvas.getContext('2d');

    this.weatherCode = 0;
    this.temperature = 20;

    this._stars = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random() * 0.62,
      r: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2
    }));

    this._clouds = Array.from({ length: 6 }, (_, i) => ({
      x: i / 6,
      y: 0.06 + Math.random() * 0.28,
      w: 0.16 + Math.random() * 0.22,
      spd: 0.000020 + Math.random() * 0.000025
    }));

    this._drops = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), vy: 0.006, vx: -0.001, sz: 0.8
    }));
    this._resetDrops();
    this._bolt = 0;

    this._fetchWeather();
  }

  _resetDrops() {
    const snow = this._isSnow();
    this._drops.forEach(p => {
      p.x = Math.random(); p.y = Math.random();
      p.vy = snow ? 0.0013 + Math.random() * 0.0018 : 0.005 + Math.random() * 0.009;
      p.vx = (Math.random() - 0.5) * 0.0015;
      p.sz = snow ? 1.2 + Math.random() * 1.8 : 0.4 + Math.random() * 0.9;
    });
  }

  async _fetchWeather() {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m`
      );
      const d = await r.json();
      this.weatherCode = d.current?.weather_code ?? 0;
      this.temperature = Math.round(d.current?.temperature_2m ?? 20);
      this._resetDrops();
    } catch (_) { /* stay clear sky */ }
  }

  _tod() {
    const n = new Date();
    return (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()) / 86400;
  }

  getBrightness() {
    const t = this._tod();
    if (t >= 0.30 && t <= 0.72) return 1.0;
    if (t > 0.25 && t < 0.30)   return (t - 0.25) / 0.05;
    if (t > 0.72 && t <= 0.80)  return 1.0 - (t - 0.72) / 0.08;
    return 0.0;
  }

  _isRain()    { const c = this.weatherCode; return (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95; }
  _isSnow()    { const c = this.weatherCode; return c >= 71 && c <= 86; }
  _isCloudy()  { return this.weatherCode >= 2; }
  _isThunder() { return this.weatherCode >= 95; }

  _skyGrad(t) {
    if (t >= 0.30 && t <= 0.70) return ['#1a6dbf', '#7abde8'];
    if (t > 0.70 && t < 0.76)   return ['#6030a0', '#f07838'];
    if (t >= 0.76 && t < 0.83)  return ['#2a1050', '#903020'];
    if (t >= 0.20 && t < 0.25)  return ['#1a0c40', '#4a2055'];
    if (t >= 0.25 && t < 0.30)  return ['#4020a0', '#e86030'];
    return ['#07051a', '#12102a'];
  }

  update(time) {
    const ctx = this._ctx;
    const W = 128, H = 192;
    const tod = this._tod();
    const bright = this.getBrightness();
    const [c0, c1] = this._skyGrad(tod);

    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, c0); skyG.addColorStop(1, c1);
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

    // Stars
    if (bright < 0.5) {
      const sa = (0.5 - bright) / 0.5;
      this._stars.forEach(s => {
        const tw = Math.sin(s.phase + time * 2.0) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,255,245,${(sa * (0.35 + tw * 0.65)).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
      });
    }

    const isDay = tod >= 0.25 && tod <= 0.83;

    if (isDay) {
      // Sun arc
      const sunT = (tod - 0.25) / 0.58;
      const sx = W * (0.05 + sunT * 0.9);
      const sy = H * 0.58 - Math.sin(sunT * Math.PI) * H * 0.50;
      const sa = Math.min(1, bright * 1.2);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28);
      sg.addColorStop(0, `rgba(255,255,160,${sa.toFixed(2)})`);
      sg.addColorStop(0.35, `rgba(255,210,60,${(sa * 0.55).toFixed(2)})`);
      sg.addColorStop(1, 'rgba(255,180,40,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,252,160,${sa.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    } else {
      // Moon arc (rises at dusk 0.83, sets at dawn 0.25)
      let mf = tod >= 0.83 ? (tod - 0.83) / 0.42 : (tod + 0.17) / 0.42;
      mf = Math.min(1, Math.max(0, mf));
      const mx = W * (0.05 + mf * 0.9);
      const my = H * 0.58 - Math.sin(mf * Math.PI) * H * 0.44;
      ctx.fillStyle = '#dbd5b8';
      ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.fill();
      [[2.5, -1.5, 1.5], [-2, 2.5, 1.2]].forEach(([dx, dy, r]) => {
        ctx.fillStyle = 'rgba(0,0,0,0.13)';
        ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Clouds
    const cd = this._isCloudy() ? 0.88 : 0.28;
    this._clouds.forEach(c => {
      c.x += c.spd; if (c.x > 1.1) c.x = -0.25;
      this._drawCloud(ctx, c.x * W, c.y * H, c.w * W, cd, bright);
    });

    this._drawHorizon(ctx, W, H, bright);

    // Rain
    if (this._isRain()) {
      ctx.strokeStyle = `rgba(130,160,200,${bright > 0.25 ? 0.45 : 0.30})`;
      ctx.lineWidth = 0.65;
      this._drops.forEach(p => {
        p.y += p.vy; p.x += p.vx - 0.001;
        if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
        ctx.beginPath();
        ctx.moveTo(p.x * W, p.y * H);
        ctx.lineTo((p.x + p.vx * 3) * W, (p.y + p.vy * 0.65) * H);
        ctx.stroke();
      });
    }

    // Snow
    if (this._isSnow()) {
      this._drops.forEach(p => {
        p.y += p.vy; p.x += Math.sin(time * 1.4 + p.x * 7) * 0.0008;
        if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
        ctx.fillStyle = 'rgba(208,225,255,0.82)';
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.sz, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Lightning
    if (this._isThunder() && Math.random() < 0.0035) this._bolt = 0.20;
    if (this._bolt > 0) {
      ctx.fillStyle = `rgba(195,205,255,${this._bolt.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
      if (this._bolt > 0.10) {
        ctx.strokeStyle = `rgba(255,255,180,${Math.min(1, this._bolt * 4).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let bx = W * (0.25 + Math.random() * 0.5), by = 0;
        ctx.moveTo(bx, by);
        while (by < H * 0.68) { by += 10 + Math.random() * 18; bx += (Math.random() - 0.5) * 18; ctx.lineTo(bx, by); }
        ctx.stroke();
      }
      this._bolt = Math.max(0, this._bolt - 0.014);
    }
  }

  _drawCloud(ctx, cx, cy, cw, density, bright) {
    const v = Math.round(bright > 0.5 ? 240 : 80 + bright * 2 * 160);
    ctx.fillStyle = `rgba(${v},${v},${v},${(density * 0.88).toFixed(2)})`;
    [[-0.22, 0, 0.28], [0, -0.10, 0.23], [0.22, -0.06, 0.20], [0.40, 0, 0.18], [0.14, 0.08, 0.26]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(cx + dx * cw, cy + dy * cw, r * cw, 0, Math.PI * 2); ctx.fill();
    });
  }

  _drawHorizon(ctx, W, H, bright) {
    const gy = H * 0.77;
    const gi = Math.round(bright * 40);
    ctx.fillStyle = `rgb(${10 + gi},${gi * 2},${5 + Math.round(gi / 2)})`;
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, gy + 6);
    ctx.bezierCurveTo(W * 0.18, gy - 12, W * 0.42, gy + 10, W * 0.6, gy - 4);
    ctx.bezierCurveTo(W * 0.78, gy - 16, W * 0.9, gy + 8, W, gy + 3);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    const tc = `rgb(${8 + gi},${18 + gi},${4 + Math.round(gi / 2)})`;
    [[11, gy + 3, 24], [W * 0.18, gy - 3, 32], [W * 0.62, gy + 1, 27], [W * 0.82, gy - 5, 36], [W - 10, gy + 5, 21]].forEach(([tx, ty, th]) => {
      ctx.fillStyle = tc;
      ctx.beginPath(); ctx.moveTo(tx, ty - th); ctx.lineTo(tx - 8, ty); ctx.lineTo(tx + 8, ty); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx, ty - th * 0.62); ctx.lineTo(tx - 11, ty - th * 0.22); ctx.lineTo(tx + 11, ty - th * 0.22); ctx.closePath(); ctx.fill();
    });
  }

  getCanvas() { return this._canvas; }
}
