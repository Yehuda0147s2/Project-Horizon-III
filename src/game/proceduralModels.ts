import * as THREE from 'three';

const materials = {
  bark: new THREE.MeshStandardMaterial({
    color: 0x5b3824,
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true,
  }),
  pineFoliage: new THREE.MeshStandardMaterial({
    color: 0x1b4d2d,
    roughness: 0.7,
    metalness: 0.08,
    flatShading: true,
  }),
  oakFoliage: new THREE.MeshStandardMaterial({
    color: 0x2c6a39,
    roughness: 0.76,
    metalness: 0.05,
    flatShading: true,
  }),
  stone: new THREE.MeshStandardMaterial({
    color: 0x6f7781,
    roughness: 0.86,
    metalness: 0.12,
    flatShading: true,
  }),
  ironOre: new THREE.MeshStandardMaterial({
    color: 0x9b6340,
    roughness: 0.4,
    metalness: 0.8,
    flatShading: true,
  }),
  crystal: new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x0d6b8b,
    emissiveIntensity: 1.4,
    roughness: 0.12,
    metalness: 0.7,
    transmission: 0.2,
    thickness: 1.0,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  }),
  timber: new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.75,
    metalness: 0.06,
    flatShading: true,
  }),
  timberDark: new THREE.MeshStandardMaterial({
    color: 0x4f3520,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  }),
  metalPlate: new THREE.MeshStandardMaterial({
    color: 0x3a434b,
    roughness: 0.28,
    metalness: 0.88,
    flatShading: true,
  }),
  ember: new THREE.MeshStandardMaterial({
    color: 0xffa14d,
    emissive: 0xff5511,
    emissiveIntensity: 2.1,
    roughness: 0.28,
    metalness: 0.08,
  }),
  playerSuit: new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.5,
    metalness: 0.25,
    flatShading: true,
  }),
  playerTrim: new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.38,
    metalness: 0.7,
    flatShading: true,
  }),
  playerVisor: new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.08,
    metalness: 0.95,
    flatShading: true,
  }),
  playerBackpack: new THREE.MeshStandardMaterial({
    color: 0xe78f0b,
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true,
  }),
  cape: new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.75,
    metalness: 0.1,
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  }),
};

export interface PlayerMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Object3D;
    rightLeg?: THREE.Object3D;
    leftArm?: THREE.Object3D;
    rightArm?: THREE.Object3D;
    tool?: THREE.Object3D;
    bodyGroup?: THREE.Object3D;
    cape?: THREE.Object3D;
    updateCloth?: (dt: number, isMoving: boolean, walkTime: number) => void;
  };
}

export function createPlayerMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;
  group.name = 'player';

  const hips = new THREE.Group();
  hips.position.y = 1.05;
  group.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.0, 10, 14), materials.playerSuit);
  torso.position.y = 0.86;
  torso.castShadow = true;
  hips.add(torso);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.12), materials.playerTrim);
  chestPlate.position.set(0, 1.1, 0.18);
  chestPlate.castShadow = true;
  hips.add(chestPlate);

  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), materials.crystal);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 1.1, 0.24);
  hips.add(chestCore);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16), materials.playerTrim);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.28;
  belt.castShadow = true;
  hips.add(belt);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.18, 8), materials.playerSuit);
  neck.position.y = 1.62;
  hips.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 18), materials.playerSuit);
  head.position.y = 2.1;
  head.castShadow = true;
  hips.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.15), materials.playerVisor);
  visor.position.set(0, 2.1, 0.18);
  visor.castShadow = true;
  hips.add(visor);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.7, 0.16), materials.playerBackpack);
  backpack.position.set(0, 0.9, -0.32);
  backpack.castShadow = true;
  hips.add(backpack);

  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.48, 1.28, 0);
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(0, -0.15, 0);
  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.8, 6, 10), materials.playerSuit);
  leftArm.position.y = -0.55;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  leftShoulder.add(leftArmPivot);
  hips.add(leftShoulder);

  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.48, 1.28, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0, -0.15, 0);
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.8, 6, 10), materials.playerSuit);
  rightArm.position.y = -0.55;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  rightShoulder.add(rightArmPivot);
  hips.add(rightShoulder);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, -0.02, 0);
  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.9, 6, 10), materials.playerTrim);
  leftLeg.position.y = -0.72;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  hips.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, -0.02, 0);
  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.9, 6, 10), materials.playerTrim);
  rightLeg.position.y = -0.72;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  hips.add(rightLegPivot);

  const capeGeo = new THREE.PlaneGeometry(0.7, 1.3, 8, 10);
  const cape = new THREE.Mesh(capeGeo, materials.cape);
  cape.position.set(0, 0.9, 0.32);
  cape.rotation.x = -0.16;
  cape.castShadow = true;
  hips.add(cape);

  const updateCloth = (dt: number, isMoving: boolean, walkTime: number) => {
    const flutter = isMoving ? Math.sin(walkTime * 4.2) * 0.18 : Math.sin(walkTime * 2) * 0.08;
    cape.rotation.x = -0.16 + flutter * 0.4;
    cape.rotation.z = Math.sin(walkTime * 2.5) * 0.18;
    cape.position.x = Math.sin(walkTime * 1.5) * 0.06;
    cape.position.z = 0.28 + Math.cos(walkTime * 2.2) * 0.06;
  };

  const toolGroup = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), materials.timberDark);
  handle.rotation.x = Math.PI / 2;
  toolGroup.add(handle);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), materials.metalPlate);
  blade.position.set(0, 0, 0.18);
  toolGroup.add(blade);

  toolGroup.position.set(0.16, -0.15, 0.12);
  rightArmPivot.add(toolGroup);

  group.userData = {
    leftLeg: leftLegPivot,
    rightLeg: rightLegPivot,
    leftArm: leftArmPivot,
    rightArm: rightArmPivot,
    tool: toolGroup,
    bodyGroup: hips,
    cape,
    updateCloth,
  };

  return group;
}

export { materials };
