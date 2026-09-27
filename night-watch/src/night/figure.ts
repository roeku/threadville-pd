/**
 * Figurines. Suspects share one pawn silhouette so that in the dark only the
 * lantern can tell you who is who; their colours warm up when lit and fade
 * back slowly (afterglow). The baker and the cat have their own shapes.
 */
import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from '@iwsdk/core';
import { PALETTE, TUNING } from './tuning.js';
import type { FigureId } from './story.js';

interface Part {
  material: MeshStandardMaterial;
  day: Color;
}

const NIGHT = new Color(PALETTE.nightFigure);
const GLOW = new Color(PALETTE.amber);
const scratch = new Color();

export interface FigureStyle {
  kind: 'pawn' | 'baker' | 'cat';
  coat: number;
  hat: number;
  trim: number;
}

export class Figure {
  readonly root = new Group();
  readonly body = new Group();
  readonly hand = new Object3D();
  readonly tagAnchor = new Object3D();
  /** 0..1, how much the lantern currently reveals this figure. */
  lit = 0;
  /** True while the lantern centre is on this figure. */
  inLight = false;
  heading = 0;
  lastShimmer = -100;
  lastStep = 0;
  private parts: Part[] = [];
  private hopTime = -10;
  private wobbleTime = -10;
  private readonly seed: number;

  constructor(
    readonly id: FigureId,
    style: FigureStyle,
  ) {
    this.root.name = `figure-${id}`;
    this.root.add(this.body);
    this.seed = id.length * 1.7 + id.charCodeAt(0) * 0.13;
    if (style.kind === 'cat') this.buildCat(style);
    else this.buildPawn(style);
    this.body.add(this.hand);
    this.body.add(this.tagAnchor);
  }

  private part(geometry: CylinderGeometry | SphereGeometry | ConeGeometry, day: number, x: number, y: number, z: number): Mesh {
    const material = new MeshStandardMaterial({ color: NIGHT.clone(), roughness: 0.75, metalness: 0 });
    const m = new Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.parts.push({ material, day: new Color(day) });
    this.body.add(m);
    return m;
  }

  private buildPawn(style: FigureStyle): void {
    const baseH = 0.0022;
    const bodyH = 0.0175;
    this.part(new CylinderGeometry(0.0085, 0.009, baseH, 16), PALETTE.wood, 0, baseH / 2, 0);
    this.part(new CylinderGeometry(0.0062, 0.0082, bodyH, 14), style.coat, 0, baseH + bodyH / 2, 0);
    this.part(new CylinderGeometry(0.0071, 0.0074, 0.0022, 14), style.trim, 0, baseH + 0.0068, 0);
    const headY = baseH + bodyH + 0.005;
    this.part(new SphereGeometry(0.0058, 14, 10), PALETTE.skin, 0, headY, 0);
    const brimY = headY + 0.0048;
    if (style.kind === 'baker') {
      this.part(new CylinderGeometry(0.0055, 0.0048, 0.009, 12), style.hat, 0, brimY + 0.0045, 0);
      this.part(new SphereGeometry(0.0062, 12, 8), style.hat, 0, brimY + 0.0095, 0);
      this.tagAnchor.position.set(0, brimY + 0.022, 0);
    } else {
      this.part(new CylinderGeometry(0.0072, 0.0072, 0.0009, 14), style.hat, 0, brimY, 0);
      this.part(new CylinderGeometry(0.0046, 0.0048, 0.004, 12), style.hat, 0, brimY + 0.0024, 0);
      this.tagAnchor.position.set(0, brimY + 0.016, 0);
    }
    this.hand.position.set(0.0036, baseH + 0.009, 0.0092);
  }

  private buildCat(style: FigureStyle): void {
    const body = this.part(new SphereGeometry(0.0062, 12, 8), style.coat, 0, 0.0052, 0);
    body.scale.set(0.75, 0.7, 1.35);
    this.part(new SphereGeometry(0.0038, 12, 8), style.coat, 0, 0.0088, 0.0075);
    const earL = this.part(new ConeGeometry(0.0013, 0.0028, 6), style.trim, -0.0018, 0.0122, 0.0075);
    const earR = this.part(new ConeGeometry(0.0013, 0.0028, 6), style.trim, 0.0018, 0.0122, 0.0075);
    earL.rotation.z = 0.25;
    earR.rotation.z = -0.25;
    const tail = this.part(new CylinderGeometry(0.0007, 0.0009, 0.011, 6), style.coat, 0, 0.0085, -0.0095);
    tail.rotation.x = -0.6;
    this.hand.position.set(0, 0.006, 0.01);
    this.tagAnchor.position.set(0, 0.022, 0);
  }

  /** Applies reveal colours. `daylight` (0..1) reveals everyone at dawn. */
  applyColours(daylight: number): void {
    const amount = Math.max(this.lit, daylight);
    const glow = this.lit * (1 - daylight) * 0.16;
    for (const p of this.parts) {
      p.material.color.copy(NIGHT).lerp(p.day, amount);
      scratch.copy(GLOW).multiplyScalar(glow);
      p.material.emissive.copy(scratch);
    }
  }

  hop(now: number): void {
    this.hopTime = now;
  }

  wobble(now: number): void {
    this.wobbleTime = now;
  }

  /** Poses the body: walking bob, idle glances, hops and head-shake wobbles. */
  animate(now: number, moving: boolean, dt: number, targetHeading: number): void {
    const turn = 1 - Math.exp(-TUNING.turnRate * dt);
    let diff = targetHeading - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += diff * turn;

    let y = 0;
    let yaw = this.heading;
    let roll = 0;
    if (moving) {
      const phase = now * TUNING.walkBobRate * Math.PI;
      y = Math.abs(Math.sin(phase)) * TUNING.walkBobHeight;
      roll = Math.sin(phase) * 0.06;
    } else {
      // Idle: an occasional glance around, different per figure.
      yaw += Math.sin(now * 0.7 + this.seed) * 0.35 * Math.max(0, Math.sin(now * 0.23 + this.seed * 2));
    }
    const hopAge = now - this.hopTime;
    if (hopAge >= 0 && hopAge < 0.45) {
      const u = hopAge / 0.45;
      y += Math.sin(u * Math.PI) * 0.012;
    }
    const wobbleAge = now - this.wobbleTime;
    if (wobbleAge >= 0 && wobbleAge < 0.7) {
      const u = wobbleAge / 0.7;
      yaw += Math.sin(u * Math.PI * 4) * 0.5 * (1 - u);
    }
    this.body.position.y = y;
    this.body.rotation.set(0, yaw, roll);
  }
}

export function makeFigures(looks: Record<'mayor' | 'teen' | 'gardener', { coat: number; hat: number; trim: number }>): Record<FigureId, Figure> {
  return {
    mayor: new Figure('mayor', { kind: 'pawn', ...looks.mayor }),
    teen: new Figure('teen', { kind: 'pawn', ...looks.teen }),
    gardener: new Figure('gardener', { kind: 'pawn', ...looks.gardener }),
    baker: new Figure('baker', { kind: 'baker', coat: 0xf6f1e7, hat: 0xffffff, trim: 0xd9c9a8 }),
    cat: new Figure('cat', { kind: 'cat', coat: 0xd9822b, hat: 0xd9822b, trim: 0x8a4a1a }),
  };
}
