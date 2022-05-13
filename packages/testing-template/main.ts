import * as h from '@rupertofly/h/src/main';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import { generate } from 'town-gen/src/main';
import { Segment } from 'town-gen/src/Segment';
import * as d3 from 'd3';
import iter from 'iterare';
const [wid, hei] = [1080, 1920];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

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

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 60 * 7,
  name: 'testing-template',
});

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
// #endregion helpers
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.lineCap = 'round';
ctx.fillRect(0, 0, wid, hei);
ctx.imageSmoothingEnabled = true;
function iterLast<N, U, T>(iter: Iterator<N, U, T>) {
  let v: IteratorResult<N, U>;
  let shouldIterate = true;
  while (shouldIterate) {
    v = iter.next();
    if (v.done) {
      shouldIterate = false;
      return v.value;
    }
  }
  return v.value;
}
const heatF = (v: h.Vec) => rad - vec(0, 0).dist(v);

const cityGen = generate(heatF);
const city = iterLast(cityGen)!.filter(
  (c) => c.minDistToPoint(vec(0, 0)) < rad / 2,
);
const m = d3.max<number>(city.map((c) => c.time))!;
const minimum = d3.min<number>(city.map((c) => c.time))!;
const colInterp = d3.interpolateLab(c.yellow, c.orange);
const drawFunc = (time: number) => {
  const drawable = city.filter((seg) => seg.time < time);
  for (const line of drawable) {
    ctx.strokeStyle = colInterp((time - line.time) / m);
    ctx.beginPath();
    h.drawLine([[...line.start.values()], [...line.end.values()]], ctx);
    ctx.stroke();
  }
};
const circDrawFunc = (t: number) => {
  ctx.strokeStyle = c.yellow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, rad * 0.51, rad * 0.51, -PI_12, 0, t * tau);
  ctx.stroke();
};
const t = new Tween(drawFunc)
  .duration(60 * 5)
  .drawAfterCompletion(true)
  .easeing(d3.easeCubicOut);
t.start();
const ct = new Tween(circDrawFunc);
ct.drawAfterCompletion(true).duration(120).easeing(d3.easeSinInOut);
t.chain(ct);
h.anim.add(t);
t.interpolation((t) => minimum + t * (m - minimum));
console.log(h.anim.getTweens());

const render = async () => {
  ctx.fillStyle = c.red;
  ctx.lineWidth = 3;
  ctx.fillRect(0, 0, wid, hei);
  ctx.save();
  ctx.translate(wid / 2, hei / 2);
  // ctx.scale(1.2, 1.2);
  h.anim.update(true);
  ctx.restore();
  await client.capture();
  requestAnimationFrame(render);
};
void render();
// Uncomment for central
// ctx.translate(rad, rad);
