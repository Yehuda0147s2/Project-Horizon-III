export type InputVector = {
  x: number;
  y: number;
};

export function normalizeInputVector(
  keysHeld: Record<string, boolean>,
  joystickVector: InputVector = { x: 0, y: 0 }
): InputVector {
  let moveX = 0;
  let moveZ = 0;

  if (keysHeld['KeyW'] || keysHeld['ArrowUp']) moveZ -= 1;
  if (keysHeld['KeyS'] || keysHeld['ArrowDown']) moveZ += 1;
  if (keysHeld['KeyA'] || keysHeld['ArrowLeft']) moveX -= 1;
  if (keysHeld['KeyD'] || keysHeld['ArrowRight']) moveX += 1;

  if (Math.hypot(joystickVector.x, joystickVector.y) > 0.05) {
    moveX += joystickVector.x;
    moveZ += joystickVector.y;
  }

  return { x: moveX, y: moveZ };
}

export function isGameKeyEvent(code: string, key: string): boolean {
  const gameKeys = [
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
    'Space', 'ShiftLeft', 'ShiftRight',
    'KeyQ', 'KeyE', 'KeyF', 'KeyB', 'KeyL', 'KeyC', 'KeyR', 'KeyV',
    'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
  ];

  const lower = key.toLowerCase();
  return (
    gameKeys.includes(code) ||
    ['w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(lower)
  );
}
