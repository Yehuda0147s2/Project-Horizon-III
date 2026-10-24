# Touch Camera Controls & Mobile Input Hardening — Future-Proofing Appendix

This appendix documents all the invariants, guardrails, and architectural rules governing the unified pointer engine and camera controller.

## 8.1 Input & UI

| Tip | Reason |
|---|---|
| **Every `<button>` needs `mousedown → e.preventDefault()`** | Buttons otherwise steal focus; `Space` re-fires them instead of jumping / action (browser default). |
| **Any new interactive HUD element must have `data-hud`** | The controller uses `[data-hud]` to skip captures. Forgetting breaks camera on touch. |
| **All full-screen overlay divs: `touch-action: none` + explicit `pointer-events: auto`** | `touch-action: auto` (default) lets the browser steal gestures for scroll, zoom, back-swipe. |
| **Never use `click` for gameplay** | `click` fires 300ms late on mobile and doesn't fire after drags. Use `pointerdown` / `pointerup`. |
| **`setPointerCapture` on every draggable element** | Ensures the element receives events even if the pointer leaves its bounds. Without it, drags break at edges. |
| **Test every HUD button at 320×568 and 375×667** | Smallest common mobile viewports. If it fits there, it fits everywhere. |
| **`overscroll-behavior: none` on `body`** | Prevents pull-to-refresh killing your canvas mid-game. |
| **Add `<meta name="apple-mobile-web-app-capable" content="yes">`** | Enables fullscreen on iOS when added to home screen. |
| **Handle Android back button via `popstate`** | Otherwise back exits the game entirely (loses state). |

## 8.2 Camera & Rendering

| Tip | Reason |
|---|---|
| **Cap `devicePixelRatio` at 2** | Retina phones at 3× tank FPS for no visible gain. |
| **`CONFIG.camera.distance` is the single source of truth** | Multiple systems writing to it → preview desync. Controller owns it; everyone reads it. |
| **Camera collision: raycast player→camera each frame** | Otherwise camera clips through hills and walls. |
| **Floating origin: shift world when `|playerPos| > 1000`** | Prevents float precision jitter at >5km from origin. |
| **`dt = Math.min(clock.getDelta(), 0.05)` in game loop** | After tab-switch `getDelta()` returns huge values → physics explodes. |

## 8.3 Save / Persistence

| Tip | Reason |
|---|---|
| **Version tag every save: `{ v: N, ... }`** | Schema changes without versioning corrupt old saves. Add a migration function `migrate(v2→v3)` per bump. |
| **Round float positions to 2 decimals before save** | Prevents 47KB save files from raw float precision. |
| **Save on `visibilitychange` when `document.hidden`** | Mobile users swipe away — auto-save fires or data is lost. |
| **Wrap every `localStorage` access in try/catch** | Safari private mode throws `QuotaExceededError`. |
| **Store depleted gatherables as `Map<chunkKey, Set<id>>`** | Not the whole object — just the ID. World gen is deterministic; only the delta matters. |

## 8.4 Performance

| Tip | Reason |
|---|---|
| **Pause `requestAnimationFrame` when `document.hidden`** | Battery drain. Resume on visible. |
| **Budget chunk loading: ≤ 2 per frame** | Prevents 30ms stutter when crossing chunk boundary. |
| **Pre-allocate `Vector3` / `Vector2` for hot loops** | `new THREE.Vector3()` inside `animate()` = 60 GC pauses/sec. |
| **Dispose geometries + materials on chunk unload** | Otherwise VRAM climbs until tab crashes. |
| **Cap concurrent sounds at 8** | 50 overlapping Web Audio oscillators = crunchy mess + perf hit. |

## 8.5 Audio

| Tip | Reason |
|---|---|
| **Only call `audioCtx.resume()` on a user gesture** | iOS / Chrome autoplay policy blocks otherwise. |
| **Wrap every SFX in try/catch** | Some browsers disable Web Audio entirely in private mode. |
| **Lazy-init `AudioContext` on first `onTap`** | Deferring avoids warnings during page load. |

## 8.6 Robustness

| Tip | Reason |
|---|---|
| **Every raycast needs a null check** | `raycaster.intersectObjects()` returns `[]` on miss — dereferencing crashes. |
| **Clamp `player.position.y` every frame** | A NaN from bad physics propagates to `setY(NaN)` and kills the world. `player.position.y = Math.max(-100, Math.min(500, y))`. |
| **Autosave interval ≥ 10s** | Too frequent → hitches. Too infrequent → data loss. 15s is the sweet spot. |
| **Handle `pointercancel` — not just `pointerup`** | Mobile browsers cancel pointers on system gestures (calls, notifications). Without it, touches get stuck. |
| **`pointerup` on `window`, not on `element`** | If pointer leaves the element before release, element never sees `up`. Window always does. |

## 8.7 Code Organization

| Tip | Reason |
|---|---|
| **One `CONFIG` object — no magic numbers elsewhere** | Tuning "how fast things happen" needs one place, not 40. |
| **One `state` object — no scattered globals** | Save / load becomes trivial when state is one object. |
| **Name files by version: `game-v3.html`, `game-v4.html`** | You will want to roll back. |
| **Any function > 60 lines → extract a helper** | Long functions hide bugs. Split them. |
| **No `console.log` in shipped code — use a debug flag** | `if (CONFIG.debug) console.log(...)` |

## 8.8 Touch-Specific Gotchas

| Gotcha | Fix |
|---|---|
| **iOS requires a gesture to enable audio** | Lazy-init `AudioContext` inside first tap handler. |
| **Android Chrome fires `pointercancel` when scrolling a div** | Set `touch-action: none` on the div to prevent. |
| **Safari double-fires `pointerdown` on links** | Prevent default on `<a>` tags inside game canvas. |
| **DevTools touch emulation ≠ real touch** | Always final-test on hardware. Emulator lies about timing, DPI, and vibration. |
| **`preventDefault` on `touchmove` blocks pinch zoom globally** | Only prevent on canvas; let HUD scroll normally. |
| **`passive: false` needed for `wheel` to call `preventDefault`** | Default is passive; without it, `preventDefault` is ignored. |

## 8.9 Anti-Patterns Matrix

| # | Anti-pattern | Why it breaks |
|---|---|---|
| 1 | Attaching `pointerup` only to the target element | Misses releases outside the element (drag off-screen) |
| 2 | Using `click` event for gameplay | 300ms delay on mobile, no drag support |
| 3 | `setPointerCapture` never called | Drags break when pointer leaves bounds |
| 4 | `preventDefault` on every `touchmove` | Kills scroll on HUD |
| 5 | Forgetting `pointercancel` handler | System gestures leave touches "stuck down" |
| 6 | `onLook` fires for HUD taps | Camera jerks when pressing buttons |
| 7 | `onTap` fires after a drag | Places structures on accidental long-drag |
| 8 | `onTap` fires twice on double-tap | Double-placement bug |
| 9 | Inertia never decays to zero | Camera drifts forever |
| 10 | Pinch and look both fire simultaneously | Jitter — pick a priority |
| 11 | `window.innerWidth` cached at init | Wrong after orientation change |
| 12 | `setTimeout` loops for input | Fights with `requestAnimationFrame` timing |
| 13 | Global `let lastPointer` (not per-pointer) | Multi-touch corrupts state |
| 14 | Raycasting at screen center for touch taps | Tap on tree harvests different tree |
| 15 | Not calling `touchCam.tick(dt)` in game loop | Inertia broken |
| 16 | `e.preventDefault()` on `pointerdown` for canvas | Breaks focus, breaks keyboard |
| 17 | Sound init in `pointerdown` without `try/catch` | Crashes on browsers without Web Audio |
| 18 | Dead zone not enforced | Joystick + camera both fire |
| 19 | `element` not `window` for `pointerup` | Stuck touches after off-element release |
| 20 | `touch-action: auto` on full-screen div | Browser steals gestures — scroll, back-swipe, zoom |
