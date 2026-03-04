# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

**No build step.** Open `index.html` directly in a browser that supports ES modules and importmaps (Chrome 89+, Firefox 108+, Edge 89+).

For reliable module loading (avoids CORS errors on some browsers):
```bash
npx serve .          # or
python -m http.server 8080
```

Then open `http://localhost:8080`.

**Debug access:** `window._game` exposes the live `Game` instance in DevTools console.

## Architecture

### Module dependency graph
```
main.js
  └── Game (game.js)
        ├── SceneManager (scene.js)       — WebGLRenderer, camera, lights, post-processing
        ├── TimeManager (timeManager.js)  — game clock, speed multiplier, tick intervals
        ├── WeatherSystem (weather.js)    — sky canvas, Open-Meteo API, real local time
        ├── Room (room.js)                — background room meshes + atmosphere
        ├── TerrariumManager (terrariumManager.js)
        │     └── Terrarium (terrarium.js)
        │           ├── Substrate (substrate.js)
        │           ├── Plant (plant.js)
        │           └── CareSystem (careSystem.js)
        ├── ParticleSystem (particles.js)
        ├── UI (ui.js)
        └── InputHandler (inputHandler.js)
```

### Rendering pipeline
- **Internal resolution**: `1280×720`, CSS-upscaled with `image-rendering: pixelated`
- **Render path**: `EffectComposer → RenderPass → BokehPass` (falls back to direct renderer if unavailable)
- All textures use `NearestFilter` for the pixel-art look
- Plant sprites: `OffscreenCanvas 192×288` → `CanvasTexture` → `PlaneGeometry` billboard
- Weather window: `CanvasTexture` wrapping `WeatherSystem._canvas`, `needsUpdate = true` every frame in `room.update()`

### Lighting model (interior — fixed, not time-dependent)
Interior lighting is **static**. `scene.setTimeOfDay()` exists but is intentionally **not called** from the game loop. Only the weather canvas (outside the window) reflects real time/weather.

Key lights in `scene.js`:
- `ambientLight` — `AmbientLight(0xFFF5E0, 0.26)`
- `dirLight` — `DirectionalLight(0xFFE8C0, 0.42)`
- `lampLight` — `PointLight(0xFF9933, 0.84, 20)`
- `tableLight` — `PointLight(0xFFDD66, 1.80, 11, 1.5)` — follows active terrarium X
- `terrariumSpot` — `SpotLight(0xFFFFFF, 6.75)` — top-down, no lamp geometry, follows active X
- `_leftFill` / `_rightFill` — flanking fill lights, follow active X
- Beam cone + pool: `CylinderGeometry` + `CircleGeometry` with `AdditiveBlending`

All lights that follow the active terrarium are updated in `scene.setTerrariumLightX(x)`, called each frame with `camera.position.x`.

### Terrarium spacing
Terrariums are spaced at `SPACING = 8` world units (`Terrarium.group.position.x = index * 8`). Camera lerps to `activeIndex * 8` at `LERP_SPEED = 0.08` per frame.

### Substrate geometry (two-mesh system)
`Substrate` uses **two separate meshes**:
1. `_baseFrontFace` — static front-face `PlaneGeometry` showing the soil profile (colored side-view)
2. `mesh` — horizontal `PlaneGeometry(SUB_W, SUB_D, 19, 7)` top surface with a `Float32Array(20×8)` height map for sculpting

`getSurfaceY(normX, normZ)` does a 2D lookup into the height map to place plants at correct height. `sculptAtPoint(localX, localZ, dir)` converts local mesh coords to normalized, then applies radial falloff.

### Game tick intervals (TimeManager)
All intervals are in **real milliseconds**, scaled by `speedMultiplier`:
- **Growth tick**: 30 000 ms → `terrariumManager.growAll(5)` (5% per tick)
- **Care tick**: 60 000 ms → `terrariumManager.evaluateCareAll()`
- **Env tick**: 10 000 ms → `terrariumManager.decayAll(scaledDelta)`
- **Save tick**: 30 000 ms → `game._save()`

### Sprite coordinate system (`plant.js`)
- Canvas: `192×288 px`
- Logical grid: `96×144` cells drawn with 2×2 px blocks via `b(ctx, gx, gy, color)`
- Convention: `cx = 48` (horizontal center), `base = 143` (bottom of canvas, plants grow upward)
- Growth stage 0→1 drives all size/detail parameters in each drawer

### Save format (`localStorage` key: `terrarium_save`)
```js
{
  version: 1,
  terrariums: [{ name, substrateType, heightMap, plants: [...], env: {...} }],
  gameTime: <ms>,
  speedMultiplier: <number>
}
```
Version mismatch → save ignored entirely.

### Weather system
`WeatherSystem` fetches from `navigator.geolocation` + `https://api.open-meteo.com/v1/forecast`. On failure it silently stays clear-sky. WMO weather codes: 51–67 / 80–82 / 95+ = rain, 71–86 = snow, 95+ = thunder. `getBrightness()` maps real clock time to 0–1 but is only used for window light shaft opacity — **not** for interior lights.

### Key constants to know
| Constant | Value | File |
|----------|-------|------|
| `GLASS_W/H/D` | 5.175 / 4.025 / 3.45 | terrarium.js |
| `SUB_BASE_Y` | -2.0125 | substrate.js |
| `_surfaceY` | -1.3625 | substrate.js |
| `GRID_W × GRID_D` | 20 × 8 | substrate.js |
| `SPACING` | 8 | terrariumManager.js |
| `INTERNAL_W/H` | 1280 / 720 | scene.js |

### THREE.js pitfall
`THREE.Mesh.position` is a read-only Vector3 property — it must be mutated, never replaced. Always use `.position.set(x, y, z)` or `.position.x = ...`. Using `Object.assign(mesh, { position: new THREE.Vector3(...) })` will throw.
