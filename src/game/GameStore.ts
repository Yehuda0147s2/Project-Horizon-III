import { GameSnapshot } from './GameState';

export const INITIAL_GAME_STATE: GameSnapshot = {
  gameStage: 'title',
  horizon3Mode: false,
  isPaused: false,
  isInventoryOpen: false,
  isMuted: false,
  inventory: { wood: 12, stone: 8, crystal: 4 },
  inventorySlots: [],
  inventoryUsed: 5,
  inventoryMax: 16,
  equippedAxe: 'standard_axe',
  equippedPickaxe: 'standard_pickaxe',
  isBuildMode: false,
  selectedBlueprint: 'campfire',
  activeTool: 'axe',
  playerCoord: { x: 0, z: 0, angle: 0 },
  floatingTexts: [],
};

export class GameStore {
  private listeners = new Set<(state: GameSnapshot) => void>();
  private state: GameSnapshot;

  constructor(initialState: GameSnapshot = INITIAL_GAME_STATE) {
    this.state = {
      ...initialState,
      inventory: { ...initialState.inventory },
      playerCoord: { ...initialState.playerCoord },
      floatingTexts: [...initialState.floatingTexts],
      inventorySlots: initialState.inventorySlots.map((slot) => ({
        ...slot,
        item: slot.item ? { ...slot.item } : null,
      })),
    };
  }

  getState(): GameSnapshot {
    return {
      ...this.state,
      inventory: { ...this.state.inventory },
      playerCoord: { ...this.state.playerCoord },
      floatingTexts: this.state.floatingTexts.map((ft) => ({ ...ft })),
      inventorySlots: this.state.inventorySlots.map((slot) => ({
        ...slot,
        item: slot.item ? { ...slot.item } : null,
      })),
    };
  }

  subscribe(listener: (state: GameSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  setState(patch: Partial<GameSnapshot>): GameSnapshot {
    this.state = {
      ...this.state,
      ...patch,
      inventory: patch.inventory ? { ...this.state.inventory, ...patch.inventory } : this.state.inventory,
      playerCoord: patch.playerCoord ? { ...this.state.playerCoord, ...patch.playerCoord } : this.state.playerCoord,
      inventorySlots: patch.inventorySlots ? patch.inventorySlots.map((slot) => ({
        ...slot,
        item: slot.item ? { ...slot.item } : null,
      })) : this.state.inventorySlots,
      floatingTexts: patch.floatingTexts ? patch.floatingTexts.map((ft) => ({ ...ft })) : this.state.floatingTexts,
    };

    this.emit();
    return this.getState();
  }

  decayFloatingTexts(): void {
    this.setState({
      floatingTexts: this.state.floatingTexts
        .map((ft) => ({
          ...ft,
          y: ft.y - 1.5,
          opacity: ft.opacity - 0.04,
          life: ft.life - 0.04,
        }))
        .filter((ft) => ft.opacity > 0),
    });
  }
}
