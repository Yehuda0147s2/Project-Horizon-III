import * as THREE from 'three';

// Shared materials cache to minimize draw calls and shader recompiles
const materials = {
  bark: new THREE.MeshStandardMaterial({
    color: 0x4a2e18,
    roughness: 0.9,
    metalness: 0.05,
  }),
  pineFoliage: new THREE.MeshStandardMaterial({
    color: 0x1d4a2a,
    roughness: 0.7,
    metalness: 0.1,
    flatShading: true,
  }),
  oakFoliage: new THREE.MeshStandardMaterial({
    color: 0x2e6930,
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  }),
  stone: new THREE.MeshStandardMaterial({
    color: 0x6e7682,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
  }),
  ironOre: new THREE.MeshStandardMaterial({
    color: 0x8a5533,
    roughness: 0.4,
    metalness: 0.7,
    flatShading: true,
  }),
  crystal: new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x005577,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.88,
  }),
  timber: new THREE.MeshStandardMaterial({
    color: 0x7c4f2b,
    roughness: 0.75,
    metalness: 0.05,
  }),
  timberDark: new THREE.MeshStandardMaterial({
    color: 0x513117,
    roughness: 0.8,
    metalness: 0.05,
  }),
  metalPlate: new THREE.MeshStandardMaterial({
    color: 0x3d444f,
    roughness: 0.3,
    metalness: 0.85,
  }),
  ember: new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff5511,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  }),
  playerSuit: new THREE.MeshStandardMaterial({
    color: 0x2563eb, // Vibrant explorer blue
    roughness: 0.5,
    metalness: 0.2,
  }),
  playerTrim: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.6,
  }),
  playerVisor: new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Gold tinted visor
    roughness: 0.1,
    metalness: 0.95,
  }),
  playerBackpack: new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.6,
    metalness: 0.3,
  }),
};

/**
 * 3-8 Part Procedural Tree (Grounded at y=0)
 */
export function createTreeMesh(variant: 'pine' | 'oak' = 'pine'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tree';

  // 1. Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.2, 7);
  const trunk = new THREE.Mesh(trunkGeo, materials.bark);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // 2. Root spurs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const rootGeo = new THREE.ConeGeometry(0.18, 0.6, 5);
    const root = new THREE.Mesh(rootGeo, materials.bark);
    root.rotation.z = 0.5;
    root.rotation.y = angle;
    root.position.set(Math.cos(angle) * 0.28, 0.2, Math.sin(angle) * 0.28);
    root.castShadow = true;
    group.add(root);
  }

  if (variant === 'pine') {
    // 3 Foliage Tiers (Cones)
    const tiers = [
      { r: 1.6, h: 1.8, y: 2.2 },
      { r: 1.25, h: 1.6, y: 3.2 },
      { r: 0.85, h: 1.4, y: 4.1 },
    ];
    tiers.forEach((t) => {
      const folGeo = new THREE.ConeGeometry(t.r, t.h, 7);
      const fol = new THREE.Mesh(folGeo, materials.pineFoliage);
      fol.position.y = t.y;
      fol.castShadow = true;
      fol.receiveShadow = true;
      group.add(fol);
    });
  } else {
    // Oak: 4 clustered faceted leaf blobs
    const clusters = [
      { r: 1.2, x: 0, y: 2.6, z: 0 },
      { r: 0.9, x: 0.45, y: 2.9, z: 0.3 },
      { r: 0.85, x: -0.4, y: 2.8, z: -0.25 },
      { r: 0.7, x: 0.1, y: 3.4, z: -0.1 },
    ];
    clusters.forEach((c) => {
      const geo = new THREE.DodecahedronGeometry(c.r, 1);
      const m = new THREE.Mesh(geo, materials.oakFoliage);
      m.position.set(c.x, c.y, c.z);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    });
  }

  return group;
}

/**
 * 3-5 Part Procedural Rock / Crystal Node (Grounded at y=0)
 */
export function createResourceNodeMesh(type: 'stone' | 'crystal'): THREE.Group {
  const group = new THREE.Group();
  group.name = type;

  if (type === 'stone') {
    // Main boulder
    const mainGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const mainMesh = new THREE.Mesh(mainGeo, materials.stone);
    mainMesh.position.y = 0.8;
    mainMesh.scale.set(1.2, 0.9, 1.1);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    // Satellite rocks & iron veins
    const sub1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), materials.stone);
    sub1.position.set(0.7, 0.35, 0.5);
    sub1.castShadow = true;
    group.add(sub1);

    const oreVein = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), materials.ironOre);
    oreVein.position.set(-0.55, 0.6, 0.45);
    oreVein.castShadow = true;
    group.add(oreVein);
  } else {
    // Crystal Spire
    const coreGeo = new THREE.ConeGeometry(0.5, 2.2, 6);
    const core = new THREE.Mesh(coreGeo, materials.crystal);
    core.position.y = 1.1;
    core.castShadow = true;
    group.add(core);

    // Satellite shards
    const shardAngles = [0.8, 2.6, 4.4];
    shardAngles.forEach((ang, i) => {
      const shardGeo = new THREE.ConeGeometry(0.25, 1.2, 5);
      const shard = new THREE.Mesh(shardGeo, materials.crystal);
      shard.position.set(Math.cos(ang) * 0.45, 0.5, Math.sin(ang) * 0.45);
      shard.rotation.z = 0.35;
      shard.rotation.y = ang + i * 0.2;
      shard.castShadow = true;
      group.add(shard);
    });

    // Rock base collar
    const baseGeo = new THREE.DodecahedronGeometry(0.65, 0);
    const base = new THREE.Mesh(baseGeo, materials.stone);
    base.position.y = 0.25;
    base.scale.set(1.2, 0.45, 1.2);
    base.castShadow = true;
    group.add(base);
  }

  return group;
}

/**
 * Procedural Player Character (Composite Group with limbs, cape cloth physics, and gear)
 */
export interface PlayerMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
    tool?: THREE.Group;
    bodyGroup?: THREE.Group;
    cape?: THREE.Mesh;
    updateCloth?: (dt: number, isMoving: boolean, walkTime: number) => void;
  };
}

// Procedural Cloth Texture for Survival Explorer Cape
const explorerCapeTexture = (() => {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  // Navy / Amber field
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.7, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Microscopic weave
  for (let y = 0; y < 256; y += 4) {
    ctx.strokeStyle = y % 8 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
  }
  for (let x = 0; x < 256; x += 4) {
    ctx.strokeStyle = x % 8 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
  }

  // Golden Expedition Star Emblem
  ctx.save();
  ctx.translate(128, 90);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? 24 : 10;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Gold Trim Bottom Hem
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 238, 256, 8);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 246, 256, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
})();

const capeMaterial = new THREE.MeshStandardMaterial({
  map: explorerCapeTexture,
  color: 0xffffff,
  roughness: 0.82,
  metalness: 0.1,
  side: THREE.DoubleSide,
  shadowSide: THREE.DoubleSide,
});

export function createPlayerMesh(): PlayerMeshGroup {
  const root = new THREE.Group() as PlayerMeshGroup;
  root.name = 'player';

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.9;
  root.add(bodyGroup);

  // 1. Torso
  const torsoGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.65, 8);
  const torso = new THREE.Mesh(torsoGeo, materials.playerSuit);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Chest Emblem
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.04), materials.playerTrim);
  chestPlate.position.set(0, 0.08, 0.22);
  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 6), materials.crystal);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 0.08, 0.24);
  bodyGroup.add(chestPlate, chestCore);

  // 2. Utility belt & Pouch
  const beltGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.1, 8);
  const belt = new THREE.Mesh(beltGeo, materials.playerTrim);
  belt.position.y = -0.22;
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.07), materials.playerBackpack);
  pouch.position.set(0.20, -0.22, 0.14);
  bodyGroup.add(belt, pouch);

  // 3. Head & Helmet
  const headGeo = new THREE.SphereGeometry(0.24, 12, 10);
  const head = new THREE.Mesh(headGeo, materials.playerSuit);
  head.position.y = 0.52;
  head.castShadow = true;
  bodyGroup.add(head);

  // 4. Gold Visor
  const visorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 8, 1, false, -Math.PI / 2.5, Math.PI / 1.25);
  const visor = new THREE.Mesh(visorGeo, materials.playerVisor);
  visor.position.set(0, 0.52, 0.12);
  visor.rotation.y = Math.PI / 2;
  bodyGroup.add(visor);

  // 5. Backpack
  const packGeo = new THREE.BoxGeometry(0.32, 0.42, 0.2);
  const pack = new THREE.Mesh(packGeo, materials.playerBackpack);
  pack.position.set(0, 0.05, -0.22);
  pack.castShadow = true;
  bodyGroup.add(pack);

  // 6. Antenna / Beacon
  const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4);
  const ant = new THREE.Mesh(antGeo, materials.playerTrim);
  ant.position.set(0.1, 0.32, -0.22);
  bodyGroup.add(ant);

  // 7. Nuanced Cloth Cape Simulation Setup (6 cols x 9 rows)
  const cCols = 6;
  const cRows = 9;
  const cWidth = 0.52;
  const cHeight = 0.95;
  const cGeo = new THREE.PlaneGeometry(cWidth, cHeight, cCols - 1, cRows - 1);
  const cPosAttr = cGeo.attributes.position;
  const cParticles: { pos: THREE.Vector3; oldPos: THREE.Vector3; orig: THREE.Vector3; pinned: boolean }[] = [];

  for (let r = 0; r < cRows; r++) {
    for (let c = 0; c < cCols; c++) {
      const idx = r * cCols + c;
      const nx = c / (cCols - 1) - 0.5;
      const ny = r / (cRows - 1);
      const x = nx * cWidth;
      const y = 0.26 - ny * cHeight;
      const z = -0.32 - ny * 0.03;
      cPosAttr.setXYZ(idx, x, y, z);
      cParticles.push({
        pos: new THREE.Vector3(x, y, z),
        oldPos: new THREE.Vector3(x, y, z),
        orig: new THREE.Vector3(x, y, z),
        pinned: (r === 0)
      });
    }
  }
  cPosAttr.needsUpdate = true;
  cGeo.computeVertexNormals();

  const capeMesh = new THREE.Mesh(cGeo, capeMaterial);
  capeMesh.castShadow = true;
  bodyGroup.add(capeMesh);

  // Cape Constraints
  const sX = cWidth / (cCols - 1);
  const sY = cHeight / (cRows - 1);
  const cConstraints: [number, number, number][] = [];
  for (let r = 0; r < cRows; r++) {
    for (let c = 0; c < cCols - 1; c++) {
      cConstraints.push([r * cCols + c, r * cCols + c + 1, sX]);
    }
  }
  for (let r = 0; r < cRows - 1; r++) {
    for (let c = 0; c < cCols; c++) {
      cConstraints.push([r * cCols + c, (r + 1) * cCols + c, sY]);
    }
  }

  const updateCloth = (dt: number, isMoving: boolean, walkTime: number) => {
    const backwardForce = isMoving ? 0.35 : 0.04;
    const flutter = isMoving ? 0.04 : 0.015;
    const drag = 0.90;
    const gravY = -9.8 * 0.32 * dt * dt;

    for (let i = 0; i < cParticles.length; i++) {
      const p = cParticles[i];
      if (p.pinned) {
        p.pos.copy(p.orig);
        p.oldPos.copy(p.orig);
        continue;
      }
      const r = Math.floor(i / cCols);
      const normR = r / (cRows - 1);

      const vx = (p.pos.x - p.oldPos.x) * drag;
      const vy = (p.pos.y - p.oldPos.y) * drag;
      const vz = (p.pos.z - p.oldPos.z) * drag;

      p.oldPos.copy(p.pos);

      const wave = Math.sin(walkTime * 8 + r * 1.2) * flutter * normR;
      p.pos.x += vx;
      p.pos.y += vy + gravY;
      p.pos.z += vz - backwardForce * normR * dt * 7 + wave;

      // Body obstacle push-out
      const bodyRadius = 0.28;
      const dist2D = Math.hypot(p.pos.x, p.pos.z);
      if (dist2D < bodyRadius && p.pos.z > -bodyRadius) {
        const safeZ = -Math.sqrt(Math.max(0.001, bodyRadius * bodyRadius - p.pos.x * p.pos.x)) - 0.02;
        p.pos.z = Math.min(p.pos.z, safeZ);
      }
    }

    // Solve relaxation
    for (let iter = 0; iter < 2; iter++) {
      for (let ci = 0; ci < cConstraints.length; ci++) {
        const [i1, i2, rest] = cConstraints[ci];
        const p1 = cParticles[i1];
        const p2 = cParticles[i2];
        const dx = p2.pos.x - p1.pos.x;
        const dy = p2.pos.y - p1.pos.y;
        const dz = p2.pos.z - p1.pos.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist === 0) continue;
        const diff = (dist - rest) / dist;
        const ox = dx * 0.5 * diff;
        const oy = dy * 0.5 * diff;
        const oz = dz * 0.5 * diff;
        if (!p1.pinned && !p2.pinned) {
          p1.pos.x += ox; p1.pos.y += oy; p1.pos.z += oz;
          p2.pos.x -= ox; p2.pos.y -= oy; p2.pos.z -= oz;
        } else if (!p1.pinned && p2.pinned) {
          p1.pos.x += ox * 2; p1.pos.y += oy * 2; p1.pos.z += oz * 2;
        } else if (p1.pinned && !p2.pinned) {
          p2.pos.x -= ox * 2; p2.pos.y -= oy * 2; p2.pos.z -= oz * 2;
        }
      }
    }

    for (let i = 0; i < cParticles.length; i++) {
      cPosAttr.setXYZ(i, cParticles[i].pos.x, cParticles[i].pos.y, cParticles[i].pos.z);
    }
    cPosAttr.needsUpdate = true;
    cGeo.computeVertexNormals();
    cGeo.attributes.normal.needsUpdate = true;
  };

  // 8. Legs with Articulated Knee Guards
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.55, 6);
  legGeo.translate(0, -0.275, 0);

  const leftLeg = new THREE.Mesh(legGeo, materials.playerTrim);
  leftLeg.position.set(-0.14, 0.55, 0);
  leftLeg.castShadow = true;
  const leftKnee = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.06), materials.playerSuit);
  leftKnee.position.set(0, -0.28, 0.08);
  leftLeg.add(leftKnee);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, materials.playerTrim);
  rightLeg.position.set(0.14, 0.55, 0);
  rightLeg.castShadow = true;
  const rightKnee = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.06), materials.playerSuit);
  rightKnee.position.set(0, -0.28, 0.08);
  rightLeg.add(rightKnee);
  root.add(rightLeg);

  // 9. Arms with Pauldrons
  const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 6);
  armGeo.translate(0, -0.25, 0);

  const leftArm = new THREE.Mesh(armGeo, materials.playerSuit);
  leftArm.position.set(-0.35, 0.85, 0);
  leftArm.castShadow = true;
  const leftPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), materials.playerTrim);
  leftPauldron.position.set(-0.02, 0.02, 0);
  leftArm.add(leftPauldron);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, materials.playerSuit);
  rightArm.position.set(0.35, 0.85, 0);
  rightArm.castShadow = true;
  const rightPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), materials.playerTrim);
  rightPauldron.position.set(0.02, 0.02, 0);
  rightArm.add(rightPauldron);
  root.add(rightArm);

  // 10. Tool (Axe / Hammer) in right hand
  const toolGroup = new THREE.Group();
  const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5);
  const handle = new THREE.Mesh(handleGeo, materials.timberDark);
  handle.rotation.x = Math.PI / 2;
  toolGroup.add(handle);

  const headPickGeo = new THREE.BoxGeometry(0.08, 0.24, 0.12);
  const headPick = new THREE.Mesh(headPickGeo, materials.metalPlate);
  headPick.position.set(0, 0, 0.22);
  toolGroup.add(headPick);

  toolGroup.position.set(0, -0.45, 0.15);
  rightArm.add(toolGroup);

  root.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    tool: toolGroup,
    bodyGroup,
    cape: capeMesh,
    updateCloth
  };
  return root;
}

/**
 * 3-10 Part Procedural Buildable Structures
 */
export function createStructureModel(type: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `structure_${type}`;

  if (type === 'campfire') {
    // 6 stones in a ring
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), materials.stone);
      rock.position.set(Math.cos(ang) * 0.65, 0.14, Math.sin(ang) * 0.65);
      rock.castShadow = true;
      group.add(rock);
    }
    // 3 crossed logs
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), materials.timber);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;
      log.position.y = 0.18;
      log.castShadow = true;
      group.add(log);
    }
    // Glowing ember center
    const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), materials.ember);
    ember.position.y = 0.2;
    group.add(ember);

    // Warm point light for campfire
    const fireLight = new THREE.PointLight(0xff7722, 2.5, 6, 1.5);
    fireLight.position.set(0, 0.6, 0);
    fireLight.name = 'fireLight';
    group.add(fireLight);
  } else if (type === 'shelter') {
    // 4 Corner stilts
    const postGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.0, 6);
    const coords = [
      [-1.0, -1.0],
      [1.0, -1.0],
      [-1.0, 1.0],
      [1.0, 1.0],
    ];
    coords.forEach(([x, z]) => {
      const post = new THREE.Mesh(postGeo, materials.timber);
      post.position.set(x, 1.0, z);
      post.castShadow = true;
      group.add(post);
    });

    // Crossbeams
    const beamGeo = new THREE.BoxGeometry(2.1, 0.12, 0.12);
    const b1 = new THREE.Mesh(beamGeo, materials.timber);
    b1.position.set(0, 1.95, -1.0);
    const b2 = new THREE.Mesh(beamGeo, materials.timber);
    b2.position.set(0, 1.95, 1.0);
    group.add(b1, b2);

    // Slanted plank roof
    const roofGeo = new THREE.BoxGeometry(2.4, 0.08, 2.4);
    const roof = new THREE.Mesh(roofGeo, materials.timberDark);
    roof.position.set(0, 2.15, 0);
    roof.rotation.x = 0.12;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Back wall slats
    for (let i = 0; i < 4; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.06), materials.timber);
      slat.position.set(0, 0.3 + i * 0.42, -0.98);
      slat.castShadow = true;
      group.add(slat);
    }
  } else if (type === 'tower') {
    // 4 Tall posts
    const stiltGeo = new THREE.CylinderGeometry(0.1, 0.12, 4.0, 6);
    [
      [-0.8, -0.8],
      [0.8, -0.8],
      [-0.8, 0.8],
      [0.8, 0.8],
    ].forEach(([x, z]) => {
      const stilt = new THREE.Mesh(stiltGeo, materials.timber);
      stilt.position.set(x, 2.0, z);
      stilt.castShadow = true;
      group.add(stilt);
    });

    // Platform floor
    const platGeo = new THREE.BoxGeometry(2.2, 0.14, 2.2);
    const plat = new THREE.Mesh(platGeo, materials.timberDark);
    plat.position.set(0, 3.9, 0);
    plat.castShadow = true;
    group.add(plat);

    // Safety railings
    const railGeo = new THREE.BoxGeometry(2.2, 0.08, 0.08);
    const r1 = new THREE.Mesh(railGeo, materials.timber);
    r1.position.set(0, 4.5, -1.0);
    const r2 = new THREE.Mesh(railGeo, materials.timber);
    r2.position.set(0, 4.5, 1.0);
    group.add(r1, r2);

    // Ladder rungs on back
    for (let i = 1; i <= 7; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4), materials.timber);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, i * 0.5, -0.8);
      group.add(rung);
    }
  } else if (type === 'beacon') {
    // Metal pedestal base
    const baseGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.3, 8);
    const base = new THREE.Mesh(baseGeo, materials.metalPlate);
    base.position.y = 0.15;
    base.castShadow = true;
    group.add(base);

    // Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.22, 0.35, 1.5, 8);
    const pillar = new THREE.Mesh(pillarGeo, materials.metalPlate);
    pillar.position.y = 0.9;
    pillar.castShadow = true;
    group.add(pillar);

    // Gyro ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 20);
    const ring = new THREE.Mesh(ringGeo, materials.metalPlate);
    ring.position.y = 1.7;
    ring.rotation.x = Math.PI / 4;
    ring.name = 'gyroRing';
    group.add(ring);

    // Glowing core
    const coreGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const core = new THREE.Mesh(coreGeo, materials.crystal);
    core.position.y = 1.7;
    group.add(core);

    const beaconLight = new THREE.PointLight(0x00f0ff, 2.0, 8, 1.5);
    beaconLight.position.set(0, 2.0, 0);
    group.add(beaconLight);
  } else if (type === 'wall') {
    // 3 Defensive palisade stakes
    for (let i = -1; i <= 1; i++) {
      const stakeGeo = new THREE.ConeGeometry(0.2, 2.2, 6);
      const stake = new THREE.Mesh(stakeGeo, materials.timber);
      stake.position.set(i * 0.45, 1.1, 0);
      stake.castShadow = true;
      group.add(stake);
    }
    // Horizontal cross bracing
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), materials.timberDark);
    brace.position.set(0, 0.9, 0.12);
    group.add(brace);
  }

  return group;
}
