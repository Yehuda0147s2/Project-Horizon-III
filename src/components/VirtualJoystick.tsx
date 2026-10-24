import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 45; // Maximum joystick displacement in pixels

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only capture primary touch/click in the joystick zone
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    setActive(true);
    updateVector(e.clientX, e.clientY);
  };

  const updateVector = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.hypot(rawDx, rawDy);

      let clampedDx = rawDx;
      let clampedDy = rawDy;

      if (dist > maxRadius) {
        clampedDx = (rawDx / dist) * maxRadius;
        clampedDy = (rawDy / dist) * maxRadius;
      }

      setKnobPos({ x: clampedDx, y: clampedDy });

      // Deadzone threshold of 6px
      if (dist < 6) {
        onMove({ x: 0, y: 0 });
      } else {
        onMove({
          x: clampedDx / maxRadius,
          y: clampedDy / maxRadius,
        });
      }
    },
    [onMove]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activePointerId.current = null;
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerUp(e);
  };

  // Clear on unmount or blur
  useEffect(() => {
    const onWindowBlur = () => {
      activePointerId.current = null;
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
    };
    window.addEventListener('blur', onWindowBlur);
    return () => window.removeEventListener('blur', onWindowBlur);
  }, [onMove]);

  return (
    <div
      data-hud
      className="absolute bottom-6 left-6 pointer-events-auto select-none touch-none z-30"
    >
      <div
        id="joystick-base"
        ref={baseRef}
        data-hud
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`w-28 h-28 rounded-full border-2 transition-colors relative flex items-center justify-center ${
          active
            ? 'bg-slate-900/80 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
            : 'bg-slate-950/50 border-slate-700/60'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Direction ring hints */}
        <div className="absolute inset-2 rounded-full border border-slate-700/30 pointer-events-none" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-500/50 pointer-events-none" />

        {/* Knob */}
        <div
          id="joystick-knob"
          data-hud
          className={`w-12 h-12 rounded-full border border-sky-300/60 shadow-lg pointer-events-none flex items-center justify-center ${
            active ? 'bg-sky-500 text-white' : 'bg-slate-800/90 text-slate-400'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: active ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-3 h-3 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="text-[10px] tracking-wider text-slate-400 text-center mt-1 uppercase font-medium pointer-events-none">
        Move (L-Zone)
      </div>
    </div>
  );
};
