import React from 'react';
import { BLUEPRINTS } from '../game/GameEngine';

interface HotbarProps {
  isBuildMode: boolean;
  selectedBlueprint: string;
  onToggleBuildMode: () => void;
  onSelectBlueprint: (id: string) => void;
  inventory: { wood: number; stone: number; crystal: number };
}

export const Hotbar: React.FC<HotbarProps> = ({
  isBuildMode,
  selectedBlueprint,
  onToggleBuildMode,
  onSelectBlueprint,
  inventory,
}) => {
  return (
    <div
      id="hotbar"
      data-hud
      className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-30 select-none flex flex-col items-center gap-2 max-w-[95vw]"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Blueprint Sub-bar (Only expanded when in build mode) */}
      {isBuildMode && (
        <div
          data-hud
          className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-xl overflow-x-auto max-w-[92vw]"
        >
          {BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint === bp.id;
            const canAfford =
              inventory.wood >= bp.cost.wood &&
              inventory.stone >= bp.cost.stone &&
              inventory.crystal >= bp.cost.crystal;

            return (
              <button
                key={bp.id}
                data-hud
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectBlueprint(bp.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex flex-col items-center whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                    : canAfford
                    ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-800/40 text-slate-500 border border-red-500/30'
                }`}
              >
                <span>{bp.name}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  {bp.cost.wood > 0 && `W:${bp.cost.wood} `}
                  {bp.cost.stone > 0 && `S:${bp.cost.stone} `}
                  {bp.cost.crystal > 0 && `C:${bp.cost.crystal}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Action Bar */}
      <div
        data-hud
        className="flex items-center gap-2 px-3 py-2 bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-2xl"
      >
        <button
          data-hud
          id="btn-build-toggle"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleBuildMode}
          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
            isBuildMode
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.5)] ring-2 ring-emerald-300'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{isBuildMode ? 'Tap Ground to Build' : 'Build Mode (B)'}</span>
        </button>

        {isBuildMode && (
          <div className="text-[11px] text-emerald-400 font-mono hidden sm:block px-2">
            Tap terrain or click to place
          </div>
        )}
      </div>
    </div>
  );
};
