import React, { useState, useEffect } from 'react';
import { InventorySlot } from '../game/Inventory';
import {
  ITEM_REGISTRY,
  CRAFTING_RECIPES,
  CraftingRecipe,
  ItemDefinition,
} from '../game/items';

interface InventoryCraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: InventorySlot[];
  usedSlots: number;
  maxSlots: number;
  equippedAxe: string;
  equippedPickaxe: string;
  onCraft: (recipeId: string) => void;
  onUseSlot: (slotIndex: number) => void;
  onDropSlot: (slotIndex: number, amount?: number) => void;
}

export const InventoryCraftingModal: React.FC<InventoryCraftingModalProps> = ({
  isOpen,
  onClose,
  slots,
  usedSlots,
  maxSlots,
  equippedAxe,
  equippedPickaxe,
  onCraft,
  onUseSlot,
  onDropSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [craftCategory, setCraftCategory] = useState<'all' | 'materials' | 'tools' | 'survival'>('all');

  // Keyboard shortcut listener for Tab / I / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedSlot = selectedSlotIndex !== null ? slots[selectedSlotIndex] : null;
  const selectedItemDef: ItemDefinition | null =
    selectedSlot && selectedSlot.item ? ITEM_REGISTRY[selectedSlot.item.itemId] || null : null;

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (craftCategory === 'all') return true;
    return r.category === craftCategory;
  });

  // Calculate available count for each item across all slots
  const getItemCount = (itemId: string): number => {
    let total = 0;
    for (const s of slots) {
      if (s.item && s.item.itemId === itemId) {
        total += s.item.count;
      }
    }
    return total;
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'epic':
        return 'border-purple-500/70 text-purple-300 bg-purple-950/40';
      case 'rare':
        return 'border-cyan-500/70 text-cyan-300 bg-cyan-950/40';
      case 'uncommon':
        return 'border-amber-500/70 text-amber-300 bg-amber-950/40';
      default:
        return 'border-slate-600/70 text-slate-300 bg-slate-900/60';
    }
  };

  return (
    <div
      data-hud
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 select-none pointer-events-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        data-hud
        className="w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
      >
        {/* Modal Header */}
        <div
          data-hud
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Field Terminal
              </h2>
            </div>

            {/* Navigation Tabs */}
            <div data-hud className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                data-hud
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('inventory')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'inventory'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inventory ({usedSlots}/{maxSlots})
              </button>
              <button
                data-hud
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setActiveTab('crafting')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'crafting'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fabricator
              </button>
            </div>
          </div>

          <button
            data-hud
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div data-hud className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: INVENTORY SYSTEM */}
          {activeTab === 'inventory' && (
            <div data-hud className="flex flex-col md:flex-row gap-5">
              {/* Left Column: Slots Grid */}
              <div data-hud className="flex-1 flex flex-col gap-3">
                {/* Capacity meter */}
                <div data-hud className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Capacity:</span>
                    <span className="font-mono text-white font-bold tabular-nums">
                      {usedSlots} / {maxSlots} Slots
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono ${usedSlots >= maxSlots ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                    {usedSlots >= maxSlots ? 'FULL' : `${maxSlots - usedSlots} Available`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      usedSlots >= maxSlots ? 'bg-red-500' : usedSlots >= maxSlots * 0.75 ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${(usedSlots / maxSlots) * 100}%` }}
                  />
                </div>

                {/* 16-Slot Grid (4x4) */}
                <div
                  data-hud
                  className="grid grid-cols-4 gap-2.5 p-3 bg-slate-950/70 border border-slate-800/90 rounded-2xl"
                >
                  {slots.map((slot) => {
                    const item = slot.item;
                    const def = item ? ITEM_REGISTRY[item.itemId] : null;
                    const isSelected = selectedSlotIndex === slot.index;
                    const isEquipped =
                      def &&
                      ((def.id === equippedAxe && def.toolType === 'axe') ||
                        (def.id === equippedPickaxe && def.toolType === 'pickaxe'));

                    return (
                      <button
                        key={slot.index}
                        data-hud
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSelectedSlotIndex(slot.index)}
                        className={`aspect-square relative rounded-xl border p-2 flex flex-col items-center justify-between transition-all ${
                          isSelected
                            ? 'ring-2 ring-sky-400 border-sky-300 bg-slate-800 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                            : item
                            ? 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-700/80'
                            : 'bg-slate-950/50 border-slate-800/60 hover:border-slate-700/40'
                        }`}
                      >
                        {/* Slot number hint */}
                        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-600 pointer-events-none">
                          {slot.index + 1}
                        </span>

                        {/* Equipped badge */}
                        {isEquipped && (
                          <span className="absolute top-1 right-1 px-1 py-0.2 bg-emerald-500 text-slate-950 text-[8px] font-bold rounded uppercase">
                            EQ
                          </span>
                        )}

                        {item && def ? (
                          <>
                            {/* Item Icon Swatch */}
                            <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg mt-2 flex items-center justify-center font-bold text-xs uppercase shadow-inner"
                              style={{ backgroundColor: `${def.color}25`, color: def.color, border: `1px solid ${def.color}55` }}
                            >
                              {def.name.slice(0, 2)}
                            </div>

                            {/* Item Count */}
                            <span className="text-[11px] font-mono font-bold text-slate-200 self-end tabular-nums">
                              {item.count}
                            </span>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-mono">
                            —
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Item Detail & Actions */}
              <div
                data-hud
                className="w-full md:w-64 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between"
              >
                {selectedItemDef && selectedSlot?.item ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white">{selectedItemDef.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getRarityBadge(selectedItemDef.rarity)}`}>
                            {selectedItemDef.rarity}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize font-medium">
                            {selectedItemDef.category}
                          </span>
                        </div>
                      </div>

                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-md"
                        style={{ backgroundColor: `${selectedItemDef.color}35`, color: selectedItemDef.color }}
                      >
                        {selectedItemDef.name.slice(0, 2)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      {selectedItemDef.description}
                    </p>

                    <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-400 pt-1">
                      <div className="flex justify-between">
                        <span>Stack Count:</span>
                        <span className="text-white font-bold">
                          {selectedSlot.item.count} / {selectedItemDef.maxStack}
                        </span>
                      </div>
                      {selectedItemDef.toolPower && (
                        <div className="flex justify-between">
                          <span>Harvest Power:</span>
                          <span className="text-sky-300 font-bold">+{selectedItemDef.toolPower}</span>
                        </div>
                      )}
                      {selectedItemDef.healAmount && (
                        <div className="flex justify-between">
                          <span>Heal Amount:</span>
                          <span className="text-emerald-300 font-bold">+{selectedItemDef.healAmount} HP</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div data-hud className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                      {selectedItemDef.category === 'tool' && (
                        <button
                          data-hud
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onUseSlot(selectedSlot.index)}
                          className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all shadow-md"
                        >
                          Equip Tool
                        </button>
                      )}

                      {selectedItemDef.category === 'consumable' && (
                        <button
                          data-hud
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onUseSlot(selectedSlot.index)}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all shadow-md"
                        >
                          Use Item
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          data-hud
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onDropSlot(selectedSlot.index, 1)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                        >
                          Discard 1
                        </button>
                        <button
                          data-hud
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onDropSlot(selectedSlot.index, selectedSlot.item?.count || 1)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-red-900/40 hover:text-red-300 text-slate-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          Discard All
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-xs font-medium">Select any inventory slot to inspect details or discard items.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CRAFTING SYSTEM */}
          {activeTab === 'crafting' && (
            <div data-hud className="flex flex-col gap-4">
              {/* Category Pills */}
              <div data-hud className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'materials', 'tools', 'survival'] as const).map((cat) => (
                  <button
                    key={cat}
                    data-hud
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setCraftCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      craftCategory === cat
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'All Blueprints' : cat}
                  </button>
                ))}
              </div>

              {/* Recipe List */}
              <div data-hud className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecipes.map((recipe) => {
                  const outDef = ITEM_REGISTRY[recipe.output.itemId];
                  if (!outDef) return null;

                  // Check ingredient availability
                  const canAffordAll = recipe.inputs.every((input) => getItemCount(input.itemId) >= input.count);
                  const isInvFull = usedSlots >= maxSlots;
                  const canCraft = canAffordAll && !isInvFull;

                  return (
                    <div
                      key={recipe.id}
                      data-hud
                      className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl flex flex-col justify-between gap-3"
                    >
                      <div>
                        {/* Title & Icon Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner"
                              style={{ backgroundColor: `${outDef.color}25`, color: outDef.color, border: `1px solid ${outDef.color}55` }}
                            >
                              {outDef.name.slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-white">
                                {recipe.name}{' '}
                                {recipe.output.count > 1 && (
                                  <span className="text-sky-300 font-mono">(x{recipe.output.count})</span>
                                )}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono ${getRarityBadge(outDef.rarity)}`}>
                                {outDef.rarity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                          {recipe.description}
                        </p>

                        {/* Ingredients Breakdown */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {recipe.inputs.map((inp) => {
                            const inpDef = ITEM_REGISTRY[inp.itemId];
                            const available = getItemCount(inp.itemId);
                            const hasEnough = available >= inp.count;

                            return (
                              <div
                                key={inp.itemId}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 border ${
                                  hasEnough
                                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-900 border-red-500/40 text-red-300'
                                }`}
                              >
                                <span>{inpDef ? inpDef.name : inp.itemId}:</span>
                                <span className="font-bold">
                                  {available}/{inp.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Craft Action Button */}
                      <button
                        data-hud
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onCraft(recipe.id)}
                        disabled={!canCraft}
                        className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          canCraft
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md active:scale-98'
                            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/30'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>
                          {isInvFull
                            ? 'Inventory Full'
                            : canAffordAll
                            ? 'Fabricate'
                            : 'Missing Components'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          data-hud
          className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono"
        >
          <span>Press [I] or [TAB] to toggle terminal</span>
          <span className="hidden sm:inline">Project Horizon Fabricator v2.4</span>
        </div>
      </div>
    </div>
  );
};
