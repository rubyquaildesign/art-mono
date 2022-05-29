/* eslint-disable capitalized-comments */
import * as h from '@rupertofly/h/src/main';
import * as c from 'colours';
// import Capture from '@rupertofly/capture-client';
import {
  List,
  Map as IMap,
  Range,
  Record as IRecord,
  Set as ISet,
} from 'immutable';
import {
  Cell,
  CellFactory,
  CellProps,
  Field,
  Tile,
  TileFactory,
  TileProps,
  WaveFunctionCollapse,
} from 'wave-function-collapse';
import type { Debug } from 'wave-function-collapse';

const [wid, hei] = [1080, 1920];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
canvas.setAttribute('hidden', 'true');
const content = document.createElement('pre');
document.body.append(content);
document.body.setAttribute('style', 'background-color:#202224;');
content.setAttribute(
  'style',
  'font-family:"Comic Code Ligatures";line-height:16px;font-size:16px;color:#cf6d71;',
);
const ctx = canvas.getContext('2d')!;
const {
  drawLoop,
  drawShape,
  bezierSpline,
  splineBuilder,
  Tween,
  anim,
  Vec: { lerp, r2d, d2r },
} = h;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

// const client = new Capture(6969, canvas);
// client.start({
//   frameRate: 30,
//   lengthIsFrames: true,
//   maxLength: 60 * 7,
//   name: 'testing-template',
// });

const rad = wid / 2;
const pi = Math.PI;
const tau = Math.PI * 2;
const PI_12 = pi / 2;
const {
  E: _esq,
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

enum Slots {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}
enum Sockets {
  EMPTY,
  LINE,
}
enum TileIds {
  TOP_LEFT = 'TopLeft',
  BOTTOM_RIGHT = 'BottomRight',
  TOP_RIGHT = 'TopRight',
  BOTTOM_LEFT = 'BottomLeft',
  BLANK = 'blank',
  CROSS = 'cross',
  LEFT_T = 'LeftT',
  RIGHT_T = 'RightT',
  TOP_T = 'TopT',
  BOTTOM_T = 'BottomT',
  HOZ = 'hoz',
}
const testMap = IMap([
  [TileIds.BLANK, 0.001],
  [TileIds.TOP_LEFT, 0.001],
]);
const wfc = new WaveFunctionCollapse<Slots, Sockets, number, TileIds>();
wfc.tileWeighting = testMap;
wfc.isDebug = false;
wfc.matchingSlot = (slot) => {
  switch (slot) {
    case Slots.DOWN:
      return Slots.UP;
    case Slots.UP:
      return Slots.DOWN;
    case Slots.LEFT:
      return Slots.RIGHT;
    default:
      return Slots.LEFT;
  }
};
const F_WID = 48;
const F_HEI = 48;
const rows = Range(0, F_HEI, 1)
  .map((i) => document.createElement('div'))
  .map((div) => {
    content.append(div);
    return div;
  })
  .toArray();
const spans = Range(0, F_HEI * F_WID, 1)
  .map((i) => document.createElement('span'))
  .map((span, i) => {
    const y = Math.floor(i / F_WID);
    rows[y].append(span);
    return span;
  })
  .toArray();
wfc.boundarySocket = Sockets.EMPTY;
wfc.adjacentCells = (here: number) => {
  const x = here % F_WID;
  const y = Math.floor(here / F_WID);
  const toI = (x: number, y: number) => {
    if (x < 0 || x >= F_WID || y < 0 || y >= F_HEI) return 'boundary' as const;
    return x + y * F_WID;
  };

  return IMap<Slots, number | 'boundary'>()
    .set(Slots.UP, toI(x, y - 1))
    .set(Slots.DOWN, toI(x, y + 1))
    .set(Slots.LEFT, toI(x - 1, y))
    .set(Slots.RIGHT, toI(x + 1, y));
};
const sockets: Record<Slots, Sockets> = {
  down: Sockets.EMPTY,
  left: Sockets.EMPTY,
  right: Sockets.EMPTY,
  up: Sockets.EMPTY,
};
const plugs = {
  down: ISet([Sockets.EMPTY]),
  left: ISet([Sockets.EMPTY]),
  right: ISet([Sockets.EMPTY]),
  up: ISet([Sockets.EMPTY]),
};
const tile: TileFactory<Sockets, Slots, TileIds> = IRecord<
  TileProps<Sockets, Slots, TileIds>
>(
  {
    sockets: IMap<Slots, Sockets>(sockets),
    id: TileIds.BLANK,
    plugs: IMap<Slots, ISet<Sockets>>(plugs),
  },
  'tile',
);
function simpleTileCreator(
  id: TileIds,
  v: [top: Sockets, right: Sockets, down: Sockets, left: Sockets],
) {
  return tile({
    id,
    plugs: IMap({
      up: ISet([v[0]]),
      right: ISet([v[1]]),
      down: ISet([v[2]]),
      left: ISet([v[3]]),
    } as Record<Slots, ISet<Sockets>>) as any,
    sockets: IMap({
      up: v[0],
      right: v[1],
      down: v[2],
      left: v[3],
    }) as any,
  });
}
const tiles = IMap<TileIds, Tile<Sockets, Slots, TileIds>>()
  .set(TileIds.TOP_LEFT, simpleTileCreator(TileIds.TOP_LEFT, [1, 0, 0, 1]))
  .set(TileIds.LEFT_T, simpleTileCreator(TileIds.LEFT_T, [1, 0, 1, 1]))
  // .set(TileIds.TOP_T, simpleTileCreator(TileIds.TOP_T, [1, 1, 0, 1]))
  // .set(TileIds.BOTTOM_T, simpleTileCreator(TileIds.BOTTOM_T, [0, 1, 1, 1]))
  .set(TileIds.RIGHT_T, simpleTileCreator(TileIds.RIGHT_T, [1, 1, 1, 0]))
  .set(TileIds.BLANK, simpleTileCreator(TileIds.BLANK, [0, 0, 0, 0]))
  .set(TileIds.HOZ, simpleTileCreator(TileIds.HOZ, [0, 1, 0, 1]))
  // .set(TileIds.CROSS, simpleTileCreator(TileIds.CROSS, [1, 1, 1, 1]))
  .set(TileIds.TOP_RIGHT, simpleTileCreator(TileIds.TOP_RIGHT, [1, 1, 0, 0]))
  .set(
    TileIds.BOTTOM_LEFT,
    simpleTileCreator(TileIds.BOTTOM_LEFT, [0, 0, 1, 1]),
  )
  .set(
    TileIds.BOTTOM_RIGHT,
    simpleTileCreator(TileIds.BOTTOM_RIGHT, [0, 1, 1, 0]),
  );

wfc.tiles = tiles;

const cell: CellFactory<Slots, number, TileIds> = IRecord<
  CellProps<Slots, number, TileIds>
>(
  {
    collapsed: false,
    id: 0,
    slots: ISet([Slots.DOWN, Slots.LEFT, Slots.UP, Slots.RIGHT]),
    tileMap: ISet(Object.entries(TileIds).map((v) => v[1])),
  },
  'cell',
);
const cells = Range(0, F_WID * F_HEI)
  .toMap()
  .map((i) => cell().set('id', i) as Cell<Slots, number, TileIds>);
wfc.field = cells;
const solve = wfc.solveGenerator();
function renderFunc() {
  const generatedValue = solve.next();
  if (!generatedValue.value) return true;
  const [field, ent, debug] = generatedValue.value;

  const elements = field
    .toList()
    .map((cell, i) => {
      if (typeof cell === 'number') return cell;
      if (ent?.get(i) !== 1) return 'waiting' as const;
      return field.get(i)!.tileMap.first<TileIds>();
    })
    .map((v, k) => {
      switch (v) {
        case TileIds.BLANK:
          return '∙';
        case TileIds.CROSS:
          return '┼';
        case TileIds.TOP_LEFT:
          return '╯';
        case TileIds.TOP_RIGHT:
          return '╰';
        case TileIds.BOTTOM_LEFT:
          return '╮';
        case TileIds.BOTTOM_RIGHT:
          return '╭';
        case TileIds.HOZ:
          return '─';
        case TileIds.VERT:
          return '│';
        case TileIds.RIGHT_T:
          return '├';
        case TileIds.LEFT_T:
          return '┤';
        case TileIds.TOP_T:
          return '┴';
        case TileIds.BOTTOM_T:
          return '┬';
        case 'waiting':
          return field.get(k)!.tileMap.size.toString(16);
        default:
          return 'x';
      }
    });
  for (const [i, e] of elements.entries()) {
    spans[i].innerHTML = e;
    spans[i].setAttribute('style', '');
    let c = '#55585f';
    if (/[\dab]/.test(e)) spans[i].setAttribute('style', `color:${c};`);
    if (wfc.isDebug && debug) {
      switch (debug.get(i)) {
        case 'sourceCell':
          c = 'blue';
          break;
        case 'collapsed':
          c = 'red';
          break;
        case 'checkedCell':
          c = 'green';
          break;
        case 'noChange':
          c = 'brown';
          break;
        case 'changed':
          c = 'yellow';
          break;
        default:
          c = 'black';
          break;
      }
      spans[i].setAttribute('style', `color:${c};`);
    }
  }
  window.requestAnimationFrame(renderFunc);
}
window.addEventListener('keypress', (e) => {
  if (e.code !== 'Space') return true;
  renderFunc();
});
// #endregion helpers
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.lineCap = 'round';
ctx.fillRect(0, 0, wid, hei);
ctx.imageSmoothingEnabled = true;

// const render = async () => {
//   ctx.fillStyle = c.red;
//   ctx.lineWidth = 3;
//   ctx.fillRect(0, 0, wid, hei);
//   ctx.save();
//   ctx.translate(wid / 2, hei / 2);
//   // Ctx.scale(1.2, 1.2);
//   h.anim.update(true);
//   ctx.restore();
//   // await client.capture();
//   requestAnimationFrame(render);
// };
// void render();
// Uncomment for central
// ctx.translate(rad, rad);
