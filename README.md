# ROCKET RUN — project layout

| Folder | What is in it |
|---|---|
| `dist/ROCKET_RUN.html` | **The playable game** — one file, double-click to play. |
| `src/css/` | Styles, split by area (core HUD, cockpit, phone overrides). |
| `src/html/` | Page markup (canvas, HUD, overlays). |
| `src/js/` | Game code in 45 numbered sections (`14_fx.js`, `40_main-loop.js`, `41_performance-manager.js` …). |
| `src/index.template.html` | Page shell that the build fills in. |
| `tools/build.js` | Joins `src/` into `dist/ROCKET_RUN.html` and `www/index.html`. Run: `node tools/build.js` |
| `tools/vendor-three.js` | Copies Three.js locally so the Android app works offline. |
| `www/` | Generated web folder used by the Android wrapper. |
| `.github/workflows/` | Builds the Android APK automatically on GitHub. |

**Why one built file and not separate script files?** Browsers refuse to load separate JavaScript module files when a page is opened by double-click (`file://`).
The build step keeps the code organised in folders *and* keeps the game playable straight from your desktop or phone.

Edit files in `src/`, run `node tools/build.js`, play `dist/ROCKET_RUN.html`.
In-game: Pause menu → **FPS INFO** shows live FPS, resolution scale, draw calls and triangles. **BATTERY SAVER** caps to 30 FPS.

## Smoke test (optional, for developers)
`tools/test/` runs the real game code in a headless browser against a stand-in Three.js, clicks through the menus, starts every game mode and plays ~20 s
with abilities and camera switches, reporting any JavaScript error. It checks game logic, not graphics or FPS.
`node tools/test/modes.js $(pwd)/dist/ROCKET_RUN.html` (needs Playwright installed).

### v11 notes
- Screen effects (vignette, damage/hit flash, boost tunnel, tints, shield glow) are drawn by ONE shader pass (`src/js/40a_screen-fx.js`) instead of ~12 full-screen DOM layers.
- `src/js/41_performance-manager.js` measures CPU time per frame and picks the remedy (fewer effects when CPU-bound; resolution/AA/glow when GPU-bound). FPS INFO shows `cpu` ms.
- Planets (`08_background.js`) are placed with 3D + screen-space clearance, drift at one shared speed, and are disposed when recycled.
- Extra tests: `tools/test/planets_test.js` (placement/leak stress) and `tools/test/shader_test.js` (compiles the effect shader in real WebGL).
