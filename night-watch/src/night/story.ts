/**
 * The night as data. Everything here is hand-authored: town spots, three
 * night variants that swap who is the culprit, and route templates that turn
 * a variant into timed keyframes for every figure.
 *
 * Coordinates are board-local metres: x to the right, z toward the player,
 * y up from the board's top surface. Times are story-clock seconds, starting
 * at dusk.
 */

export type Vec2 = readonly [number, number];

export interface Key {
  t: number;
  p: Vec2;
  /** From this key until the next one the figure is indoors and hidden. */
  inside?: boolean;
}

export type SuspectId = 'mayor' | 'teen' | 'gardener';
export type FigureId = SuspectId | 'baker' | 'cat';

export interface SuspectLook {
  coat: number;
  hat: number;
  trim: number;
}

export const STREET_Z = -0.04;

export const SPOTS = {
  sill: [0.142, 0.012] as Vec2,
  pieOnSill: [0.159, 0.012] as Vec2,
  bakeryDoor: [0.158, 0.056] as Vec2,
  bakerStand: [0.14, 0.038] as Vec2,
  plaza: [0.06, -0.008] as Vec2,
  plazaBack: [0.052, 0.002] as Vec2,
  pieWalkBy: [0.139, 0.02] as Vec2,
  bakeryCorner: [0.118, -0.012] as Vec2,
  well: [0.012, 0.046] as Vec2,
  bench: [-0.15, 0.066] as Vec2,
  bin: [-0.198, -0.034] as Vec2,
  catHome: [-0.17, 0.048] as Vec2,
  catWander: [-0.08, 0.072] as Vec2,
  catByBin: [-0.184, -0.026] as Vec2,
  catSit: [-0.118, 0.09] as Vec2,
  lineup: [
    [-0.075, 0.118],
    [0, 0.118],
    [0.075, 0.118],
  ] as Vec2[],
  lantern: [0.165, 0.128] as Vec2,
} as const;

export const HOUSES: Record<
  SuspectId,
  { center: Vec2; size: Vec2; height: number; door: Vec2; roof: 'red' | 'teal' | 'plum' }
> = {
  teen: { center: [-0.15, -0.112], size: [0.07, 0.056], height: 0.05, door: [-0.15, -0.078], roof: 'teal' },
  mayor: { center: [-0.025, -0.114], size: [0.092, 0.062], height: 0.062, door: [-0.025, -0.077], roof: 'plum' },
  gardener: { center: [0.095, -0.116], size: [0.068, 0.05], height: 0.046, door: [0.095, -0.085], roof: 'red' },
};

export const BAKERY = {
  center: [0.19, 0.032] as Vec2,
  size: [0.05, 0.078] as Vec2,
  height: 0.052,
};

export const SUSPECT_LOOKS: Record<SuspectId, SuspectLook> = {
  mayor: { coat: 0x6b3fa0, hat: 0x2b2233, trim: 0xd4a93c },
  teen: { coat: 0xf2c230, hat: 0x2f6fb0, trim: 0x2f6fb0 },
  gardener: { coat: 0x2e8b83, hat: 0xd9c58c, trim: 0x7a5a2e },
};

export const SUSPECT_ORDER: SuspectId[] = ['mayor', 'teen', 'gardener'];

export interface NightDef {
  id: string;
  culprit: SuspectId;
  herring: SuspectId;
  neutral: SuspectId;
  /** Story time of the theft, in seconds. */
  theft: number;
}

export const NIGHTS: NightDef[] = [
  { id: 'night-1', culprit: 'mayor', herring: 'teen', neutral: 'gardener', theft: 46 },
  { id: 'night-2', culprit: 'gardener', herring: 'mayor', neutral: 'teen', theft: 54 },
  { id: 'night-3', culprit: 'teen', herring: 'gardener', neutral: 'mayor', theft: 40 },
];

export type StoryEventKind = 'clatter' | 'theft';

export interface StoryEvent {
  t: number;
  kind: StoryEventKind;
}

export interface NightPlan {
  def: NightDef;
  routes: Record<FigureId, Key[]>;
  events: StoryEvent[];
  /** Crumbs are dropped by the culprit between these story times. */
  crumbStart: number;
  crumbEnd: number;
  /** Story time at which dawn begins. */
  end: number;
}

const street = (door: Vec2): Vec2 => [door[0], STREET_Z];

function culpritRoute(door: Vec2, theft: number): Key[] {
  return [
    { t: 0, p: door, inside: true },
    { t: theft - 14, p: door },
    { t: theft - 12.6, p: street(door) },
    { t: theft - 6, p: SPOTS.plaza },
    { t: theft - 2.2, p: SPOTS.plaza },
    { t: theft - 0.3, p: SPOTS.sill },
    { t: theft + 0.7, p: SPOTS.sill },
    { t: theft + 3.6, p: SPOTS.plazaBack },
    { t: theft + 6.4, p: street(door) },
    { t: theft + 7.4, p: door, inside: true },
  ];
}

function herringRoute(door: Vec2, theft: number): Key[] {
  return [
    { t: 0, p: door, inside: true },
    { t: theft - 22, p: door },
    { t: theft - 20.6, p: street(door) },
    { t: theft - 11.5, p: SPOTS.bakeryCorner },
    { t: theft - 9.2, p: SPOTS.pieWalkBy },
    { t: theft - 7.9, p: SPOTS.pieWalkBy },
    { t: theft - 5, p: SPOTS.well },
    { t: theft + 14, p: SPOTS.well },
    { t: theft + 19.6, p: street(door) },
    { t: theft + 21, p: door, inside: true },
  ];
}

function neutralRoute(door: Vec2, theft: number): Key[] {
  return [
    { t: 0, p: door, inside: true },
    { t: theft - 30, p: door },
    { t: theft - 28.6, p: street(door) },
    { t: theft - 21, p: SPOTS.bench },
    { t: theft + 15, p: SPOTS.bench },
    { t: theft + 20.4, p: street(door) },
    { t: theft + 21.8, p: door, inside: true },
  ];
}

function bakerRoute(theft: number): Key[] {
  return [
    { t: 0, p: SPOTS.bakeryDoor, inside: true },
    { t: theft + 7, p: SPOTS.bakeryDoor },
    { t: theft + 8.4, p: SPOTS.bakerStand },
    { t: theft + 12.5, p: SPOTS.bakerStand },
    { t: theft + 13.8, p: SPOTS.bakeryDoor, inside: true },
  ];
}

function catRoute(theft: number): Key[] {
  return [
    { t: 0, p: SPOTS.catHome },
    { t: 9, p: SPOTS.catHome },
    { t: 13, p: SPOTS.catWander },
    { t: 17, p: SPOTS.catWander },
    { t: 20, p: SPOTS.catHome },
    { t: theft - 9, p: SPOTS.catHome },
    { t: theft - 6.2, p: SPOTS.catByBin },
    { t: theft - 5, p: SPOTS.catByBin },
    { t: theft - 3.6, p: SPOTS.catSit },
  ];
}

export function planNight(def: NightDef, maxEnd: number): NightPlan {
  const doorOf = (id: SuspectId) => HOUSES[id].door;
  const routes: Record<FigureId, Key[]> = {
    mayor: [],
    teen: [],
    gardener: [],
    baker: bakerRoute(def.theft),
    cat: catRoute(def.theft),
  };
  routes[def.culprit] = culpritRoute(doorOf(def.culprit), def.theft);
  routes[def.herring] = herringRoute(doorOf(def.herring), def.theft);
  routes[def.neutral] = neutralRoute(doorOf(def.neutral), def.theft);

  let lastKey = 0;
  for (const id of Object.keys(routes) as FigureId[]) {
    const keys = routes[id];
    lastKey = Math.max(lastKey, keys[keys.length - 1].t);
  }

  return {
    def,
    routes,
    events: [
      { t: def.theft - 5, kind: 'clatter' },
      { t: def.theft, kind: 'theft' },
    ],
    crumbStart: def.theft + 0.6,
    crumbEnd: def.theft + 7.3,
    end: Math.min(maxEnd, lastKey + 6),
  };
}

export interface RouteSample {
  x: number;
  z: number;
  inside: boolean;
  moving: boolean;
  /** Direction of travel on the board, radians around +y (0 faces +z). */
  heading: number;
}

/** Samples a route at story time t, writing into `out` (no allocation). */
export function sampleRoute(keys: Key[], t: number, out: RouteSample): RouteSample {
  if (keys.length === 0) {
    out.x = 0;
    out.z = 0;
    out.inside = true;
    out.moving = false;
    return out;
  }
  if (t <= keys[0].t) {
    out.x = keys[0].p[0];
    out.z = keys[0].p[1];
    out.inside = keys[0].inside === true;
    out.moving = false;
    return out;
  }
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t < b.t) {
      const span = b.t - a.t;
      const u = span > 0 ? (t - a.t) / span : 1;
      const dx = b.p[0] - a.p[0];
      const dz = b.p[1] - a.p[1];
      out.x = a.p[0] + dx * u;
      out.z = a.p[1] + dz * u;
      out.inside = a.inside === true;
      out.moving = !out.inside && dx * dx + dz * dz > 1e-8;
      if (out.moving) out.heading = Math.atan2(dx, dz);
      return out;
    }
  }
  const last = keys[keys.length - 1];
  out.x = last.p[0];
  out.z = last.p[1];
  out.inside = last.inside === true;
  out.moving = false;
  return out;
}

/** Times at which a figure steps out of or into a building (door creaks). */
export function doorMoments(keys: Key[]): { t: number; p: Vec2 }[] {
  const moments: { t: number; p: Vec2 }[] = [];
  for (let i = 1; i < keys.length; i++) {
    const wasInside = keys[i - 1].inside === true;
    const isInside = keys[i].inside === true;
    if (wasInside !== isInside) moments.push({ t: keys[i].t, p: keys[i].p });
  }
  return moments;
}
