/**
 * Paper tags: the only text in the game. Handwritten words on torn paper,
 * drawn to a canvas texture with an embedded font (Caveat, OFL), placed in
 * the world next to the thing they concern. They pop in, fade out and turn
 * to face the player.
 */
import caveatBoldUrl from '@fontsource/caveat/files/caveat-latin-700-normal.woff2?url';
import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from '@iwsdk/core';
import { PALETTE } from './tuning.js';

const FONT_FAMILY = 'NightWatchHand';
const FONT_STACK = `${FONT_FAMILY}, 'Segoe Print', 'Bradley Hand', cursive`;
let fontPromise: Promise<boolean> | null = null;

/** Loads the embedded handwriting face once; resolves false on failure. */
export function loadTagFont(): Promise<boolean> {
  if (fontPromise == null) {
    const face = new FontFace(FONT_FAMILY, `url(${caveatBoldUrl})`, { weight: '700' });
    fontPromise = face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        return true;
      })
      .catch(() => false);
  }
  return fontPromise;
}

export type TagIcon = 'pie' | 'well' | 'bench' | 'bin' | 'door' | 'street' | null;

export interface TagStyle {
  paper: string;
  ink: string;
  pin: string | null;
}

export const TAG_STYLES = {
  hint: { paper: '#f4ead5', ink: '#2b2233', pin: null },
  mark: { paper: '#e0503c', ink: '#fff4e6', pin: '#2b2233' },
  verdict: { paper: '#f4ead5', ink: '#2b2233', pin: '#e0503c' },
} satisfies Record<string, TagStyle>;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const STAR_ON = hex(PALETTE.amber);
const STAR_OFF = 'rgba(43,34,51,0.25)';

export class PaperTag {
  readonly mesh: Mesh;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: CanvasTexture;
  private readonly material: MeshBasicMaterial;
  private opacity = 0;
  private targetOpacity = 0;
  private shownAt = -10;
  private text = '';
  private icon: TagIcon = null;
  private stars: boolean[] | null = null;
  private readonly seed = Math.random() * 1000;

  constructor(
    private readonly widthM: number,
    private readonly heightM: number,
    private readonly style: TagStyle,
    pixelsPerMeter = 5200,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(widthM * pixelsPerMeter);
    this.canvas.height = Math.round(heightM * pixelsPerMeter);
    const ctx = this.canvas.getContext('2d');
    if (ctx == null) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    });
    this.mesh = new Mesh(new PlaneGeometry(widthM, heightM), this.material);
    this.mesh.visible = false;
    this.mesh.renderOrder = 10;
  }

  set(text: string, icon: TagIcon = null, stars: boolean[] | null = null): this {
    this.text = text;
    this.icon = icon;
    this.stars = stars;
    this.redraw();
    return this;
  }

  redraw(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Torn-paper outline with a deterministic jitter per tag.
    let s = this.seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const m = h * 0.08;
    const steps = 18;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) ctx.lineTo(m + ((w - 2 * m) * i) / steps, m + rand() * m * 0.6);
    for (let i = 0; i <= steps / 3; i++) ctx.lineTo(w - m - rand() * m * 0.6, m + ((h - 2 * m) * i) / (steps / 3));
    for (let i = steps; i >= 0; i--) ctx.lineTo(m + ((w - 2 * m) * i) / steps, h - m - rand() * m * 0.6);
    for (let i = steps / 3; i >= 0; i--) ctx.lineTo(m + rand() * m * 0.6, m + ((h - 2 * m) * i) / (steps / 3));
    ctx.closePath();
    ctx.fillStyle = 'rgba(15,12,30,0.35)';
    ctx.save();
    ctx.translate(h * 0.03, h * 0.05);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = this.style.paper;
    ctx.fill();

    if (this.style.pin) {
      ctx.fillStyle = this.style.pin;
      ctx.beginPath();
      ctx.arc(w / 2, m * 1.9, h * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }

    let textX = w / 2;
    if (this.icon) {
      const size = h * 0.56;
      const cx = this.text ? m * 2 + size / 2 : w / 2;
      this.drawIcon(this.icon, cx, h / 2 + h * 0.04, size);
      textX = this.text ? cx + size / 2 + (w - (cx + size / 2)) / 2 : w / 2;
    }
    if (this.stars) {
      const n = this.stars.length;
      const size = h * 0.42;
      const gap = size * 1.25;
      const startX = w / 2 - ((n - 1) * gap) / 2;
      const y = this.text ? h * 0.7 : h / 2;
      this.stars.forEach((on, i) => this.drawStar(startX + i * gap, y, size / 2, on));
    }
    if (this.text) {
      ctx.fillStyle = this.style.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = h * (this.stars ? 0.34 : 0.52);
      ctx.font = `700 ${size}px ${FONT_STACK}`;
      const maxWidth = this.icon ? w - textX - m : w - 2.6 * m;
      while (ctx.measureText(this.text).width > maxWidth * (this.icon ? 2 : 1) && size > 8) {
        size *= 0.92;
        ctx.font = `700 ${size}px ${FONT_STACK}`;
      }
      ctx.fillText(this.text, textX, this.stars ? h * 0.3 : h / 2 + h * 0.03);
    }
    this.texture.needsUpdate = true;
  }

  private drawStar(cx: number, cy: number, r: number, on: boolean): void {
    const { ctx } = this;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = on ? STAR_ON : STAR_OFF;
    ctx.fill();
    if (on) {
      ctx.strokeStyle = '#8a5a14';
      ctx.lineWidth = r * 0.12;
      ctx.stroke();
    }
  }

  private drawIcon(icon: Exclude<TagIcon, null>, cx: number, cy: number, size: number): void {
    const { ctx } = this;
    const r = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineWidth = size * 0.08;
    ctx.strokeStyle = this.style.ink;
    ctx.fillStyle = this.style.ink;
    ctx.lineCap = 'round';
    switch (icon) {
      case 'pie':
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * r * 0.45 - r * 0.2, -r * 0.35);
          ctx.lineTo(i * r * 0.45 + r * 0.2, r * 0.35);
          ctx.stroke();
        }
        break;
      case 'well':
        ctx.strokeRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.8);
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.45);
        ctx.lineTo(0, -r * 0.95);
        ctx.lineTo(r * 0.9, -r * 0.45);
        ctx.stroke();
        break;
      case 'bench':
        ctx.fillRect(-r * 0.9, -r * 0.1, r * 1.8, r * 0.18);
        ctx.fillRect(-r * 0.9, -r * 0.55, r * 1.8, r * 0.14);
        ctx.fillRect(-r * 0.75, 0, r * 0.14, r * 0.6);
        ctx.fillRect(r * 0.6, 0, r * 0.14, r * 0.6);
        break;
      case 'bin':
        ctx.strokeRect(-r * 0.5, -r * 0.55, r, r * 1.3);
        ctx.fillRect(-r * 0.62, -r * 0.75, r * 1.24, r * 0.2);
        break;
      case 'door':
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.8);
        ctx.lineTo(-r * 0.5, -r * 0.3);
        ctx.arc(0, -r * 0.3, r * 0.5, Math.PI, 0);
        ctx.lineTo(r * 0.5, r * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r * 0.25, r * 0.25, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'street':
        for (let i = -1; i <= 1; i++) ctx.strokeRect(i * r * 0.62 - r * 0.28, -r * 0.28, r * 0.56, r * 0.56);
        break;
    }
    ctx.restore();
  }

  show(now: number): void {
    if (this.targetOpacity < 1) this.shownAt = now;
    this.targetOpacity = 1;
  }

  hide(): void {
    this.targetOpacity = 0;
  }

  get isShown(): boolean {
    return this.targetOpacity > 0;
  }

  /** Fades, pops and turns the tag toward the viewer. */
  update(now: number, dt: number, viewer: Vector3): void {
    const rate = this.targetOpacity > this.opacity ? 7 : 5;
    this.opacity += (this.targetOpacity - this.opacity) * (1 - Math.exp(-rate * dt));
    if (this.targetOpacity === 0 && this.opacity < 0.01) this.opacity = 0;
    this.material.opacity = this.opacity;
    this.mesh.visible = this.opacity > 0.01;
    if (!this.mesh.visible) return;
    const age = Math.max(0, now - this.shownAt);
    const pop = age < 0.3 ? 1 + 0.22 * Math.sin((age / 0.3) * Math.PI) * (1 - age / 0.3) : 1;
    this.mesh.scale.setScalar(pop);
    this.mesh.lookAt(viewer);
  }
}
