// weather.js — Animated sky renderer (static daytime, no real-world data)

export class WeatherSystem {
  constructor() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = 128;
    this._canvas.height = 192;
    this._ctx = this._canvas.getContext('2d');

    this._clouds = Array.from({ length: 6 }, (_, i) => ({
      x: i / 6,
      y: 0.06 + Math.random() * 0.28,
      w: 0.16 + Math.random() * 0.22,
      spd: 0.000020 + Math.random() * 0.000025
    }));
  }

  update(time) {
    const ctx = this._ctx;
    const W = 128, H = 192;

    // Static daytime sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, '#1a6dbf');
    skyG.addColorStop(1, '#7abde8');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, H);

    // Sun — slow arc driven by elapsed time
    const sunT = (Math.sin(time * 0.012) * 0.5 + 0.5) * 0.8 + 0.1;
    const sx = W * (0.05 + sunT * 0.9);
    const sy = H * 0.58 - Math.sin(sunT * Math.PI) * H * 0.50;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28);
    sg.addColorStop(0, 'rgba(255,255,160,1.00)');
    sg.addColorStop(0.35, 'rgba(255,210,60,0.55)');
    sg.addColorStop(1, 'rgba(255,180,40,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,252,160,1.00)';
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();

    // Clouds
    this._clouds.forEach(c => {
      c.x += c.spd; if (c.x > 1.1) c.x = -0.25;
      this._drawCloud(ctx, c.x * W, c.y * H, c.w * W);
    });

    this._drawHorizon(ctx, W, H);
  }

  _drawCloud(ctx, cx, cy, cw) {
    ctx.fillStyle = 'rgba(240,240,240,0.78)';
    [[-0.22, 0, 0.28], [0, -0.10, 0.23], [0.22, -0.06, 0.20], [0.40, 0, 0.18], [0.14, 0.08, 0.26]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(cx + dx * cw, cy + dy * cw, r * cw, 0, Math.PI * 2); ctx.fill();
    });
  }

  _drawHorizon(ctx, W, H) {
    const gy = H * 0.77;
    ctx.fillStyle = 'rgb(20,40,10)';
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, gy + 6);
    ctx.bezierCurveTo(W * 0.18, gy - 12, W * 0.42, gy + 10, W * 0.6, gy - 4);
    ctx.bezierCurveTo(W * 0.78, gy - 16, W * 0.9, gy + 8, W, gy + 3);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    const tc = 'rgb(18,42,10)';
    [[11, gy + 3, 24], [W * 0.18, gy - 3, 32], [W * 0.62, gy + 1, 27], [W * 0.82, gy - 5, 36], [W - 10, gy + 5, 21]].forEach(([tx, ty, th]) => {
      ctx.fillStyle = tc;
      ctx.beginPath(); ctx.moveTo(tx, ty - th); ctx.lineTo(tx - 8, ty); ctx.lineTo(tx + 8, ty); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx, ty - th * 0.62); ctx.lineTo(tx - 11, ty - th * 0.22); ctx.lineTo(tx + 11, ty - th * 0.22); ctx.closePath(); ctx.fill();
    });
  }

  getCanvas() { return this._canvas; }
}
