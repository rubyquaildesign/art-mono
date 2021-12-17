import { SVGPathData } from 'svg-pathdata';
import 'fractal-noise';
import NS from 'simplex-noise';
import iter from 'iterare';
import C from '@rupertofly/capture-client';
import { range } from 'd3-array';
import * as h from '../src/main';
import * as df from './newDiffGrowth';
import { DifferentialLine, Node } from './diffGrowth';
import svgString from './heartpot.svg?raw';
import { hcl } from 'd3-color';
/* eslint-disable no-multi-assign */
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
const ctx = canvas.getContext('2d');
const width = (canvas.width = 1080);
const height = (canvas.height = 1080);
const shadingCanvas = new OffscreenCanvas(width, height);
const growCanvas = new OffscreenCanvas(width, height);
const scCtx = shadingCanvas.getContext('2d');
const gCtx = growCanvas.getContext('2d');

const radius = height / 2;
const gashSize = 0.8 * width;
const offset = 0.1 * width;
const client = new C(6969, canvas);
const f = new DOMParser();
const set = new df.Settings();
const s = f.parseFromString(svgString, 'text/xml');
const pot: SVGPolygonElement = s.querySelector('#pot');
const mask: SVGPolygonElement = s.querySelector('#mask');
const sourceSq: SVGRectElement = s.querySelector('#diff');
const sB = sourceSq.getBBox();
const potLoop = iter(pot.points)
  .map(({ x, y }) => new h.Vec(x, y))
  .toArray();
const maskLoop = iter(mask.points)
  .map(({ x, y }) => new h.Vec(x, y))
  .toArray();
const lx = sourceSq.x.baseVal.value;
const ly = sourceSq.y.baseVal.value;
const lw = sourceSq.width.baseVal.value;
const lh = sourceSq.height.baseVal.value;
const sourceLoop = [
  new df.Node(lx, ly, set),
  new df.Node(lx + lw, ly, set),
  new df.Node(lx + lw, ly + lh, set).fix(),
  new df.Node(lx, ly + lh, set).fix(),
];
// const data = new SVGPathData(path);
const bg = '#fffaf0';
const pink = '#ff6188';
const org = '#fc9867';
const lndk = hcl(pink);
lndk.l -= 10;

ctx.fillStyle = bg;
ctx.fillRect(0, -radius, width, height);

const diffPath = new df.Path(sourceLoop, set);
diffPath.isClosed = true;
diffPath.bounds = maskLoop;
const world = new df.World(set);
world.addPath(diffPath);

let t = 0;
// const colChoice = [pink, red, pink, pink];
client.start({
  frameRate: 60,
  lengthIsFrames: true,
  maxLength: 60 * 30,
  name: 'growthHeart',
});
let j = 4;

// const ln = new DifferentialLine();
async function render() {
  gCtx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fill();
  ctx.fillStyle = pink;
  for (const path of world.paths) {
    ctx.beginPath();
    // Const bez = h.catmulToBezier(path.nodes);
    // h.drawLoop(path.nodes, true, ctx);
    h.drawLoop(h.spline(path.nodes, 5, true, path.nodes.length * 1), true, ctx);
    ctx.fill();
  }

  world.iterate();

  ctx.beginPath();
  ctx.fillStyle = org;
  h.drawLoop(potLoop, true, ctx);
  ctx.fill();

  // t += 1;
  // await client.capture();
  requestAnimationFrame(render);
}
render();
