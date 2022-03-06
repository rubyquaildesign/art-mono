import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import * as TG from 'town-gen';
import paperTexUrl from './paper.jpg';
import { resolveConfig } from 'prettier';
import { interval } from 'd3';
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

const img = async (url: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.addEventListener('load', () => {
      resolve(img);
    });
    img.src = url;
  });
const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 90,
  name: '09-architecture',
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
ctx.strokeStyle = c.white;
ctx.fillRect(0, 0, wid, hei);
ctx.lineWidth = 4;
const paper = await img(paperTexUrl);
const towngen = TG.generate();
// Uncomment for central

function render() {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const t = towngen.next();
  ctx.fillStyle = c.white;
  ctx.strokeStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  if (t.done) return;
  ctx.lineWidth = 4;
  ctx.translate(rad, hei / 2);
  ctx.globalAlpha = 1;
  for (const seg of t.value.segments) {
    ctx.lineWidth = seg.metaInfo.hw ? 6 : 4;
    ctx.strokeStyle = c.grey;
    if (seg.metaInfo.ending) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
    }
    if (seg.metaInfo.creationReason === 'created from split') {
      ctx.strokeStyle = c.blue;
      ctx.lineWidth = 2;
    }
    const l = seg.road;
    const line = [l.start, l.end] as [h.Vp, h.Vp];
    ctx.beginPath();
    h.drawLine(line, ctx);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  for (const seg of t.value.rejects) {
    const l = seg.road;
    const line = [l.start, l.end] as [h.Vp, h.Vp];
    ctx.strokeStyle = c.blue;
    ctx.beginPath();
    h.drawLine(line, ctx);
    ctx.stroke();
  }
  ctx.translate(-rad, -(hei / 2));
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.3;
  ctx.drawImage(paper, 0, 0);
}
setInterval(() => {
  render();
}, 500);
