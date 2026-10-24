import {
  ITEM_REGISTRY,
  CraftingRecipe,
  InventoryItem,
  ItemDefinition,
} from './items';

export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
}

export class PlayerInventory {
  public maxSlots: number;
  private slots: (InventoryItem | null)[];
  public equippedAxe: string = 'standard_axe';
  public equippedPickaxe: string = 'standard_pickaxe';

  constructor(maxSlots: number = 16) {
    this.maxSlots = maxSlots;
    this.slots = new Array(maxSlots).fill(null);

    // Initial starter inventory so players can immediately explore and craft
    this.addItem('wood', 12);
    this.addItem('stone', 8);
    this.addItem('crystal', 4);
    this.addItem('plant_fiber', 6);
    this.addItem('iron_ore', 4);
  }

  public getSlots(): InventorySlot[] {
    return this.slots.map((item, index) => ({
      index,
      item: item ? { ...item } : null,
    }));
  }

  public getUsedSlotCount(): number {
    return this.slots.filter((s) => s !== null).length;
  }

  public isFull(): boolean {
    return this.getUsedSlotCount() >= this.maxSlots;
  }

  public getItemTotal(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  public hasItem(itemId: string, requiredCount: number): boolean {
    return this.getItemTotal(itemId) >= requiredCount;
  }

  /**
   * Adds an item with automatic stacking and slot overflow handling.
   * Returns { added: number, remaining: number, success: boolean }
   */
  public addItem(itemId: string, count: number): { added: number; remaining: number; success: boolean } {
    const def: ItemDefinition | undefined = ITEM_REGISTRY[itemId];
    const maxStack = def ? def.maxStack : 50;
    let remaining = count;

    // Phase 1: Try adding into existing non-full stacks
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId && slot.count < maxStack) {
        const canAdd = maxStack - slot.count;
        const addAmount = Math.min(canAdd, remaining);
        slot.count += addAmount;
        remaining -= addAmount;
        if (remaining <= 0) break;
      }
    }

    // Phase 2: Fill empty slots with remaining items
    if (remaining > 0) {
      for (let i = 0; i < this.maxSlots; i++) {
        if (this.slots[i] === null) {
          const addAmount = Math.min(maxStack, remaining);
          this.slots[i] = { itemId, count: addAmount };
          remaining -= addAmount;
          if (remaining <= 0) break;
        }
      }
    }

    const added = count - remaining;
    return {
      added,
      remaining,
      success: remaining === 0,
    };
  }

  /**
   * Removes `count` of an item across all slots
   */
  public removeItem(itemId: string, count: number): boolean {
    if (!this.hasItem(itemId, count)) return false;

    let remainingToRemove = count;
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId) {
        if (slot.count <= remainingToRemove) {
          remainingToRemove -= slot.count;
          this.slots[i] = null;
        } else {
          slot.count -= remainingToRemove;
          remainingToRemove = 0;
        }
        if (remainingToRemove <= 0) break;
      }
    }
    return true;
  }

  /**
   * Discards or removes an item from a specific slot
   */
  public removeSlotItem(slotIndex: number, amount: number = 1): InventoryItem | null {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;
    const slot = this.slots[slotIndex];
    if (!slot) return null;

    const removedCount = Math.min(slot.count, amount);
    const removedItem: InventoryItem = { itemId: slot.itemId, count: removedCount };

    slot.count -= removedCount;
    if (slot.count <= 0) {
      this.slots[slotIndex] = null;
    }
    return removedItem;
  }

  /**
   * Checks if player has required ingredients and space for craft output
   */
  public canCraft(recipe: CraftingRecipe): { canCraft: boolean; reason?: string } {
    // 1. Check all inputs
    for (const input of recipe.inputs) {
      const available = this.getItemTotal(input.itemId);
      if (available < input.count) {
        const itemDef = ITEM_REGISTRY[input.itemId];
        const name = itemDef ? itemDef.name : input.itemId;
        return {
          canCraft: false,
          reason: `Missing ingredients: need ${input.count}x ${name} (have ${available})`,
        };
      }
    }

    // 2. Check space for output item
    const outputDef = ITEM_REGISTRY[recipe.output.itemId];
    const maxStack = outputDef ? outputDef.maxStack : 50;

    let canFitInExisting = false;
    for (const slot of this.slots) {
      if (slot && slot.itemId === recipe.output.itemId && slot.count + recipe.output.count <= maxStack) {
        canFitInExisting = true;
        break;
      }
    }

    const hasEmptySlot = this.slots.some((s) => s === null);

    // If consuming all inputs from a slot will free that slot, that could count as well,
    // but guaranteeing either existing stack space or empty slot prevents edge-case lockups
    if (!canFitInExisting && !hasEmptySlot) {
      return {
        canCraft: false,
        reason: 'Inventory is completely full! Free a slot first.',
      };
    }

    return { canCraft: true };
  }

  /**
   * Performs the crafting action
   */
  public craft(recipe: CraftingRecipe): { success: boolean; reason?: string } {
    const check = this.canCraft(recipe);
    if (!check.canCraft) {
      return { success: false, reason: check.reason };
    }

    // Deduct inputs
    for (const input of recipe.inputs) {
      this.removeItem(input.itemId, input.count);
    }

    // Add output
    const res = this.addItem(recipe.output.itemId, recipe.output.count);

    return {
      success: res.success,
      reason: res.success ? undefined : 'Output partially lost due to full inventory',
    };
  }

  /**
   * Use or equip an item
   */
  public useItem(slotIndex: number): { success: boolean; message: string; healAmount?: number } {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      return { success: false, message: 'Invalid slot' };
    }
    const slot = this.slots[slotIndex];
    if (!slot) return { success: false, message: 'Slot is empty' };

    const def = ITEM_REGISTRY[slot.itemId];
    if (!def) return { success: false, message: 'Unknown item' };

    if (def.category === 'tool') {
      if (def.toolType === 'axe') {
        this.equippedAxe = def.id;
        return { success: true, message: `Equipped ${def.name}!` };
      }
      if (def.toolType === 'pickaxe') {
        this.equippedPickaxe = def.id;
        return { success: true, message: `Equipped ${def.name}!` };
      }
    }

    if (def.category === 'consumable' && def.healAmount) {
      this.removeSlotItem(slotIndex, 1);
      return {
        success: true,
        message: `Used ${def.name}! Restored health.`,
        healAmount: def.healAmount,
      };
    }

    if (def.id === 'torch') {
      this.removeSlotItem(slotIndex, 1);
      return { success: true, message: 'Lit Phosphor Flare!' };
    }

    return { success: false, message: `${def.name} is a crafting resource.` };
  }
}
