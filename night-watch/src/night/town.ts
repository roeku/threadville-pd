/**
 * Procedural tabletop town: a painted wooden board with a street, a plaza,
 * three suspects' houses, the bakery (with the pie on its windowsill) and a
 * few props. Everything is built from primitives so it loads instantly and
 * reads clearly at 45 cm across.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
} from '@iwsdk/core';
import { PALETTE, TUNING } from './tuning.js';
import { BAKERY, HOUSES, SPOTS, STREET_Z, SuspectId, Vec2 } from './story.js';

const materialCache = new Map<string, MeshStandardMaterial>();

/** Shared matte material for a colour (painted wood look). */
export function paint(color: number, roughness = 0.85): MeshStandardMaterial {
  const key = `${color}:${roughness}`;
  let material = materialCache.get(key);
  if (material == null) {
    material = new MeshStandardMaterial({ color, roughness, metalness: 0 });
    materialCache.set(key, material);
  }
  return material;
}

function mesh(
  geometry: BufferGeometry,
  material: MeshStandardMaterial | MeshBasicMaterial,
  x: number,
  y: number,
  z: number,
  cast = true,
): Mesh {
  const m = new Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/** A gable roof whose ridge runs left to right (along x). */
function gableRoof(width: number, depth: number, height: number): BufferGeometry {
  const hw = width / 2 + 0.004;
  const hd = depth / 2 + 0.005;
  const L1 = [-hw, 0, hd];
  const L2 = [-hw, 0, -hd];
  const L3 = [-hw, height, 0];
  const R1 = [hw, 0, hd];
  const R2 = [hw, 0, -hd];
  const R3 = [hw, height, 0];
  const tris = [
    [L1, R1, R3],
    [L1, R3, L3],
    [R2, L2, L3],
    [R2, L3, R3],
    [L2, L1, L3],
    [R1, R2, R3],
  ];
  const positions: number[] = [];
  for (const tri of tris) for (const v of tri) positions.push(v[0], v[1], v[2]);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export interface WindowLight {
  material: MeshStandardMaterial;
  mesh: Mesh;
  /** Order in which windows switch off at dusk (0 first). */
  order: number;
}

export interface Town {
  root: Group;
  /** Surface height of the board top in board-local space (always 0). */
  windows: WindowLight[];
  lampBulbs: MeshStandardMaterial[];
  pie: Object3D;
  pieHome: Vec2;
  bin: Object3D;
  moon: Object3D;
  sun: Object3D;
  lanternProp: Object3D;
  lanternFlame: MeshStandardMaterial;
}

const roofColor = { red: PALETTE.roofRed, teal: PALETTE.roofTeal, plum: PALETTE.roofPlum };

function addHouse(
  parent: Group,
  id: SuspectId,
  windows: WindowLight[],
  orderStart: number,
): void {
  const h = HOUSES[id];
  const [cx, cz] = h.center;
  const [w, d] = h.size;
  const house = new Group();
  house.name = `house-${id}`;
  house.position.set(cx, 0, cz);
  const wallMat = paint(id === 'mayor' ? PALETTE.wall : PALETTE.wallWarm);
  house.add(mesh(new BoxGeometry(w, h.height, d), wallMat, 0, h.height / 2, 0));
  house.add(
    mesh(gableRoof(w, d, h.height * 0.55), paint(roofColor[h.roof], 0.7), 0, h.height, 0),
  );
  // Door on the front face (toward the player).
  const doorZ = d / 2 + 0.0006;
  house.add(
    mesh(new BoxGeometry(0.012, 0.02, 0.0015), paint(PALETTE.woodDark), 0, 0.01, doorZ, false),
  );
  // Two front windows that glow at dusk and dawn.
  const offsets = [-w * 0.3, w * 0.3];
  offsets.forEach((ox, i) => {
    const material = new MeshStandardMaterial({
      color: 0x1d2033,
      emissive: new Color(PALETTE.window),
      emissiveIntensity: 1,
      roughness: 0.4,
    });
    const pane = mesh(new PlaneGeometry(0.011, 0.011), material, ox, h.height * 0.62, doorZ + 0.0002, false);
    house.add(pane);
    windows.push({ material, mesh: pane, order: orderStart + i });
  });
  // Chimney.
  house.add(
    mesh(
      new BoxGeometry(0.008, 0.02, 0.008),
      paint(PALETTE.woodDark),
      w * 0.28,
      h.height + h.height * 0.35,
      -d * 0.12,
    ),
  );
  parent.add(house);
}

function addBakery(parent: Group, windows: WindowLight[]): { pie: Object3D } {
  const [cx, cz] = BAKERY.center;
  const [w, d] = BAKERY.size;
  const bakery = new Group();
  bakery.name = 'bakery';
  bakery.position.set(cx, 0, cz);
  bakery.add(mesh(new BoxGeometry(w, BAKERY.height, d), paint(PALETTE.cream), 0, BAKERY.height / 2, 0));
  // Roof ridge runs front to back, so rotate a gable roof by 90 degrees.
  const roof = mesh(gableRoof(d, w, BAKERY.height * 0.5), paint(PALETTE.roofBakery, 0.7), 0, BAKERY.height, 0);
  roof.rotation.y = Math.PI / 2;
  bakery.add(roof);
  const westX = -w / 2 - 0.0006;
  // Striped awning over the windowsill (west face, toward the street).
  for (let i = 0; i < 4; i++) {
    const stripe = mesh(
      new BoxGeometry(0.012, 0.0015, 0.008),
      paint(i % 2 === 0 ? PALETTE.vermilion : PALETTE.cream, 0.7),
      westX - 0.005,
      0.036,
      -0.02 + (i - 1.5) * 0.008,
      false,
    );
    stripe.rotation.z = -0.35;
    bakery.add(stripe);
  }
  // Window above the sill and the sill ledge itself.
  const windowMat = new MeshStandardMaterial({
    color: 0x1d2033,
    emissive: new Color(PALETTE.window),
    emissiveIntensity: 1,
    roughness: 0.4,
  });
  const win = mesh(new PlaneGeometry(0.024, 0.014), windowMat, westX, 0.028, -0.02, false);
  win.rotation.y = -Math.PI / 2;
  bakery.add(win);
  windows.push({ material: windowMat, mesh: win, order: 6 });
  bakery.add(mesh(new BoxGeometry(0.014, 0.003, 0.03), paint(PALETTE.wood), westX - 0.004, 0.02, -0.02));
  // Door on the west face, nearer the player.
  const door = mesh(new BoxGeometry(0.0015, 0.021, 0.013), paint(PALETTE.woodDark), westX, 0.0105, 0.024, false);
  bakery.add(door);
  // Sign board.
  bakery.add(mesh(new BoxGeometry(0.002, 0.008, 0.022), paint(PALETTE.wood), westX - 0.001, 0.046, 0.012, false));
  parent.add(bakery);

  // The pie sits on the sill; it lives in board space so it can move to a hand.
  const pie = new Group();
  pie.name = 'pie';
  const dish = mesh(new CylinderGeometry(0.0062, 0.005, 0.0022, 14), paint(0x9aa3b5, 0.45), 0, 0.0011, 0);
  const crust = mesh(new CylinderGeometry(0.0056, 0.0058, 0.0024, 14), paint(PALETTE.pie, 0.8), 0, 0.0031, 0);
  pie.add(dish, crust);
  pie.position.set(SPOTS.pieOnSill[0], 0.0215, SPOTS.pieOnSill[1]);
  parent.add(pie);
  return { pie };
}

function addGround(parent: Group): void {
  const { boardWidth: W, boardDepth: D, boardThickness: T } = TUNING;
  const board = mesh(new BoxGeometry(W, T, D), paint(PALETTE.woodDark, 0.9), 0, -T / 2, 0, false);
  board.name = 'board';
  parent.add(board);
  // A slightly lighter bevel frame so the board reads as a crafted object.
  const rim = mesh(new BoxGeometry(W + 0.01, T * 0.6, D + 0.01), paint(PALETTE.wood, 0.9), 0, -T * 0.72, 0, false);
  parent.add(rim);

  const grass = mesh(new BoxGeometry(W - 0.012, 0.0012, D - 0.012), paint(PALETTE.grass, 0.95), 0, 0.0006, 0, false);
  parent.add(grass);
  const street = mesh(new BoxGeometry(0.395, 0.0014, 0.036), paint(PALETTE.cobble, 0.95), -0.028, 0.0013, STREET_Z, false);
  parent.add(street);
  const plaza = new Mesh(new CylinderGeometry(0.058, 0.058, 0.0014, 32), paint(PALETTE.plaza, 0.95));
  plaza.position.set(0.035, 0.0014, 0.02);
  plaza.receiveShadow = true;
  parent.add(plaza);
  // Path from the plaza to the lineup area at the front.
  const path = mesh(new BoxGeometry(0.03, 0.0014, 0.06), paint(PALETTE.plaza, 0.95), 0.0, 0.0013, 0.1, false);
  parent.add(path);
}

function addProps(parent: Group): { bin: Object3D; lampBulbs: MeshStandardMaterial[] } {
  // Well.
  const well = new Group();
  well.position.set(SPOTS.well[0] + 0.022, 0, SPOTS.well[1] - 0.006);
  well.add(mesh(new CylinderGeometry(0.009, 0.01, 0.009, 16), paint(0x8b8fa3), 0, 0.0045, 0));
  well.add(mesh(new CylinderGeometry(0.0072, 0.0072, 0.0005, 16), paint(0x0e1224), 0, 0.0093, 0, false));
  well.add(mesh(new BoxGeometry(0.0015, 0.016, 0.0015), paint(PALETTE.wood), -0.008, 0.017, 0));
  well.add(mesh(new BoxGeometry(0.0015, 0.016, 0.0015), paint(PALETTE.wood), 0.008, 0.017, 0));
  well.add(mesh(new BoxGeometry(0.022, 0.0025, 0.012), paint(PALETTE.roofRed, 0.7), 0, 0.026, 0));
  parent.add(well);

  // Bench in the park.
  const bench = new Group();
  bench.position.set(SPOTS.bench[0], 0, SPOTS.bench[1] - 0.011);
  bench.add(mesh(new BoxGeometry(0.03, 0.0018, 0.008), paint(PALETTE.wood), 0, 0.006, 0));
  bench.add(mesh(new BoxGeometry(0.03, 0.007, 0.0015), paint(PALETTE.wood), 0, 0.0105, -0.0035));
  bench.add(mesh(new BoxGeometry(0.0015, 0.006, 0.007), paint(PALETTE.woodDark), -0.013, 0.003, 0));
  bench.add(mesh(new BoxGeometry(0.0015, 0.006, 0.007), paint(PALETTE.woodDark), 0.013, 0.003, 0));
  parent.add(bench);

  // Tree.
  const tree = new Group();
  tree.position.set(-0.2, 0, 0.1);
  tree.add(mesh(new CylinderGeometry(0.003, 0.004, 0.028, 8), paint(PALETTE.woodDark), 0, 0.014, 0));
  const canopy = mesh(new IcosahedronGeometry(0.02, 0), paint(0x3f6b45, 0.9), 0, 0.04, 0);
  canopy.scale.set(1, 0.9, 1);
  tree.add(canopy);
  parent.add(tree);

  // The bin the cat knocks over. Pivot at its base edge so it tips over.
  const bin = new Group();
  bin.name = 'bin';
  bin.position.set(SPOTS.bin[0], 0, SPOTS.bin[1]);
  bin.add(mesh(new CylinderGeometry(0.0055, 0.0048, 0.013, 12), paint(0x7d8597, 0.5), 0, 0.0065, 0));
  bin.add(mesh(new CylinderGeometry(0.006, 0.006, 0.0015, 12), paint(0x5c6273, 0.5), 0, 0.0138, 0));
  parent.add(bin);

  // Lamp posts: lit at dusk, dark at night, lit again at dawn.
  const lampBulbs: MeshStandardMaterial[] = [];
  const lampSpots: Vec2[] = [
    [-0.09, -0.018],
    [0.075, -0.06],
    [-0.02, 0.068],
  ];
  for (const [x, z] of lampSpots) {
    const lamp = new Group();
    lamp.position.set(x, 0, z);
    lamp.add(mesh(new CylinderGeometry(0.0009, 0.0012, 0.034, 6), paint(0x2b2f3f, 0.5), 0, 0.017, 0));
    const bulbMat = new MeshStandardMaterial({
      color: 0x333645,
      emissive: new Color(PALETTE.window),
      emissiveIntensity: 1,
      roughness: 0.3,
    });
    lamp.add(mesh(new SphereGeometry(0.0028, 10, 8), bulbMat, 0, 0.0355, 0, false));
    lampBulbs.push(bulbMat);
    parent.add(lamp);
  }
  return { bin, lampBulbs };
}

function addSky(parent: Group): { moon: Object3D; sun: Object3D } {
  // A tiny theatre-style moon and sun on wires behind the town: the moon
  // crossing the back of the board is the night's clock.
  const moon = new Group();
  moon.name = 'moon';
  const moonMat = new MeshBasicMaterial({ color: PALETTE.moon });
  moon.add(new Mesh(new SphereGeometry(0.009, 16, 12), moonMat));
  const wire = new Mesh(
    new CylinderGeometry(0.0003, 0.0003, 0.12, 4),
    new MeshBasicMaterial({ color: 0x9aa0b8, transparent: true, opacity: 0.35 }),
  );
  wire.position.y = 0.06;
  moon.add(wire);
  parent.add(moon);

  const sun = new Group();
  sun.name = 'sun';
  sun.add(new Mesh(new SphereGeometry(0.011, 16, 12), new MeshBasicMaterial({ color: PALETTE.sun })));
  const sunWire = wire.clone();
  sun.add(sunWire);
  sun.visible = false;
  parent.add(sun);
  return { moon, sun };
}

function addLanternProp(parent: Group): { lanternProp: Object3D; lanternFlame: MeshStandardMaterial } {
  const lantern = new Group();
  lantern.name = 'lantern-prop';
  lantern.position.set(SPOTS.lantern[0], 0, SPOTS.lantern[1]);
  const metal = paint(0x2b2f3f, 0.45);
  lantern.add(mesh(new CylinderGeometry(0.006, 0.007, 0.002, 12), metal, 0, 0.001, 0));
  lantern.add(mesh(new CylinderGeometry(0.0042, 0.0062, 0.0035, 12), metal, 0, 0.0185, 0));
  const flame = new MeshStandardMaterial({
    color: 0x5a3d1c,
    emissive: new Color(PALETTE.amber),
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.9,
  });
  lantern.add(mesh(new CylinderGeometry(0.0045, 0.0045, 0.014, 12, 1, true), flame, 0, 0.0095, 0, false));
  lantern.add(mesh(new CylinderGeometry(0.0007, 0.0007, 0.006, 6), metal, 0, 0.023, 0));
  lantern.visible = false;
  parent.add(lantern);
  return { lanternProp: lantern, lanternFlame: flame };
}

export function buildTown(): Town {
  const root = new Group();
  root.name = 'night-watch-town';
  const windows: WindowLight[] = [];
  addGround(root);
  addHouse(root, 'teen', windows, 0);
  addHouse(root, 'mayor', windows, 2);
  addHouse(root, 'gardener', windows, 4);
  const { pie } = addBakery(root, windows);
  const { bin, lampBulbs } = addProps(root);
  const { moon, sun } = addSky(root);
  const { lanternProp, lanternFlame } = addLanternProp(root);
  return {
    root,
    windows,
    lampBulbs,
    pie,
    pieHome: [pie.position.x, pie.position.z],
    bin,
    moon,
    sun,
    lanternProp,
    lanternFlame,
  };
}

/** Flat circle used for glows and selection rings (lies on the board). */
export function flatDisc(radius: number, material: MeshBasicMaterial): Mesh {
  const disc = new Mesh(new CircleGeometry(radius, 40), material);
  disc.rotation.x = -Math.PI / 2;
  return disc;
}
