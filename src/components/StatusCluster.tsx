import React from 'react';
import { FloatingText } from '../game/world';

interface StatusClusterProps {
  inventory: { wood: number; stone: number; crystal: number };
  activeTool: 'axe' | 'pickaxe';
  onToggleTool: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenInventory: () => void;
  usedSlots: number;
  maxSlots: number;
  floatingTexts: FloatingText[];
}

export const StatusCluster: React.FC<StatusClusterProps> = ({
  inventory,
  activeTool,
  onToggleTool,
  isMuted,
  onToggleMute,
  onOpenPause,
  onOpenInventory,
  usedSlots,
  maxSlots,
  floatingTexts,
}) => {
  return (
    <>
      {/* Top Left Status & Inventory */}
      <div
        data-hud
        className="absolute top-4 left-4 z-30 pointer-events-auto select-none flex flex-col gap-2"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Inventory readout */}
        <div
          data-hud
          className="flex items-center gap-3 px-3.5 py-2 bg-slate-950/85 border border-slate-800/80 rounded-xl shadow-xl backdrop-blur-none"
        >
          {/* Wood */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block shadow-sm" />
            <span className="text-xs font-medium text-slate-300">Wood</span>
            <span className="text-xs font-mono font-bold text-amber-300 tabular-nums min-w-[20px]">
              {inventory.wood}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          {/* Stone */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shadow-sm" />
            <span className="text-xs font-medium text-slate-300">Stone</span>
            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums min-w-[20px]">
              {inventory.stone}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          {/* Crystal */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm" />
            <span className="text-xs font-medium text-slate-300">Crystal</span>
            <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums min-w-[20px]">
              {inventory.crystal}
            </span>
          </div>
        </div>

        {/* Quick controls row */}
        <div data-hud className="flex items-center gap-2">
          {/* Tool switch */}
          <button
            data-hud
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleTool}
            className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Tool:</span>
            <span className="font-semibold text-sky-400 uppercase text-[11px]">{activeTool}</span>
          </button>

          {/* Mute button */}
          <button
            data-hud
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleMute}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 transition-colors"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Inventory & Fabricator button */}
          <button
            data-hud
            id="btn-inventory"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenInventory}
            className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 rounded-lg text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Inventory</span>
            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-sky-950/80 text-sky-200">
              {usedSlots}/{maxSlots}
            </span>
          </button>

          {/* Pro Controls & Settings button */}
          <button
            data-hud
            id="btn-controls-settings"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenPause}
            title="Open Pro Controls & Settings (Esc / P)"
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-sky-400/40 rounded-lg text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>⚙️</span>
            <span>Controls (P)</span>
          </button>
        </div>
      </div>

      {/* Floating Damage & Resource Gain Numbers */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-bold text-sm tracking-wide transition-opacity pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              color: ft.color,
              opacity: ft.opacity,
              transform: `translate(-50%, -50%) scale(${0.9 + ft.life * 0.3})`,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>
    </>
  );
};
