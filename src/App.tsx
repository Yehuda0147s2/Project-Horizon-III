import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { sound } from './game/audio';
import { FloatingText } from './game/world';
import { InventorySlot } from './game/Inventory';
import { VirtualJoystick } from './components/VirtualJoystick';
import { Minimap } from './components/Minimap';
import { Hotbar } from './components/Hotbar';
import { StatusCluster } from './components/StatusCluster';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal } from './components/PauseModal';
import { InventoryCraftingModal } from './components/InventoryCraftingModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App shell states
  const [gameStage, setGameStage] = useState<'title' | 'playing'>('title');
  const [horizon3Mode, setHorizon3Mode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Synced game state
  const [inventory, setInventory] = useState({ wood: 12, stone: 8, crystal: 4 });
  const [inventorySlots, setInventorySlots] = useState<InventorySlot[]>([]);
  const [inventoryUsed, setInventoryUsed] = useState(5);
  const [inventoryMax, setInventoryMax] = useState(16);
  const [equippedAxe, setEquippedAxe] = useState('standard_axe');
  const [equippedPickaxe, setEquippedPickaxe] = useState('standard_pickaxe');

  const [isBuildMode, setIsBuildMode] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState('campfire');
  const [activeTool, setActiveTool] = useState<'axe' | 'pickaxe'>('axe');
  const [playerCoord, setPlayerCoord] = useState({ x: 0, z: 0, angle: 0 });

  // Floating text alerts
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current || !lookZoneRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, lookZoneRef.current);
    engineRef.current = engine;

    engine.onStateChange = (state) => {
      setInventory({ ...state.inventory });
      setInventorySlots([...state.inventorySlots]);
      setInventoryUsed(state.inventoryUsed);
      setInventoryMax(state.inventoryMax);
      setEquippedAxe(state.equippedAxe);
      setEquippedPickaxe(state.equippedPickaxe);

      setIsBuildMode(state.isBuildMode);
      setSelectedBlueprint(state.selectedBlueprint);
      setActiveTool(state.activeTool);
      setPlayerCoord({
        x: state.playerPos.x,
        z: state.playerPos.z,
        angle: state.facingAngle,
      });
    };

    engine.onFeedbackEvent = (text, color, screenX, screenY) => {
      const id = Date.now() + Math.random();
      setFloatingTexts((prev) => [
        ...prev,
        { id, text, color, x: screenX, y: screenY, opacity: 1, life: 1 },
      ]);
    };

    // Initial sync
    engine.syncInventoryState();
    setInventorySlots([...engine.state.inventorySlots]);
    setInventoryUsed(engine.state.inventoryUsed);
    setInventoryMax(engine.state.inventoryMax);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard shortcut listener for Tab / I / P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStage !== 'playing') return;
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        setIsInventoryOpen((prev) => !prev);
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStage]);

  // Floating text animation decay loop
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const interval = setInterval(() => {
      setFloatingTexts((prev) =>
        prev
          .map((ft) => ({
            ...ft,
            y: ft.y - 1.5,
            opacity: ft.opacity - 0.04,
            life: ft.life - 0.04,
          }))
          .filter((ft) => ft.opacity > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [floatingTexts.length]);

  const handleStartGame = useCallback(() => {
    sound.init();
    sound.playWhoosh();
    setGameStage('playing');
  }, []);

  const handleJoystickMove = useCallback((vector: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.joystickVector = vector;
    }
  }, []);

  const handleToggleBuildMode = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setBuildMode(!isBuildMode);
    }
  }, [isBuildMode]);

  const handleSelectBlueprint = useCallback((id: string) => {
    if (engineRef.current) {
      engineRef.current.setSelectedBlueprint(id);
    }
  }, []);

  const handleToggleTool = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleTool();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleResetPosition = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.state.playerPos.set(0, 0, 0);
      engineRef.current.state.facingAngle = 0;
    }
    setIsPaused(false);
  }, []);

  const horizon3IframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-focus and forward game input events to Horizon III iframe
  useEffect(() => {
    if (!horizon3Mode) return;

    const focusIframe = () => {
      if (horizon3IframeRef.current) {
        horizon3IframeRef.current.focus();
        try {
          horizon3IframeRef.current.contentWindow?.focus();
        } catch {
          // Cross-origin safety
        }
      }
    };

    focusIframe();
    const t1 = setTimeout(focusIframe, 80);
    const t2 = setTimeout(focusIframe, 300);
    const t3 = setTimeout(focusIframe, 800);

    const forwardKeyEvent = (e: KeyboardEvent, isDown: boolean) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      const gameKeys = [
        'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
        'Space', 'ShiftLeft', 'ShiftRight',
        'KeyQ', 'KeyE', 'KeyF', 'KeyB', 'KeyL', 'KeyC', 'KeyR', 'KeyV',
        'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
      ];

      const keyLower = e.key?.toLowerCase();
      if (
        gameKeys.includes(e.code) ||
        ['w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyLower)
      ) {
        try {
          horizon3IframeRef.current?.contentWindow?.postMessage(
            {
              type: 'HORIZON3_KEY_EVENT',
              eventType: isDown ? 'keydown' : 'keyup',
              code: e.code,
              key: e.key,
            },
            '*'
          );
        } catch {
          // Ignore
        }
      }
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => forwardKeyEvent(e, true);
    const handleWindowKeyUp = (e: KeyboardEvent) => forwardKeyEvent(e, false);

    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('keyup', handleWindowKeyUp);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.removeEventListener('keyup', handleWindowKeyUp);
    };
  }, [horizon3Mode]);

  const handleCraft = useCallback((recipeId: string) => {
    if (engineRef.current) {
      engineRef.current.craftRecipe(recipeId);
    }
  }, []);

  const handleUseSlot = useCallback((slotIndex: number) => {
    if (engineRef.current) {
      engineRef.current.useInventorySlot(slotIndex);
    }
  }, []);

  const handleDropSlot = useCallback((slotIndex: number, amount = 1) => {
    if (engineRef.current) {
      engineRef.current.dropInventorySlot(slotIndex, amount);
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      {/* 1. Isolated 3D WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
      />

      {/* 2. Full-Screen Look-Zone (Captures camera gestures on canvas, skips HUD) */}
      <div
        id="look-zone"
        ref={lookZoneRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* 3. Title Screen Modal */}
      {gameStage === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onStartHorizon3={() => setHorizon3Mode(true)}
        />
      )}

      {/* 3b. Project Horizon III Fullscreen Iframe Engine */}
      {horizon3Mode && (
        <div className="absolute inset-0 w-full h-full z-50 bg-[#07090e]">
          <iframe
            ref={horizon3IframeRef}
            src="/project-horizon-3.html"
            className="w-full h-full border-none outline-none"
            tabIndex={0}
            title="Project Horizon III: Dungeons, Powers & Weapon Systems"
            onLoad={() => {
              horizon3IframeRef.current?.focus();
              try {
                horizon3IframeRef.current?.contentWindow?.focus();
              } catch {
                // Ignore
              }
            }}
          />
          <button
            onClick={() => setHorizon3Mode(false)}
            className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded-lg shadow-lg cursor-pointer"
          >
            ✕ Exit Horizon III
          </button>
        </div>
      )}

      {/* 4. Active In-Game HUD Elements (Low occlusion, world matched) */}
      {gameStage === 'playing' && !horizon3Mode && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top Left: Resources & quick buttons */}
          <StatusCluster
            inventory={inventory}
            activeTool={activeTool}
            onToggleTool={handleToggleTool}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenPause={() => setIsPaused(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            usedSlots={inventoryUsed}
            maxSlots={inventoryMax}
            floatingTexts={floatingTexts}
          />

          {/* Top Right: Minimap */}
          <div className="absolute top-4 right-4 z-30 pointer-events-auto">
            <Minimap
              playerX={playerCoord.x}
              playerZ={playerCoord.z}
              playerAngle={playerCoord.angle}
            />
          </div>

          {/* Bottom Left: Touch Joystick (Left 35% zone) */}
          <VirtualJoystick onMove={handleJoystickMove} />

          {/* Bottom Center: Hotbar & Blueprint selection */}
          <Hotbar
            isBuildMode={isBuildMode}
            selectedBlueprint={selectedBlueprint}
            onToggleBuildMode={handleToggleBuildMode}
            onSelectBlueprint={handleSelectBlueprint}
            inventory={inventory}
          />

          {/* Touch Camera Hint (Subtle right-side indicator) */}
          <div className="absolute bottom-6 right-6 pointer-events-none z-20 hidden md:block">
            <div className="text-[10px] tracking-wider text-slate-500 font-mono text-right uppercase">
              Right Zone: Drag to Look · Wheel/Pinch Zoom
            </div>
          </div>
        </div>
      )}

      {/* 5. Inventory & Crafting Fabricator Terminal */}
      <InventoryCraftingModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        slots={inventorySlots}
        usedSlots={inventoryUsed}
        maxSlots={inventoryMax}
        equippedAxe={equippedAxe}
        equippedPickaxe={equippedPickaxe}
        onCraft={handleCraft}
        onUseSlot={handleUseSlot}
        onDropSlot={handleDropSlot}
      />

      {/* 6. Pause & Settings Modal */}
      <PauseModal
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onResetPosition={handleResetPosition}
      />
    </div>
  );
}
