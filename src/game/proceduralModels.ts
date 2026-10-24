import * as THREE from 'three';

const materials = {
  bark: new THREE.MeshStandardMaterial({ color: 0x4a2e1d, roughness: 0.9, metalness: 0.05, flatShading: true }),
  pineFoliage: new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.7, metalness: 0.08, flatShading: true }),
  oakFoliage: new THREE.MeshStandardMaterial({ color: 0x2e692f, roughness: 0.72, metalness: 0.06, flatShading: true }),
  stone: new THREE.MeshStandardMaterial({ color: 0x6e7682, roughness: 0.88, metalness: 0.12, flatShading: true }),
  ironOre: new THREE.MeshStandardMaterial({ color: 0x8a5533, roughness: 0.45, metalness: 0.8, flatShading: true }),
  crystal: new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x005577,
    emissiveIntensity: 1.1,
    roughness: 0.18,
    metalness: 0.72,
    transparent: true,
    opacity: 0.9,
    flatShading: true,
  }),
  timber: new THREE.MeshStandardMaterial({ color: 0x7c4f2b, roughness: 0.75, metalness: 0.08, flatShading: true }),
  timberDark: new THREE.MeshStandardMaterial({ color: 0x513b1a, roughness: 0.82, metalness: 0.05, flatShading: true }),
  metalPlate: new THREE.MeshStandardMaterial({ color: 0x3d4444, roughness: 0.3, metalness: 0.85, flatShading: true }),
  ember: new THREE.MeshStandardMaterial({
    color: 0xffa94d,
    emissive: 0xff5511,
    emissiveIntensity: 2.0,
    roughness: 0.35,
    metalness: 0.15,
  }),
  playerSuit: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.55, metalness: 0.2, flatShading: true }),
  playerTrim: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.65, flatShading: true }),
  playerVisor: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.18, metalness: 0.95, flatShading: true }),
  playerBackpack: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65, metalness: 0.25, flatShading: true }),
};

export type PlayerMeshGroup = THREE.Group & {
  userData: {
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    leftArm: THREE.Object3D;
    rightArm: THREE.Object3D;
    cape: THREE.Object3D;
    updateCloth?: (dt: number, isMoving: boolean, walkTime: number) => void;
  };
};

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash2D(x: number, z: number): number {
  return fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453123);
}

function smoothstep(min: number, max: number, value: number): number {
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return t * t * (3 - 2 * t);
}

function fbm2D(x: number, z: number): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normalization = 0;

  for (let i = 0; i < 5; i++) {
    const sampleX = x * frequency;
    const sampleZ = z * frequency;
    const noise = hash2D(Math.floor(sampleX), Math.floor(sampleZ));
    total += noise * amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / normalization;
}

export function createTreeMesh(variant: 'pine' | 'oak' = 'pine'): THREE.Group {
  const group = new THREE.Group();
  group.name = `tree_${variant}`;

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 8);
  const trunk = new THREE.Mesh(trunkGeo, materials.bark);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  if (variant === 'pine') {
    const tiers = [
      { r: 1.2, h: 2.1 },
      { r: 0.9, h: 2.7 },
      { r: 0.6, h: 3.2 },
    ];

    for (const tier of tiers) {
      const cone = new THREE.ConeGeometry(tier.r, tier.h, 8);
      const foliage = new THREE.Mesh(cone, materials.pineFoliage);
      foliage.position.y = 3.0 + tier.h * 0.45;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }
  } else {
    const clumps = [
      { x: 0, y: 2.8, z: 0 },
      { x: 0.7, y: 2.9, z: 0.4 },
      { x: -0.7, y: 3.0, z: -0.4 },
      { x: 0.4, y: 3.2, z: -0.6 },
      { x: -0.5, y: 3.1, z: 0.8 },
    ];

    for (const clump of clumps) {
      const leafBall = new THREE.SphereGeometry(0.8, 10, 10);
      const foliage = new THREE.Mesh(leafBall, materials.oakFoliage);
      foliage.position.set(clump.x, clump.y, clump.z);
      foliage.scale.set(1.1, 0.9, 1.1);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }
  }

  return group;
}

export function createResourceNodeMesh(type: 'stone' | 'crystal'): THREE.Group {
  const group = new THREE.Group();
  group.name = type;

  if (type === 'stone') {
    const body = new THREE.DodecahedronGeometry(0.9, 0);
    const mesh = new THREE.Mesh(body, materials.stone);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    group.add(mesh);

    const veinGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.3, 6);
    const vein = new THREE.Mesh(veinGeo, materials.ironOre);
    vein.position.set(-0.5, 0.1, 0.2);
    vein.rotation.z = 1.1;
    vein.castShadow = true;
    group.add(vein);
  } else {
    const core = new THREE.ConeGeometry(0.45, 1.8, 8);
    const crystal = new THREE.Mesh(core, materials.crystal);
    crystal.position.y = 0.9;
    crystal.rotation.set(0.6, 0.3, 1.1);
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    group.add(crystal);

    const shardGeo = new THREE.ConeGeometry(0.2, 1.1, 5);
    for (let i = 0; i < 4; i++) {
      const shard = new THREE.Mesh(shardGeo, materials.crystal);
      shard.position.set(Math.cos(i * 1.57) * 0.4, 0.6 + (i % 2) * 0.2, Math.sin(i * 1.57) * 0.4);
      shard.rotation.set(Math.PI / 2, i * 0.8, i * 0.5);
      shard.castShadow = true;
      group.add(shard);
    }
  }

  return group;
}

export function createStructureModel(type: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `structure_${type}`;

  switch (type) {
    case 'campfire': {
      const base = new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12);
      const stoneBase = new THREE.Mesh(base, materials.stone);
      stoneBase.position.y = 0.25;
      group.add(stoneBase);

      for (let i = 0; i < 6; i++) {
        const rock = new THREE.DodecahedronGeometry(0.18, 0);
        const mesh = new THREE.Mesh(rock, materials.stone);
        const angle = (i / 6) * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * 0.7, 0.2, Math.sin(angle) * 0.7);
        mesh.scale.set(1, 0.4, 1);
        group.add(mesh);
      }

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), materials.ember);
      flame.position.y = 0.8;
      flame.scale.set(1, 1.5, 1);
      group.add(flame);
      break;
    }
    case 'shelter': {
      const frameGeo = new THREE.BoxGeometry(0.12, 1.8, 0.12);
      for (const x of [-1.8, 1.8]) {
        for (const z of [-1.2, 1.2]) {
          const beam = new THREE.Mesh(frameGeo, materials.timberDark);
          beam.position.set(x, 0.9, z);
          group.add(beam);
        }
      }

      for (let i = 0; i < 5; i++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.12), materials.timber);
        beam.position.set(0, 1.7 - i * 0.25, i * 0.4 - 1.2);
        beam.rotation.z = i % 2 === 0 ? 0.2 : -0.2;
        group.add(beam);
      }

      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.3, 4), materials.pineFoliage);
      roof.rotateY(Math.PI / 4);
      roof.position.y = 2.2;
      group.add(roof);
      break;
    }
    case 'tower': {
      const base = new THREE.CylinderGeometry(0.8, 1.1, 0.5, 8);
      const body = new THREE.CylinderGeometry(0.7, 0.9, 2.4, 8);
      const baseMesh = new THREE.Mesh(base, materials.timber);
      const bodyMesh = new THREE.Mesh(body, materials.timberDark);
      baseMesh.position.y = 0.25;
      bodyMesh.position.y = 1.6;
      group.add(baseMesh, bodyMesh);

      const roof = new THREE.ConeGeometry(0.8, 1.1, 6);
      const roofMesh = new THREE.Mesh(roof, materials.metalPlate);
      roofMesh.position.y = 3.2;
      group.add(roofMesh);
      break;
    }
    case 'beacon': {
      const pole = new THREE.CylinderGeometry(0.12, 0.18, 3.2, 8);
      const poleMesh = new THREE.Mesh(pole, materials.metalPlate);
      poleMesh.position.y = 1.6;
      group.add(poleMesh);

      const orb = new THREE.SphereGeometry(0.5, 14, 14);
      const orbMesh = new THREE.Mesh(orb, materials.crystal);
      orbMesh.position.y = 3.3;
      group.add(orbMesh);
      break;
    }
    case 'wall': {
      const segment = new THREE.BoxGeometry(1.8, 1.0, 0.35);
      for (let i = 0; i < 3; i++) {
        const stone = new THREE.Mesh(segment, materials.timberDark);
        stone.position.set(i * 1.1 - 1.1, 0.5, 0);
        stone.castShadow = true;
        stone.receiveShadow = true;
        group.add(stone);
      }
      break;
    }
    default: {
      const fallback = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mesh = new THREE.Mesh(fallback, materials.timber);
      group.add(mesh);
    }
  }

  return group;
}

export function createPlayerMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;
  group.name = 'player';

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.2, 6, 12), materials.playerSuit);
  torso.position.y = 1.65;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), materials.playerSuit);
  head.position.y = 2.85;
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.18), materials.playerVisor);
  visor.position.set(0, 2.9, 0.22);
  visor.castShadow = true;
  group.add(visor);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.7, 0.24), materials.playerBackpack);
  backpack.position.set(0, 1.9, -0.4);
  backpack.castShadow = true;
  group.add(backpack);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.58, 2.2, 0);
  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.9, 4, 10), materials.playerSuit);
  leftArm.position.y = -0.5;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  group.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.58, 2.2, 0);
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.9, 4, 10), materials.playerSuit);
  rightArm.position.y = -0.5;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  group.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.22, 0.8, 0);
  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 10), materials.playerTrim);
  leftLeg.position.y = -0.4;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  group.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.22, 0.8, 0);
  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 10), materials.playerTrim);
  rightLeg.position.y = -0.4;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  group.add(rightLegPivot);

  const capeGeo = new THREE.BoxGeometry(0.8, 1.4, 0.08);
  const cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1, flatShading: true }));
  cape.position.set(0, 1.7, 0.52);
  cape.castShadow = true;
  group.add(cape);

  const capeOffset = new THREE.Vector3();
  const updateCloth = (dt: number, isMoving: boolean, walkTime: number) => {
    const sway = isMoving ? Math.sin(walkTime * 2.5) * 0.18 : Math.sin(walkTime * 1.5) * 0.08;
    cape.rotation.x = 0.3 + sway;
    cape.rotation.z = 0.12 + Math.sin(walkTime * 2) * 0.08;
    cape.position.x = capeOffset.x + Math.sin(walkTime * 1.6) * 0.04;
    cape.position.y = 1.7 + Math.sin(walkTime * 2.4) * 0.05;
    cape.position.z = 0.52 + Math.cos(walkTime * 1.8) * 0.06;
    cape.rotation.y += dt * 0.4;
  };

  group.userData = {
    leftLeg: leftLegPivot,
    rightLeg: rightLegPivot,
    leftArm: leftArmPivot,
    rightArm: rightArmPivot,
    cape,
    updateCloth,
  };

  return group;
}
