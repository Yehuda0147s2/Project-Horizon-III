/**
 * TouchCameraController
 * 
 * Production-grade unified camera controller for mouse, pen, and touch.
 * Provides single-finger look, two-finger pinch zoom, double-tap zoom,
 * tap-position raycasting coordinates, inertia damping, left-zone joystick isolation,
 * HUD target filtering, and pointercancel robustness.
 */

export interface TouchCameraOptions {
  sensitivity?: number;         // radians per pixel (mouse) [default: 0.005]
  touchSensMult?: number;       // touch pointer multiplier [default: 1.25]
  inertiaDamping?: number;      // 0..1, applied per-frame after finger lift [default: 0.90]
  tapThreshold?: number;        // px of movement before a tap becomes a drag [default: 8]
  tapTime?: number;             // ms — max tap duration [default: 300]
  doubleTapTime?: number;       // ms — max between two taps to count as double [default: 280]
  leftDeadZone?: number;        // fraction of screen width reserved for joystick [default: 0.35]
  minDistance?: number;         // minimum camera zoom distance [default: 2]
  maxDistance?: number;         // maximum camera zoom distance [default: 14]
  initialDistance?: number;     // initial camera zoom distance [default: 7]
  onLook: (dx: number, dy: number) => void;     // dx, dy are already sensitivity-scaled
  onZoom: (distance: number) => void;           // new camera distance
  onTap: (x: number, y: number, pointerType: 'touch' | 'mouse' | 'pen') => void;
}

interface TouchRecord {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startT: number;
  lastT: number;
  moved: boolean;
  pointerType: 'touch' | 'mouse' | 'pen';
}

export class TouchCameraController {
  private element: HTMLElement;
  private opts: Required<TouchCameraOptions>;

  private touches = new Map<number, TouchRecord>();
  private lookId: number | null = null;
  private pinchStart: { distance: number; initialCamDist: number } | null = null;
  private lastTapTime = 0;
  private inertia = { x: 0, y: 0 };
  private currentDistance: number;

  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;
  private boundOnPointerCancel: (e: PointerEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnContextMenu: (e: MouseEvent) => void;
  private boundOnBlur: () => void;

  constructor(element: HTMLElement, options: TouchCameraOptions) {
    this.element = element;
    this.opts = {
      sensitivity: options.sensitivity ?? 0.005,
      touchSensMult: options.touchSensMult ?? 1.25,
      inertiaDamping: options.inertiaDamping ?? 0.90,
      tapThreshold: options.tapThreshold ?? 8,
      tapTime: options.tapTime ?? 300,
      doubleTapTime: options.doubleTapTime ?? 280,
      leftDeadZone: options.leftDeadZone ?? 0.35,
      minDistance: options.minDistance ?? 2,
      maxDistance: options.maxDistance ?? 14,
      initialDistance: options.initialDistance ?? 7,
      onLook: options.onLook,
      onZoom: options.onZoom,
      onTap: options.onTap,
    };

    this.currentDistance = this.opts.initialDistance;

    this.boundOnPointerDown = this.handlePointerDown.bind(this);
    this.boundOnPointerMove = this.handlePointerMove.bind(this);
    this.boundOnPointerUp = this.handlePointerUp.bind(this);
    this.boundOnPointerCancel = this.handlePointerCancel.bind(this);
    this.boundOnWheel = this.handleWheel.bind(this);
    this.boundOnContextMenu = (e) => e.preventDefault();
    this.boundOnBlur = this.resetState.bind(this);

    this.attach();
  }

  private attach(): void {
    this.element.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove, { passive: false });
    window.addEventListener('pointerup', this.boundOnPointerUp);
    window.addEventListener('pointercancel', this.boundOnPointerCancel);
    this.element.addEventListener('wheel', this.boundOnWheel, { passive: false });
    this.element.addEventListener('contextmenu', this.boundOnContextMenu);
    window.addEventListener('blur', this.boundOnBlur);
  }

  public destroy(): void {
    this.element.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('pointercancel', this.boundOnPointerCancel);
    this.element.removeEventListener('wheel', this.boundOnWheel);
    this.element.removeEventListener('contextmenu', this.boundOnContextMenu);
    window.removeEventListener('blur', this.boundOnBlur);
    this.touches.clear();
  }

  public getDistance(): number {
    return this.currentDistance;
  }

  public setDistance(dist: number): void {
    this.currentDistance = Math.max(this.opts.minDistance, Math.min(this.opts.maxDistance, dist));
    this.opts.onZoom(this.currentDistance);
  }

  private isHudTarget(e: Event): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    return !!target.closest('button, #joystick-base, #joystick-knob, #hotbar, #minimap, [data-hud]');
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.isHudTarget(e)) return;

    // Reject touches starting in the left dead zone (reserved for virtual joystick)
    if (e.pointerType === 'touch' && e.clientX < window.innerWidth * this.opts.leftDeadZone) {
      return;
    }

    try {
      this.element.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture fails in restricted browser contexts
    }

    const now = performance.now();
    this.touches.set(e.pointerId, {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      startT: now,
      lastT: now,
      moved: false,
      pointerType: e.pointerType as 'touch' | 'mouse' | 'pen',
    });

    // Zero-out residual inertia on new interaction
    this.inertia.x = 0;
    this.inertia.y = 0;

    if (this.touches.size === 1) {
      this.lookId = e.pointerId;
      this.pinchStart = null;
    } else if (this.touches.size === 2) {
      // Two pointers -> switch to pinch mode (pinch takes priority over look)
      this.lookId = null;
      const [p1, p2] = Array.from(this.touches.values());
      const dist = Math.hypot(p2.lastX - p1.lastX, p2.lastY - p1.lastY);
      this.pinchStart = {
        distance: Math.max(dist, 10),
        initialCamDist: this.currentDistance,
      };
    } else {
      // More than 2 fingers: ignore to avoid corrupting look/pinch
      this.lookId = null;
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    const record = this.touches.get(e.pointerId);
    if (!record) return;

    const dx = e.clientX - record.lastX;
    const dy = e.clientY - record.lastY;
    const totalDist = Math.hypot(e.clientX - record.startX, e.clientY - record.startY);

    if (totalDist > this.opts.tapThreshold) {
      record.moved = true;
    }

    record.lastX = e.clientX;
    record.lastY = e.clientY;
    record.lastT = performance.now();

    // 2-finger pinch gesture
    if (this.touches.size === 2 && this.pinchStart) {
      const [p1, p2] = Array.from(this.touches.values());
      const currentPinchDist = Math.hypot(p2.lastX - p1.lastX, p2.lastY - p1.lastY);
      if (currentPinchDist > 5 && this.pinchStart.distance > 5) {
        const scale = this.pinchStart.distance / currentPinchDist;
        const targetDist = this.pinchStart.initialCamDist * scale;
        this.setDistance(targetDist);
      }
      return;
    }

    // 1-finger look gesture
    if (this.lookId === e.pointerId) {
      const mult = record.pointerType === 'touch' ? this.opts.touchSensMult : 1.0;
      const scaledDx = dx * this.opts.sensitivity * mult;
      const scaledDy = dy * this.opts.sensitivity * mult;

      this.opts.onLook(scaledDx, scaledDy);

      // Store momentary velocity for post-lift inertia
      this.inertia.x = scaledDx;
      this.inertia.y = scaledDy;
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    const record = this.touches.get(e.pointerId);
    if (!record) return;

    const now = performance.now();
    const duration = now - record.startT;
    const isStationary = !record.moved;

    // Check tap condition
    if (isStationary && duration < this.opts.tapTime) {
      const timeSinceLastTap = now - this.lastTapTime;
      if (timeSinceLastTap < this.opts.doubleTapTime) {
        // Double-tap zoom detected: zoom in by 30% and suppress the second tap
        this.setDistance(this.currentDistance * 0.7);
        this.lastTapTime = 0; // consume double-tap
      } else {
        this.lastTapTime = now;
        this.opts.onTap(record.startX, record.startY, record.pointerType);
      }
    }

    this.cleanupPointer(e.pointerId);
  }

  private handlePointerCancel(e: PointerEvent): void {
    // Pointer cancel (interrupted by notification, gesture, or call):
    // Perform cleanup identically to up, but never fire a tap.
    this.cleanupPointer(e.pointerId);
  }

  private cleanupPointer(id: number): void {
    try {
      if (this.element.hasPointerCapture(id)) {
        this.element.releasePointerCapture(id);
      }
    } catch {
      // Ignore
    }

    this.touches.delete(id);

    if (this.touches.size === 0) {
      this.lookId = null;
      this.pinchStart = null;
      // Note: residual inertia remains intact for tick(dt) to decay smoothly
    } else if (this.touches.size === 1) {
      // Transition from pinch back to look with the remaining finger
      const [remainingId] = Array.from(this.touches.keys());
      this.lookId = remainingId;
      this.pinchStart = null;
      const rec = this.touches.get(remainingId);
      if (rec) {
        rec.lastX = rec.startX;
        rec.lastY = rec.startY;
      }
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (this.isHudTarget(e)) return;
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this.setDistance(this.currentDistance * zoomFactor);
  }

  private resetState(): void {
    this.touches.clear();
    this.lookId = null;
    this.pinchStart = null;
    this.inertia.x = 0;
    this.inertia.y = 0;
  }

  /**
   * Game loop tick — call every frame with dt (seconds).
   * Decays inertia post-lift and continues camera rotation until it stops dead.
   */
  public tick(dt: number): void {
    // Invariant: tick is a no-op while any pointer is active to prevent double-motion
    if (this.touches.size > 0) return;

    if (Math.abs(this.inertia.x) < 0.00005 && Math.abs(this.inertia.y) < 0.00005) {
      this.inertia.x = 0;
      this.inertia.y = 0;
      return;
    }

    // Apply residual motion
    this.opts.onLook(this.inertia.x, this.inertia.y);

    // Frame-rate independent decay (target 60hz base)
    const decay = Math.pow(this.opts.inertiaDamping, dt * 60);
    this.inertia.x *= decay;
    this.inertia.y *= decay;
  }
}
