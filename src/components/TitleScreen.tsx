import React, { useEffect } from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onStartHorizon3?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onStartHorizon3 }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div
      data-hud
      className="absolute inset-0 z-50 flex flex-col justify-between p-8 sm:p-12 pointer-events-auto bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent select-none"
    >
      {/* Top Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-mono">
            Touch Camera & Input Hardening v2.4
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Three.js r160+ · Unified Pointer Engine
        </div>
      </div>

      {/* Center Title Lockup with Bespoke SVG Graphic */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        {/* Bespoke Geometric Horizon Icon */}
        <div className="w-20 h-20 mb-4 text-cyan-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.5)]">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <polygon points="50,10 90,80 10,80" stroke="currentColor" strokeWidth="2.5" fill="rgba(56,189,248,0.08)" />
            <circle cx="50" cy="50" r="14" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <line x1="18" y1="65" x2="82" y2="65" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="3" fill="#f59e0b" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
          PROJECT HORIZON
        </h1>
        <p className="text-sm sm:text-base text-cyan-300/90 font-medium tracking-wider mt-2 mb-8">
          FRONTIER EXPEDITION & 3D SURVIVAL BUILDER
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          <button
            data-hud
            id="btn-start-horizon3"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onStartHorizon3 || onStart}
            className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>⚔️ Play Horizon III (Dungeons & Powers)</span>
          </button>

          <button
            data-hud
            id="btn-start"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onStart}
            className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-sm tracking-wider uppercase transition-all"
          >
            Standard Frontier
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono mt-3">
          Press <span className="text-sky-300 font-semibold">SPACE</span> or <span className="text-sky-300 font-semibold">ENTER</span> to start
        </div>
      </div>

      {/* Flat Control Hints Bar at Bottom */}
      <div className="text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium px-4 py-2 bg-slate-950/70 border border-slate-800/80 rounded-full">
          <span>WASD Move</span>
          <span className="text-slate-600">·</span>
          <span>Mouse Drag / Touch Look</span>
          <span className="text-slate-600">·</span>
          <span>Pinch / Wheel Zoom</span>
          <span className="text-slate-600">·</span>
          <span>Tap Tree to Chop</span>
          <span className="text-slate-600">·</span>
          <span>B Build Mode</span>
        </div>
      </div>
    </div>
  );
};
