import * as h from '@rupertofly/h/src/main';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import {
  Delaunay,
  interpolateGreys,
  interpolateLab,
  interpolateRainbow,
  interpolateTurbo,
  rgb,
} from 'd3';
import { Cell, Debug, WaveFunctionCollapse } from 'wave-function-collapse';
import iter from 'iterare';
import { produce } from 'immer';
import { fromInt, HexCoord, Layout } from './hexHelp';
import {
  idFromString,
  IdString,
  idToString,
  outTiles,
  Slots,
  slotSet,
  Sockets,
  TileIdentifier,
  TileType,
} from './tiles';
import { makeNoise2D } from 'open-simplex-noise';

const [wid, hei] = [1080, 1920];
const [wrad, hrad] = [wid / 2, hei / 2];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const {
  drawLoop,
  drawShape,
  bezierSpline,
  splineBuilder,
  Tween,
  anim,
  Vec,
} = h;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

const rad = wid / 2;
const pi = Math.PI;
const tau = Math.PI * 2;
const {
  random: rnd,
  floor: flr,
  ceil,
  abs,
  atan2,
  sin,
  cos,
  tan,
  min,
  max,
  sqrt,
} = Math;
// #endregion helpers
ctx.fillStyle = c.black;
ctx.strokeStyle = c.white;
ctx.fillRect(0, 0, wid, hei);
ctx.lineWidth = 2;
ctx.imageSmoothingEnabled = false;
// Uncomment for central
ctx.translate(wid / 2, hei / 2);
const f = new Layout(vec(24, 24), vec(0, 0));
const mutSet = createMutSet(8);
const mutSet2 = createMutSet(9).map((v) => v.toInt());
const client = new Capture(6969, canvas);
client.start({
  frameRate: 60,
  lengthIsFrames: true,
  maxLength: 60 * 100,
  name: 'wfs',
});
type C = Cell<Slots, IdString, number>;
const cellFactory: (id: HexCoord) => Cell<Slots, IdString, number> = (
  id: HexCoord,
) => ({
  collapsed: false,
  observed: false,
  id: id.toInt(),
  slots: slotSet,
  tileMap: iter(outTiles)
    .map((v) => v[0])
    .toSet(),
});

let field = iter(mutSet)
  .map((v) => [v.toInt(), cellFactory(v)] as [number, C])
  .toMap();

field = produce(field, (draft) => {
  const c = draft.get(HexCoord.from(0, 0).toInt())!;
  c.collapsed = true;
  c.tileMap = new Set([
    [...c.tileMap].find((v) => v.startsWith('intersection')),
  ]);
});
const wfc = new WaveFunctionCollapse<Sockets, Slots, IdString, number>();
wfc.isDebug = false;
wfc.field = field;
wfc.tiles = outTiles;
wfc.boundarySocket = 0;
wfc.matchingSlot = (s) => ((s + 3) % 6) as Slots;
wfc.adjacentCells = (c) => {
  const nb = HexCoord.fromInt(c).neighbours.map(
    (v, i) =>
      [i as Slots, wfc.field.has(v.toInt()) ? v.toInt() : 'boundary'] as [
        Slots,
        number | 'boundary',
      ],
  );
  return new Map(nb);
};
const mutMap = new Map<number, number>();
for (const [index, coord] of mutSet.entries()) {
  mutMap.set(coord.toInt(), index);
}
const vorSet = mutSet
  .map((cd) => f.hexToPixel(cd))
  .map((v) => {
    const a = v.angle();
    const c = v.len();
    const n = vec(c, 0).rotate(a + Math.sqrt(c) / 20);
    return n;
  });
const d = Delaunay.from(
  mutSet.map((x, i) => vorSet[i]),
  (d) => d.x,
  (d) => d.y,
);
const v = d.voronoi([-wid / 2, -hei / 2, wid / 2, hei / 2]);
// Wfc.isDebug = true;
const gen = wfc.gen();
const g: Array<ReturnType<typeof gen.next>['value']> = [];

ctx.lineJoin = 'bevel';

ctx.fillStyle = c.red;
ctx.strokeStyle = c.lightGrey;
for (const hx of mutSet) {
  ctx.lineWidth = 1;
  // Const pgon = f.hexPolygon(hx, vec(2, 2));
  // ctx.beginPath();
  // h.drawLoop(pgon, true, ctx);
  // ctx.fill();
  // const o = f.hexPolygon(hx, vec(24, 24));
  // ctx.beginPath();
  // h.drawLoop(o, true, ctx);
  // ctx.stroke();
}

window.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') return true;
  void render();
});
type dt = NonNullable<ReturnType<NonNullable<typeof wfc['debug']>['get']>>;
const sockDict: Record<Sockets, string> = {
  0: c.black,
  1: c.red,
  2: c.green,
  3: c.blue,
};
function createMutSet(mr = 6) {
  const mutSet = [];
  for (let q = -mr; q <= mr; q++) {
    const r1 = Math.max(-mr, -q - mr);
    const r2 = Math.min(mr, -q + mr);
    for (let r = r1; r <= r2; r++) {
      mutSet.push(HexCoord.from(q, r));
    }
  }
  return mutSet as Readonly<HexCoord[]>;
}
wfc.isDebug = false;
const noise = makeNoise2D(12)
const ns = (y) => Math.abs(noise(1, y))
let count = 0
wfc.random = () => ns(count++);
async function render() {
  const interp = interpolateLab(c.white, c.black);
  const debCol: globalThis.Record<dt, string> = {
    '': c.grey,
    changed: c.green,
    collapsed: c.red,
    noChange: c.purple,
    sourceCell: c.orange,
    checkedCell: c.deepPurple,
    conflict: 'pink',
  };
  const result = gen.next();
  if (!result.value) {
    await client.capture();
    await client.stop(true);
    window.requestAnimationFrame(render);
    return;
  }
  ctx.fillStyle = c.black;
  ctx.fillRect(-wrad, -hrad, wid, hei);
  const [field, entropy, debug] = result.value as [
    typeof wfc.wave,
    typeof wfc.entropy,
    typeof wfc.debug,
  ];
  for (const [coords, cell] of field) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = c.grey;

    const debugs = debug.get(coords)!;

    ctx.fillStyle = c.green;
    ctx.strokeStyle = ctx.fillStyle;

    const cen = vorSet[mutMap.get(coords)];
    const acen = vorSet[mutMap.get(coords)];
    ctx.lineWidth = 4;
    const tile = cell.tileMap.values().next().value;
    const type = idFromString(tile).type;
    const mps = f.midPoints(HexCoord.fromInt(coords)).map((v, i) => {
      const neighbour = HexCoord.fromInt(coords).neighbours[i]!;
      const nit = neighbour.toInt();
      const nix = mutMap.get(neighbour.toInt()) ?? -1;
      if (nix === -1) {
        return v;
      }
      const ix = vorSet[nix]!;
      return acen.clone().mix(ix, 0.5);
    });
    const ts = wfc.tiles;
    const slots = wfc.tiles.get(tile).sockets;
    const tiles = iter(cell.tileMap)
      .map((id) => wfc.tiles.get(id))
      .toArray();
    const slotSock = iter(slotSet)
      .map(
        (slt) =>
          [
            slt,
            iter(tiles)
              .map((tl) => tl.sockets[slt])
              .toSet(),
          ] as [Slots, Set<Sockets>],
      )
      .toMap();

    // for (const [slt, sck] of slotSock) {
    //   ctx.fillStyle = `#${sck.has(0) ? 'e' : '5'}${sck.has(1) ? 'e' : '5'}${
    //     sck.has(2) ? 'e' : '5'
    //   }`;
    //   const pt = mps[slt];
    //   const r = pt.clone().sub(cen).absAngle();
    //   ctx.beginPath();
    //   ctx.ellipse(pt.x, pt.y, 6, 6, r, pi / 2, 3 * (pi / 2));
    //   ctx.fill();
    // }

    const rotations = idFromString(tile).rotations ?? 0;
    const sockets = idFromString(tile).allSockets;
    ctx.strokeStyle = sockDict[sockets[0]];
    if (cell.collapsed) {
      switch (type) {
        case TileType.smallTurn:
          drawSmallTurn(mps, rotations, cen);
          break;
        case TileType.largeTurn:
          drawLargeTurn(mps, rotations, cen);

          break;
        case TileType.double:
          drawDouble(mps, rotations, cen, slots);

          break;
        case TileType.intersection:
          drawIntersection(mps, rotations, cen);

          break;
        case TileType.cross:
          drawCross(mps, rotations, cen, slots);
          break;
        case TileType.end:
          drawEnd(mps, rotations, cen);
          break;
        default:
          // Ctx.beginPath();
          // h.drawDot(cen, 2, ctx);
          // ctx.fill();
          break;
      }
    }
    ctx.strokeStyle = c.red;
    // for (const [slt, sck] of slotSock) {
    //   ctx.fillStyle = `#${sck.has(0) ? 'e' : '5'}${sck.has(1) ? 'e' : '5'}${
    //     sck.has(2) ? 'e' : '5'
    //   }`;
    //   const pt = mps[slt];
    //   const r = pt.clone().sub(cen).absAngle();
    //   ctx.beginPath();
    //   ctx.ellipse(pt.x, pt.y, 6, 6, r, pi / 2, 3 * (pi / 2));
    //   ctx.fill();
    // }
  }
  // await client.capture();
  window.requestAnimationFrame(render);
}
function drawCross(
  mps: h.Vec[],
  rotations: number,
  cen: h.Vec,
  socks: Readonly<Record<Slots, Sockets>>,
) {
  ctx.strokeStyle = sockDict[socks[(rotations % 6) as Slots]];
  const cs = mps[(rotations + 1) % 6];
  const ce = mps[(rotations + 5) % 6];
  const ss = mps[rotations];
  const se = mps[(rotations + 3) % 6];
  ctx.beginPath();
  ctx.moveTo(ss.x, ss.y);
  ctx.lineTo(se.x, se.y);
  ctx.stroke();
  ctx.strokeStyle = sockDict[socks[((rotations + 1) % 6) as Slots]];
  ctx.beginPath();
  ctx.moveTo(cs.x, cs.y);
  ctx.quadraticCurveTo(cen.x, cen.y, ce.x, ce.y);
  ctx.stroke();
}
function drawEnd(mps: h.Vec[], rotations: number, cen: h.Vec) {
  const start = mps[rotations];
  const ang = cen.sub(start).angle();
  const sz = cen.dist(start);
  const mid = vec(sz / 2, 0)
    .rotate(ang)
    .add(start);
  const c1 = vec(sz / 2, 0)
    .rotate(ang - tau / 4)
    .add(cen);
  const c2 = vec(sz / 2, 0)
    .rotate(ang - tau / 4)
    .add(cen);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(mid.x, mid.y, c1.x, c1.y, cen.x, cen.y);
  ctx.bezierCurveTo(c2.x, c2.y, mid.x, mid.y, start.x, start.y);
  ctx.stroke();
}
function drawIntersection(mps: h.Vec[], rotations: number, cen: h.Vec) {
  {
    const first = mps[rotations];
    const last = mps[(rotations + 2) % 6];
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.bezierCurveTo(cen.x, cen.y, cen.x, cen.y, last.x, last.y);
    ctx.stroke();
    const first2 = mps[(rotations + 2) % 6];
    const last2 = mps[(rotations + 4) % 6];
    ctx.beginPath();
    ctx.moveTo(first2.x, first2.y);
    ctx.bezierCurveTo(cen.x, cen.y, cen.x, cen.y, last2.x, last2.y);
    ctx.stroke();
    const first3 = mps[(rotations + 4) % 6];
    const last3 = mps[(rotations + 6) % 6];
    ctx.beginPath();
    ctx.moveTo(first3.x, first3.y);
    ctx.bezierCurveTo(cen.x, cen.y, cen.x, cen.y, last3.x, last3.y);
    ctx.stroke();
  }
}

function drawDouble(
  mps: h.Vec[],
  rotations: number,
  cen: h.Vec,
  slots: Readonly<Record<Slots, Sockets>>,
) {
  {
    const has2 = iter(Object.values(slots)).some((v) => v === 2);
    const has1 = iter(Object.values(slots)).some((v) => v === 1);
    const isDouble = has1 && has2;
    ctx.strokeStyle = sockDict[slots[rotations]];
    const first = mps[rotations];
    const last = mps[(rotations + 1) % 6];
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.quadraticCurveTo(cen.x, cen.y, last.x, last.y);
    ctx.stroke();
    const first2 = mps[(rotations + 3) % 6];
    const last2 = mps[(rotations + 4) % 6];
    ctx.strokeStyle = sockDict[slots[((rotations + 3) % 6) as Slots]];
    ctx.beginPath();
    ctx.moveTo(first2.x, first2.y);
    ctx.quadraticCurveTo(cen.x, cen.y, last2.x, last2.y);
    ctx.stroke();
  }
}

function drawSmallTurn(mps: h.Vec[], rotations: number, cen: h.Vec) {
  {
    const first = mps[rotations];
    const last = mps[(rotations + 1) % 6];
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.quadraticCurveTo(cen.x, cen.y, last.x, last.y);
    ctx.stroke();
  }
}

function drawLargeTurn(mps: h.Vec[], rotations: number, cen: h.Vec) {
  {
    const first = mps[rotations];
    const last = mps[(rotations + 2) % 6];
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.quadraticCurveTo(cen.x, cen.y, last.x, last.y);
    ctx.stroke();
  }
}
void render();
