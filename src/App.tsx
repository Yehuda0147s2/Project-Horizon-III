import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { sound } from './game/audio';
import { GameStore, INITIAL_GAME_STATE } from './game/GameStore';
import { GameSnapshot } from './game/GameState';
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
  const storeRef = useRef<GameStore>(new GameStore(INITIAL_GAME_STATE));
  const [gameState, setGameState] = useState<GameSnapshot>(storeRef.current.getState());

  useEffect(() => {
    const unsubscribe = storeRef.current.subscribe((next) => {
      setGameState(next);
    });

    if (!canvasMountRef.current || !lookZoneRef.current) return unsubscribe;

    const engine = new GameEngine(canvasMountRef.current, lookZoneRef.current);
    engineRef.current = engine;

    engine.onStateChange = (state) => {
      storeRef.current.setState({
        inventory: { ...state.inventory },
        inventorySlots: state.inventorySlots.map((slot) => ({
          index: slot.index,
          item: slot.item ? { ...slot.item } : null,
        })),
        inventoryUsed: state.inventoryUsed,
        inventoryMax: state.inventoryMax,
        equippedAxe: state.equippedAxe,
        equippedPickaxe: state.equippedPickaxe,
        isBuildMode: state.isBuildMode,
        selectedBlueprint: state.selectedBlueprint,
        activeTool: state.activeTool,
        playerCoord: {
          x: state.playerPos.x,
          z: state.playerPos.z,
          angle: state.facingAngle,
        },
      });
    };

    engine.onFeedbackEvent = (text, color, screenX, screenY) => {
      const next = storeRef.current.getState();
      storeRef.current.setState({
        floatingTexts: [
          ...next.floatingTexts,
          { id: Date.now() + Math.random(), text, color, x: screenX, y: screenY, opacity: 1, life: 1 },
        ],
      });
    };

    engine.syncInventoryState();

    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gameState.floatingTexts.length === 0) return;
    const interval = window.setInterval(() => {
      storeRef.current.decayFloatingTexts();
    }, 30);
    return () => window.clearInterval(interval);
  }, [gameState.floatingTexts.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStage !== 'playing') return;
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        storeRef.current.setState({ isInventoryOpen: !gameState.isInventoryOpen });
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        storeRef.current.setState({ isPaused: !gameState.isPaused });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStage, gameState.isInventoryOpen, gameState.isPaused]);

  const handleStartGame = useCallback(() => {
    sound.init();
    sound.playWhoosh();
    storeRef.current.setState({ gameStage: 'playing' });
  }, []);

  const handleJoystickMove = useCallback((vector: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.joystickVector = vector;
    }
  }, []);

  const handleToggleBuildMode = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setBuildMode(!gameState.isBuildMode);
    }
  }, [gameState.isBuildMode]);

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
    storeRef.current.setState({ isMuted: muted });
  }, []);

  const handleResetPosition = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.state.playerPos.set(0, 0, 0);
      engineRef.current.state.facingAngle = 0;
      engineRef.current.syncInventoryState();
    }
    storeRef.current.setState({ isPaused: false, playerCoord: { x: 0, z: 0, angle: 0 } });
  }, []);

  const horizon3IframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!gameState.horizon3Mode) return;

    const focusIframe = () => {
      if (horizon3IframeRef.current) {
        horizon3IframeRef.current.focus();
        try {
          horizon3IframeRef.current.contentWindow?.focus();
        } catch {
          // cross-origin safety
        }
      }
    };

    focusIframe();
    const t1 = window.setTimeout(focusIframe, 80);
    const t2 = window.setTimeout(focusIframe, 300);
    const t3 = window.setTimeout(focusIframe, 800);

    const forwardKeyEvent = (e: KeyboardEvent, isDown: boolean) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      const keyLower = e.key?.toLowerCase();
      const gameKeys = [
        'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
        'Space', 'ShiftLeft', 'ShiftRight',
        'KeyQ', 'KeyE', 'KeyF', 'KeyB', 'KeyL', 'KeyC', 'KeyR', 'KeyV',
        'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
      ];

      if (
        gameKeys.includes(e.code) ||
        ['w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyLower ?? '')
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
          // ignore
        }
      }
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => forwardKeyEvent(e, true);
    const handleWindowKeyUp = (e: KeyboardEvent) => forwardKeyEvent(e, false);

    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('keyup', handleWindowKeyUp);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.removeEventListener('keyup', handleWindowKeyUp);
    };
  }, [gameState.horizon3Mode]);

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
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
      />

      <div
        id="look-zone"
        ref={lookZoneRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto touch-none"
        style={{ touchAction: 'none' }}
      />

      {gameState.gameStage === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onStartHorizon3={() => storeRef.current.setState({ horizon3Mode: true })}
        />
      )}

      {gameState.horizon3Mode && (
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
                // ignore
              }
            }}
          />
          <button
            onClick={() => storeRef.current.setState({ horizon3Mode: false })}
            className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded-lg shadow-lg cursor-pointer"
          >
            ✕ Exit Horizon III
          </button>
        </div>
      )}

      {gameState.gameStage === 'playing' && !gameState.horizon3Mode && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <StatusCluster
            inventory={gameState.inventory}
            activeTool={gameState.activeTool}
            onToggleTool={handleToggleTool}
            isMuted={gameState.isMuted}
            onToggleMute={handleToggleMute}
            onOpenPause={() => storeRef.current.setState({ isPaused: true })}
            onOpenInventory={() => storeRef.current.setState({ isInventoryOpen: true })}
            usedSlots={gameState.inventoryUsed}
            maxSlots={gameState.inventoryMax}
            floatingTexts={gameState.floatingTexts}
          />

          <div className="absolute top-4 right-4 z-30 pointer-events-auto">
            <Minimap
              playerX={gameState.playerCoord.x}
              playerZ={gameState.playerCoord.z}
              playerAngle={gameState.playerCoord.angle}
            />
          </div>

          <VirtualJoystick onMove={handleJoystickMove} />

          <Hotbar
            isBuildMode={gameState.isBuildMode}
            selectedBlueprint={gameState.selectedBlueprint}
            onToggleBuildMode={handleToggleBuildMode}
            onSelectBlueprint={handleSelectBlueprint}
            inventory={gameState.inventory}
          />

          <div className="absolute bottom-6 right-6 pointer-events-none z-20 hidden md:block">
            <div className="text-[10px] tracking-wider text-slate-500 font-mono text-right uppercase">
              Right Zone: Drag to Look · Wheel/Pinch Zoom
            </div>
          </div>
        </div>
      )}

      <InventoryCraftingModal
        isOpen={gameState.isInventoryOpen}
        onClose={() => storeRef.current.setState({ isInventoryOpen: false })}
        slots={gameState.inventorySlots}
        usedSlots={gameState.inventoryUsed}
        maxSlots={gameState.inventoryMax}
        equippedAxe={gameState.equippedAxe}
        equippedPickaxe={gameState.equippedPickaxe}
        onCraft={handleCraft}
        onUseSlot={handleUseSlot}
        onDropSlot={handleDropSlot}
      />

      <PauseModal
        isOpen={gameState.isPaused}
        onClose={() => storeRef.current.setState({ isPaused: false })}
        isMuted={gameState.isMuted}
        onToggleMute={handleToggleMute}
        onResetPosition={handleResetPosition}
      />
    </div>
  );
}
