import * as THREE from 'three';
import { createTreeMesh, createResourceNodeMesh, createStructureModel } from './proceduralModels';

export interface ResourceNode {
  id: string;
  type: 'tree_pine' | 'tree_oak' | 'stone' | 'crystal';
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  mesh: THREE.Group;
  shakeTime: number;
  shakeAngle: number;
}

export interface PlacedStructure {
  id: string;
  type: string;
  position: THREE.Vector3;
  rotationY: number;
  mesh: THREE.Group;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
  life: number;
}

/**
 * Procedural continuous ground height function
 * Includes natural perimeter cliffs beyond radius 34m
 */
export function getGroundHeight(x: number, z: number): number {
  const base =
    Math.sin(x * 0.06) * Math.cos(z * 0.06) * 1.4 +
    Math.sin(x * 0.12 + 1.5) * 0.6 +
    Math.cos(z * 0.15 - 0.7) * 0.5;

  const dist = Math.hypot(x, z);
  if (dist > 34) {
    const cliffFactor = Math.min((dist - 34) * 0.8, 14);
    return base + cliffFactor;
  }
  return base;
}

/**
 * Builds the terrain mesh with procedural grassy meadow vertex colors & normals
 */
export function createTerrainMesh(): THREE.Mesh {
  const size = 100;
  const segments = 90;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const colorGrassLow = new THREE.Color(0x356637);
  const colorGrassHigh = new THREE.Color(0x4d8847);
  const colorDirt = new THREE.Color(0x5a4833);
  const colorRock = new THREE.Color(0x575f6d);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = getGroundHeight(x, z);
    pos.setY(i, y);

    const dist = Math.hypot(x, z);
    const c = new THREE.Color();
    if (dist > 35) {
      c.lerpColors(colorDirt, colorRock, Math.min((dist - 35) / 10, 1.0));
    } else if (y > 1.2) {
      c.lerpColors(colorGrassLow, colorGrassHigh, (y - 1.2) / 1.5);
    } else {
      c.lerpColors(colorDirt, colorGrassLow, Math.max(0, (y + 1.5) / 2.5));
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.name = 'terrain';
  terrain.receiveShadow = true;
  return terrain;
}

/**
 * Spawns initial gatherable resource nodes deterministically
 */
export function populateResourceNodes(scene: THREE.Scene): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  const coords = [
    // Trees
    { type: 'tree_pine' as const, x: -6, z: -8, hp: 4 },
    { type: 'tree_pine' as const, x: -9, z: -12, hp: 4 },
    { type: 'tree_oak' as const, x: 7, z: -7, hp: 4 },
    { type: 'tree_pine' as const, x: 12, z: -4, hp: 4 },
    { type: 'tree_oak' as const, x: -14, z: 4, hp: 4 },
    { type: 'tree_pine' as const, x: -8, z: 12, hp: 4 },
    { type: 'tree_oak' as const, x: 6, z: 14, hp: 4 },
    { type: 'tree_pine' as const, x: 15, z: 10, hp: 4 },
    { type: 'tree_oak' as const, x: -18, z: -10, hp: 4 },
    { type: 'tree_pine' as const, x: 18, z: -14, hp: 4 },
    { type: 'tree_pine' as const, x: -5, z: 22, hp: 4 },
    { type: 'tree_oak' as const, x: 22, z: 4, hp: 4 },

    // Rocks
    { type: 'stone' as const, x: -12, z: -3, hp: 5 },
    { type: 'stone' as const, x: 10, z: 3, hp: 5 },
    { type: 'stone' as const, x: 3, z: -14, hp: 5 },
    { type: 'stone' as const, x: -4, z: 16, hp: 5 },
    { type: 'stone' as const, x: 16, z: -8, hp: 5 },
    { type: 'stone' as const, x: -20, z: 8, hp: 5 },

    // Crystals
    { type: 'crystal' as const, x: 14, z: 18, hp: 3 },
    { type: 'crystal' as const, x: -16, z: -18, hp: 3 },
    { type: 'crystal' as const, x: -15, z: 19, hp: 3 },
    { type: 'crystal' as const, x: 19, z: -20, hp: 3 },
  ];

  coords.forEach((item, index) => {
    const y = getGroundHeight(item.x, item.z);
    let mesh: THREE.Group;
    if (item.type === 'tree_pine') {
      mesh = createTreeMesh('pine');
    } else if (item.type === 'tree_oak') {
      mesh = createTreeMesh('oak');
    } else {
      mesh = createResourceNodeMesh(item.type);
    }

    mesh.position.set(item.x, y, item.z);
    mesh.rotation.y = (index * 1.37) % (Math.PI * 2);
    // Subtle scale variation (±15%) as per Three.js directives
    const scale = 0.85 + (index % 5) * 0.07;
    mesh.scale.set(scale, scale, scale);

    scene.add(mesh);

    nodes.push({
      id: `res_${index}`,
      type: item.type,
      position: mesh.position,
      health: item.hp,
      maxHealth: item.hp,
      mesh,
      shakeTime: 0,
      shakeAngle: 0,
    });
  });

  return nodes;
}

/**
 * High-performance pooled particle system for impact splinters and smoke
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 250;
  private pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private instMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.instMesh = new THREE.InstancedMesh(this.pGeo, pMat, this.maxParticles);
    this.instMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instMesh.frustumCulled = false;
    scene.add(this.instMesh);

    // Initialize all offscreen
    for (let i = 0; i < this.maxParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.instMesh.setMatrixAt(i, this.dummy.matrix);
      this.instMesh.setColorAt(i, new THREE.Color(0xffffff));
    }
    this.instMesh.instanceMatrix.needsUpdate = true;
    if (this.instMesh.instanceColor) this.instMesh.instanceColor.needsUpdate = true;
  }

  public burst(pos: THREE.Vector3, colorHex: number, count = 12): void {
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      const up = 2.0 + Math.random() * 3.0;

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4)),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, up, Math.sin(angle) * speed),
        color: col,
        size: 0.1 + Math.random() * 0.14,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      });
    }
  }

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.velocity.y -= 12 * dt; // gravity
      p.position.addScaledVector(p.velocity, dt);

      // Floor bounce / clamp
      const floor = getGroundHeight(p.position.x, p.position.z);
      if (p.position.y < floor + 0.05) {
        p.position.y = floor + 0.05;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }
    }

    // Update InstancedMesh
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const progress = p.life / p.maxLife;
        const scale = p.size * (1 - progress);
        this.dummy.position.copy(p.position);
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.rotation.x += dt * 5;
        this.dummy.rotation.y += dt * 5;
        this.dummy.updateMatrix();
        this.instMesh.setMatrixAt(i, this.dummy.matrix);
        this.instMesh.setColorAt(i, p.color);
      } else {
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }

    this.instMesh.instanceMatrix.needsUpdate = true;
    if (this.instMesh.instanceColor) this.instMesh.instanceColor.needsUpdate = true;
  }
}
