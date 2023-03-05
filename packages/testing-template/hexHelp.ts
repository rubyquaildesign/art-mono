import { Vec } from '@rupertofly/h';

import { immerable } from 'immer';

const SQRT3 = Math.sqrt(3);
const TAU = Math.PI * 2;
export const pointyW = (size: number) => SQRT3 * size;
export const pointyH = (size: number) => size * 2;
const vec = (x: number, y: number) => new Vec(x, y);
export function pointyHexCorner(center: Vec, size: number, i: number) {
  const angDeg = 60 * i - 30;
  const angRad = (Math.PI / 180) * angDeg;
  return vec(
    center.x + size * Math.cos(angRad),
    center.y + size * Math.sin(angRad),
  );
}
export function flatHexCorner(center: Vec, size: number, i: number) {
  const angDeg = 60 * i;
  const angRad = (Math.PI / 180) * angDeg;
  return vec(
    center.x + size * Math.cos(angRad),
    center.y + size * Math.sin(angRad),
  );
}
export function pointyHex(center: Vec, size: number) {
  const out: Vec[] = [];
  for (let i = 0; i < 6; i++) {
    out.push(pointyHexCorner(center, size, i));
  }
  return out;
}

const fmat = [SQRT3, SQRT3 / 2, 0, 3 / 2] as const;
const bmat = [SQRT3 / 3, -1 / 3, 0, 2 / 3] as const;

export class HexCoord {
  [immerable] = true;
  q = 0;
  r = 0;
  constructor(_q: number, _r: number) {
    this.q = _q;
    this.r = _r;
  }

  private static readonly nbDir: readonly HexCoord[] = [
    HexCoord.from(1, 0),
    HexCoord.from(0, 1),
    HexCoord.from(-1, 1),
    HexCoord.from(-1, 0),
    HexCoord.from(0, -1),
    HexCoord.from(1, -1),
  ];

  get s() {
    return -this.q - this.r;
  }

  static from(q: number, r: number) {
    return new this(q, r);
  }

  static fromInt(i: number): HexCoord {
    const qref = i & 0xff_ff;
    const q = qref > 0x7f_ff ? qref - 0x1_00_00 : qref;
    const ref = (i >> 16) & 0xff_ff;
    const r = ref > 0x7f_ff ? ref - 0x1_00_00 : ref;
    return HexCoord.from(q, r);
  }

  add(other: HexCoord) {
    return new HexCoord(this.q + other.q, this.r + other.r);
  }

  get neighbours() {
    return HexCoord.nbDir.map((n) => this.add(n));
  }

  isEqual(other: HexCoord) {
    return this.q === other.q && this.r === other.r;
  }

  toVec(size: number) {
    const x = size * (SQRT3 * this.q + (SQRT3 / 2) * this.r);
    const y = size * (3 / 2) * this.r;
    return new Vec(x, y);
  }

  toInt(): number {
    const q = this.q & 0xff_ff;
    const r = (this.r & 0xff_ff) << 16;
    return q + r;
  }
}
const HEX_ANG = TAU / 6;
export class Layout {
  size: Vec;
  origin: Vec;
  constructor(size_: Vec, origin_: Vec) {
    this.size = size_;
    this.origin = origin_;
  }

  hexToPixel(hex: HexCoord) {
    const x = (fmat[0] * hex.q + fmat[1] * hex.r) * this.size.x;
    const y = (fmat[2] * hex.q + fmat[3] * hex.r) * this.size.y;
    return new Vec(x, y).add(this.origin);
  }

  private hexOff(i: number, sz = this.size) {
    const ang = (i + 0.5) * HEX_ANG;
    return new Vec(sz.x * Math.cos(ang), sz.y * Math.sin(ang));
  }

  private sideOff(i: number, sz = this.size) {
    const ang = i * HEX_ANG;
    const ns = sz.mul(SQRT3).div(vec(2, 2));
    return new Vec(ns.x * Math.cos(ang), ns.y * Math.sin(ang));
  }

  hexPolygon(hex: HexCoord, pgSize?: Vec) {
    const corners: Vec[] = [];
    const c = this.hexToPixel(hex);
    for (let i = 0; i < 6; i++) {
      const off = this.hexOff(i, pgSize);
      corners.push(vec(c.x + off.x, c.y + off.y));
    }
    return corners;
  }

  midPoints(hex: HexCoord, pgSize?: Vec) {
    const midPoints: Vec[] = [];
    const c = this.hexToPixel(hex);
    for (let i = 0; i < 6; i++) {
      const off = this.sideOff(i, pgSize);
      midPoints.push(vec(c.x + off.x, c.y + off.y));
    }
    return midPoints;
  }
}
export function fromInt(i: number): HexCoord {
  const qref = i & 0xff_ff;
  const q = qref > 0x7f_ff ? qref - 0x1_00_00 : qref;
  const ref = (i >> 0xf) & 0xff_ff;
  const r = ref > 0x7f_ff ? ref - 0x1_00_00 : ref;
  return HexCoord.from(q, r);
}
const n = HexCoord.from(2, 3);
