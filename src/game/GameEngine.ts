import * as THREE from 'three';
import { normalizeInputVector } from './InputAdapter';

export class GameEngine {
  // ... existing members unchanged ...

  private updatePlayerMovement(dt: number): void {
    const input = normalizeInputVector(this.keysHeld, this.joystickVector);
    const moveX = input.x;
    const moveZ = input.y;

    const moveMag = Math.hypot(moveX, moveZ);
    this.state.isMoving = moveMag > 0.08;

    if (this.state.isMoving) {
      const normX = moveX / moveMag;
      const normZ = moveZ / moveMag;

      const forwardX = -Math.sin(this.state.currentYaw);
      const forwardZ = -Math.cos(this.state.currentYaw);
      const rightX = Math.cos(this.state.currentYaw);
      const rightZ = -Math.sin(this.state.currentYaw);

      const worldMoveX = rightX * normX + forwardX * (-normZ);
      const worldMoveZ = rightZ * normX + forwardZ * (-normZ);

      const targetFacing = Math.atan2(worldMoveX, worldMoveZ);
      this.state.facingAngle = THREE.MathUtils.damp(this.state.facingAngle, targetFacing, CONFIG.player.turnSpeed, dt);

      const speed = CONFIG.player.speed * Math.min(moveMag, 1.0);
      this.state.playerPos.x += worldMoveX * speed * dt;
      this.state.playerPos.z += worldMoveZ * speed * dt;

      const distFromCenter = Math.hypot(this.state.playerPos.x, this.state.playerPos.z);
      if (distFromCenter > 38) {
        const angle = Math.atan2(this.state.playerPos.z, this.state.playerPos.x);
        this.state.playerPos.x = Math.cos(angle) * 38;
        this.state.playerPos.z = Math.sin(angle) * 38;
      }

      this.walkTime += dt * 14;
      if (Math.sin(this.walkTime) > 0.95 && Math.random() < 0.25) {
        sound.playFootstep();
      }
    } else {
      this.walkTime = 0;
    }

    const groundY = getGroundHeight(this.state.playerPos.x, this.state.playerPos.z);
    this.state.playerPos.y = Math.max(-20, Math.min(300, groundY));

    this.playerMesh.position.copy(this.state.playerPos);
    this.playerMesh.rotation.y = this.state.facingAngle;

    const ud = this.playerMesh.userData;
    if (ud.leftLeg && ud.rightLeg && ud.leftArm && ud.rightArm) {
      if (this.state.isMoving) {
        const legSwing = Math.sin(this.walkTime) * 0.7;
        ud.leftLeg.rotation.x = legSwing;
        ud.rightLeg.rotation.x = -legSwing;
        ud.leftArm.rotation.x = -legSwing * 0.8;
      } else {
        ud.leftLeg.rotation.x = 0;
        ud.rightLeg.rotation.x = 0;
        ud.leftArm.rotation.x = 0;
      }

      if (this.swingTimer > 0) {
        this.swingTimer -= dt;
        ud.rightArm.rotation.x = -1.5 + Math.sin(this.swingTimer * 20) * 0.8;
      } else {
        ud.rightArm.rotation.x = this.state.isMoving ? Math.sin(this.walkTime) * 0.7 : 0;
      }

      ud.updateCloth?.(dt, this.state.isMoving, this.walkTime);
    }
  }
}
