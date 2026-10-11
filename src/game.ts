import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export const BACKGROUND = "#020611";
export type Direction = "up" | "down" | "left" | "right";
export type Screen =
  | "title"
  | "howto"
  | "countdown"
  | "playing"
  | "paused"
  | "cleared"
  | "gameover";
export type PredatorState = "den" | "wander" | "chase" | "search";
interface Body {
  x: number;
  y: number;
  tx: number;
  ty: number;
}
export interface Forager extends Body {
  dir: Direction;
  moving: boolean;
}
export interface Drifter extends Body {
  lit: boolean;
  mind: boolean;
  travel: boolean;
  dir?: Direction;
}
export interface Predator extends Body {
  kind: C.PredatorKind;
  dir: Direction;
  state: PredatorState;
  released: boolean;
  mind: boolean;
  travel: boolean;
  speed: number;
  alert: boolean;
  lit: boolean;
  detectRange: number | null;
  hearingRange: number | null;
  hearingLock: boolean | null;
  flareCharging: boolean | null;
  flaring: boolean | null;
  flareRadius: number | null;
  timer?: number;
  mark?: number;
  releaseAt?: number;
}
export interface Pulse {
  source: "forager" | "gloamfin";
  tint: "cyan" | "violet" | "orange";
  ox: number;
  oy: number;
  front: number;
  range: number;
}
export interface InkCloud {
  x: number;
  y: number;
  radius: number;
  remaining: number;
}
interface Assets {
  glimmerfin: ImageBitmap[];
  lanternjaw: ImageBitmap[];
  gloamfin: ImageBitmap[];
  flarefish: ImageBitmap[];
  drifter: ImageBitmap[];
  bloom: ImageBitmap[];
  walls: ImageBitmap[];
}
export interface FathomState {
  version: number;
  screen: Screen;
  menuIndex: number | null;
  titleIndex: number;
  depth: number;
  score: number;
  lives: number;
  muted: boolean;
  planktonRemaining: number;
  drifterIn: number;
  brightness: number;
  brightHold: number;
  visionRadius: number;
  windowRadius: number;
  sonar: { ready: boolean; cooldown: number; range: number };
  ink: { ready: boolean; cooldown: number };
  grid: {
    cols: number;
    rows: number;
    tile: number;
    originX: number;
    originY: number;
  };
  tiles: string[];
  plankton: string[];
  visibility: string[];
  forager: Forager;
  drifters: Drifter[];
  predators: Predator[];
  pulses: Pulse[];
  inkClouds: InkCloud[];
  simTime: number;
  assets: Assets;
  accumulator: number;
  screenTime: number;
  playTime: number;
  desired: Direction | null;
  animTime: number;
  pointerDown: number | null;
}
type RS = DeepReadonly<FathomState>;
type Rect = { x: number; y: number; w: number; h: number };
export interface FathomDebugApi {
  version: number;
  reset(s: RS): FathomState;
  snapshot(s: RS): Record<string, unknown>;
  reconcile(s: RS): FathomState;
  setScreen(s: RS, v: Screen): FathomState;
  setMenuIndex(s: RS, v: number): FathomState;
  setTitleIndex(s: RS, v: number): FathomState;
  menuItemRect(s: RS, v: number): Rect | null;
  setScore(s: RS, v: number): FathomState;
  setLives(s: RS, v: number): FathomState;
  setDepth(s: RS, v: number): FathomState;
  setMaze(s: RS, v: string[]): FathomState;
  setPlankton(s: RS, x: number, y: number, v: boolean): FathomState;
  clearPlankton(s: RS): FathomState;
  clearFog(s: RS): FathomState;
  setForagerTile(s: RS, x: number, y: number): FathomState;
  setForagerDir(s: RS, v: Direction): FathomState;
  setBrightness(s: RS, v: number): FathomState;
  setBrightHold(s: RS, v: number): FathomState;
  clearPredators(s: RS): FathomState;
  addPredator(s: RS, k: C.PredatorKind, x: number, y: number): FathomState;
  setPredatorTile(s: RS, i: number, x: number, y: number): FathomState;
  setPredatorDir(s: RS, i: number, v: Direction): FathomState;
  setPredatorState(
    s: RS,
    i: number,
    v: "den" | "wander" | "chase",
  ): FathomState;
  setPredatorReleased(s: RS, i: number, v: boolean): FathomState;
  setPredatorMind(s: RS, i: number, v: boolean): FathomState;
  setPredatorTravel(s: RS, i: number, v: boolean): FathomState;
  spawnDrifter(s: RS, x: number, y: number): FathomState;
  clearDrifters(s: RS): FathomState;
  setDrifterMind(s: RS, i: number, v: boolean): FathomState;
  setDrifterTravel(s: RS, i: number, v: boolean): FathomState;
  setDrifterIn(s: RS, v: number): FathomState;
  setSonarCooldown(s: RS, v: number): FathomState;
  setInkCooldown(s: RS, v: number): FathomState;
}
const ds: Direction[] = ["up", "left", "down", "right"],
  vec: Record<Direction, [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  },
  opp: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
const pos = (x: number, y: number): [number, number] => [
  C.GRID_ORIGIN_X + x * C.TILE + 16,
  C.GRID_ORIGIN_Y + y * C.TILE + 16,
];
const tile = (x: number, y: number): [number, number] => [
  Math.max(0, Math.min(35, Math.floor((x - C.GRID_ORIGIN_X) / C.TILE))),
  Math.max(0, Math.min(17, Math.floor((y - C.GRID_ORIGIN_Y) / C.TILE))),
];
const rows = (ch: string) =>
  Array.from({ length: C.GRID_ROWS }, () => ch.repeat(C.GRID_COLS));
const edit = (r: readonly string[], x: number, y: number, ch: string) =>
  r.map((v, i) => (i === y ? v.slice(0, x) + ch + v.slice(x + 1) : v));
const mutable = (s: RS) => s as unknown as FathomState;
function maze() {
  const a = Array.from({ length: 18 }, () => Array(36).fill("#"));
  for (let y = 2; y < 17; y += 2) for (let x = 1; x < 35; x++) a[y][x] = ".";
  for (const x of [1, 7, 13, 22, 28, 34])
    for (let y = 1; y < 17; y++) a[y][x] = ".";
  a[4][0] = a[4][35] = ".";
  for (let y = 7; y <= 9; y++) for (let x = 16; x <= 19; x++) a[y][x] = "d";
  for (let y = 6; y <= 10; y++) a[y][15] = a[y][20] = "#";
  for (let x = 16; x <= 19; x++) a[6][x] = a[10][x] = "#";
  a[6][17] = "g";
  a[5][17] = a[4][17] = ".";
  return a.map((r) => r.join(""));
}
const plankton = (t: readonly string[]) =>
  t.map((r) => [...r].map((x) => (x === "." ? "*" : "-")).join(""));
const count = (p: readonly string[]) =>
  p.reduce((n, r) => n + [...r].filter((x) => x === "*").length, 0);
const radii = (g: number) => ({
  visionRadius: C.VISION_MIN + C.VISION_GAIN * g,
  windowRadius: C.KINDLE_VISION_MIN + C.KINDLE_VISION_GAIN * g,
});
function pred(kind: C.PredatorKind, tx: number, ty: number, i = 0): Predator {
  const [x, y] = pos(tx, ty);
  return {
    kind,
    x,
    y,
    tx,
    ty,
    dir: "up",
    state: "den",
    released: false,
    mind: true,
    travel: true,
    speed: kind === "lanternjaw" ? C.DRIFTER_SPEED : C.PREDATOR_SPEED,
    alert: false,
    lit: false,
    detectRange: kind === "gloamfin" ? null : C.LANTERN_RANGE_BASE,
    hearingRange: kind === "gloamfin" ? C.GLOAMFIN_HEAR : null,
    hearingLock: kind === "gloamfin" ? false : null,
    flareCharging: kind === "flarefish" ? false : null,
    flaring: kind === "flarefish" ? false : null,
    flareRadius: kind === "flarefish" ? 0 : null,
    releaseAt: i * C.DEN_RELEASE_GAP,
    timer: kind === "flarefish" ? C.FLARE_INTERVAL : C.GLOAMFIN_PING_INTERVAL,
  };
}
function roster(depth: number, t: readonly string[]) {
  const kinds: C.PredatorKind[] = [...C.DEN_ORDER];
  for (let d = 2; d <= Math.min(depth, 4); d++)
    kinds.push(C.ROSTER_ADD_ORDER[d - 2]);
  const den: string[] = [];
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 36; x++) if (t[y][x] === "d") den.push(`${x},${y}`);
  return kinds.map((k, i) => {
    const q = (den[i % den.length] ?? "17,8").split(",").map(Number);
    return pred(k, q[0], q[1], i);
  });
}
function initial(assets: Assets, muted = false) {
  const t = maze(),
    p = plankton(t),
    [x, y] = pos(1, 14);
  return {
    version: 1,
    screen: "title" as Screen,
    menuIndex: 0,
    titleIndex: 0,
    depth: 1,
    score: 0,
    lives: C.START_LIVES,
    muted,
    planktonRemaining: count(p),
    drifterIn: C.DRIFTER_INTERVAL,
    brightness: 0,
    brightHold: 0,
    ...radii(0),
    sonar: { ready: true, cooldown: 0, range: C.SONAR_RANGE_BASE },
    ink: { ready: true, cooldown: 0 },
    grid: { cols: 36, rows: 18, tile: 32, originX: 64, originY: 80 },
    tiles: t,
    plankton: p,
    visibility: rows("u"),
    forager: { x, y, tx: 1, ty: 14, dir: "right" as Direction, moving: false },
    drifters: [],
    predators: roster(1, t),
    pulses: [],
    inkClouds: [],
    simTime: 0,
    assets,
    accumulator: 0,
    screenTime: 0,
    playTime: 0,
    desired: null,
    pointerDown: null,
    animTime: 0,
  };
}
function reconcile(s: RS): FathomState {
  const q = mutable(s);
  return {
    ...q,
    ...radii(s.brightness),
    planktonRemaining: count(s.plankton),
    sonar: {
      cooldown: s.sonar.cooldown,
      ready: s.sonar.cooldown === 0,
      range: Math.max(C.SONAR_RANGE_MIN, C.SONAR_RANGE_BASE - s.depth + 1),
    },
    ink: { cooldown: s.ink.cooldown, ready: s.ink.cooldown === 0 },
    forager: {
      ...s.forager,
      tx: tile(s.forager.x, s.forager.y)[0],
      ty: tile(s.forager.x, s.forager.y)[1],
    },
    drifters: s.drifters.map((d) => ({
      ...d,
      tx: tile(d.x, d.y)[0],
      ty: tile(d.x, d.y)[1],
    })),
    predators: s.predators.map((p) => ({
      ...p,
      tx: tile(p.x, p.y)[0],
      ty: tile(p.x, p.y)[1],
      detectRange:
        p.kind === "gloamfin"
          ? null
          : C.LANTERN_RANGE_BASE + C.LANTERN_RANGE_GAIN * s.brightness,
      speed:
        p.kind === "lanternjaw" && p.state === "wander"
          ? C.DRIFTER_SPEED
          : p.kind === "gloamfin" && p.state === "chase"
            ? C.GLOAMFIN_CHASE_SPEED
            : C.PREDATOR_SPEED,
    })),
  };
}
function snap(s: RS) {
  const {
    assets: _,
    accumulator: __,
    screenTime: ___,
    playTime: ____,
    desired: _____,
    animTime: ______,
    pointerDown: _______,
    ...v
  } = s;
  return structuredClone(v) as unknown as Record<string, unknown>;
}
const rect = (s: RS, i: number): Rect | null => {
  const n =
    s.screen === "paused"
      ? 3
      : s.screen === "title" || s.screen === "gameover"
        ? 2
        : 0;
  if (i < 0 || i >= n) return null;
  return {
    x: 440,
    y:
      (s.screen === "paused" ? 300 : s.screen === "title" ? 420 : 430) + 62 * i,
    w: 400,
    h: 50,
  };
};
const menuN = (s: RS) =>
  s.screen === "paused"
    ? 3
    : s.screen === "title" || s.screen === "gameover"
      ? 2
      : 0;
function checkInt(v: number, min: number, n: string) {
  if (!Number.isInteger(v) || v < min) throw new RangeError(`${n}: ${v}`);
}
function checkTile(s: RS, x: number, y: number, chars: string) {
  checkInt(x, 0, "tx");
  checkInt(y, 0, "ty");
  if (x >= 36 || y >= 18 || !chars.includes(s.tiles[y][x]))
    throw new RangeError(`tile ${x},${y}`);
}
function debug(assets: Assets): FathomDebugApi {
  const pi = (s: RS, i: number) => {
      checkInt(i, 0, "index");
      if (i >= s.predators.length) throw new RangeError("predator index");
    },
    di = (s: RS, i: number) => {
      checkInt(i, 0, "index");
      if (i >= s.drifters.length) throw new RangeError("drifter index");
    },
    pm = (s: RS, i: number, f: (p: Predator) => Predator) =>
      s.predators.map((p, j) => (j === i ? f({ ...p }) : { ...p }));
  return {
    version: C.FATHOM_DEBUG_VERSION,
    reset: (s) => initial(assets, s.muted),
    snapshot: snap,
    reconcile,
    setScreen: (s, v) => {
      if (
        ![
          "title",
          "howto",
          "countdown",
          "playing",
          "paused",
          "cleared",
          "gameover",
        ].includes(v)
      )
        throw new RangeError("screen");
      return {
        ...mutable(s),
        screen: v,
        menuIndex:
          v === "title"
            ? s.titleIndex
            : v === "paused" || v === "gameover"
              ? 0
              : null,
        screenTime: 0,
        playTime: v === "playing" ? 0 : s.playTime,
      };
    },
    setMenuIndex: (s, v) => {
      checkInt(v, 0, "index");
      if (v >= menuN(s)) throw new RangeError("menu");
      return { ...mutable(s), menuIndex: v };
    },
    setTitleIndex: (s, v) => {
      checkInt(v, 0, "index");
      if (v > 1) throw new RangeError("title");
      return { ...mutable(s), titleIndex: v };
    },
    menuItemRect: rect,
    setScore: (s, v) => {
      checkInt(v, 0, "score");
      return { ...mutable(s), score: v };
    },
    setLives: (s, v) => {
      checkInt(v, 0, "lives");
      return { ...mutable(s), lives: v };
    },
    setDepth: (s, v) => {
      checkInt(v, 1, "depth");
      return reconcile({
        ...mutable(s),
        depth: v,
        predators: roster(v, s.tiles),
      });
    },
    setMaze: (s, v) => {
      if (
        v.length !== 18 ||
        v.some((r) => r.length !== 36 || /[^#.gd]/.test(r)) ||
        (/[gd]/.test(v.join("")) && v.join("").split("g").length !== 2)
      )
        throw new RangeError("maze");
      return { ...mutable(s), tiles: [...v] };
    },
    setPlankton: (s, x, y, v) => {
      checkTile(s, x, y, ".");
      return reconcile({
        ...mutable(s),
        plankton: edit(s.plankton, x, y, v ? "*" : "-"),
      });
    },
    clearPlankton: (s) => ({
      ...mutable(s),
      plankton: rows("-"),
      planktonRemaining: 0,
    }),
    clearFog: (s) => ({ ...mutable(s), visibility: rows("u") }),
    setForagerTile: (s, x, y) => {
      checkTile(s, x, y, ".");
      const [px, py] = pos(x, y);
      return {
        ...mutable(s),
        forager: { ...s.forager, x: px, y: py, tx: x, ty: y, moving: false },
      };
    },
    setForagerDir: (s, v) => {
      if (!ds.includes(v)) throw new RangeError("dir");
      return {
        ...mutable(s),
        forager: { ...s.forager, dir: v, moving: false },
      };
    },
    setBrightness: (s, v) => {
      if (v < 0 || v > 1) throw new RangeError("brightness");
      return reconcile({ ...mutable(s), brightness: v });
    },
    setBrightHold: (s, v) => {
      if (v < 0 || v > C.BRIGHT_HOLD) throw new RangeError("hold");
      return { ...mutable(s), brightHold: v };
    },
    clearPredators: (s) => ({ ...mutable(s), predators: [] }),
    addPredator: (s, k, x, y) => {
      if (!C.DEN_ORDER.includes(k)) throw new RangeError("kind");
      checkTile(s, x, y, ".");
      return reconcile({
        ...mutable(s),
        predators: [
          ...s.predators.map((p) => ({ ...p })),
          { ...pred(k, x, y), state: "wander", released: true },
        ],
      });
    },
    setPredatorTile: (s, i, x, y) => {
      pi(s, i);
      checkTile(s, x, y, ".dg");
      const [px, py] = pos(x, y);
      return {
        ...mutable(s),
        predators: pm(s, i, (p) => ({ ...p, x: px, y: py, tx: x, ty: y })),
      };
    },
    setPredatorDir: (s, i, v) => {
      pi(s, i);
      if (!ds.includes(v)) throw new RangeError("dir");
      return { ...mutable(s), predators: pm(s, i, (p) => ({ ...p, dir: v })) };
    },
    setPredatorState: (s, i, v) => {
      pi(s, i);
      if (!["den", "wander", "chase"].includes(v))
        throw new RangeError("state");
      return reconcile({
        ...mutable(s),
        predators: pm(s, i, (p) => ({ ...p, state: v })),
      });
    },
    setPredatorReleased: (s, i, v) => {
      pi(s, i);
      return {
        ...mutable(s),
        predators: pm(s, i, (p) => ({ ...p, released: v })),
      };
    },
    setPredatorMind: (s, i, v) => {
      pi(s, i);
      return { ...mutable(s), predators: pm(s, i, (p) => ({ ...p, mind: v })) };
    },
    setPredatorTravel: (s, i, v) => {
      pi(s, i);
      return {
        ...mutable(s),
        predators: pm(s, i, (p) => ({ ...p, travel: v })),
      };
    },
    spawnDrifter: (s, x, y) => {
      checkTile(s, x, y, ".");
      const [px, py] = pos(x, y);
      return {
        ...mutable(s),
        drifters: [
          ...s.drifters.map((d) => ({ ...d })),
          {
            x: px,
            y: py,
            tx: x,
            ty: y,
            lit: false,
            mind: true,
            travel: true,
            dir: "up",
          },
        ],
      };
    },
    clearDrifters: (s) => ({ ...mutable(s), drifters: [] }),
    setDrifterMind: (s, i, v) => {
      di(s, i);
      return {
        ...mutable(s),
        drifters: s.drifters.map((d, j) => ({
          ...d,
          mind: j === i ? v : d.mind,
        })),
      };
    },
    setDrifterTravel: (s, i, v) => {
      di(s, i);
      return {
        ...mutable(s),
        drifters: s.drifters.map((d, j) => ({
          ...d,
          travel: j === i ? v : d.travel,
        })),
      };
    },
    setDrifterIn: (s, v) => {
      if (v < 0 || v > C.DRIFTER_INTERVAL) throw new RangeError("timer");
      return { ...mutable(s), drifterIn: v };
    },
    setSonarCooldown: (s, v) => {
      if (v < 0) throw new RangeError("sonar");
      return {
        ...mutable(s),
        sonar: { ...s.sonar, cooldown: v, ready: v === 0 },
      };
    },
    setInkCooldown: (s, v) => {
      if (v < 0) throw new RangeError("ink");
      return { ...mutable(s), ink: { cooldown: v, ready: v === 0 } };
    },
  };
}
function open(s: RS, x: number, y: number, p = false) {
  return (
    y >= 0 &&
    y < 18 &&
    x >= 0 &&
    x < 36 &&
    (p ? ".dg".includes(s.tiles[y][x]) : s.tiles[y][x] === ".")
  );
}
function direction(s: RS, b: Body, d: Direction, target?: Body) {
  const a = ds.filter((q) => open(s, b.tx + vec[q][0], b.ty + vec[q][1], true));
  if (target)
    a.sort(
      (x, y) =>
        Math.abs(b.tx + vec[x][0] - target.tx) +
        Math.abs(b.ty + vec[x][1] - target.ty) -
        (Math.abs(b.tx + vec[y][0] - target.tx) +
          Math.abs(b.ty + vec[y][1] - target.ty)),
    );
  return a.find((q) => q !== opp[d]) ?? a[0] ?? d;
}
function move(
  s: RS,
  b: Forager | Predator | Drifter,
  d: Direction,
  speed: number,
  dt: number,
  p = false,
) {
  const [vx, vy] = vec[d];
  let x = b.x + vx * speed * dt,
    y = b.y + vy * speed * dt,
    [tx, ty] = tile(x, y);
  if (!open(s, tx, ty, p)) {
    const [cx, cy] = pos(b.tx, b.ty);
    x = vx ? cx : b.x;
    y = vy ? cy : b.y;
    tx = b.tx;
    ty = b.ty;
  }
  return { ...b, x, y, tx, ty, dir: d };
}
function visible(s: FathomState) {
  const lit = new Set<string>();
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 36; x++) {
      const [px, py] = pos(x, y);
      if (Math.hypot(px - s.forager.x, py - s.forager.y) <= s.visionRadius)
        lit.add(`${x},${y}`);
    }
  for (const p of s.predators)
    if (p.flaring)
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 36; x++) {
          const [a, b] = pos(x, y);
          if (Math.hypot(a - p.x, b - p.y) <= C.FLARE_RADIUS)
            lit.add(`${x},${y}`);
        }
  return {
    ...s,
    visibility: s.visibility.map((r, y) =>
      [...r]
        .map((v, x) => (lit.has(`${x},${y}`) ? "l" : v === "u" ? "u" : "r"))
        .join(""),
    ),
    predators: s.predators.map((p) => ({
      ...p,
      lit: lit.has(`${p.tx},${p.ty}`) || p.alert || (p.mark ?? 0) > 0,
    })),
    drifters: s.drifters.map((d) => ({
      ...d,
      lit: lit.has(`${d.tx},${d.ty}`),
    })),
  };
}
function resetAttempt(s: FathomState): FathomState {
  const [x, y] = pos(1, 14);
  return {
    ...s,
    screen: "countdown" as Screen,
    menuIndex: null,
    screenTime: 0,
    playTime: 0,
    brightness: 0,
    brightHold: 0,
    ...radii(0),
    forager: { x, y, tx: 1, ty: 14, dir: "right" as Direction, moving: false },
    predators: roster(s.depth, s.tiles),
    drifters: [],
    drifterIn: C.DRIFTER_INTERVAL,
    pulses: [],
    inkClouds: [],
    sonar: { ready: true, cooldown: 0, range: s.sonar.range },
    ink: { ready: true, cooldown: 0 },
  };
}
function fresh(s: FathomState, depth = 1): FathomState {
  const t = maze(),
    p = plankton(t);
  return resetAttempt({
    ...s,
    tiles: t,
    plankton: p,
    visibility: rows("u"),
    planktonRemaining: count(p),
    depth,
    score: depth === 1 ? 0 : s.score,
    lives: depth === 1 ? C.START_LIVES : s.lives,
    predators: roster(depth, t),
    sonar: {
      ready: true,
      cooldown: 0,
      range: Math.max(C.SONAR_RANGE_MIN, C.SONAR_RANGE_BASE - depth + 1),
    },
  });
}
function tick(s: FathomState, api: UpdateApi): FathomState {
  let n = {
    ...s,
    simTime: s.simTime + C.TICK_DT,
    screenTime: s.screenTime + C.TICK_DT,
    animTime: s.animTime + C.TICK_DT,
  };
  if (n.screen === "countdown") {
    if (n.screenTime >= 2)
      n = { ...n, screen: "playing", screenTime: 0, playTime: 0 };
    return visible(n);
  }
  if (n.screen === "cleared") {
    if (n.screenTime >= 2) return fresh(n, n.depth + 1);
    return n;
  }
  if (n.screen !== "playing") return n;
  n.playTime += C.TICK_DT;
  const hold = Math.max(0, n.brightHold - C.TICK_DT);
  let g = n.brightness;
  if (n.brightHold <= 0) g *= Math.pow(0.5, C.TICK_DT / C.BRIGHT_HALFLIFE);
  n = {
    ...n,
    brightness: g,
    brightHold: hold,
    ...radii(g),
    sonar: {
      ...n.sonar,
      cooldown: Math.max(0, n.sonar.cooldown - C.TICK_DT),
      ready: n.sonar.cooldown <= C.TICK_DT,
    },
    ink: {
      cooldown: Math.max(0, n.ink.cooldown - C.TICK_DT),
      ready: n.ink.cooldown <= C.TICK_DT,
    },
  };
  const held = ds.find((d) => api.input.value(d) > 0);
  if (held) n.desired = held;
  let f = { ...n.forager, moving: Boolean(held) };
  if (held) {
    if (opp[f.dir] === n.desired) f.dir = n.desired!;
    const [cx, cy] = pos(f.tx, f.ty);
    if (
      Math.hypot(f.x - cx, f.y - cy) < 2 &&
      n.desired &&
      open(n, f.tx + vec[n.desired][0], f.ty + vec[n.desired][1])
    )
      f.dir = n.desired;
    f = move(n, f, f.dir, C.FORAGER_SPEED, C.TICK_DT) as Forager;
  }
  n.forager = f;
  if (n.plankton[f.ty][f.tx] === "*") {
    n.plankton = edit(n.plankton, f.tx, f.ty, "-");
    n.planktonRemaining--;
    n.score += C.SCORE_PLANKTON;
    n.brightness = Math.min(1, n.brightness + C.BRIGHT_PER_EAT);
    n.brightHold = C.BRIGHT_HOLD;
    Object.assign(n, radii(n.brightness));
    api.audio.play(C.CUES.eat);
    if (!n.planktonRemaining) {
      n.score += C.SCORE_CLEAR;
      n.screen = "cleared";
      n.screenTime = 0;
      api.audio.play(C.CUES.descend);
      return visible(n);
    }
  }
  n.inkClouds = n.inkClouds
    .map((c) => ({ ...c, remaining: c.remaining - C.TICK_DT }))
    .filter((c) => c.remaining > 0);
  n.pulses = n.pulses
    .map((p) => ({ ...p, front: p.front + C.SONAR_WAVE_SPEED * C.TICK_DT }))
    .filter((p) => p.front <= p.range + 0.5);
  n.drifterIn = Math.max(0, n.drifterIn - C.TICK_DT);
  if (
    n.drifterIn === 0 &&
    n.planktonRemaining > 0 &&
    n.drifters.length < C.DRIFTER_MAX
  ) {
    const gateY = n.tiles.findIndex((r) => r.includes("g"));
    const gateX = gateY >= 0 ? n.tiles[gateY].indexOf("g") : -1;
    if (gateX >= 0 && open(n, gateX, gateY - 1)) {
      const [x, y] = pos(gateX, gateY - 1);
      n.drifters = [
        ...n.drifters,
        {
          x,
          y,
          tx: gateX,
          ty: gateY - 1,
          lit: false,
          mind: true,
          travel: true,
          dir: "up",
        },
      ];
    }
    n.drifterIn = C.DRIFTER_INTERVAL;
  }
  n.drifters = n.drifters
    .map((d) => {
      if (!d.mind || !d.travel) return { ...d };
      let dir = d.dir ?? "up";
      const [cx, cy] = pos(d.tx, d.ty);
      if (Math.hypot(d.x - cx, d.y - cy) < 2) dir = direction(n, d, dir);
      return move(n, d, dir, C.DRIFTER_SPEED, C.TICK_DT) as Drifter;
    })
    .filter((d) => {
      if (d.tx !== f.tx || d.ty !== f.ty) return true;
      n.score += C.SCORE_DRIFTER;
      api.audio.play(C.CUES.eat);
      return false;
    });
  n.predators = n.predators.map((p, i) => {
    let q = { ...p };
    if (!q.released && n.playTime >= (q.releaseAt ?? i * C.DEN_RELEASE_GAP)) {
      q.released = true;
      q.state = "wander";
    }
    if (!q.released || !q.mind) return q;
    q.alert = false;
    const dist = Math.hypot(q.x - f.x, q.y - f.y),
      sense =
        q.kind === "gloamfin"
          ? dist <= C.GLOAMFIN_HEAR
          : dist <= C.LANTERN_RANGE_BASE + C.LANTERN_RANGE_GAIN * n.brightness;
    if (sense) {
      if (q.state !== "chase" && q.kind !== "lanternjaw") q.alert = true;
      q.state = "chase";
    }
    q.speed =
      q.kind === "lanternjaw" && q.state === "wander"
        ? C.DRIFTER_SPEED
        : q.kind === "gloamfin" && q.state === "chase"
          ? C.GLOAMFIN_CHASE_SPEED
          : C.PREDATOR_SPEED;
    if (q.travel) {
      const [cx, cy] = pos(q.tx, q.ty);
      if (Math.hypot(q.x - cx, q.y - cy) < 2)
        q.dir = direction(n, q, q.dir, q.state === "chase" ? f : undefined);
      q = move(n, q, q.dir, q.speed, C.TICK_DT, true) as Predator;
    }
    if (q.kind === "flarefish" && q.state === "wander") {
      q.timer = (q.timer ?? C.FLARE_INTERVAL) - C.TICK_DT;
      q.flareCharging = q.timer <= C.FLARE_CHARGE && q.timer > 0;
      if (q.timer <= 0) {
        q.flaring = true;
        q.flareRadius = C.FLARE_RADIUS;
        q.timer = C.FLARE_BLOOM;
        api.audio.play(C.CUES.flare);
      }
    }
    return q;
  });
  if (n.predators.some((p) => p.released && p.tx === f.tx && p.ty === f.ty)) {
    api.audio.play(C.CUES.caught);
    return n.lives === 0
      ? { ...n, screen: "gameover", menuIndex: 0 }
      : resetAttempt({ ...n, lives: n.lives - 1 });
  }
  return visible(n);
}
function menu(s: FathomState): FathomState {
  const i = s.menuIndex ?? 0;
  if (s.screen === "title")
    return i
      ? { ...s, screen: "howto" as Screen, menuIndex: null, titleIndex: 1 }
      : { ...fresh({ ...s, titleIndex: 0 }, 1), titleIndex: 0 };
  if (s.screen === "paused")
    return i === 0
      ? { ...s, screen: "playing" as Screen, menuIndex: null }
      : i === 1
        ? fresh(s, 1)
        : {
            ...fresh(s, 1),
            screen: "title" as Screen,
            menuIndex: s.titleIndex,
          };
  if (s.screen === "gameover")
    return i === 0
      ? fresh(s, 1)
      : { ...fresh(s, 1), screen: "title" as Screen, menuIndex: s.titleIndex };
  return s;
}
function input(s: FathomState, a: UpdateApi): FathomState {
  const n = { ...s };
  if (a.input.pressed("mute")) a.audio.setMuted(!a.audio.muted());
  n.muted = a.audio.muted();
  if (n.screen === "playing") {
    if (a.input.pressed("pause"))
      return { ...n, screen: "paused", menuIndex: 0 };
    if (a.input.pressed("a") && n.sonar.ready) {
      n.sonar = { ...n.sonar, ready: false, cooldown: C.SONAR_COOLDOWN };
      n.pulses = [
        ...n.pulses,
        {
          source: "forager",
          tint: "cyan",
          ox: n.forager.tx,
          oy: n.forager.ty,
          front: 0,
          range: n.sonar.range,
        },
      ];
      a.audio.play(C.CUES.sonar);
    }
    if (a.input.pressed("b") && n.ink.ready) {
      n.ink = { ready: false, cooldown: C.INK_COOLDOWN };
      n.inkClouds = [
        ...n.inkClouds,
        {
          x: n.forager.x,
          y: n.forager.y,
          radius: C.INK_RADIUS,
          remaining: C.INK_LIFE,
        },
      ];
      a.audio.play(C.CUES.ink);
    }
    return n;
  }
  if (
    n.screen === "paused" &&
    (a.input.pressed("pause") || a.input.pressed("back"))
  )
    return { ...n, screen: "playing", menuIndex: null };
  if (
    n.screen === "howto" &&
    (a.input.pressed("confirm") ||
      a.input.pressed("back") ||
      a.input.pointerReleased())
  )
    return { ...fresh(n, 1), screen: "title", menuIndex: n.titleIndex };
  const z = menuN(n);
  if (z) {
    let i = n.menuIndex ?? 0;
    if (a.input.pressed("up")) i = (i + z - 1) % z;
    if (a.input.pressed("down")) i = (i + 1) % z;
    const pointer = a.input.pointer();
    const hover = Array.from({ length: z }, (_, j) => j).find((j) => {
      const r = rect(n, j)!;
      return (
        pointer.x >= r.x &&
        pointer.x <= r.x + r.w &&
        pointer.y >= r.y &&
        pointer.y <= r.y + r.h
      );
    });
    if (hover !== undefined) i = hover;
    for (const sample of a.input.pointerSamples().filter((p) => p.primary)) {
      const hit = Array.from({ length: z }, (_, j) => j).find((j) => {
        const r = rect(n, j)!;
        return (
          sample.x >= r.x &&
          sample.x <= r.x + r.w &&
          sample.y >= r.y &&
          sample.y <= r.y + r.h
        );
      });
      if (sample.type === "down") n.pointerDown = hit ?? null;
      if (sample.type === "up") {
        if (hit !== undefined && hit === n.pointerDown) {
          n.menuIndex = hit;
          return menu(n);
        }
        n.pointerDown = null;
      }
    }
    n.menuIndex = i;
    if (a.input.pressed("confirm")) return menu(n);
    if (n.screen === "gameover" && a.input.pressed("back"))
      return { ...fresh(n, 1), screen: "title", menuIndex: n.titleIndex };
  }
  return n;
}
const text = (
  x: CanvasRenderingContext2D,
  t: string,
  px: number,
  y: number,
  size: number,
  color: string = "#dff",
) => {
  x.font = `700 ${size}px ui-monospace,monospace`;
  x.fillStyle = color;
  x.textAlign = "center";
  x.fillText(t, px, y);
};
function renderMaze(s: RS, x: CanvasRenderingContext2D) {
  x.save();
  x.beginPath();
  x.arc(s.forager.x, s.forager.y, s.windowRadius, 0, Math.PI * 2);
  x.clip();
  for (let y = 0; y < 18; y++)
    for (let z = 0; z < 36; z++) {
      const px = 64 + z * 32,
        py = 80 + y * 32,
        v = s.visibility[y][z];
      if (v === "u") {
        x.drawImage(s.assets.walls[17] as unknown as CanvasImageSource, px, py);
        continue;
      }
      x.globalAlpha = v === "l" ? 1 : 0.28;
      const ch = s.tiles[y][z];
      let frame = 16;
      if (ch === "#") {
        frame = 0;
        if (s.tiles[y - 1]?.[z] === "#") frame |= 1;
        if (s.tiles[y]?.[z + 1] === "#") frame |= 2;
        if (s.tiles[y + 1]?.[z] === "#") frame |= 4;
        if (s.tiles[y]?.[z - 1] === "#") frame |= 8;
      } else if (ch === "g") frame = 18;
      x.drawImage(
        s.assets.walls[frame] as unknown as CanvasImageSource,
        px,
        py,
      );
      if (s.plankton[y][z] === "*") {
        x.fillStyle = "#8ff";
        x.beginPath();
        x.arc(px + 16, py + 16, 3, 0, 7);
        x.fill();
      }
    }
  x.globalAlpha = 1;
  x.restore();
  for (const p of s.predators)
    if (p.lit && p.state !== "den")
      sprite(
        x,
        s.assets[p.kind],
        p,
        s.animTime,
        p.kind === "lanternjaw" && p.state === "wander" ? 8 : 0,
      );
  for (const d of s.drifters)
    if (d.lit) sprite(x, s.assets.drifter, d, s.animTime);
  for (const c of s.inkClouds) {
    x.fillStyle = "rgba(0,0,8,.8)";
    x.beginPath();
    x.arc(c.x, c.y, c.radius, 0, 7);
    x.fill();
  }
  for (const p of s.pulses) {
    x.strokeStyle =
      p.tint === "cyan" ? "#5ff" : p.tint === "violet" ? "#a7f" : "#f95";
    x.lineWidth = 4;
    x.beginPath();
    const [o, q] = pos(p.ox, p.oy);
    x.arc(o, q, p.front * 32, 0, 7);
    x.stroke();
  }
  sprite(x, s.assets.glimmerfin, s.forager, s.animTime);
}
function sprite(
  x: CanvasRenderingContext2D,
  a: readonly DeepReadonly<ImageBitmap>[],
  b: { x: number; y: number; dir?: Direction },
  t: number,
  off = 0,
) {
  const base = { down: 0, up: 2, left: 4, right: 6 }[b.dir ?? "down"];
  x.drawImage(
    a[
      Math.min(
        a.length - 1,
        off + (off ? Math.floor(t * 8) % 8 : base + (Math.floor(t * 8) % 2)),
      )
    ] as unknown as CanvasImageSource,
    b.x - 16,
    b.y - 16,
  );
}
function drawMenu(
  s: RS,
  x: CanvasRenderingContext2D,
  items: readonly string[],
) {
  items.forEach((v, i) => {
    const r = rect(s, i)!;
    x.fillStyle = i === s.menuIndex ? "#174858" : "#071521";
    x.fillRect(r.x, r.y, r.w, r.h);
    text(x, v, 640, r.y + 34, 20, i === s.menuIndex ? "#dff" : "#789");
  });
}
export const game: Game<FathomState, FathomDebugApi> = {
  async initialize(api: InitApi<FathomState>) {
    for (const a of C.ACTIONS)
      api.input.register(a, { keys: [...C.BINDINGS[a]] });
    Object.values(C.CUES).forEach((v, i) =>
      api.audio.define(v, {
        freq: 180 + i * 90,
        freqTo: 500 - i * 40,
        durationMs: 100 + i * 40,
        gain: 0.14,
      }),
    );
    const load = (f: string, n: number) =>
      Promise.all(
        Array.from({ length: n }, (_, i) =>
          api.assets.loadImage(`${f}/${i}.png`),
        ),
      );
    const [glimmerfin, lanternjaw, gloamfin, flarefish, drifter, bloom, walls] =
        await Promise.all([
          load("glimmerfin", 8),
          load("lanternjaw", 16),
          load("gloamfin", 8),
          load("flarefish", 8),
          load("drifter", 8),
          load("flare-bloom", 8),
          load("trench-walls", 19),
        ]),
      assets = {
        glimmerfin,
        lanternjaw,
        gloamfin,
        flarefish,
        drifter,
        bloom,
        walls,
      };
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("depth", (s) => s.depth);
    api.diagnostics.register("score/lives", (s) => `${s.score}/${s.lives}`);
    api.diagnostics.register(
      "G / V / R",
      (s) =>
        `${s.brightness.toFixed(2)} / ${s.visionRadius} / ${s.windowRadius}`,
    );
    api.diagnostics.register(
      "sonar / ink",
      (s) => `${s.sonar.cooldown.toFixed(2)} / ${s.ink.cooldown.toFixed(2)}`,
    );
    api.diagnostics.register("plankton", (s) => s.planktonRemaining);
    api.diagnostics.register(
      "forager",
      (s) => `${s.forager.tx},${s.forager.ty} ${s.forager.dir}`,
    );
    api.diagnostics.register("predators", (s) =>
      s.predators
        .map((p) => `${p.kind}:${p.state}@${p.tx},${p.ty}`)
        .join(" | "),
    );
    return [initial(assets), debug(assets)];
  },
  update(s, a, dt) {
    let n = input(mutable(s), a),
      acc = n.accumulator + Math.max(0, dt);
    while (acc + 1e-10 >= C.TICK_DT) {
      n = tick({ ...n, accumulator: 0 }, a);
      acc -= C.TICK_DT;
    }
    return { ...n, accumulator: acc, muted: a.audio.muted() };
  },
  render(s, a: RenderApi) {
    const x = a.ctx;
    x.imageSmoothingEnabled = false;
    x.fillStyle = BACKGROUND;
    x.fillRect(0, 0, C.STAGE_W, C.STAGE_H);
    if (["countdown", "playing", "paused", "cleared"].includes(s.screen)) {
      renderMaze(s, x);
      x.fillStyle = "#040b18";
      x.fillRect(0, 0, 1280, 80);
      x.fillRect(0, 656, 1280, 64);
      text(x, String(s.score).padStart(6, "0"), 155, 55, 40);
      text(x, C.DIVE_LABEL, 640, 30, 16, "#578");
      text(
        x,
        `DEPTH ${s.depth}     SONAR ${s.sonar.ready ? "READY" : "…"}     INK ${s.ink.ready ? "READY" : "…"}`,
        810,
        696,
        18,
      );
    }
    const cover = () => {
      x.fillStyle = "rgba(1,5,15,.82)";
      x.fillRect(0, 0, 1280, 720);
    };
    if (s.screen === "title") {
      cover();
      text(x, C.TITLE_TEXT, 640, 230, 92);
      text(x, C.TAGLINE_TEXT, 640, 290, 20, "#6bd");
      drawMenu(s, x, C.TITLE_ITEMS);
    }
    if (s.screen === "howto") {
      cover();
      text(x, "HOW TO DIVE", 640, 95, 38);
      [
        "ARROWS / WASD  SWIM",
        "SPACE  SONAR     SHIFT  INK     ESC  PAUSE",
        "",
        "LANTERNJAW HUNTS LIGHT",
        "GLOAMFIN HUNTS SOUND",
        "FLAREFISH HUNTS IN ITS FLASH",
        "",
        "EAT PLANKTON TO GROW YOUR LIGHT.",
        "SONAR REMEMBERS PATHS BEYOND YOUR WINDOW.",
        "",
        "PRESS ENTER, SPACE, ESC, OR TAP",
      ].forEach((v, i) =>
        text(x, v, 640, 165 + i * 40, 17, i > 2 && i < 6 ? "#fa8" : "#9bd"),
      );
    }
    if (s.screen === "paused") {
      cover();
      text(x, "DIVE PAUSED", 640, 220, 40);
      drawMenu(s, x, C.PAUSE_ITEMS);
    }
    if (s.screen === "gameover") {
      cover();
      text(x, "THE DARK TOOK YOU", 640, 210, 42, "#f87");
      text(x, `SCORE ${s.score} · DEPTH ${s.depth}`, 640, 275, 22);
      drawMenu(s, x, C.GAMEOVER_ITEMS);
    }
    if (s.screen === "countdown") text(x, "DIVE", 640, 375, 70);
    if (s.screen === "cleared")
      text(x, `DEPTH ${s.depth} CLEARED`, 640, 375, 42);
  },
};
