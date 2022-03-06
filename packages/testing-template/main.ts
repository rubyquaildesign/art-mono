import * as h from '@rupertofly/h/src/main';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import { Road } from 'town-gen/src/Segment';
const [wid, hei] = [1080, 1080];
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
  maxLength: 90,
  name: 'testing-template',
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

// Uncomment for central
// ctx.translate(rad, rad);
const mouseInfo = {
  mouse: vec(0, 0),
  pts: [vec(0, 0), vec(50, 50), vec(200, 400), vec(500, 500)],
};
canvas.addEventListener('mousemove', (event) => {
  mouseInfo.mouse = vec(event.offsetX, event.offsetY);
});
window.addEventListener('keyup', (event) => {
  const key = event.key;
  document.querySelector('#info')!.innerHTML = key;
  switch (key) {
    case '1':
      mouseInfo.pts[0] = mouseInfo.mouse.clone();
      break;
    case '2':
      mouseInfo.pts[1] = mouseInfo.mouse.clone();
      break;

    case '3':
      mouseInfo.pts[2] = mouseInfo.mouse.clone();
      break;

    case '4':
      mouseInfo.pts[3] = mouseInfo.mouse.clone();
      break;

    default:
      break;
  }
  const l1 = new h.Line(mouseInfo.pts[0], mouseInfo.pts[1]);
  const l2 = new h.Line(mouseInfo.pts[2], mouseInfo.pts[3]);
  console.log(l1, l2);
});
function render() {
  ctx.lineWidth = 2;
  const l1 = new h.Line(mouseInfo.pts[0], mouseInfo.pts[1]);
  const l2 = new h.Line(mouseInfo.pts[2], mouseInfo.pts[3]);
  const intersection = l1.intersectionPoint(l2);
  ctx.strokeStyle = c.black;
  ctx.fillStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  h.drawDot(mouseInfo.mouse, 5, ctx);
  ctx.stroke();
  for (const pt of mouseInfo.pts) {
    h.drawDot(pt, 5, ctx);
    ctx.stroke();
  }
  h.drawLine(l1.arr, ctx);
  ctx.stroke();
  h.drawLine(l2.arr, ctx);
  ctx.stroke();
  document.querySelector('#info')!.textContent = `${
    intersection.kind
  }, ${JSON.stringify(intersection, null, 1)}`;
  if (intersection.kind === 'intersect') {
    const pt = intersection.pt;

    ctx.strokeStyle = c.red;
    h.drawDot(pt, 5, ctx);
    ctx.stroke();
    const tt = intersection.tFromA;
    ctx.strokeStyle = c.green;
    const other = h.Vec.lerp(l1.start, l1.end, tt);
    h.drawDot(other, 5, ctx);
    ctx.stroke();
    ctx.strokeStyle = c.blue;
    const mid = h.Vec.lerp(l1.start, l1.end, 0.5);
    h.drawDot(mid, 5, ctx);
    ctx.stroke();
  }
  ctx.strokeStyle = c.purple;
  const prj = l1.projectPointToLine(l2.start);
  if (!prj.onLine) ctx.strokeStyle = c.orange;
  h.drawDot(prj.pt, 5, ctx);
  ctx.stroke();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
