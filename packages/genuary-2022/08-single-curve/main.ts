import * as h from '@rupertofly/h/src/main';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import { LUTBuilder, Vec } from '@rupertofly/h';
import { line } from 'd3';

const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 60,
  lengthIsFrames: true,
  maxLength: 6 * 60,
  name: '08-single-curve',
});

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
ctx.lineWidth = 4;
ctx.lineCap = 'round';
// Uncomment for central
// ctx.translate(rad, rad);

class HilbertC {
  order = 1;
  n = 2 ** this.order;
  totalPoints = this.n ** 2;
  hilbert(i: number): Vec {
    let index = i & 3;
    const points = [vec(0, 0), vec(0, 1), vec(1, 1), vec(1, 0)];
    let v = points[index];
    for (let j = 1; j < this.order; j++) {
      i = i >>> 2;
      index = i & 3;
      const length = 2 ** j;
      let temp: number;

      if (index === 0) {
        temp = v.x;
        v.x = v.y;
        v.y = temp;
      } else if (index === 1) {
        v.y += length;
      } else if (index === 2) {
        v.addScalar(length);
      } else if (index === 3) {
        temp = length - 1 - v.x;
        v.x = length - 1 - v.y;
        v.y = temp;
        v.x += length;
      }
    }
    return v;
  }

  path(o: number) {
    this.order = o;
    this.n = 2 ** this.order;
    this.totalPoints = this.n ** 2;
    const start = flr(this.totalPoints / 4);
    const end = this.totalPoints - start;
    return d3.range(start, end).map((i) => this.hilbert(i));
  }
}

const curve = new HilbertC();
curve.order = 1;
const testPoints = curve.path(5).map((v) => {
  const sz = curve.n;
  const a = (v.x / sz) * tau;
  const d = 50 + (1 - sqrt(v.y / sz)) * 1200;
  return vec(cos(a) * d, sin(a) * d);
});
console.log(testPoints);

const sp = [...h.spline(testPoints, 5, true, 12_000)];

const b = h.splineBuilder(testPoints, 5, true);
const lut = h.LUTBuilder(sp);

const lineAni = new h.Tween((t) => {
  ctx.beginPath();
  const start = b(0);
  const maxDist = lut.lut[lut.lut.length - 1].dist;
  const dist = maxDist * t;
  const endT = lut.get(t);
  ctx.moveTo(start[0], start[1]);
  for (let d = 1; d < dist; d += 2) {
    const pt = b(lut.getDist(d));
    ctx.lineTo(pt[0], pt[1]);
  }
  ctx.stroke();
  if (t > 0.99) {
    const out = (t - 0.999) / 0.001;
    const fill = d3.rgb(c.white);
    fill.opacity = out;
    ctx.fillStyle = fill.toString();
    ctx.fill();
  }
});
lineAni.interpolation(d3.easeQuadInOut);
lineAni.duration(5 * 60);
h.anim.add(lineAni);
async function render() {
  ctx.fillStyle = c.black;
  ctx.strokeStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  ctx.lineWidth = 4;
  ctx.save();
  ctx.translate(rad, rad);
  ctx.rotate(pi / 1.9);
  h.anim.update(true);
  ctx.restore();
  await client.capture();
  requestAnimationFrame(render);
}
render();
