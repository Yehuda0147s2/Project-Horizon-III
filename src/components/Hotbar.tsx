import React from 'react';
import { BLUEPRINTS } from '../game/GameEngine';

interface HotbarProps {
  isBuildMode: boolean;
  selectedBlueprint?: string;
  onToggleBuildMode: () => void;
  onSelectBlueprint: (id: string) => void;
  inventory?: unknown[];
}

type MenuTab = 'weapons' | 'powers';

const WEAPON_PRESETS = [
  { id: 'sword', label: 'Sword', icon: '⚔️', accent: 'from-cyan-500 to-sky-500' },
  { id: 'axe', label: 'Axe', icon: '🪓', accent: 'from-orange-500 to-amber-500' },
  { id: 'bow', label: 'Bow', icon: '🏹', accent: 'from-violet-500 to-fuchsia-500' },
  { id: 'staff', label: 'Staff', icon: '🪄', accent: 'from-emerald-500 to-teal-500' },
];

const POWER_PRESETS = [
  { id: 'fireball', label: 'Fireball', icon: '🔥', accent: 'from-red-500 to-orange-500' },
  { id: 'storm', label: 'Storm', icon: '⚡', accent: 'from-sky-500 to-cyan-500' },
  { id: 'shield', label: 'Shield', icon: '🛡️', accent: 'from-indigo-500 to-blue-500' },
  { id: 'heal', label: 'Heal', icon: '✨', accent: 'from-emerald-500 to-lime-500' },
];

export const Hotbar: React.FC<HotbarProps> = ({
  isBuildMode,
  selectedBlueprint,
  onToggleBuildMode,
  onSelectBlueprint,
  inventory,
}) => {
  const [activeTab, setActiveTab] = React.useState<MenuTab>('weapons');
  const visibleInventory = Array.isArray(inventory) ? inventory.slice(0, 4) : [];

  const activeItems = activeTab === 'weapons' ? WEAPON_PRESETS : POWER_PRESETS;

  return (
    <div
      id="hotbar"
      data-hud
      className="pointer-events-auto z-30 select-none absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,980px)]"
      onMouseDown={(e) => e.preventDefault()}
    >
      {isBuildMode && (
        <div
          data-hud
          className="mb-3 flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-2 shadow-[0_10px_30px_rgba(14,165,233,0.16)] backdrop-blur-md"
        >
          {BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint === bp.id;
            return (
              <button
                key={bp.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectBlueprint(bp.id)}
                className={`group min-w-[112px] rounded-xl border px-2.5 py-2 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                    : 'border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800/80'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                  <span>{bp.name}</span>
                  <span className="text-cyan-300">{bp.cost?.wood || 0}</span>
                </div>
                <div className="text-xs text-slate-200">{bp.type}</div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {bp.cost.wood > 0 && `W:${bp.cost.wood} `}
                  {bp.cost.stone > 0 && `S:${bp.cost.stone} `}
                  {bp.cost.crystal > 0 && `C:${bp.cost.crystal}`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-[28px] border border-slate-700/80 bg-slate-950/80 p-2.5 shadow-[0_18px_45px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Smart Menu</span>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveTab('weapons')}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                activeTab === 'weapons'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.5)]'
                  : 'text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              Weapons
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveTab('powers')}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                activeTab === 'powers'
                  ? 'bg-violet-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.45)]'
                  : 'text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              Powers
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {activeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (activeTab === 'weapons') {
                  // Optional hook for weapon switching if the parent wires it later.
                  return;
                }
              }}
              className={`group relative flex min-w-[98px] items-center gap-3 rounded-2xl border border-slate-700 bg-gradient-to-r ${item.accent} px-3 py-2.5 text-left text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/20`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/35 text-lg shadow-inner">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">{activeTab === 'weapons' ? 'Weapon' : 'Power'}</div>
                <div className="truncate text-sm font-semibold text-white">{item.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-2 py-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleBuildMode}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
              isBuildMode
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <span>{isBuildMode ? 'Build On' : 'Build Off'}</span>
          </button>

          <div className="flex items-center gap-2">
            {visibleInventory.length > 0 ? (
              visibleInventory.map((item, index) => (
                <div
                  key={`${String(item)}-${index}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-xs text-slate-200 shadow-inner"
                >
                  {index === 0 ? 'I' : index === 1 ? 'P' : index === 2 ? 'W' : 'S'}
                </div>
              ))
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl border border-slate-600 bg-slate-800/80" />
                <div className="h-9 w-9 rounded-xl border border-slate-600 bg-slate-800/80" />
                <div className="h-9 w-9 rounded-xl border border-slate-600 bg-slate-800/80" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotbar;
