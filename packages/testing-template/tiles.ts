import { range } from 'd3';
import iter from 'iterare';
import {
  constructSimpleTileFactory,
  rotateSlots,
  Tile,
} from 'wave-function-collapse';

const slots = [0, 1, 2, 3, 4, 5] as const;
export type Slots = typeof slots[number];
export const slotSet = new Set(slots);
export type Sockets = 0 | 1 | 2 | 3;
export enum TileType {
  smallTurn = 'smTrn',
  largeTurn = 'lgTrn',
  cross = 'cross',
  intersection = 'intersection',
  double = 'double',
  blank = 'blank',
  end = 'end',
}

export interface TileIdentifier {
  type: TileType;
  rotations?: number;
  allSockets?: Sockets[];
}
function tileIdBuilder(
  t: TileType,
  r?: number,
  sock?: Iterable<Sockets>,
): TileIdentifier {
  return {
    type: t,
    rotations: r,
    allSockets: sock ? Array.from(sock) : undefined,
  };
}

export type IdString = `${TileType}&${string}&${number}`;
export function idToString(id: TileIdentifier): IdString {
  const t = id.type;
  const r = id.rotations ?? 0;
  const f = id.allSockets ? id.allSockets.join('-') : '0';
  return `${t}&${f}&${r}`;
}
const idMaker: (...args: Parameters<typeof tileIdBuilder>) => IdString = (
  t,
  r,
  sock?,
) => {
  return idToString(tileIdBuilder(t, r, sock));
};

export function idFromString(ids: string): TileIdentifier {
  const [type, sockString, rotString] = ids.split('&');
  const sockets: Sockets[] = sockString
    .split('-')
    .map((v) => Number.parseInt(v, 10) as Sockets);
  return tileIdBuilder(
    type as TileType,
    Number.parseInt(rotString, 10),
    sockets,
  );
}
type Tl = Tile<Sockets, Slots, IdString>;
const slotOrder = [0, 1, 2, 3, 4, 5] as const
const tileBuilder = constructSimpleTileFactory<Sockets, Slots, IdString>(slots);
function rotationBuilder(base: Tl, noRot = 6) {
  const id = idFromString(base.id);
  const baseSockets = slotOrder.map(v => base.sockets[v]);
  return range(1, noRot).map((i) =>
  {
    const rotatedSockets = rotateSlots(baseSockets,[...slotOrder],i)
    const rotatedTile = tileBuilder(
      idToString(tileIdBuilder(id.type, i, id.allSockets)),
      rotatedSockets,
    )
  return rotatedTile}
  );
}
const sockets: Sockets[] = [1, 2];
const tiles: Tl[] = [];
for (const s of sockets) {
  const smallTurn = tileBuilder(idMaker(TileType.smallTurn, 0, [s, 0]), [
    s,
    s,
    0,
    0,
    0,
    0,
  ]);
  tiles.push(smallTurn, ...rotationBuilder(smallTurn));

  const bigTurn = tileBuilder(idMaker(TileType.largeTurn, 0, [s, 0]), [
    s,
    0,
    s,
    0,
    0,
    0,
  ]);
  tiles.push(bigTurn, ...rotationBuilder(bigTurn));

  const intersection = tileBuilder(idMaker(TileType.intersection, 0, [s, 0]), [
    s,
    0,
    s,
    0,
    s,
    0,
  ]);
  tiles.push(intersection, ...rotationBuilder(intersection, 2));
  const basicDouble = tileBuilder(idMaker(TileType.double, 0, [s, 0]), [
    s,
    s,
    0,
    s,
    s,
    0,
  ]);
  tiles.push(basicDouble, ...rotationBuilder(basicDouble, 3));
}
const pairs: Array<[Sockets, Sockets]> = [[1, 2]];
for (const [h, t] of pairs) {
  const cross = tileBuilder(idMaker(TileType.cross, 0, [h, t, 0]), [
    t,
    h,
    0,
    t,
    0,
    h,
  ]);
  const crossI = tileBuilder(idMaker(TileType.cross, 0, [t, h, 0]), [
    h,
    t,
    0,
    h,
    0,
    t,
  ]);
  const double = tileBuilder(idMaker(TileType.double, 0, [h, t, 0]), [
    h,
    h,
    0,
    t,
    t,
    0,
  ]);
  tiles.push(
    cross,
    ...rotationBuilder(cross),
    crossI,
    ...rotationBuilder(crossI),
    double,
    ...rotationBuilder(double),
  );
}

const blank = tileBuilder(
  idToString(tileIdBuilder(TileType.blank, 0, [0])),
  [0, 0, 0, 0, 0, 0],
);
tiles.push(blank);
export const outTiles = new Map(tiles.map((tl) => [tl.id, tl]));
console.log(tiles);
// Console.log(tiles.toJS());
