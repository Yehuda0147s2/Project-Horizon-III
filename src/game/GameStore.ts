import { InventorySlot } from './Inventory';
import { sound } from './audio';

export type GameStage = 'title' | 'playing';
export type ActiveTool = 'axe' | 'pickaxe';

export type FloatingText = {
  id: number | string;
  text: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
  life: number;
};

export interface EngineSnapshot {
  inventory: { wood: number; stone: number; crystal: number };
  inventorySlots: InventorySlot[];
  inventoryUsed: number;
  inventoryMax: number;
  equippedAxe: string;
  equippedPickaxe: string;
  isBuildMode: boolean;
  selectedBlueprint: string;
  activeTool: ActiveTool;
  playerPos: { x: number; z: number };
  facingAngle: number;
}

export interface GameUiState {
  gameStage: GameStage;
  horizon3Mode: boolean;
  isPaused: boolean;
  isInventoryOpen: boolean;
  isMuted: boolean;
  inventory: { wood: number; stone: number; crystal: number };
  inventorySlots: InventorySlot[];
  inventoryUsed: number;
  inventoryMax: number;
  equippedAxe: string;
  equippedPickaxe: string;
  isBuildMode: boolean;
  selectedBlueprint: string;
  activeTool: ActiveTool;
  playerCoord: { x: number; z: number; angle: number };
  floatingTexts: FloatingText[];
}

export class GameStore {
  private listeners = new Set<(state: GameUiState) => void>();

  private state: GameUiState = {
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

  getState(): GameUiState {
    return {
      ...this.state,
      inventory: { ...this.state.inventory },
      inventorySlots: this.state.inventorySlots.map((slot) => ({
        ...slot,
        item: slot.item ? { ...slot.item } : null,
      })),
      playerCoord: { ...this.state.playerCoord },
      floatingTexts: this.state.floatingTexts.map((ft) => ({ ...ft })),
    };
  }

  subscribe(listener: (state: GameUiState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  setGameStage(gameStage: GameStage): void {
    this.state.gameStage = gameStage;
    this.emit();
  }

  setHorizon3Mode(enabled: boolean): void {
    this.state.horizon3Mode = enabled;
    this.emit();
  }

  setIsPaused(isPaused: boolean): void {
    this.state.isPaused = isPaused;
    this.emit();
  }

  setIsInventoryOpen(isInventoryOpen: boolean): void {
    this.state.isInventoryOpen = isInventoryOpen;
    this.emit();
  }

  setIsMuted(isMuted: boolean): void {
    this.state.isMuted = isMuted;
    this.emit();
  }

  setIsBuildMode(isBuildMode: boolean): void {
    this.state.isBuildMode = isBuildMode;
    this.emit();
  }

  setSelectedBlueprint(selectedBlueprint: string): void {
    this.state.selectedBlueprint = selectedBlueprint;
    this.emit();
  }

  setActiveTool(activeTool: ActiveTool): void {
    this.state.activeTool = activeTool;
    this.emit();
  }

  setPlayerCoord(playerCoord: { x: number; z: number; angle: number }): void {
    this.state.playerCoord = { ...playerCoord };
    this.emit();
  }

  startGame(): void {
    sound.init();
    sound.playWhoosh();
    this.state.gameStage = 'playing';
    this.emit();
  }

  toggleMute(): boolean {
    const muted = sound.toggleMute();
    this.state.isMuted = muted;
    this.emit();
    return muted;
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
    this.emit();
  }

  toggleInventory(): void {
    this.state.isInventoryOpen = !this.state.isInventoryOpen;
    this.emit();
  }

  applyEngineState(state: Partial<EngineSnapshot>): void {
    if (state.inventory) {
      this.state.inventory = { ...state.inventory };
    }
    if (state.inventorySlots) {
      this.state.inventorySlots = state.inventorySlots.map((slot) => ({
        ...slot,
        item: slot.item ? { ...slot.item } : null,
      }));
    }
    if (state.inventoryUsed !== undefined) {
      this.state.inventoryUsed = state.inventoryUsed;
    }
    if (state.inventoryMax !== undefined) {
      this.state.inventoryMax = state.inventoryMax;
    }
    if (state.equippedAxe !== undefined) {
      this.state.equippedAxe = state.equippedAxe;
    }
    if (state.equippedPickaxe !== undefined) {
      this.state.equippedPickaxe = state.equippedPickaxe;
    }
    if (state.isBuildMode !== undefined) {
      this.state.isBuildMode = state.isBuildMode;
    }
    if (state.selectedBlueprint !== undefined) {
      this.state.selectedBlueprint = state.selectedBlueprint;
    }
    if (state.activeTool !== undefined) {
      this.state.activeTool = state.activeTool;
    }
    if (state.playerPos || state.facingAngle !== undefined) {
      this.state.playerCoord = {
        x: state.playerPos?.x ?? this.state.playerCoord.x,
        z: state.playerPos?.z ?? this.state.playerCoord.z,
        angle: state.facingAngle ?? this.state.playerCoord.angle,
      };
    }
    this.emit();
  }

  addFloatingText(text: FloatingText): void {
    this.state.floatingTexts = [...this.state.floatingTexts, text];
    this.emit();
  }

  decayFloatingTexts(): void {
    this.state.floatingTexts = this.state.floatingTexts
      .map((ft) => ({
        ...ft,
        y: ft.y - 1.5,
        opacity: ft.opacity - 0.04,
        life: ft.life - 0.04,
      }))
      .filter((ft) => ft.opacity > 0);
    this.emit();
  }
}
