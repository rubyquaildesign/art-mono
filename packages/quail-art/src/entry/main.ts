import { Vec } from '../lib/vec.js';
import { range } from 'd3';
import { c, maths as m } from '../lib/index.js';
/* eslint-disable no-var */
import * as D3 from 'd3';
const PI = Math.PI;
const TAU = Math.PI * 2;
const vec = (x: number, y: number) => new Vec(x, y);
const { random, floor, ceil, abs, atan2, sin, cos, tan, min, max, sqrt } = Math;
const forExport = {
  random,
  floor,
  ceil,
  abs,
  range,
  m,
  c,
  atan2,
  sin,
  cos,
  tan,
  min,
  max,
  PI,
  TAU,
  d3: D3,
  sqrt,
  vec,
  lerp: Vec.lerp,
  r2d: Vec.rad2deg,
  d2r: Vec.deg2rad,
};
Object.entries(forExport).forEach(([key, value]) => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (globalThis as any)[key as any] = value;
});
declare global {
  var {
    random,
    floor,
    ceil,
    range,
    abs,
    c,
    atan2,
    sin,
    cos,
    tan,
    min,
    max,
    PI,
    TAU,
    // @ts-expect-error a weird umd bug
    d3,
    sqrt,
    vec,
    lerp,
    r2d,
    d2r,
  }: typeof forExport;
}
export {
  random,
  floor,
  ceil,
  abs,
  range,
  m,
  c,
  atan2,
  sin,
  cos,
  tan,
  min,
  max,
  PI,
  TAU,
  D3 as d3,
  sqrt,
  vec,
};
