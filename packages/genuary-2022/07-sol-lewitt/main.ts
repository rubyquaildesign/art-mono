import * as h from '@rupertofly/h/src/main';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import * as contour from 'd3-contour';
const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 30 * 30,
  name: '07-sol-lewitt',
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
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.fillRect(0, 0, wid, hei);
const n = ns.makeNoise2D(12);
const structureNoise = ns.makeNoise3D(42);
const structRad = 256;

const noiseCanvas = new OffscreenCanvas(wid, hei);
const nctx = noiseCanvas.getContext('2d')!;
for (const x of d3.range(wid))
  for (const y of d3.range(hei)) {
    const shade = d3.rgb(c.black);
    shade.opacity = (1 + n(x / 1.8, y / 1.8)) * 0.05;
    nctx.fillStyle = shade.toString();
    nctx.fillRect(x, y, 1, 1);
  }
// Uncomment for central
// ctx.translate(rad, rad);
ctx.fillStyle = c.red;
h.drawDot([rad, rad], 50, ctx);
ctx.fill();
// ctx.globalCompositeOperation = 'luminosity';
ctx.shadowColor = c.black + '11';
ctx.shadowOffsetX = 1;
ctx.shadowOffsetY = 1;
let t = 0;
const conGen = contour
  .contours()
  .size([structRad, structRad])
  .thresholds([0.2, 0.4, 0.6]);
async function render() {
  ctx.fillStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  ctx.save();
  ctx.translate(140, 140);
  ctx.scale(800 / structRad, 800 / structRad);
  const pts = d3.range(structRad ** 2).map((i) => {
    const x = i % structRad;
    const y = flr(i / structRad);
    const noise = structureNoise(x / 12, y / 12, t / 48);
    const d =
      vec(x, y)
        .sub(vec(structRad / 2, structRad / 2))
        .len() /
      (structRad / 2);
    return 0.3 * noise + (1 - d);
  });
  const pgs = conGen(pts);

  const cols = ['#7acbf5', '#eaacb8', c.white, '#eaacb8'];
  for (const [i, polygon] of pgs.entries()) {
    const colour = cols[i % 4];
    ctx.fillStyle = colour;
    for (const shape of polygon.coordinates) {
      h.drawShape(shape, ctx);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.drawImage(noiseCanvas, 0, 0);
  t++;
  await client.capture();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
