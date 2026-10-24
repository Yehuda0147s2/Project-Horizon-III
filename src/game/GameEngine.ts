import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TouchCameraController } from './TouchCameraController';
import { sound } from './audio';
import {
  createTerrainMesh,
  getGroundHeight,
  populateResourceNodes,
  ResourceNode,
  PlacedStructure,
  ParticleSystem,
} from './world';
import {
  createPlayerMesh,
  createStructureModel,
  PlayerMeshGroup,
} from './proceduralModels';
import { PlayerInventory, InventorySlot } from './Inventory';
import { CRAFTING_RECIPES, ITEM_REGISTRY, CraftingRecipe } from './items';

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  cost: { wood: number; stone: number; crystal: number };
}

export const BLUEPRINTS: Blueprint[] = [
  { id: 'campfire', name: 'Campfire', description: 'Warm flame & ember light', cost: { wood: 4, stone: 2, crystal: 0 } },
  { id: 'shelter', name: 'Timber Shelter', description: 'Rainproof lean-to cabin', cost: { wood: 8, stone: 4, crystal: 0 } },
  { id: 'tower', name: 'Watchtower', description: 'Elevated scouting deck', cost: { wood: 12, stone: 6, crystal: 0 } },
  { id: 'beacon', name: 'Solar Beacon', description: 'Pulsing energy resonance spire', cost: { wood: 0, stone: 6, crystal: 3 } },
  { id: 'wall', name: 'Palisade Wall', description: 'Heavy timber defensive barrier', cost: { wood: 5, stone: 0, crystal: 0 } },
];

export const CONFIG = {
  camera: {
    distance: 7.0,
    minDistance: 2.5,
    maxDistance: 14.0,
    minPitch: -Math.PI / 2.8, // looking downward
    maxPitch: Math.PI / 8,   // looking horizontal / slightly upward
    heightOffset: 1.3,
  },
  player: {
    speed: 6.2,
    turnSpeed: 12.0,
  },
  debug: false,
};

export class GameEngine {
  private container: HTMLElement;
  private lookZone: HTMLElement;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private touchCam!: TouchCameraController;

  private terrainMesh!: THREE.Mesh;
  private playerMesh!: PlayerMeshGroup;
  private resourceNodes: ResourceNode[] = [];
  private placedStructures: PlacedStructure[] = [];
  private particles!: ParticleSystem;

  private previewGroup: THREE.Group | null = null;
  private previewValid: boolean = false;
  private lastRaycastGroundPos = new THREE.Vector3();

  public playerInventory = new PlayerInventory(16);

  // Simulation State
  public state = {
    targetYaw: 0,
    targetPitch: -0.35,
    currentYaw: 0,
    currentPitch: -0.35,
    playerPos: new THREE.Vector3(0, 0, 0),
    playerVelocity: new THREE.Vector3(0, 0, 0),
    facingAngle: 0,
    isMoving: false,
    isBuildMode: false,
    selectedBlueprint: 'campfire',
    inventory: {
      wood: 12,
      stone: 8,
      crystal: 4,
    },
    inventorySlots: [] as InventorySlot[],
    inventoryUsed: 5,
    inventoryMax: 16,
    equippedAxe: 'standard_axe',
    equippedPickaxe: 'standard_pickaxe',
    structuresBuilt: 0,
    totalGathered: 0,
    activeTool: 'axe' as 'axe' | 'pickaxe',
  };

  // Input states
  private keysHeld: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 }; // Normalized -1..1 from on-screen joystick

  // Animation & game loop
  private clock = new THREE.Clock();
  private frameId = 0;
  private isDestroyed = false;
  private hitstopTimer = 0;
  private walkTime = 0;
  private swingTimer = 0;

  // Listeners
  public onStateChange?: (state: GameEngine['state']) => void;
  public onFeedbackEvent?: (text: string, color: string, screenX: number, screenY: number) => void;

  constructor(container: HTMLElement, lookZone: HTMLElement) {
    this.container = container;
    this.lookZone = lookZone;

    this.initThree();
    this.initWorld();
    this.initPlayer();
    this.initInput();
    this.initTouchCamera();
    this.initPreview();
    this.syncInventoryState();

    this.startLoop();
  }

  private initThree(): void {
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.024);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Studio Environment Reflection via RoomEnvironment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // Balanced 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7fb8f5, 0x223322, 0.7);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    dirLight.position.set(15, 25, 12);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-15, 12, -15);
    this.scene.add(rimLight);

    window.addEventListener('resize', this.onResize);
  }

  private initWorld(): void {
    this.terrainMesh = createTerrainMesh();
    this.scene.add(this.terrainMesh);

    this.resourceNodes = populateResourceNodes(this.scene);
    this.particles = new ParticleSystem(this.scene);
  }

  private initPlayer(): void {
    this.playerMesh = createPlayerMesh();
    const spawnY = getGroundHeight(0, 0);
    this.state.playerPos.set(0, spawnY, 0);
    this.playerMesh.position.copy(this.state.playerPos);
    this.scene.add(this.playerMesh);
  }

  private initInput(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private initTouchCamera(): void {
    this.touchCam = new TouchCameraController(this.lookZone, {
      sensitivity: 0.005,
      touchSensMult: 1.25,
      inertiaDamping: 0.90,
      tapThreshold: 8,
      tapTime: 300,
      doubleTapTime: 280,
      leftDeadZone: 0.35,
      minDistance: CONFIG.camera.minDistance,
      maxDistance: CONFIG.camera.maxDistance,
      initialDistance: CONFIG.camera.distance,
      onLook: (dx, dy) => {
        this.state.targetYaw -= dx;
        this.state.targetPitch -= dy;
        this.state.targetPitch = Math.max(
          CONFIG.camera.minPitch,
          Math.min(CONFIG.camera.maxPitch, this.state.targetPitch)
        );
      },
      onZoom: (distance) => {
        CONFIG.camera.distance = distance;
      },
      onTap: (x, y, pointerType) => {
        sound.init();
        if (pointerType === 'touch') {
          this.handleWorldClick(x, y);
        } else {
          // Desktop mouse tap
          this.handleWorldClick(x, y);
        }
      },
    });
  }

  private initPreview(): void {
    this.updatePreviewMesh();
  }

  public setBuildMode(enabled: boolean): void {
    this.state.isBuildMode = enabled;
    if (this.previewGroup) {
      this.previewGroup.visible = enabled;
    }
    this.notifyState();
  }

  public setSelectedBlueprint(blueprintId: string): void {
    this.state.selectedBlueprint = blueprintId;
    this.updatePreviewMesh();
    this.notifyState();
  }

  public toggleTool(): void {
    this.state.activeTool = this.state.activeTool === 'axe' ? 'pickaxe' : 'axe';
    this.notifyState();
  }

  private updatePreviewMesh(): void {
    if (this.previewGroup) {
      this.scene.remove(this.previewGroup);
      this.previewGroup = null;
    }

    const group = createStructureModel(this.state.selectedBlueprint);
    group.name = 'placement_preview';
    group.visible = this.state.isBuildMode;

    // Apply semi-transparent holographic styling to all preview parts
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = false;
        m.receiveShadow = false;
        m.material = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.55,
          wireframe: false,
        });
      }
    });

    this.previewGroup = group;
    this.scene.add(this.previewGroup);
  }

  /**
   * Patched handleWorldClick accepts optional tap coordinates (tapX, tapY).
   * If provided, creates an exact screen-space raycaster.
   * If omitted, falls back to screen center.
   */
  public handleWorldClick(tapX: number | null = null, tapY: number | null = null): void {
    const rc = new THREE.Raycaster();
    if (tapX !== null && tapY !== null) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((tapX - rect.left) / rect.width) * 2 - 1,
        -((tapY - rect.top) / rect.height) * 2 + 1
      );
      rc.setFromCamera(ndc, this.camera);
    } else {
      rc.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    }

    // In build mode: try placing structure first
    if (this.state.isBuildMode) {
      const placed = this.tryPlaceStructure(rc);
      if (placed) return;
    }

    // Otherwise test gatherable harvest
    const g = this.findGatherable(rc);
    if (g) {
      this.hitGatherable(g, tapX, tapY);
      return;
    }

    // If tapped ground without hit in build mode, re-attempt ground placement
    if (this.state.isBuildMode) {
      this.tryPlaceStructure(rc);
    }
  }

  private findGatherable(rc: THREE.Raycaster): ResourceNode | null {
    const meshes: THREE.Object3D[] = [];
    const map = new Map<THREE.Object3D, ResourceNode>();

    for (const node of this.resourceNodes) {
      if (node.health <= 0) continue;
      // Distance check to player: can harvest within 18 meters
      if (node.position.distanceTo(this.state.playerPos) > 18) continue;

      node.mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child);
          map.set(child, node);
        }
      });
    }

    const hits = rc.intersectObjects(meshes, false);
    if (hits.length > 0) {
      return map.get(hits[0].object) || null;
    }
    return null;
  }

  private hitGatherable(node: ResourceNode, tapX: number | null = null, tapY: number | null = null): void {
    // Initiate swing animation
    this.swingTimer = 0.25;

    // Hitstop freeze (40ms impact weight)
    this.hitstopTimer = 0.04;

    // Apply shake animation to resource node
    node.shakeTime = 0.35;
    node.shakeAngle = (Math.random() - 0.5) * 0.25;

    // Damage & drop resource
    node.health -= 1;
    let resourceYield = 0;
    let resName = '';
    let burstColor = 0xffffff;

    if (node.type.startsWith('tree')) {
      sound.playChop();
      const bonus = this.playerInventory.equippedAxe === 'reinforced_axe' ? 1 : 0;
      resourceYield = 2 + Math.floor(Math.random() * 2) + bonus;
      const addRes = this.playerInventory.addItem('wood', resourceYield);
      if (addRes.added > 0) {
        resName = `+${addRes.added} Wood`;
      } else {
        resName = 'Inventory Full!';
      }
      burstColor = 0x8b5a2b;

      // 40% chance of plant fiber drop
      if (Math.random() < 0.4) {
        const fiberAdd = this.playerInventory.addItem('plant_fiber', 1);
        if (fiberAdd.added > 0) {
          setTimeout(() => {
            const sc = tapX !== null && tapY !== null ? { x: tapX, y: tapY - 20 } : this.getScreenCoords(node.position);
            this.onFeedbackEvent?.('+1 Flora Fiber', '#34d399', sc.x, sc.y);
          }, 120);
        }
      }
    } else if (node.type === 'stone') {
      sound.playPickaxe();
      const bonus = this.playerInventory.equippedPickaxe === 'plasma_pickaxe' ? 1 : 0;
      resourceYield = 2 + Math.floor(Math.random() * 2) + bonus;
      const addRes = this.playerInventory.addItem('stone', resourceYield);
      if (addRes.added > 0) {
        resName = `+${addRes.added} Stone`;
      } else {
        resName = 'Inventory Full!';
      }
      burstColor = 0xa3a3a3;

      // 35% chance of iron ore drop
      if (Math.random() < 0.35) {
        const oreAdd = this.playerInventory.addItem('iron_ore', 1);
        if (oreAdd.added > 0) {
          setTimeout(() => {
            const sc = tapX !== null && tapY !== null ? { x: tapX, y: tapY - 20 } : this.getScreenCoords(node.position);
            this.onFeedbackEvent?.('+1 Raw Iron Ore', '#fb923c', sc.x, sc.y);
          }, 120);
        }
      }
    } else if (node.type === 'crystal') {
      sound.playCrystal();
      resourceYield = 1 + Math.floor(Math.random() * 2);
      const addRes = this.playerInventory.addItem('crystal', resourceYield);
      if (addRes.added > 0) {
        resName = `+${addRes.added} Crystal`;
      } else {
        resName = 'Inventory Full!';
      }
      burstColor = 0x00f0ff;
    }

    this.state.totalGathered += resourceYield;

    // Spawn pooled 3D particle burst
    this.particles.burst(node.position, burstColor, 14);

    // Floating UI feedback
    const screenPos = tapX !== null && tapY !== null ? { x: tapX, y: tapY } : this.getScreenCoords(node.position);
    this.onFeedbackEvent?.(resName, burstColor === 0x00f0ff ? '#38bdf8' : burstColor === 0xa3a3a3 ? '#e2e8f0' : '#f59e0b', screenPos.x, screenPos.y);

    // Depleted node removal
    if (node.health <= 0) {
      this.scene.remove(node.mesh);
      this.particles.burst(node.position, burstColor, 28);
    }

    this.notifyState();
  }

  /**
   * Patched tryPlaceStructure accepts a caller-provided raycaster.
   */
  public tryPlaceStructure(rc: THREE.Raycaster | null = null): boolean {
    if (!rc) {
      rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    }

    const groundHits = rc.intersectObject(this.terrainMesh, false);
    if (groundHits.length === 0) return false;

    const hitPoint = groundHits[0].point;

    // Check build distance: player must be within 16 meters
    if (hitPoint.distanceTo(this.state.playerPos) > 16) {
      const scr = this.getScreenCoords(hitPoint);
      this.onFeedbackEvent?.('Too far to build!', '#ef4444', scr.x, scr.y);
      return false;
    }

    // Check blueprint cost
    const bp = BLUEPRINTS.find((b) => b.id === this.state.selectedBlueprint);
    if (!bp) return false;

    const canAfford =
      this.playerInventory.hasItem('wood', bp.cost.wood) &&
      this.playerInventory.hasItem('stone', bp.cost.stone) &&
      this.playerInventory.hasItem('crystal', bp.cost.crystal);

    if (!canAfford) {
      const scr = this.getScreenCoords(hitPoint);
      this.onFeedbackEvent?.('Insufficient resources!', '#f43f5e', scr.x, scr.y);
      return false;
    }

    // Deduct cost
    if (bp.cost.wood > 0) this.playerInventory.removeItem('wood', bp.cost.wood);
    if (bp.cost.stone > 0) this.playerInventory.removeItem('stone', bp.cost.stone);
    if (bp.cost.crystal > 0) this.playerInventory.removeItem('crystal', bp.cost.crystal);
    this.state.structuresBuilt += 1;

    // Place structure mesh
    const structureGroup = createStructureModel(this.state.selectedBlueprint);
    structureGroup.position.copy(hitPoint);
    structureGroup.rotation.y = this.state.facingAngle;
    this.scene.add(structureGroup);

    this.placedStructures.push({
      id: `struct_${Date.now()}`,
      type: this.state.selectedBlueprint,
      position: hitPoint.clone(),
      rotationY: this.state.facingAngle,
      mesh: structureGroup,
    });

    sound.playPlace();
    this.particles.burst(hitPoint, 0x10b981, 16);

    const scr = this.getScreenCoords(hitPoint);
    this.onFeedbackEvent?.(`Built ${bp.name}!`, '#34d399', scr.x, scr.y);

    this.notifyState();
    return true;
  }

  private getScreenCoords(worldPos: THREE.Vector3): { x: number; y: number } {
    const v = worldPos.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: ((v.x + 1) / 2) * rect.width + rect.left,
      y: ((-v.y + 1) / 2) * rect.height + rect.top,
    };
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keysHeld[e.code] = true;
    if (e.code === 'KeyB') {
      this.setBuildMode(!this.state.isBuildMode);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld[e.code] = false;
  };

  private onBlur = (): void => {
    this.keysHeld = {};
    this.joystickVector = { x: 0, y: 0 };
  };

  private onResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public syncInventoryState(): void {
    this.state.inventory = {
      wood: this.playerInventory.getItemTotal('wood'),
      stone: this.playerInventory.getItemTotal('stone'),
      crystal: this.playerInventory.getItemTotal('crystal'),
    };
    this.state.inventorySlots = this.playerInventory.getSlots();
    this.state.inventoryUsed = this.playerInventory.getUsedSlotCount();
    this.state.inventoryMax = this.playerInventory.maxSlots;
    this.state.equippedAxe = this.playerInventory.equippedAxe;
    this.state.equippedPickaxe = this.playerInventory.equippedPickaxe;
  }

  private notifyState(): void {
    this.syncInventoryState();
    this.onStateChange?.({ ...this.state });
  }

  public craftRecipe(recipeId: string): boolean {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    const res = this.playerInventory.craft(recipe);
    if (res.success) {
      sound.playCraft();
      const outputDef = ITEM_REGISTRY[recipe.output.itemId];
      const name = outputDef ? outputDef.name : recipe.output.itemId;
      const pos = this.getScreenCoords(this.state.playerPos);
      this.onFeedbackEvent?.(`Crafted ${recipe.output.count}x ${name}!`, '#38bdf8', pos.x, pos.y);
      this.notifyState();
      return true;
    } else {
      sound.playError();
      const pos = this.getScreenCoords(this.state.playerPos);
      this.onFeedbackEvent?.(res.reason || 'Cannot craft item', '#f43f5e', pos.x, pos.y);
      return false;
    }
  }

  public useInventorySlot(slotIndex: number): boolean {
    const res = this.playerInventory.useItem(slotIndex);
    const pos = this.getScreenCoords(this.state.playerPos);
    if (res.success) {
      sound.playEquip();
      this.onFeedbackEvent?.(res.message, '#34d399', pos.x, pos.y);
      this.notifyState();
      return true;
    } else {
      sound.playError();
      this.onFeedbackEvent?.(res.message, '#94a3b8', pos.x, pos.y);
      return false;
    }
  }

  public dropInventorySlot(slotIndex: number, amount: number = 1): boolean {
    const removed = this.playerInventory.removeSlotItem(slotIndex, amount);
    if (removed) {
      const def = ITEM_REGISTRY[removed.itemId];
      const name = def ? def.name : removed.itemId;
      const pos = this.getScreenCoords(this.state.playerPos);
      this.onFeedbackEvent?.(`Discarded ${removed.count}x ${name}`, '#94a3b8', pos.x, pos.y);
      this.notifyState();
      return true;
    }
    return false;
  }

  private startLoop(): void {
    const tick = () => {
      if (this.isDestroyed) return;
      this.frameId = requestAnimationFrame(tick);

      // Frame delta clamped as per guidelines
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    // 1. Game-loop hook for TouchCameraController
    this.touchCam.tick(dt);

    // 2. Smooth camera rotation damping
    this.state.currentYaw = THREE.MathUtils.damp(this.state.currentYaw, this.state.targetYaw, 18, dt);
    this.state.currentPitch = THREE.MathUtils.damp(this.state.currentPitch, this.state.targetPitch, 18, dt);

    // 3. Hitstop freeze check
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // 4. Update player movement
    this.updatePlayerMovement(dt);

    // 5. Update camera position (Third-Person follow with terrain collision avoidance)
    this.updateCameraFollow();

    // 6. Update build preview position
    this.updateBuildPreview();

    // 7. Update particles & node animations
    this.particles.update(dt);
    this.updateResourceNodes(dt);
  }

  private updatePlayerMovement(dt: number): void {
    // Collect keyboard input
    let moveX = 0;
    let moveZ = 0;

    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveZ -= 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveZ += 1;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveX -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveX += 1;

    // Combine with virtual joystick
    if (Math.hypot(this.joystickVector.x, this.joystickVector.y) > 0.05) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputMag = Math.hypot(moveX, moveZ);
    this.state.isMoving = inputMag > 0.08;

    if (this.state.isMoving) {
      const normX = moveX / inputMag;
      const normZ = moveZ / inputMag;

      // Transform input vector by camera yaw
      const forwardX = -Math.sin(this.state.currentYaw);
      const forwardZ = -Math.cos(this.state.currentYaw);
      const rightX = Math.cos(this.state.currentYaw);
      const rightZ = -Math.sin(this.state.currentYaw);

      const worldMoveX = rightX * normX + forwardX * (-normZ);
      const worldMoveZ = rightZ * normX + forwardZ * (-normZ);

      const targetFacing = Math.atan2(worldMoveX, worldMoveZ);
      this.state.facingAngle = THREE.MathUtils.damp(this.state.facingAngle, targetFacing, CONFIG.player.turnSpeed, dt);

      const speed = CONFIG.player.speed * Math.min(inputMag, 1.0);
      this.state.playerPos.x += worldMoveX * speed * dt;
      this.state.playerPos.z += worldMoveZ * speed * dt;

      // Soft perimeter barrier
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

    // Clamp Y to terrain height with safety check
    const groundY = getGroundHeight(this.state.playerPos.x, this.state.playerPos.z);
    this.state.playerPos.y = Math.max(-20, Math.min(300, groundY));

    // Update player mesh
    this.playerMesh.position.copy(this.state.playerPos);
    this.playerMesh.rotation.y = this.state.facingAngle;

    // Limb animations (walk cycle & tool swing)
    const ud = this.playerMesh.userData;
    if (ud.leftLeg && ud.rightLeg && ud.leftArm && ud.rightArm) {
      if (this.state.isMoving) {
        const legSwing = Math.sin(this.walkTime) * 0.6;
        ud.leftLeg.rotation.x = legSwing;
        ud.rightLeg.rotation.x = -legSwing;
        ud.leftArm.rotation.x = -legSwing * 0.7;
      } else {
        ud.leftLeg.rotation.x = 0;
        ud.rightLeg.rotation.x = 0;
        ud.leftArm.rotation.x = 0;
      }

      // Tool swing animation
      if (this.swingTimer > 0) {
        this.swingTimer -= dt;
        ud.rightArm.rotation.x = -1.5 + Math.sin(this.swingTimer * 20) * 0.8;
      } else {
        ud.rightArm.rotation.x = this.state.isMoving ? Math.sin(this.walkTime) * 0.6 : 0;
      }

      // Nuanced cloth physics update for player cape
      ud.updateCloth?.(dt, this.state.isMoving, this.walkTime);
    }
  }

  private updateCameraFollow(): void {
    const yaw = this.state.currentYaw;
    const pitch = this.state.currentPitch;
    const dist = CONFIG.camera.distance;

    const targetLook = this.state.playerPos.clone().add(new THREE.Vector3(0, CONFIG.camera.heightOffset, 0));

    const camX = targetLook.x + Math.sin(yaw) * Math.cos(pitch) * dist;
    const camY = targetLook.y - Math.sin(pitch) * dist;
    const camZ = targetLook.z + Math.cos(yaw) * Math.cos(pitch) * dist;

    // Terrain clearance raycast check: camera must not clip into ground
    const groundUnderCam = getGroundHeight(camX, camZ);
    const clampedY = Math.max(camY, groundUnderCam + 0.65);

    this.camera.position.set(camX, clampedY, camZ);
    this.camera.lookAt(targetLook);
  }

  private updateBuildPreview(): void {
    if (!this.state.isBuildMode || !this.previewGroup) return;

    // Project ray from camera along center or player facing to find ground spot
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = rc.intersectObject(this.terrainMesh, false);

    if (hits.length > 0) {
      this.lastRaycastGroundPos.copy(hits[0].point);
    } else {
      // Default to 4 meters in front of player
      const fwd = new THREE.Vector3(Math.sin(this.state.facingAngle), 0, Math.cos(this.state.facingAngle));
      this.lastRaycastGroundPos.copy(this.state.playerPos).addScaledVector(fwd, 4.0);
      this.lastRaycastGroundPos.y = getGroundHeight(this.lastRaycastGroundPos.x, this.lastRaycastGroundPos.z);
    }

    this.previewGroup.position.copy(this.lastRaycastGroundPos);
    this.previewGroup.rotation.y = this.state.facingAngle;

    // Color code preview based on affordability & range
    const bp = BLUEPRINTS.find((b) => b.id === this.state.selectedBlueprint);
    const inRange = this.lastRaycastGroundPos.distanceTo(this.state.playerPos) <= 16;
    const canAfford = bp
      ? this.playerInventory.hasItem('wood', bp.cost.wood) &&
        this.playerInventory.hasItem('stone', bp.cost.stone) &&
        this.playerInventory.hasItem('crystal', bp.cost.crystal)
      : false;

    this.previewValid = inRange && canAfford;
    const targetColor = this.previewValid ? 0x22c55e : 0xef4444;

    this.previewGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.color.setHex(targetColor);
      }
    });
  }

  private updateResourceNodes(dt: number): void {
    for (const node of this.resourceNodes) {
      if (node.shakeTime > 0) {
        node.shakeTime -= dt;
        const decay = Math.max(0, node.shakeTime / 0.35);
        const oscillation = Math.sin(node.shakeTime * 45) * node.shakeAngle * decay;
        node.mesh.rotation.z = oscillation;
        node.mesh.rotation.x = oscillation * 0.5;
      } else {
        node.mesh.rotation.z = 0;
        node.mesh.rotation.x = 0;
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);

    this.touchCam.destroy();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
