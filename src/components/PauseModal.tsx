import React, { useEffect, useState } from 'react';

interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetPosition: () => void;
}

export type ControlScheme = 'hybrid' | 'floating' | 'joystick' | 'dpad' | 'tap_to_move';

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  onResetPosition,
}) => {
  // Pro Control Settings state (persisted to localStorage)
  const [controlScheme, setControlScheme] = useState<ControlScheme>(() => {
    return (localStorage.getItem('horizon_react_scheme') as ControlScheme) || 'hybrid';
  });
  const [sensitivity, setSensitivity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('horizon_react_sens') || '1.0');
  });
  const [deadzone, setDeadzone] = useState<number>(() => {
    return parseInt(localStorage.getItem('horizon_react_deadzone') || '5', 10);
  });
  const [invertY, setInvertY] = useState<boolean>(() => {
    return localStorage.getItem('horizon_react_invert_y') === 'true';
  });
  const [leftHanded, setLeftHanded] = useState<boolean>(() => {
    return localStorage.getItem('horizon_react_left_handed') === 'true';
  });
  const [autoSprint, setAutoSprint] = useState<boolean>(() => {
    return localStorage.getItem('horizon_react_auto_sprint') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'schemes' | 'tuning' | 'keybinds'>('schemes');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const saveSettings = () => {
    localStorage.setItem('horizon_react_scheme', controlScheme);
    localStorage.setItem('horizon_react_sens', sensitivity.toString());
    localStorage.setItem('horizon_react_deadzone', deadzone.toString());
    localStorage.setItem('horizon_react_invert_y', invertY.toString());
    localStorage.setItem('horizon_react_left_handed', leftHanded.toString());
    localStorage.setItem('horizon_react_auto_sprint', autoSprint.toString());
    onClose();
  };

  const applyPreset = (preset: 'mobile_pro' | 'tactical' | 'desktop' | 'lefty') => {
    if (preset === 'mobile_pro') {
      setControlScheme('floating');
      setSensitivity(1.4);
      setDeadzone(3);
      setAutoSprint(true);
      setLeftHanded(false);
    } else if (preset === 'tactical') {
      setControlScheme('tap_to_move');
      setSensitivity(0.9);
      setDeadzone(4);
      setAutoSprint(false);
    } else if (preset === 'desktop') {
      setControlScheme('hybrid');
      setSensitivity(1.2);
      setDeadzone(2);
      setAutoSprint(false);
      setLeftHanded(false);
    } else if (preset === 'lefty') {
      setLeftHanded(true);
      setControlScheme('hybrid');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-hud
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none pointer-events-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        data-hud
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
                Pro Controls & Settings
                <span className="px-2 py-0.5 text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded">PRO MATRIX</span>
              </h2>
              <p className="text-xs text-slate-400">Configure movement schemes, touch joystick response, and input layout</p>
            </div>
          </div>
          <button
            data-hud
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">⚡ Presets:</span>
          <button
            onClick={() => applyPreset('mobile_pro')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-sky-300 font-medium border border-slate-700"
          >
            📱 Mobile Pro
          </button>
          <button
            onClick={() => applyPreset('tactical')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-emerald-300 font-medium border border-slate-700"
          >
            🎯 ARPG Click-Move
          </button>
          <button
            onClick={() => applyPreset('desktop')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-amber-300 font-medium border border-slate-700"
          >
            💻 Desktop Master
          </button>
          <button
            onClick={() => applyPreset('lefty')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-purple-300 font-medium border border-slate-700"
          >
            🖐️ Left-Handed
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === 'schemes'
                ? 'bg-slate-800 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🕹️ Movement Schemes
          </button>
          <button
            onClick={() => setActiveTab('tuning')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === 'tuning'
                ? 'bg-slate-800 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎛️ Sensitivity & Tuning
          </button>
          <button
            onClick={() => setActiveTab('keybinds')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === 'keybinds'
                ? 'bg-slate-800 text-sky-400 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⌨️ Keybinds & Gestures
          </button>
        </div>

        {/* Tab 1: Control Schemes */}
        {activeTab === 'schemes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onClick={() => setControlScheme('hybrid')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                controlScheme === 'hybrid'
                  ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-sky-300">🕹️ Dual Hybrid (Pro)</span>
                {controlScheme === 'hybrid' && <span className="text-xs text-sky-400 font-bold">✓ ACTIVE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Virtual Joystick plus WASD D-Pad buttons side-by-side. Maximum precision and versatility across mouse & touch.
              </p>
            </div>

            <div
              onClick={() => setControlScheme('floating')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                controlScheme === 'floating'
                  ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-sky-300">🔘 Floating Joystick</span>
                {controlScheme === 'floating' && <span className="text-xs text-sky-400 font-bold">✓ ACTIVE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Joystick dynamically centers wherever your thumb touches down. Clean screen until you move. Competitive mobile standard.
              </p>
            </div>

            <div
              onClick={() => setControlScheme('joystick')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                controlScheme === 'joystick'
                  ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-sky-300">🕹️ Fixed Virtual Stick</span>
                {controlScheme === 'joystick' && <span className="text-xs text-sky-400 font-bold">✓ ACTIVE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Stationary 360° analog joystick fixed in the bottom corner with tactile outer ring.
              </p>
            </div>

            <div
              onClick={() => setControlScheme('dpad')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                controlScheme === 'dpad'
                  ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-sky-300">🎮 Directional D-Pad</span>
                {controlScheme === 'dpad' && <span className="text-xs text-sky-400 font-bold">✓ ACTIVE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Discrete 4-way direction pad with highlighted cardinal arrows for retro and precision movement.
              </p>
            </div>

            <div
              onClick={() => setControlScheme('tap_to_move')}
              className={`p-3 rounded-xl border cursor-pointer transition-all sm:col-span-2 ${
                controlScheme === 'tap_to_move'
                  ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400">🎯 Click / Tap to Move (ARPG Pro)</span>
                {controlScheme === 'tap_to_move' && <span className="text-xs text-emerald-400 font-bold">✓ ACTIVE</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tap or click anywhere on the terrain to command the character to navigate to that location with ground target decal.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Tuning & Sliders */}
        {activeTab === 'tuning' && (
          <div className="flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* Camera Sensitivity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Camera Look Sensitivity</span>
                <span className="font-mono text-sky-400">{sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.4x Smooth</span>
                <span>1.0x Normal</span>
                <span>2.5x Twitch Pro</span>
              </div>
            </div>

            {/* Joystick Deadzone */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Joystick Deadzone (Twitch Threshold)</span>
                <span className="font-mono text-sky-400">{deadzone}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={deadzone}
                onChange={(e) => setDeadzone(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1px Instant</span>
                <span>5px Balanced</span>
                <span>12px Casual</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">Invert Y Pitch Axis</span>
                <input
                  type="checkbox"
                  checked={invertY}
                  onChange={(e) => setInvertY(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                <span className="text-xs text-slate-300 font-medium">Auto-Sprint Movement</span>
                <input
                  type="checkbox"
                  checked={autoSprint}
                  onChange={(e) => setAutoSprint(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer sm:col-span-2">
                <div>
                  <span className="text-xs text-slate-300 font-medium block">Left-Handed Layout Mode</span>
                  <span className="text-[10px] text-slate-500">Swaps movement controls to right side and actions/camera to left</span>
                </div>
                <input
                  type="checkbox"
                  checked={leftHanded}
                  onChange={(e) => setLeftHanded(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Keybinds & Gestures */}
        {activeTab === 'keybinds' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-sky-400 block mb-0.5">WASD / Arrow Keys</span>
              <span className="text-slate-400 text-[11px]">Primary character locomotion with camera-relative vector math</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-sky-400 block mb-0.5">Mouse Drag / Touch Look</span>
              <span className="text-slate-400 text-[11px]">Orbit 3D camera with inertia and smooth damping</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-emerald-400 block mb-0.5">Pinch / Wheel Zoom</span>
              <span className="text-slate-400 text-[11px]">Clamped camera zoom distance [2.2m to 12.0m]</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-amber-400 block mb-0.5">B Key</span>
              <span className="text-slate-400 text-[11px]">Toggle Build Mode to place campfires, shelters, walls</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-purple-400 block mb-0.5">I / Tab Key</span>
              <span className="text-slate-400 text-[11px]">Open Inventory & Crafting Fabricator terminal</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="font-semibold text-sky-400 block mb-0.5">P / Esc Key</span>
              <span className="text-slate-400 text-[11px]">Open Pro Controls & Input Settings</span>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              data-hud
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleMute}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-300 transition-colors"
            >
              {isMuted ? 'Unmute Audio' : 'Mute Audio'}
            </button>
            <button
              data-hud
              onMouseDown={(e) => e.preventDefault()}
              onClick={onResetPosition}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-300 transition-colors"
            >
              Reset Spawn
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-hud
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              data-hud
              onMouseDown={(e) => e.preventDefault()}
              onClick={saveSettings}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer"
            >
              Save & Apply Controls
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
