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

function hash2D(x: number, z: number): number {
  return Math.abs(Math.sin(x * 127.1 + z * 311.7) * 43758.5453123) % 1;
}

function smoothstep(a: number, b: number, t: number): number {
  const v = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return v * v * (3 - 2 * v);
}

export function createTreeMesh(variant: 'pine' | 'oak' = 'pine'): THREE.Group {
  const group = new THREE.Group();
  group.name = `tree_${variant}`;

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.28, 2.4, 8), materials.bark);
  trunk.position.y = 1.2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const rootAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
  for (const angle of rootAngles) {
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 5), materials.bark);
    root.rotation.z = 0.7;
    root.rotation.y = angle;
    root.position.set(Math.cos(angle) * 0.28, 0.2, Math.sin(angle) * 0.28);
    root.castShadow = true;
    group.add(root);
  }

  if (variant === 'pine') {
    const tiers = [
      { radius: 1.45, height: 2.1, y: 2.5 },
      { radius: 1.1, height: 1.7, y: 3.6 },
      { radius: 0.7, height: 1.4, y: 4.6 },
    ];

    for (const tier of tiers) {
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(tier.radius, tier.height, 8), materials.pineFoliage);
      foliage.position.y = tier.y;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }
  } else {
    const clusters = [
      { x: 0, y: 2.8, z: 0, r: 1.0 },
      { x: 0.7, y: 3.2, z: 0.7, r: 0.92 },
      { x: -0.8, y: 3.0, z: -0.5, r: 0.9 },
      { x: 0.25, y: 3.9, z: -0.85, r: 0.8 },
      { x: -0.2, y: 2.5, z: 0.9, r: 0.74 },
    ];

    for (const cluster of clusters) {
      const leafBlob = new THREE.Mesh(new THREE.SphereGeometry(cluster.r, 12, 12), materials.oakFoliage);
      leafBlob.position.set(cluster.x, cluster.y, cluster.z);
      leafBlob.scale.set(1.15, 0.9, 1.15);
      leafBlob.castShadow = true;
      leafBlob.receiveShadow = true;
      group.add(leafBlob);
    }
  }

  return group;
}

export function createResourceNodeMesh(type: 'stone' | 'crystal'): THREE.Group {
  const group = new THREE.Group();
  group.name = type;

  if (type === 'stone') {
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), materials.stone);
    body.position.y = 0.8;
    body.scale.set(1.25, 0.95, 1.15);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const iron = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.5, 6), materials.ironOre);
    iron.position.set(-0.45, 0.45, 0.35);
    iron.rotation.z = 1.1;
    iron.castShadow = true;
    group.add(iron);

    const sideRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), materials.stone);
    sideRock.position.set(0.8, 0.4, 0.55);
    sideRock.castShadow = true;
    group.add(sideRock);
  } else {
    const crystalCore = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 8), materials.crystal);
    crystalCore.position.y = 1.1;
    crystalCore.rotation.z = 0.2;
    crystalCore.castShadow = true;
    group.add(crystalCore);

    for (let i = 0; i < 4; i++) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.2, 5), materials.crystal);
      const angle = i * (Math.PI / 2);
      shard.position.set(Math.cos(angle) * 0.5, 0.7, Math.sin(angle) * 0.5);
      shard.rotation.set(0.7, angle, 0.4 + i * 0.2);
      shard.castShadow = true;
      group.add(shard);
    }

    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), materials.stone);
    base.position.y = 0.22;
    base.scale.set(1.2, 0.45, 1.2);
    base.castShadow = true;
    group.add(base);
  }

  return group;
}

export function createStructureModel(type: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `structure_${type}`;

  if (type === 'campfire') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 1.1, 0.5, 12), materials.stone);
    base.position.y = 0.22;
    base.receiveShadow = true;
    group.add(base);

    for (let i = 0; i < 6; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), materials.stone);
      const angle = (i / 6) * (Math.PI * 2);
      rock.position.set(Math.cos(angle) * 0.72, 0.2, Math.sin(angle) * 0.72);
      rock.scale.set(1, 0.5, 1);
      rock.castShadow = true;
      group.add(rock);
    }

    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), materials.timber);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;
      log.position.y = 0.25;
      log.castShadow = true;
      group.add(log);
    }

    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), materials.ember);
    ember.position.y = 0.72;
    ember.scale.set(1, 1.7, 1);
    group.add(ember);

    const light = new THREE.PointLight(0xff7a1a, 2.8, 7, 1.5);
    light.position.set(0, 0.9, 0);
    group.add(light);
  } else if (type === 'shelter') {
    const frameGeo = new THREE.BoxGeometry(0.12, 1.8, 0.12);
    const posts = [
      [-1.7, -1.2],
      [1.7, -1.2],
      [-1.7, 1.2],
      [1.7, 1.2],
    ] as const;

    for (const [x, z] of posts) {
      const post = new THREE.Mesh(frameGeo, materials.timberDark);
      post.position.set(x, 0.9, z);
      post.castShadow = true;
      group.add(post);
    }

    for (let i = 0; i < 5; i++) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 0.12), materials.timber);
      brace.position.set(0, 1.8 - i * 0.25, i * 0.42 - 1.2);
      brace.rotation.z = i % 2 === 0 ? 0.16 : -0.16;
      brace.castShadow = true;
      group.add(brace);
    }

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), materials.pineFoliage);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.45;
    roof.castShadow = true;
    group.add(roof);
  } else if (type === 'tower') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, 0.6, 8), materials.timber);
    base.position.y = 0.3;
    group.add(base);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 2.8, 8), materials.timberDark);
    body.position.y = 1.9;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.15, 6), materials.metalPlate);
    roof.position.y = 3.7;
    roof.castShadow = true;
    group.add(roof);
  } else if (type === 'beacon') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3.2, 8), materials.metalPlate);
    pole.position.y = 1.6;
    pole.castShadow = true;
    group.add(pole);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 18), materials.crystal);
    orb.position.y = 3.5;
    orb.castShadow = true;
    group.add(orb);
  } else if (type === 'wall') {
    for (let i = -1; i <= 1; i++) {
      const stake = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.0, 6), materials.timber);
      stake.position.set(i * 0.55, 1.0, 0);
      stake.castShadow = true;
      group.add(stake);
    }

    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.1), materials.timberDark);
    brace.position.set(0, 0.9, 0.12);
    brace.castShadow = true;
    group.add(brace);
  }

  return group;
}

export function createPlayerMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;
  group.name = 'player';

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.1;
  group.add(bodyGroup);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.3, 8, 14), materials.playerSuit);
  torso.position.y = 1.7;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 18), materials.playerSuit);
  head.position.y = 2.95;
  head.castShadow = true;
  bodyGroup.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.18), materials.playerVisor);
  visor.position.set(0, 2.98, 0.22);
  visor.castShadow = true;
  bodyGroup.add(visor);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.22), materials.playerBackpack);
  backpack.position.set(0, 1.95, -0.4);
  backpack.castShadow = true;
  bodyGroup.add(backpack);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.56, 2.25, 0);
  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.8, 4, 10), materials.playerSuit);
  leftArm.position.y = -0.52;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  bodyGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.56, 2.25, 0);
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.8, 4, 10), materials.playerSuit);
  rightArm.position.y = -0.52;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  bodyGroup.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.2, 0.85, 0);
  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.95, 4, 10), materials.playerTrim);
  leftLeg.position.y = -0.48;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  bodyGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.2, 0.85, 0);
  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.95, 4, 10), materials.playerTrim);
  rightLeg.position.y = -0.48;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  bodyGroup.add(rightLegPivot);

  const capeGeo = new THREE.PlaneGeometry(0.78, 1.6, 6, 10);
  const capePos = capeGeo.attributes.position;
  const capePoints: Array<{ pos: THREE.Vector3; old: THREE.Vector3; pinned: boolean }> = [];

  for (let i = 0; i < capePos.count; i++) {
    const x = capePos.getX(i);
    const y = capePos.getY(i);
    const z = capePos.getZ(i);
    const v = new THREE.Vector3(x, y, z);
    capePoints.push({ pos: v.clone(), old: v.clone(), pinned: y > 0.6 });
  }

  const capeMesh = new THREE.Mesh(capeGeo, materials.cape);
  capeMesh.position.set(0, 1.8, 0.58);
  capeMesh.castShadow = true;
  capeMesh.receiveShadow = true;
  bodyGroup.add(capeMesh);

  const updateCloth = (dt: number, isMoving: boolean, walkTime: number) => {
    const sway = isMoving ? Math.sin(walkTime * 2.5) * 0.18 : Math.sin(walkTime * 1.5) * 0.08;
    capeMesh.rotation.x = 0.38 + sway;
    capeMesh.rotation.z = 0.18 + Math.sin(walkTime * 2) * 0.08;
    capeMesh.position.x = Math.sin(walkTime * 1.6) * 0.05;
    capeMesh.position.y = 1.8 + Math.sin(walkTime * 2.3) * 0.05;
    capeMesh.position.z = 0.58 + Math.cos(walkTime * 1.8) * 0.06;
  };

  const toolGroup = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), materials.timberDark);
  handle.rotation.x = Math.PI / 2;
  toolGroup.add(handle);

  const headPick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.12), materials.metalPlate);
  headPick.position.set(0, 0, 0.2);
  toolGroup.add(headPick);

  toolGroup.position.set(0.22, 1.2, 0.18);
  rightArmPivot.add(toolGroup);

  group.userData = {
    leftLeg: leftLegPivot,
    rightLeg: rightLegPivot,
    leftArm: leftArmPivot,
    rightArm: rightArmPivot,
    tool: toolGroup,
    bodyGroup,
    cape: capeMesh,
    updateCloth,
  };

  return group;
}

export { materials };
