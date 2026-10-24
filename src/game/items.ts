export type ItemCategory = 'resource' | 'material' | 'tool' | 'consumable';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  icon: string; // SVG icon identifier or symbol
  maxStack: number;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  toolPower?: number; // e.g. harvest yield multiplier
  toolType?: 'axe' | 'pickaxe';
  healAmount?: number;
}

export interface InventoryItem {
  itemId: string;
  count: number;
}

export interface CraftingIngredient {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'materials' | 'tools' | 'survival';
  description: string;
  inputs: CraftingIngredient[];
  output: {
    itemId: string;
    count: number;
  };
  craftTimeMs?: number;
}

export const ITEM_REGISTRY: Record<string, ItemDefinition> = {
  // Raw Resources
  wood: {
    id: 'wood',
    name: 'Hardwood Timber',
    description: 'Raw trunk log harvested from pine and oak trees.',
    category: 'resource',
    icon: 'wood',
    maxStack: 50,
    color: '#b45309',
    rarity: 'common',
  },
  stone: {
    id: 'stone',
    name: 'Granite Chunk',
    description: 'Dense mineral rock mined from surface boulders.',
    category: 'resource',
    icon: 'stone',
    maxStack: 50,
    color: '#94a3b8',
    rarity: 'common',
  },
  crystal: {
    id: 'crystal',
    name: 'Resonance Crystal',
    description: 'Pulsing cyan geo-crystal emitting mild harmonic resonance.',
    category: 'resource',
    icon: 'crystal',
    maxStack: 30,
    color: '#06b6d4',
    rarity: 'rare',
  },
  plant_fiber: {
    id: 'plant_fiber',
    name: 'Flora Fiber',
    description: 'Tough, tensile organic strands harvested from foliage.',
    category: 'resource',
    icon: 'fiber',
    maxStack: 60,
    color: '#10b981',
    rarity: 'common',
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Raw Iron Ore',
    description: 'Heavy metallic ore extracted from rock outcrops.',
    category: 'resource',
    icon: 'ore',
    maxStack: 40,
    color: '#ea580c',
    rarity: 'uncommon',
  },

  // Refined Materials
  wood_planks: {
    id: 'wood_planks',
    name: 'Reinforced Planks',
    description: 'Refined lumber smoothed for shelter and fortification construction.',
    category: 'material',
    icon: 'planks',
    maxStack: 40,
    color: '#d97706',
    rarity: 'common',
  },
  stone_brick: {
    id: 'stone_brick',
    name: 'Chiseled Stone Brick',
    description: 'Square-cut masonry block used for durable building structures.',
    category: 'material',
    icon: 'brick',
    maxStack: 40,
    color: '#cbd5e1',
    rarity: 'common',
  },
  iron_ingot: {
    id: 'iron_ingot',
    name: 'Smelted Iron Ingot',
    description: 'Pure smelted iron bar essential for advanced tools and machinery.',
    category: 'material',
    icon: 'ingot',
    maxStack: 30,
    color: '#fb923c',
    rarity: 'uncommon',
  },
  rope: {
    id: 'rope',
    name: 'Braided Cordage',
    description: 'Triple-braided plant fibers with high tensile breaking strength.',
    category: 'material',
    icon: 'rope',
    maxStack: 40,
    color: '#34d399',
    rarity: 'common',
  },
  energy_cell: {
    id: 'energy_cell',
    name: 'Charged Energy Cell',
    description: 'Compact capacitive cell storing condensed crystal harmonics.',
    category: 'material',
    icon: 'cell',
    maxStack: 20,
    color: '#38bdf8',
    rarity: 'rare',
  },

  // Tools & Equipment
  reinforced_axe: {
    id: 'reinforced_axe',
    name: 'Heavy Forged Axe',
    description: 'Iron-reinforced lumber axe. Yields +1 additional timber per chop.',
    category: 'tool',
    icon: 'axe_advanced',
    maxStack: 1,
    color: '#38bdf8',
    rarity: 'rare',
    toolType: 'axe',
    toolPower: 2,
  },
  plasma_pickaxe: {
    id: 'plasma_pickaxe',
    name: 'Plasma Mining Pick',
    description: 'Energy-focused mining tool that pulverizes stone and extracts rare ore.',
    category: 'tool',
    icon: 'pick_advanced',
    maxStack: 1,
    color: '#a855f7',
    rarity: 'epic',
    toolType: 'pickaxe',
    toolPower: 2,
  },

  // Consumables & Survival
  repair_kit: {
    id: 'repair_kit',
    name: 'Field Repair Kit',
    description: 'Multi-component repair kit used for field maintenance and fortification.',
    category: 'consumable',
    icon: 'repair',
    maxStack: 10,
    color: '#f59e0b',
    rarity: 'uncommon',
  },
  stimpack: {
    id: 'stimpack',
    name: 'Nanite Stimpack',
    description: 'Rapid cellular rejuvenation injector. Restores health & vigor.',
    category: 'consumable',
    icon: 'stim',
    maxStack: 10,
    color: '#ef4444',
    rarity: 'uncommon',
    healAmount: 50,
  },
  torch: {
    id: 'torch',
    name: 'Phosphor Flare',
    description: 'Bright chemical flare that illuminates dark terrain.',
    category: 'consumable',
    icon: 'torch',
    maxStack: 15,
    color: '#f97316',
    rarity: 'common',
  },
  beacon_core: {
    id: 'beacon_core',
    name: 'Sub-Space Beacon Core',
    description: 'Super-dense crystal resonator required to power the planetary beacon.',
    category: 'material',
    icon: 'core',
    maxStack: 5,
    color: '#c084fc',
    rarity: 'epic',
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Basic Refinement
  {
    id: 'craft_wood_planks',
    name: 'Reinforced Planks',
    category: 'materials',
    description: 'Mill raw timber into 2 structural planks.',
    inputs: [{ itemId: 'wood', count: 2 }],
    output: { itemId: 'wood_planks', count: 2 },
  },
  {
    id: 'craft_stone_brick',
    name: 'Chiseled Stone Brick',
    category: 'materials',
    description: 'Dress rough granite into 2 durable masonry bricks.',
    inputs: [{ itemId: 'stone', count: 2 }],
    output: { itemId: 'stone_brick', count: 2 },
  },
  {
    id: 'craft_rope',
    name: 'Braided Cordage',
    category: 'materials',
    description: 'Weave 3 plant fibers into high-strength cord.',
    inputs: [{ itemId: 'plant_fiber', count: 3 }],
    output: { itemId: 'rope', count: 1 },
  },
  {
    id: 'craft_iron_ingot',
    name: 'Smelted Iron Ingot',
    category: 'materials',
    description: 'Smelt 2 raw iron ores using 1 wood for forge heat.',
    inputs: [
      { itemId: 'iron_ore', count: 2 },
      { itemId: 'wood', count: 1 },
    ],
    output: { itemId: 'iron_ingot', count: 1 },
  },
  {
    id: 'craft_energy_cell',
    name: 'Charged Energy Cell',
    category: 'materials',
    description: 'Synthesize 1 iron casing with 2 resonance crystals.',
    inputs: [
      { itemId: 'iron_ingot', count: 1 },
      { itemId: 'crystal', count: 2 },
    ],
    output: { itemId: 'energy_cell', count: 1 },
  },

  // Advanced Tools & Gear
  {
    id: 'craft_reinforced_axe',
    name: 'Heavy Forged Axe',
    category: 'tools',
    description: 'Forged iron lumber tool. Yields +1 extra wood per strike.',
    inputs: [
      { itemId: 'wood_planks', count: 3 },
      { itemId: 'iron_ingot', count: 2 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'reinforced_axe', count: 1 },
  },
  {
    id: 'craft_plasma_pickaxe',
    name: 'Plasma Mining Pick',
    category: 'tools',
    description: 'High-tech resonant pick. Extracts maximum stone and rare ores.',
    inputs: [
      { itemId: 'iron_ingot', count: 2 },
      { itemId: 'energy_cell', count: 2 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'plasma_pickaxe', count: 1 },
  },

  // Survival & Utility
  {
    id: 'craft_torch',
    name: 'Phosphor Flare (x2)',
    category: 'survival',
    description: 'Pack chemical resin onto timber for illumination.',
    inputs: [
      { itemId: 'wood', count: 1 },
      { itemId: 'plant_fiber', count: 2 },
    ],
    output: { itemId: 'torch', count: 2 },
  },
  {
    id: 'craft_stimpack',
    name: 'Nanite Stimpack',
    category: 'survival',
    description: 'Refine flora alkaloids with crystal resonance to heal wounds.',
    inputs: [
      { itemId: 'plant_fiber', count: 3 },
      { itemId: 'crystal', count: 1 },
    ],
    output: { itemId: 'stimpack', count: 1 },
  },
  {
    id: 'craft_repair_kit',
    name: 'Field Repair Kit',
    category: 'survival',
    description: 'Compact kit for structure reinforcement and gear upkeep.',
    inputs: [
      { itemId: 'wood_planks', count: 2 },
      { itemId: 'iron_ingot', count: 1 },
    ],
    output: { itemId: 'repair_kit', count: 1 },
  },
  {
    id: 'craft_beacon_core',
    name: 'Sub-Space Beacon Core',
    category: 'materials',
    description: 'Master artifact component for planetary beacon activation.',
    inputs: [
      { itemId: 'energy_cell', count: 3 },
      { itemId: 'stone_brick', count: 4 },
      { itemId: 'iron_ingot', count: 2 },
    ],
    output: { itemId: 'beacon_core', count: 1 },
  },
];
