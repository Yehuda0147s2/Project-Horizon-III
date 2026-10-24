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

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash2D(x: number, z: number): number {
  return fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453123);
}

function smoothstep(a: number, b: number, value: number): number {
  const t = Math.min(Math.max((value - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}

function fbm(x: number, z: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;

  for (let i = 0; i < 5; i++) {
    sum += hash2D(Math.floor(x * freq), Math.floor(z * freq)) * amp;
    norm += amp;
    amp *= 0.52;
    freq *= 2.08;
  }

  return sum / norm;
}

export function getGroundHeight(x: number, z: number): number {
  const ridge = Math.sin(x * 0.11) * Math.cos(z * 0.09) * 1.35;
  const rolling = Math.sin(x * 0.06 + 2.8) * 0.8 + Math.cos(z * 0.08 - 1.6) * 0.6;
  const detail = fbm(x * 0.35 + 12.1, z * 0.35 - 6.9) * 1.8;
  const radial = Math.hypot(x, z);
  const valley = smoothstep(28, 36, radial) * 2.5;
  const cliff = Math.max(0, radial - 34) * 0.9;

  return ridge + rolling + detail - valley + cliff * 0.55;
}

export function createTerrainMesh(size = 160, segments = 220): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassLow = new THREE.Color(0x2f6d3f);
  const grassHigh = new THREE.Color(0x69b265);
  const dirt = new THREE.Color(0x6b4c34);
  const rock = new THREE.Color(0x5b6673);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = getGroundHeight(x, z);
    pos.setY(i, y);

    const dist = Math.hypot(x, z);
    const c = new THREE.Color();

    if (dist > 36) {
      const t = Math.min((dist - 36) / 18, 1);
      c.lerpColors(dirt, rock, t);
    } else if (y > 1.6) {
      const t = Math.min(Math.max((y - 1.6) / 3.5, 0), 1);
      c.lerpColors(grassLow, grassHigh, t);
    } else {
      const t = Math.min(Math.max((1.6 - y) / 2.5, 0), 1);
      c.lerpColors(dirt, grassLow, 1 - t);
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.08,
    flatShading: false,
  });

  const terrain = new THREE.Mesh(geo, material);
  terrain.name = 'terrain';
  terrain.receiveShadow = true;
  return terrain;
}

export function populateResourceNodes(scene: THREE.Scene, centerX = 0, centerZ = 0, radius = 40): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  const sampleRadius = Math.ceil(radius / 8);

  for (let gx = -sampleRadius; gx <= sampleRadius; gx++) {
    for (let gz = -sampleRadius; gz <= sampleRadius; gz++) {
      const worldX = gx * 8 + Math.sin(gx * 1.7 + gz * 2.3) * 1.8;
      const worldZ = gz * 8 + Math.cos(gx * 2.1 - gz * 1.9) * 1.7;
      if (Math.hypot(worldX - centerX, worldZ - centerZ) > radius) continue;

      const noise = hash2D(Math.round(worldX * 10), Math.round(worldZ * 10));
      let type: ResourceNode['type'];

      if (noise > 0.76) type = 'tree_pine';
      else if (noise > 0.55) type = 'tree_oak';
      else if (noise > 0.35) type = 'stone';
      else type = 'crystal';

      const mesh = type === 'tree_pine' || type === 'tree_oak'
        ? createTreeMesh(type === 'tree_pine' ? 'pine' : 'oak')
        : createResourceNodeMesh(type);

      const y = getGroundHeight(worldX, worldZ);
      mesh.position.set(worldX, y, worldZ);
      mesh.rotation.y = noise * Math.PI * 2;
      mesh.scale.setScalar(0.8 + noise * 0.5);
      scene.add(mesh);

      nodes.push({
        id: `res_${gx}_${gz}`,
        type,
        position: mesh.position.clone(),
        health: type === 'crystal' ? 3 : type === 'stone' ? 5 : 4,
        maxHealth: type === 'crystal' ? 3 : type === 'stone' ? 5 : 4,
        mesh,
        shakeTime: 0,
        shakeAngle: 0,
      });
    }
  }

  return nodes;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 280;
  private geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(this.geometry, material, this.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    for (let i = 0; i < this.maxParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, new THREE.Color(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  burst(pos: THREE.Vector3, colorHex: number, count = 12): void {
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.7 + Math.random() * 3.5;
      const up = 1.8 + Math.random() * 2.7;
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.8, (Math.random() - 0.5) * 0.5)),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, up, Math.sin(angle) * speed),
        color,
        size: 0.08 + Math.random() * 0.16,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.5,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 12 * dt;
      p.position.addScaledVector(p.velocity, dt);

      const floor = getGroundHeight(p.position.x, p.position.z);
      if (p.position.y < floor + 0.06) {
        p.position.y = floor + 0.06;
        p.velocity.y *= -0.32;
        p.velocity.x *= 0.62;
        p.velocity.z *= 0.62;
      }
    }

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const progress = p.life / p.maxLife;
        const scale = p.size * (1 - progress);
        this.dummy.position.copy(p.position);
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.rotation.x += dt * 5;
        this.dummy.rotation.y += dt * 4;
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.mesh.setColorAt(i, p.color);
      } else {
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

export { createTreeMesh, createResourceNodeMesh, createStructureModel };
