/**
 * Night Watch game system: one state machine that runs the whole loop.
 *
 *   attract (2D page) -> dusk -> night -> dawn -> lineup -> verdict ->
 *   replay -> end -> (pinch) -> dusk ...
 *
 * The lantern follows where the player looks. A pinch marks whoever the light
 * is on; at dawn a pinch accuses whoever the player is looking at. Feel
 * numbers live in tuning.ts; the night itself lives in story.ts.
 */
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  createSystem,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  RingGeometry,
  SpotLight,
  Vector3,
  VisibilityState,
} from '@iwsdk/core';
import { nightAudio, probeSound, type Pos, type SoundName } from './audio.js';
import { Figure, makeFigures } from './figure.js';
import {
  doorMoments,
  FigureId,
  HOUSES,
  NightPlan,
  NIGHTS,
  planNight,
  RouteSample,
  sampleRoute,
  SPOTS,
  SUSPECT_LOOKS,
  SUSPECT_ORDER,
  SuspectId,
  Vec2,
} from './story.js';
import { loadTagFont, PaperTag, TAG_STYLES, TagIcon } from './tags.js';
import { PALETTE, TUNING } from './tuning.js';
import { buildTown, flatDisc, Town } from './town.js';

type Phase = 'attract' | 'dusk' | 'night' | 'dawn' | 'lineup' | 'verdict' | 'replay' | 'end';

const ALL_FIGURES: FigureId[] = ['mayor', 'teen', 'gardener', 'baker', 'cat'];
const CRUMB_POOL = 32;
const PIE_Y = 0.0215;

interface Crumb {
  mesh: Mesh;
  material: MeshStandardMaterial;
  lit: number;
  active: boolean;
}

interface DoorEvent {
  t: number;
  p: Vec2;
  fired: boolean;
}

const smooth = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function radialTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export class NightWatchSystem extends createSystem({}) {
  private town!: Town;
  private figures!: Record<FigureId, Figure>;
  private hemi!: HemisphereLight;
  private moonLight!: DirectionalLight;
  private sunLight!: DirectionalLight;
  private lantern!: SpotLight;
  private lanternTarget!: Object3D;
  private glow!: Mesh;
  private glowMat!: MeshBasicMaterial;
  private ring!: Mesh;
  private ringMat!: MeshBasicMaterial;
  private tags!: Record<'intro' | 'look' | 'pinch' | 'question' | 'verdict' | 'stars' | 'replay' | 'again', PaperTag>;
  private markTags!: Record<SuspectId, PaperTag>;
  private tagList: PaperTag[] = [];
  private crumbs: Crumb[] = [];

  private phase: Phase = 'attract';
  private phaseTime = 0;
  private story = 0;
  private nightIndex = 0;
  private plan!: NightPlan;
  private doorEvents: DoorEvent[] = [];
  private clatterFired = false;
  private theftFired = false;
  private nextCrumbAt = 0;
  private binTipAt = -10;
  private daylight = 0.35;
  private daylightGoal = 0.35;
  private windowsOn = 1;
  private lanternStrength = 0;
  private lanternGoal = 0;
  private readonly lanternPoint = new Vector3();
  private readonly lanternRaw = new Vector3();
  private lanternOnBoard = false;
  private glowPulseAt = -10;
  private markStep = 0;
  private witnessed = false;
  private caughtInAct = false;
  private accused: SuspectId | null = null;
  private looked: SuspectId | null = null;
  private pinchFor: SuspectId | null = null;
  private pinchShownAt = -10;
  private selectQueued = false;
  private selectHasRay = false;
  private guardUntil = 0;
  private placed = false;
  private paused = false;
  private session: XRSession | null = null;
  private clock = 0;
  private readonly hints = { lookDone: false, pinchDone: false, pinchShows: 0 };
  private readonly revealed = new Set<FigureId>();
  private readonly lineupFrom = new Map<SuspectId, Vec2>();
  private replayEnd = 0;
  /** Development-only time multiplier (see the DEV hook in init). */
  private devSpeed = 1;

  private readonly viewer = new Vector3();
  private readonly headQuat = new Quaternion();
  private readonly fwd = new Vector3();
  private readonly up = new Vector3();
  private readonly gazeO = new Vector3();
  private readonly gazeD = new Vector3();
  private readonly selectO = new Vector3();
  private readonly selectD = new Vector3();
  private readonly localO = new Vector3();
  private readonly localD = new Vector3();
  private readonly tmp = new Vector3();
  private readonly tmpQ = new Quaternion();
  private readonly inv = new Matrix4();
  private readonly sample: RouteSample = { x: 0, z: 0, inside: true, moving: false, heading: 0 };
  private readonly posA: Pos = { x: 0, y: 0, z: 0 };
  private readonly fwdPos: Pos = { x: 0, y: 0, z: -1 };
  private readonly upPos: Pos = { x: 0, y: 1, z: 0 };
  private readonly nightColor = new Color(PALETTE.slate);
  private readonly dayColor = new Color(0xffe6c2);
  private readonly nightGround = new Color(PALETTE.indigo);
  private readonly dayGround = new Color(0x6b5a4a);

  init(): void {
    this.town = buildTown();
    const root = this.town.root;
    this.world.createTransformEntity(root, { persistent: true });
    this.figures = makeFigures(SUSPECT_LOOKS);
    for (const id of ALL_FIGURES) root.add(this.figures[id].root);

    this.world.renderer.shadowMap.enabled = TUNING.lanternShadows;
    this.hemi = new HemisphereLight(PALETTE.slate, PALETTE.indigo, 0.3);
    this.world.createTransformEntity(this.hemi, { persistent: true });
    this.moonLight = new DirectionalLight(0x9fb1e8, 0.5);
    this.moonLight.position.set(-0.25, 0.6, -0.45);
    root.add(this.moonLight, this.moonLight.target);
    this.sunLight = new DirectionalLight(PALETTE.sun, 0);
    this.sunLight.position.set(-0.55, 0.4, 0.15);
    root.add(this.sunLight, this.sunLight.target);

    this.lanternTarget = new Object3D();
    this.world.createTransformEntity(this.lanternTarget, { persistent: true });
    this.lantern = new SpotLight(PALETTE.amber, 0, 0, 0.12, TUNING.lanternPenumbra, 0);
    this.lantern.target = this.lanternTarget;
    this.lantern.castShadow = TUNING.lanternShadows;
    this.lantern.shadow.mapSize.set(512, 512);
    this.lantern.shadow.bias = -0.0004;
    this.lantern.shadow.camera.near = 0.05;
    this.lantern.shadow.camera.far = 2;
    this.world.createTransformEntity(this.lantern, { persistent: true });

    this.glowMat = new MeshBasicMaterial({
      map: radialTexture(),
      color: PALETTE.amber,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.glow = flatDisc(TUNING.lanternRadius * 1.35, this.glowMat);
    this.glow.renderOrder = 5;
    root.add(this.glow);

    this.ringMat = new MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0.95, toneMapped: false, depthWrite: false });
    this.ring = new Mesh(new RingGeometry(0.0115, 0.0145, 40), this.ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    root.add(this.ring);

    const tag = (w: number, h: number, style: (typeof TAG_STYLES)[keyof typeof TAG_STYLES], x: number, y: number, z: number) => {
      const t = new PaperTag(w, h, style);
      t.mesh.position.set(x, y, z);
      root.add(t.mesh);
      return t;
    };
    this.tags = {
      intro: tag(0.12, 0.032, TAG_STYLES.hint, 0, 0.115, -0.03),
      look: tag(0.1, 0.028, TAG_STYLES.hint, 0, 0.04, 0.15),
      pinch: tag(0.1, 0.028, TAG_STYLES.hint, 0, 0.06, 0),
      question: tag(0.13, 0.034, TAG_STYLES.verdict, 0, 0.078, 0.105),
      verdict: tag(0.11, 0.032, TAG_STYLES.verdict, 0, 0.098, 0.105),
      stars: tag(0.1, 0.03, TAG_STYLES.verdict, 0, 0.066, 0.105),
      replay: tag(0.12, 0.03, TAG_STYLES.hint, 0, 0.115, -0.03),
      again: tag(0.14, 0.03, TAG_STYLES.hint, 0, 0.13, 0.105),
    };
    this.tags.look.set('Look around');
    this.tags.pinch.set('Pinch to mark');
    this.tags.question.set('Who took the pie?');
    this.tags.replay.set('What really happened');
    this.tags.again.set('Pinch for another night');
    this.markTags = {
      mayor: new PaperTag(0.03, 0.022, TAG_STYLES.mark),
      teen: new PaperTag(0.03, 0.022, TAG_STYLES.mark),
      gardener: new PaperTag(0.03, 0.022, TAG_STYLES.mark),
    };
    for (const id of SUSPECT_ORDER) this.figures[id].tagAnchor.add(this.markTags[id].mesh);
    this.tagList = [...Object.values(this.tags), ...Object.values(this.markTags)];
    void loadTagFont().then(() => {
      for (const t of this.tagList) t.redraw();
    });

    const crumbGeo = new CylinderGeometry(TUNING.crumbSize, TUNING.crumbSize * 1.15, 0.0012, 7);
    for (let i = 0; i < CRUMB_POOL; i++) {
      const material = new MeshStandardMaterial({ color: PALETTE.nightFigure, roughness: 0.9 });
      const mesh = new Mesh(crumbGeo, material);
      mesh.visible = false;
      root.add(mesh);
      this.crumbs.push({ mesh, material, lit: 0, active: false });
    }

    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((state) => {
        if (state === VisibilityState.NonImmersive) {
          this.toAttract();
        } else if (state === VisibilityState.Visible) {
          this.paused = false;
          nightAudio.unlock();
        } else {
          this.paused = true;
          nightAudio.suspend();
        }
      }),
      () => this.session?.removeEventListener('selectstart', this.onSelect),
    );
    this.toAttract();

    if (import.meta.env.DEV) {
      // Dev-only test hook (stripped from production builds): lets headless
      // emulator runs speed up the clock and read the game state.
      (window as unknown as { __nightWatch: unknown }).__nightWatch = {
        setSpeed: (speed: number) => {
          this.devSpeed = speed;
        },
        probe: (names: SoundName[]) => Promise.all(names.map((n) => probeSound(n))),
        audioRunning: () => nightAudio.running,
        restart: (night: number) => {
          this.nightIndex = night;
          if (this.placed) this.startNight();
        },
        boardToWorld: (x: number, y: number, z: number) => {
          const v = new Vector3(x, y, z);
          this.town.root.localToWorld(v);
          return v.toArray();
        },
        state: () => ({
          phase: this.phase,
          story: Number(this.story.toFixed(2)),
          night: this.nightIndex,
          culprit: this.plan.def.culprit,
          theft: this.plan.def.theft,
          end: this.plan.end,
          witnessed: this.witnessed,
          caughtInAct: this.caughtInAct,
          accused: this.accused,
          looked: this.looked,
          placed: this.placed,
          lantern: [Number(this.lanternPoint.x.toFixed(3)), Number(this.lanternPoint.z.toFixed(3))],
          lanternStrength: Number(this.lanternStrength.toFixed(2)),
          marks: SUSPECT_ORDER.filter((id) => this.markTags[id].isShown),
          figures: Object.fromEntries(
            ALL_FIGURES.map((id) => {
              const f = this.figures[id];
              return [id, { visible: f.root.visible, x: Number(f.root.position.x.toFixed(3)), z: Number(f.root.position.z.toFixed(3)), lit: Number(f.lit.toFixed(2)) }];
            }),
          ),
        }),
      };
    }
  }

  // ---- Input -------------------------------------------------------------

  private readonly onSelect = (event: XRInputSourceEvent): void => {
    nightAudio.unlock();
    this.selectQueued = true;
    this.selectHasRay = false;
    const source = event.inputSource;
    if (source.targetRayMode !== 'transient-pointer' && source.targetRayMode !== 'gaze') return;
    // On gaze-and-pinch devices, select exactly what the eyes were on.
    const ref = this.world.renderer.xr.getReferenceSpace();
    const pose = ref ? event.frame.getPose(source.targetRaySpace, ref) : undefined;
    if (pose == null) return;
    const { position: p, orientation: q } = pose.transform;
    this.selectO.set(p.x, p.y, p.z);
    this.selectD.set(0, 0, -1).applyQuaternion(this.tmpQ.set(q.x, q.y, q.z, q.w));
    this.selectHasRay = true;
  };

  private syncSession(): void {
    const session = (this.world.session as XRSession | undefined) ?? null;
    if (session === this.session) return;
    this.session?.removeEventListener('selectstart', this.onSelect);
    this.session = session;
    session?.addEventListener('selectstart', this.onSelect);
  }

  /** A continuous gaze input source (eye tracking) if the device exposes one. */
  private readGazeRay(): boolean {
    const session = this.session;
    const frame = this.world.xrFrame as XRFrame | undefined;
    if (session == null || frame == null) return false;
    const ref = this.world.renderer.xr.getReferenceSpace();
    if (ref == null) return false;
    const sources = session.inputSources;
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (source.targetRayMode !== 'gaze') continue;
      const pose = frame.getPose(source.targetRaySpace, ref);
      if (pose == null) continue;
      const { position: p, orientation: q } = pose.transform;
      this.gazeO.set(p.x, p.y, p.z);
      this.gazeD.set(0, 0, -1).applyQuaternion(this.tmpQ.set(q.x, q.y, q.z, q.w));
      return true;
    }
    return false;
  }

  /** Intersects a world-space ray with the board top; result in board space. */
  private rayToBoard(origin: Vector3, dir: Vector3, out: Vector3): boolean {
    this.inv.copy(this.town.root.matrixWorld).invert();
    this.localO.copy(origin).applyMatrix4(this.inv);
    this.localD.copy(dir).transformDirection(this.inv);
    if (this.localD.y > -0.02) return false;
    const t = -this.localO.y / this.localD.y;
    if (t <= 0 || t > 3) return false;
    out.copy(this.localO).addScaledVector(this.localD, t);
    const hw = TUNING.boardWidth / 2;
    const hd = TUNING.boardDepth / 2;
    const inside = Math.abs(out.x) <= hw + 0.03 && Math.abs(out.z) <= hd + 0.03;
    out.set(clamp(out.x, -hw, hw), 0, clamp(out.z, -hd, hd));
    return inside;
  }

  private boardToWorld(x: number, y: number, z: number, out: Pos): Pos {
    this.tmp.set(x, y, z);
    this.town.root.localToWorld(this.tmp);
    out.x = this.tmp.x;
    out.y = this.tmp.y;
    out.z = this.tmp.z;
    return out;
  }

  private figureWorld(fig: Figure): Pos {
    return this.boardToWorld(fig.root.position.x, 0.02, fig.root.position.z, this.posA);
  }

  // ---- Phases ------------------------------------------------------------

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
    this.guardUntil = this.clock + 0.35;
  }

  private toAttract(): void {
    this.setPhase('attract');
    this.placed = false;
    this.paused = false;
    nightAudio.stopAmbience();
    const root = this.town.root;
    root.position.set(0, 0.74, -0.12);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);
    this.world.camera.lookAt(0, 0.74, -0.1);
    this.resetNightState();
    this.daylight = this.daylightGoal = 0.45;
    this.windowsOn = 1;
    this.lanternGoal = 0;
    this.lanternStrength = 0;
    for (const t of Object.values(this.tags)) t.hide();
    SUSPECT_ORDER.forEach((id, i) => this.placeAt(this.figures[id], SPOTS.lineup[i], 0));
    this.placeAt(this.figures.baker, SPOTS.bakerStand, 0);
    this.placeAt(this.figures.cat, SPOTS.catSit, 0.6);
  }

  private placeAt(fig: Figure, p: Vec2, heading: number): void {
    fig.root.visible = true;
    fig.root.position.set(p[0], 0, p[1]);
    fig.heading = heading;
  }

  private placeBoard(): void {
    const f = this.tmp.copy(this.fwd);
    f.y = 0;
    if (f.lengthSq() < 1e-4) f.set(0, 0, -1);
    f.normalize();
    const root = this.town.root;
    root.position.copy(this.viewer).addScaledVector(f, TUNING.boardForward);
    root.position.y = this.viewer.y - TUNING.boardBelowEyes;
    root.rotation.set(0, Math.atan2(-f.x, -f.z), 0);
    root.updateMatrixWorld(true);
    this.placed = true;
    nightAudio.setCenter(this.boardToWorld(0, 0.02, 0, this.posA));
  }

  private resetNightState(): void {
    this.plan = planNight(NIGHTS[this.nightIndex % NIGHTS.length], TUNING.nightDuration);
    this.story = 0;
    this.clatterFired = false;
    this.theftFired = false;
    this.doorEvents = [];
    for (const id of ALL_FIGURES) {
      for (const m of doorMoments(this.plan.routes[id])) this.doorEvents.push({ t: m.t, p: m.p, fired: false });
    }
    this.nextCrumbAt = this.plan.crumbStart;
    for (const c of this.crumbs) {
      c.active = false;
      c.mesh.visible = false;
      c.mesh.scale.setScalar(1);
    }
    this.returnPie();
    this.town.pie.visible = true;
    this.binTipAt = -10;
    this.town.bin.rotation.set(0, 0, 0);
    this.town.bin.position.set(SPOTS.bin[0], 0, SPOTS.bin[1]);
    for (const id of SUSPECT_ORDER) this.markTags[id].hide();
    this.markStep = 0;
    this.witnessed = false;
    this.caughtInAct = false;
    this.accused = null;
    this.looked = null;
    this.ring.visible = false;
    this.pinchFor = null;
    this.revealed.clear();
    for (const id of ALL_FIGURES) {
      const fig = this.figures[id];
      fig.lit = 0;
      fig.inLight = false;
    }
    this.town.lanternProp.visible = false;
    this.town.moon.visible = true;
    this.town.sun.visible = false;
  }

  private returnPie(): void {
    const pie = this.town.pie;
    this.town.root.add(pie);
    pie.position.set(this.town.pieHome[0], PIE_Y, this.town.pieHome[1]);
    pie.scale.setScalar(1);
  }

  /** Puts the pie in the culprit's hand; `reveal` enlarges it for the verdict. */
  private pieToCulprit(reveal: boolean): void {
    const culprit = this.figures[this.plan.def.culprit];
    culprit.hand.add(this.town.pie);
    this.town.pie.position.set(0, reveal ? -0.001 : -0.003, 0);
    this.town.pie.scale.setScalar(reveal ? 1.7 : 1);
    this.town.pie.visible = true;
  }

  private startNight(): void {
    this.resetNightState();
    this.daylight = 0.45;
    this.daylightGoal = 0;
    this.windowsOn = 1;
    this.lanternGoal = 0;
    this.lanternPoint.set(0, 0, 0.04);
    for (const t of Object.values(this.tags)) t.hide();
    this.tags.intro.set(this.nightIndex === 0 ? 'Night falls...' : `Night ${this.nightIndex + 1}`).show(this.clock);
    nightAudio.startNight();
    this.setPhase('dusk');
  }

  private updateDusk(): void {
    const d = TUNING.duskDuration;
    const count = this.town.windows.length;
    for (const w of this.town.windows) {
      const offAt = 0.5 + (w.order / (count + 1)) * (d - 1.2);
      const on = this.phaseTime < offAt;
      const was = w.material.emissiveIntensity > 0.5;
      w.material.emissiveIntensity = on ? 1.2 : 0;
      if (was && !on) {
        w.mesh.getWorldPosition(this.tmp);
        nightAudio.windowClick(this.tmp);
      }
    }
    this.windowsOn = this.phaseTime < d - 0.6 ? 1 : 0;
    if (this.phaseTime > d - 1.6) this.lanternGoal = 1;
    this.advanceStory(this.dtCache, 1);
    if (this.phaseTime >= d) {
      this.tags.intro.hide();
      if (!this.hints.lookDone) this.tags.look.show(this.clock);
      this.setPhase('night');
    }
  }

  private updateNight(): void {
    this.lanternGoal = 1;
    this.advanceStory(this.dtCache, 1);
    if (!this.hints.lookDone && (this.revealed.size >= 2 || this.story > 22)) {
      this.hints.lookDone = true;
      this.tags.look.hide();
    }
    if (this.pinchFor && this.clock - this.pinchShownAt > 6) {
      this.tags.pinch.hide();
      this.pinchFor = null;
    }
    const theft = this.plan.def.theft;
    if (Math.abs(this.story - theft) <= TUNING.witnessWindow && this.lanternStrength > 0.5) {
      const dx = this.lanternPoint.x - SPOTS.sill[0];
      const dz = this.lanternPoint.z - SPOTS.sill[1];
      if (Math.hypot(dx, dz) < TUNING.witnessRadius) this.witnessed = true;
    }
    if (this.story >= this.plan.end) this.startDawn();
  }

  private startDawn(): void {
    this.setPhase('dawn');
    this.lanternGoal = 0;
    this.daylightGoal = 1;
    this.tags.pinch.hide();
    this.pinchFor = null;
    this.town.pie.visible = false;
    for (const id of SUSPECT_ORDER) {
      const fig = this.figures[id];
      const home = HOUSES[id].door;
      this.lineupFrom.set(id, fig.root.visible ? [fig.root.position.x, fig.root.position.z] : home);
    }
    nightAudio.dawn();
  }

  private updateDawn(): void {
    const u = this.phaseTime / TUNING.dawnDuration;
    this.windowsOn = u > 0.35 ? 1 : 0;
    const walkU = (this.phaseTime - 0.5) / TUNING.lineupWalkTime;
    SUSPECT_ORDER.forEach((id, i) => {
      const fig = this.figures[id];
      const from = this.lineupFrom.get(id)!;
      const to = SPOTS.lineup[i];
      const e = smooth(walkU);
      fig.root.visible = walkU > 0 || fig.root.visible;
      fig.root.position.set(from[0] + (to[0] - from[0]) * e, 0, from[1] + (to[1] - from[1]) * e);
    });
    this.placeAt(this.figures.baker, SPOTS.bakerStand, -0.6);
    this.placeAt(this.figures.cat, SPOTS.catSit, 0.4);
    if (this.phaseTime >= Math.max(TUNING.dawnDuration, 0.5 + TUNING.lineupWalkTime + 0.2)) {
      this.setPhase('lineup');
      this.tags.question.show(this.clock);
    }
  }

  private updateLineup(): void {
    let best: SuspectId | null = null;
    let bestD: number = TUNING.lineupPickRadius;
    for (const id of SUSPECT_ORDER) {
      const p = this.figures[id].root.position;
      const d = Math.hypot(p.x - this.lanternRaw.x, p.z - this.lanternRaw.z);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    if (best !== this.looked) {
      this.looked = best;
      if (best) nightAudio.knock(this.figureWorld(this.figures[best]), SUSPECT_ORDER.indexOf(best));
    }
    this.ring.visible = this.looked != null;
    if (this.looked) {
      const p = this.figures[this.looked].root.position;
      this.ring.position.set(p.x, 0.003, p.z);
      this.ring.scale.setScalar(1 + Math.sin(this.clock * 6) * 0.06);
    }
  }

  private accuse(id: SuspectId): void {
    this.accused = id;
    const culpritId = this.plan.def.culprit;
    const correct = id === culpritId;
    const culprit = this.figures[culpritId];
    this.pieToCulprit(true);
    if (correct) {
      this.figures[id].hop(this.clock);
      this.ringMat.color.setHex(PALETTE.amber);
    } else {
      this.figures[id].wobble(this.clock);
      culprit.hop(this.clock + 0.35);
      this.ringMat.color.setHex(PALETTE.vermilion);
      const p = culprit.root.position;
      this.ring.position.set(p.x, 0.003, p.z);
    }
    this.ring.visible = !correct;
    this.tags.question.hide();
    this.tags.verdict.set(correct ? 'Got them!' : 'Not them...').show(this.clock);
    this.tags.stars.set('', null, [correct, this.witnessed, this.caughtInAct]).show(this.clock + 0.08);
    nightAudio.verdict(correct);
    this.setPhase('verdict');
  }

  private startReplay(): void {
    this.setPhase('replay');
    const theft = this.plan.def.theft;
    this.story = theft - TUNING.replayLead;
    this.replayEnd = theft + TUNING.replayTail;
    this.clatterFired = this.story > theft - 5;
    this.theftFired = false;
    for (const e of this.doorEvents) e.fired = e.t <= this.story;
    this.binTipAt = -10;
    this.town.bin.rotation.set(0, 0, 0);
    this.town.bin.position.set(SPOTS.bin[0], 0, SPOTS.bin[1]);
    this.returnPie();
    this.town.pie.visible = true;
    for (const c of this.crumbs) {
      c.active = false;
      c.mesh.visible = false;
    }
    this.nextCrumbAt = this.plan.crumbStart;
    this.daylightGoal = 0.12;
    this.lanternGoal = 1;
    this.ring.visible = false;
    this.tags.verdict.hide();
    this.tags.stars.hide();
    this.tags.replay.show(this.clock);
  }

  private endNight(): void {
    this.setPhase('end');
    this.guardUntil = this.clock + TUNING.restartGuard;
    this.daylightGoal = 1;
    this.lanternGoal = 0;
    this.tags.replay.hide();
    SUSPECT_ORDER.forEach((id, i) => this.placeAt(this.figures[id], SPOTS.lineup[i], 0));
    this.pieToCulprit(true);
    this.placeAt(this.figures.baker, SPOTS.bakerStand, -0.6);
    this.placeAt(this.figures.cat, SPOTS.catSit, 0.4);
    const correct = this.accused === this.plan.def.culprit;
    this.tags.verdict.show(this.clock);
    this.tags.stars.set('', null, [correct, this.witnessed, this.caughtInAct]).show(this.clock + 0.08);
    this.tags.again.show(this.clock + 0.3);
    this.town.lanternProp.visible = true;
  }

  // ---- Story clock and events -------------------------------------------

  private dtCache = 0;

  private advanceStory(dt: number, speed: number): void {
    const prev = this.story;
    this.story += dt * speed;
    const now = this.story;
    for (const e of this.doorEvents) {
      if (!e.fired && prev < e.t && now >= e.t) {
        e.fired = true;
        nightAudio.doorCreak(this.boardToWorld(e.p[0], 0.012, e.p[1], this.posA));
      }
    }
    const theft = this.plan.def.theft;
    if (!this.clatterFired && prev < theft - 5 && now >= theft - 5) {
      this.clatterFired = true;
      this.binTipAt = this.clock;
      nightAudio.clatter(this.boardToWorld(SPOTS.bin[0], 0.01, SPOTS.bin[1], this.posA));
    }
    if (!this.theftFired && prev < theft && now >= theft) {
      this.theftFired = true;
      this.pieToCulprit(false);
      nightAudio.incident(this.boardToWorld(SPOTS.pieOnSill[0], PIE_Y, SPOTS.pieOnSill[1], this.posA));
    }
    if (now >= this.plan.crumbStart && now <= this.plan.crumbEnd && now >= this.nextCrumbAt) {
      this.nextCrumbAt += TUNING.crumbEvery;
      this.dropCrumb();
    }
  }

  private dropCrumb(): void {
    let crumb: Crumb | null = null;
    for (const c of this.crumbs) {
      if (!c.active) {
        crumb = c;
        break;
      }
    }
    if (crumb == null) return;
    const p = this.figures[this.plan.def.culprit].root.position;
    crumb.active = true;
    crumb.lit = 0;
    crumb.mesh.visible = true;
    crumb.mesh.scale.setScalar(0.8 + Math.random() * 0.5);
    crumb.mesh.position.set(p.x + (Math.random() - 0.5) * 0.006, 0.0022, p.z + (Math.random() - 0.5) * 0.006);
    crumb.mesh.rotation.y = Math.random() * Math.PI;
  }

  // ---- Marks ---------------------------------------------------------------

  private pickSuspect(point: Vector3, radius: number): SuspectId | null {
    let best: SuspectId | null = null;
    let bestD: number = radius;
    for (const id of SUSPECT_ORDER) {
      const fig = this.figures[id];
      if (!fig.root.visible) continue;
      const d = Math.hypot(fig.root.position.x - point.x, fig.root.position.z - point.z);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    return best;
  }

  private iconAt(x: number, z: number): TagIcon {
    const near = (p: Vec2, r: number) => Math.hypot(x - p[0], z - p[1]) < r;
    if (near(SPOTS.sill, 0.045)) return 'pie';
    if (near(SPOTS.well, 0.035)) return 'well';
    if (near(SPOTS.bench, 0.04)) return 'bench';
    if (near(SPOTS.bin, 0.04)) return 'bin';
    for (const id of SUSPECT_ORDER) if (near(HOUSES[id].door, 0.028)) return 'door';
    if (near(SPOTS.bakeryDoor, 0.03)) return 'door';
    return 'street';
  }

  private tryMark(): void {
    let point: Vector3 = this.lanternPoint;
    if (this.selectHasRay && this.rayToBoard(this.selectO, this.selectD, this.tmp)) point = this.tmp;
    let id = this.pickSuspect(point, TUNING.markPickRadius);
    if (id == null && point !== this.lanternRaw) id = this.pickSuspect(this.lanternRaw, TUNING.markPickRadius);
    if (id == null) {
      this.glowPulseAt = this.clock;
      nightAudio.miss(this.boardToWorld(this.lanternPoint.x, 0.01, this.lanternPoint.z, this.posA));
      return;
    }
    const fig = this.figures[id];
    const p = fig.root.position;
    this.markTags[id].set('', this.iconAt(p.x, p.z)).show(this.clock);
    fig.lit = 1;
    fig.hop(this.clock);
    nightAudio.snap(this.figureWorld(fig), this.markStep);
    this.markStep = Math.min(this.markStep + 1, 5);
    this.hints.pinchDone = true;
    this.tags.pinch.hide();
    this.pinchFor = null;
    const theft = this.plan.def.theft;
    if (
      id === this.plan.def.culprit &&
      Math.abs(this.story - theft) <= TUNING.inTheActWindow &&
      Math.hypot(p.x - SPOTS.sill[0], p.z - SPOTS.sill[1]) <= TUNING.inTheActRadius
    ) {
      this.caughtInAct = true;
    }
  }

  private handleSelect(): void {
    if (this.clock < this.guardUntil) return;
    switch (this.phase) {
      case 'night':
        this.tryMark();
        break;
      case 'lineup':
        if (this.looked) this.accuse(this.looked);
        else nightAudio.miss(this.boardToWorld(this.lanternRaw.x, 0.01, this.lanternRaw.z, this.posA));
        break;
      case 'replay':
        this.endNight();
        break;
      case 'end':
        this.nightIndex += 1;
        this.startNight();
        break;
      default:
        break;
    }
  }

  // ---- Frame -----------------------------------------------------------------

  update(delta: number): void {
    const dt = Math.min(delta, 0.05) * this.devSpeed;
    this.dtCache = dt;
    this.clock += dt;
    this.syncSession();

    const immersive = this.world.visibilityState.peek() !== VisibilityState.NonImmersive;
    const head = immersive ? this.player.head : this.world.camera;
    head.getWorldPosition(this.viewer);
    head.getWorldQuaternion(this.headQuat);
    this.fwd.set(0, 0, -1).applyQuaternion(this.headQuat);
    this.up.set(0, 1, 0).applyQuaternion(this.headQuat);

    if (immersive && !this.placed && this.viewer.y > 0.2) {
      this.placeBoard();
      this.startNight();
    }

    if (!this.paused) {
      this.phaseTime += dt;
      this.aimLantern();
      if (this.selectQueued) {
        this.selectQueued = false;
        this.handleSelect();
      }
      switch (this.phase) {
        case 'dusk':
          this.updateDusk();
          break;
        case 'night':
          this.updateNight();
          break;
        case 'dawn':
          this.updateDawn();
          break;
        case 'lineup':
          this.updateLineup();
          break;
        case 'verdict':
          if (this.phaseTime >= TUNING.verdictHold) this.startReplay();
          break;
        case 'replay':
          this.advanceStory(dt, TUNING.replaySpeed);
          if (this.story >= this.replayEnd) this.endNight();
          break;
        default:
          break;
      }
      this.updateWorld(dt);
      this.updateFigures(dt);
      this.updateCrumbs(dt);
    }
    this.selectQueued = false;

    for (const t of this.tagList) t.update(this.clock, dt, this.viewer);
    if (this.pinchFor) {
      const p = this.figures[this.pinchFor].root.position;
      this.tags.pinch.mesh.position.set(clamp(p.x + 0.045, -0.17, 0.17), 0.062, p.z);
    }

    this.fwdPos.x = this.fwd.x;
    this.fwdPos.y = this.fwd.y;
    this.fwdPos.z = this.fwd.z;
    this.upPos.x = this.up.x;
    this.upPos.y = this.up.y;
    this.upPos.z = this.up.z;
    nightAudio.setListener(this.viewer, this.fwdPos, this.upPos);
    nightAudio.tick(dt, this.plan ? this.story / this.plan.end : 0);
  }

  private aimLantern(): void {
    if (this.phase === 'attract') return;
    const useGaze = TUNING.lanternUsesEyeGaze && this.readGazeRay();
    this.lanternOnBoard = useGaze
      ? this.rayToBoard(this.gazeO, this.gazeD, this.lanternRaw)
      : this.rayToBoard(this.viewer, this.fwd, this.lanternRaw);
  }

  private updateWorld(dt: number): void {
    // Light follows the gaze (or the culprit during the replay).
    if (this.phase === 'replay') {
      const p = this.figures[this.plan.def.culprit].root.position;
      this.tmp.set(p.x, 0, p.z);
      this.lanternPoint.lerp(this.tmp, 1 - Math.exp(-8 * dt));
    } else if (this.lanternOnBoard) {
      this.lanternPoint.lerp(this.lanternRaw, 1 - Math.exp(-TUNING.lanternFollowRate * dt));
    }
    const goal = this.lanternGoal * (this.lanternOnBoard || this.phase === 'replay' ? 1 : 0.35);
    this.lanternStrength += (goal - this.lanternStrength) * (1 - Math.exp(-TUNING.lanternFadeRate * dt));

    const pulseAge = this.clock - this.glowPulseAt;
    const pulse = pulseAge < 0.25 ? Math.sin((pulseAge / 0.25) * Math.PI) * 0.35 : 0;
    this.glow.position.set(this.lanternPoint.x, 0.0026, this.lanternPoint.z);
    this.glow.scale.setScalar(1 + pulse * 0.4);
    this.glowMat.opacity = TUNING.glowOpacity * this.lanternStrength * (1 + pulse);
    this.glow.visible = this.lanternStrength > 0.02;

    this.lanternTarget.position.copy(this.lanternPoint);
    this.town.root.localToWorld(this.lanternTarget.position);
    if (this.phase === 'replay') {
      this.tmp.set(0, 0.45, 0.25);
      this.town.root.localToWorld(this.tmp);
      this.lantern.position.copy(this.tmp);
    } else {
      this.lantern.position.copy(this.viewer);
      this.lantern.position.y += 0.05;
    }
    const dist = Math.max(0.15, this.lantern.position.distanceTo(this.lanternTarget.position));
    this.lantern.angle = Math.atan((TUNING.lanternRadius * 1.3) / dist);
    this.lantern.intensity = TUNING.lanternIntensity * this.lanternStrength;
    this.lantern.visible = this.lanternStrength > 0.01;

    // Sky, lamps and windows.
    this.daylight += (this.daylightGoal - this.daylight) * (1 - Math.exp(-1.6 * dt));
    const d = this.daylight;
    this.hemi.intensity = 0.24 + d * 1.0;
    this.hemi.color.copy(this.nightColor).lerp(this.dayColor, d);
    this.hemi.groundColor.copy(this.nightGround).lerp(this.dayGround, d);
    this.moonLight.intensity = 0.58 * (1 - d);
    this.sunLight.intensity = 1.5 * smooth((d - 0.3) / 0.7);
    if (this.phase !== 'dusk') {
      for (const w of this.town.windows) w.material.emissiveIntensity = this.windowsOn * 1.2 * (1 - d * 0.5);
    }
    for (const b of this.town.lampBulbs) b.emissiveIntensity = this.windowsOn * 1.4 * (1 - d * 0.6);

    const progress = this.plan ? clamp(this.story / this.plan.end, 0, 1) : 0;
    const moon = this.town.moon;
    const nightish = this.phase === 'dusk' || this.phase === 'night' || this.phase === 'replay' || this.phase === 'attract';
    moon.visible = nightish;
    moon.position.set(-0.2 + progress * 0.4, 0.12 + Math.sin(progress * Math.PI) * 0.06, -0.175);
    const sun = this.town.sun;
    sun.visible = !nightish;
    const sunRise = this.phase === 'dawn' ? smooth(this.phaseTime / TUNING.dawnDuration) : 1;
    sun.position.set(-0.19, 0.03 + sunRise * 0.11, -0.175);

    // The cat's bin tips over when the cat bumps it.
    const tipAge = this.clock - this.binTipAt;
    if (tipAge >= 0 && tipAge < 1) {
      const u = clamp(tipAge / 0.3, 0, 1);
      const bounce = u < 1 ? u * u : 1 + Math.sin(clamp((tipAge - 0.3) / 0.25, 0, 1) * Math.PI) * -0.06;
      const angle = -1.45 * Math.min(bounce, 1.06);
      this.town.bin.rotation.set(0, 0, angle);
      this.town.bin.position.set(SPOTS.bin[0] + Math.sin(-angle) * 0.0065, Math.sin(-angle) * 0.0055, SPOTS.bin[1]);
    }

    // The lantern prop flickers when it invites another night.
    if (this.town.lanternProp.visible) {
      this.town.lanternFlame.emissiveIntensity = 1.3 + Math.sin(this.clock * 13) * 0.15 + Math.sin(this.clock * 5.3) * 0.12;
    }
  }

  private updateFigures(dt: number): void {
    const storyDriven = this.phase === 'dusk' || this.phase === 'night' || this.phase === 'replay';
    const lanternLive = this.lanternStrength > 0.4 && (storyDriven || this.phase === 'dawn');
    const reveal = this.phase === 'dusk' || this.phase === 'night' || this.phase === 'replay';
    const daylight = reveal ? Math.min(this.daylight, 0.2) : this.daylight;
    for (const id of ALL_FIGURES) {
      const fig = this.figures[id];
      let moving = false;
      let heading = fig.heading;
      if (storyDriven) {
        sampleRoute(this.plan.routes[id], this.story, this.sample);
        fig.root.visible = !this.sample.inside;
        fig.root.position.set(this.sample.x, 0, this.sample.z);
        moving = this.sample.moving;
        if (moving) heading = this.sample.heading;
      } else if (this.phase === 'dawn' && SUSPECT_ORDER.includes(id as SuspectId)) {
        const i = SUSPECT_ORDER.indexOf(id as SuspectId);
        const walkU = (this.phaseTime - 0.5) / TUNING.lineupWalkTime;
        moving = walkU > 0 && walkU < 1;
        const to = SPOTS.lineup[i];
        heading = moving ? Math.atan2(to[0] - fig.root.position.x, to[1] - fig.root.position.z) : 0;
      } else if (SUSPECT_ORDER.includes(id as SuspectId)) {
        heading = 0;
      }

      if (reveal && fig.root.visible) {
        const dx = fig.root.position.x - this.lanternPoint.x;
        const dz = fig.root.position.z - this.lanternPoint.z;
        const radius = TUNING.lanternRadius + (fig.inLight ? TUNING.revealHysteresis : 0);
        const inLight = lanternLive && Math.hypot(dx, dz) < radius;
        if (inLight && !fig.inLight) this.onReveal(fig);
        fig.inLight = inLight;
        const target = inLight ? 1 : 0;
        const rate = inLight ? TUNING.revealRiseRate : TUNING.revealFallRate;
        fig.lit += (target - fig.lit) * (1 - Math.exp(-rate * dt));
        if (
          moving &&
          this.phase !== 'replay' &&
          Math.hypot(dx, dz) < TUNING.footstepAudibleRadius &&
          this.clock - fig.lastStep > TUNING.footstepEvery
        ) {
          fig.lastStep = this.clock;
          nightAudio.footstep(this.figureWorld(fig));
        }
      } else if (!reveal) {
        fig.inLight = false;
      }
      fig.animate(this.clock, moving, dt, heading);
      fig.applyColours(daylight);
    }
  }

  private onReveal(fig: Figure): void {
    this.revealed.add(fig.id);
    if (this.phase === 'night' && this.clock - fig.lastShimmer > TUNING.shimmerCooldown) {
      fig.lastShimmer = this.clock;
      nightAudio.shimmer(this.figureWorld(fig), ALL_FIGURES.indexOf(fig.id));
    }
    const isSuspect = SUSPECT_ORDER.includes(fig.id as SuspectId);
    if (
      isSuspect &&
      this.phase === 'night' &&
      !this.hints.pinchDone &&
      this.hints.pinchShows < 3 &&
      this.pinchFor == null
    ) {
      this.pinchFor = fig.id as SuspectId;
      this.pinchShownAt = this.clock;
      this.hints.pinchShows += 1;
      this.tags.pinch.show(this.clock);
    }
  }

  private updateCrumbs(dt: number): void {
    const eaten = this.phase === 'dawn' || this.phase === 'lineup' || this.phase === 'verdict' || this.phase === 'end';
    for (const c of this.crumbs) {
      if (!c.active) continue;
      if (eaten) {
        // Birds take the crumbs at sunrise: the trail only helps at night.
        const s = c.mesh.scale.x - dt * 1.2;
        if (s <= 0.02) {
          c.active = false;
          c.mesh.visible = false;
        } else {
          c.mesh.scale.setScalar(s);
        }
        continue;
      }
      const d = Math.hypot(c.mesh.position.x - this.lanternPoint.x, c.mesh.position.z - this.lanternPoint.z);
      const target = this.lanternStrength > 0.4 && d < TUNING.lanternRadius ? 1 : 0;
      c.lit += (target - c.lit) * (1 - Math.exp(-(target ? 12 : 1.5) * dt));
      c.material.color.setHex(PALETTE.nightFigure).lerp(this.crumbDay, c.lit);
      c.material.emissive.setHex(PALETTE.amber).multiplyScalar(c.lit * 0.25);
    }
  }

  private readonly crumbDay = new Color(PALETTE.cream);
}
