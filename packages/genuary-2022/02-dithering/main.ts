import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import ns from 'simplex-noise';
import * as c from 'colours';
import { range } from 'd3';
import cap from '@rupertofly/capture-client';
// eslint-disable
const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const client = new cap(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 90,
  name: '02-dithering',
});
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
/* eslint-enable */
// #endregion helpers
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.fillRect(0, 0, wid, hei);

// Uncomment for central
// ctx.translate(rad, rad);
const bayer0 = [
  [0, 2],
  [3, 1],
];
function _bayer(x: number, y: number, n: number): number {
  if (n === 0) {
    const _x = x % 2;
    const _y = y % 2;
    return bayer0[_y][_x];
  }
  const s = 2 ** (n + 1);
  const half = s / 2;
  const _x = x % s;
  const _y = y % s;

  if (_y < half) {
    if (_x < half) {
      return 4 * _bayer(x, y, n - 1) + 0;
    } else {
      return 4 * _bayer(x, y, n - 1) + 2;
    }
  } else if (_y >= half) {
    if (_x < half) {
      return 4 * _bayer(x, y, n - 1) + 3;
    } else {
      return 4 * _bayer(x, y, n - 1) + 1;
    }
  }
  return 0;
}
function bayer(x: number, y: number, n: number) {
  return _bayer(x, y, n) / 2 ** (2 * n + 2);
}
const diam = 64;
const radius = diam / 2;
const shapeValues: number[] = [];
for (let x = 0; x < diam; x++) {
  for (let y = 0; y < diam; y++) {
    const angle = (tau + (atan2(y - radius, x - radius) + pi / 2)) % tau;
    const a = angle / tau;
    let b = x / diam;
    let bv = bayer(x, y, 1);
    if (a > bv) {
      shapeValues[y * diam + x] = 1;
    } else {
      shapeValues[y * diam + x] = 0;
    }
  }
}
const anim = new h.Group();
const offset = (wid - 960) / 2;
const ratio = 960 / diam;

ctx.fillStyle = c.grey;
const inner = radius / 4;
const halfVec = new h.Vec(radius, radius);
for (let [i, v] of shapeValues.entries()) {
  const y = flr(i / diam);
  const x = i % diam;
  const angle = (tau + (atan2(y - radius, x - radius) + pi / 2)) % tau;
  const a = angle / tau;
  const pos = new h.Vec(x, y);
  const d = pos.dist(halfVec);
  const inCircle = d < radius && d > inner;
  if (v && inCircle) {
    const tween = new h.Tween((t) => {
      ctx.beginPath();
      ctx.fillStyle = c.black;
      ctx.ellipse(x, y, 0.4, 0.4, 0, 0, t * tau);
      ctx.fill();
    });
    tween.drawAfterCompletion(true);
    tween.delay(a * 30);
    tween.duration(60);
    tween.interpolation(d3.easeCubicInOut);
    anim.add(tween);
  }
}
anim.getTweens().forEach((t) => t.drawAfterCompletion(true));
async function render() {
  ctx.fillStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  ctx.save();
  ctx.translate(offset, offset);
  ctx.scale(ratio, ratio);
  anim.update();
  ctx.restore();
  await client.capture();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
