import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';

const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const rimCanvas = new OffscreenCanvas(wid, hei);
const rimTex = new OffscreenCanvas(wid, hei);
const surfCanvas = new OffscreenCanvas(wid, hei);
const surfTex = new OffscreenCanvas(wid, hei);
const rmctx = rimCanvas.getContext('2d')!;
const smctx = surfCanvas.getContext('2d')!;
const rctx = rimTex.getContext('2d')!;
const sctx = surfTex.getContext('2d')!;
// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 720,
  name: '03-space',
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
ctx.strokeStyle = c.black;
ctx.fillRect(0, 0, wid, hei);

const noise = ns.makeNoise3D(12);
// Uncomment for central
sctx.fillStyle = c.yellow;
sctx.fillRect(0, 0, wid, hei);
rctx.fillStyle = c.red;

const innerDiskRadius = 250;
const outerDistRadius = 450;
const planetRadius = 200;

function noisePoint(
  dispSize: number,
  x: number,
  t: number,
  ps: h.Vec,
  noiseScale = 1,
) {
  const a = x % tau;
  const dsp = noise(
    ps[0] + cos(a) * noiseScale,
    ps[1] + sin(a) * noiseScale,
    t,
  );
  return dsp * dispSize;
}

function ribbon(
  topY: number,
  botY: number,
  width: number,
  dispSize: number,
  r: number,
  t: number,
  ps: h.Vec,
) {
  const count = flr(width / 2);
  const rad = count;
  const topPt: h.Vec[] = [];
  const botPt: h.Vec[] = [];
  for (let ix of d3.range(count)) {
    const tx = ix * 2 - rad;
    const disp = noisePoint(dispSize, ix / 16 + r, t, ps, 1.3);
    topPt.push(new h.Vec(tx, topY + disp));
    botPt.unshift(new h.Vec(tx, botY + disp));
  }

  return [...topPt, ...botPt];
}

const p1 = new h.Vec(rnd() * 256, rnd() * 256);
const p2 = new h.Vec(rnd() * 256, rnd() * 256);
const p3 = new h.Vec(rnd() * 256, rnd() * 256);

function drawPlanetWaves(t: number) {
  sctx.save();

  sctx.clearRect(0, 0, wid, hei);
  sctx.fillStyle = c.yellow;
  sctx.fillRect(0, 0, wid, hei);
  sctx.translate(rad, rad);
  sctx.rotate(pi / 18);
  sctx.beginPath();
  const r1 = ribbon(-250, -50, 500, 30, t / 36, t / 180, p1);
  sctx.fillStyle = c.red + 'c6';
  h.drawLoop(r1, true, sctx);
  sctx.fill();
  sctx.beginPath();
  const r2 = ribbon(-120, 120, 500, 30, t / 56, t / 180, p2);
  sctx.fillStyle = c.orange + 'a6';
  h.drawLoop(r2, true, sctx);
  sctx.fill();
  sctx.beginPath();
  const r3 = ribbon(50, 250, 500, 30, t / 36, t / 180, p3);
  sctx.fillStyle = c.purple + 'a6';
  h.drawLoop(r3, true, sctx);
  sctx.fill();
  sctx.filter = '';
  sctx.restore();
}

class Spinner {
  a: number;
  constructor(public dist: number, public speed: number, startingA: number) {
    this.a = startingA;
  }

  update() {
    this.a = (tau + this.a + this.speed) % tau;
    return this;
  }

  draw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const x = cos(this.a) * this.dist;
    const y = sin(this.a) * this.dist;
    h.drawDot([x, y], 3, context as any);
  }
}
async function refreshDisk() {
  rctx.save();
  const d = rctx.createImageData(wid, hei, { colorSpace: 'srgb' });
  const bmp = await createImageBitmap(rimTex);
  rctx.clearRect(0, 0, wid, hei);
  rctx.filter = 'blur(2px) opacity(98%)';
  rctx.drawImage(bmp, 0, 0, wid, hei);
  rctx.filter = '';
  rctx.restore();
}

const spinners: Spinner[] = [];
for (let _ of d3.range(1000)) {
  const a = rnd() * tau;
  const d = innerDiskRadius + (outerDistRadius - innerDiskRadius) * rnd();
  const n = new Spinner(d, 0.000005 * d + rnd() * 0.02, a);
  spinners.push(n);
}

function drawSpinners() {
  rctx.save();
  rctx.translate(rad, rad);
  rctx.fillStyle = c.yellow;
  for (let n of spinners) {
    const band = flr(n.dist / 6) % 2;
    rctx.fillStyle = [c.yellow, c.white][band];

    n.draw(rctx);
    rctx.fill();
    n.update();
  }

  rctx.restore();
}

function setupMasks() {
  const a = pi / 2.2;
  const ca = cos(a);
  const sa = sin(a);
  rmctx.globalCompositeOperation = 'source-over';
  rmctx.clearRect(0, 0, wid, hei);
  rmctx.save();
  rmctx.translate(rad, rad);
  rmctx.save();
  rmctx.transform(cos(a / 10), sin(a / 10), -sin(a / 10), cos(a / 10), 0, 0);
  rmctx.transform(1, 0, 0, cos(a), 0, -sin(a));
  rmctx.beginPath();
  rmctx.filter = 'blur(5px)';
  rmctx.ellipse(0, 0, outerDistRadius, outerDistRadius, 0, 0, tau, false);
  rmctx.closePath();
  rmctx.ellipse(0, 0, innerDiskRadius, innerDiskRadius, 0, 0, tau, true);
  rmctx.closePath();
  rmctx.fillStyle = c.red;
  rmctx.fill();

  rmctx.restore();
  rmctx.fillStyle = c.fullBlack;
  rmctx.globalCompositeOperation = 'destination-out';
  rmctx.filter = 'blur(5px)';
  rmctx.beginPath();
  rmctx.ellipse(0, 0, planetRadius + 10, planetRadius + 10, pi + a / 10, 0, pi);
  rmctx.fill();
  rmctx.globalCompositeOperation = 'source-over';
  rmctx.save();
  rmctx.globalCompositeOperation = 'source-in';
  rmctx.transform(cos(a / 10), sin(a / 10), -sin(a / 10), cos(a / 10), 0, 0);
  rmctx.transform(1, 0, 0, ca, 0, -sa);
  rmctx.translate(-rad, -rad);
  rmctx.filter = 'blur(0px)';
  rmctx.drawImage(rimTex, 0, 0);
  rmctx.restore();
  rmctx.restore();
  rmctx.globalCompositeOperation = 'source-over';
  smctx.clearRect(0, 0, wid, hei);
  smctx.save();
  smctx.translate(rad, rad);
  smctx.fillStyle = c.blue;
  h.drawDot([0, 0], planetRadius, smctx as any);
  smctx.fill();
  smctx.restore();
  smctx.save();
  smctx.globalCompositeOperation = 'source-in';
  smctx.drawImage(surfTex, 0, 0);
  smctx.restore();
  rmctx.globalCompositeOperation = 'source-over';
}

let frameCount = 0;

async function render() {
  ctx.fillStyle = c.black;
  ctx.strokeStyle = c.black;
  ctx.fillRect(0, 0, wid, hei);
  await refreshDisk();
  drawPlanetWaves(frameCount / 2);
  drawSpinners();
  setupMasks();
  ctx.drawImage(surfCanvas, 0, 0);
  ctx.drawImage(rimCanvas, 0, 0);
  frameCount++;
  if (frameCount > 24) await client.capture();
  requestAnimationFrame(render);
}

render();
