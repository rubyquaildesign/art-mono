import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';

const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;

// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 30 * 12,
  name: '05-destroy-square',
});

const rad = wid / 2;
const pi = Math.PI;
const tau = Math.PI * 2;
const vec = (x: number, y: number) => new h.Vec(x, y);
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

class Segment implements SimulationNodeDatum {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  index: number;
  angle = 0;
  vAngle = 0;
  polygon?: h.Vp[];
  constructor(i: number, x: number, y: number) {
    this.index = i;
    this.x = x;
    this.y = y;
  }

  rotate() {
    this.angle += this.vAngle;
    return this;
  }
}
const segments = d3
  .range(36)
  .map((i) => new Segment(i, rnd() - 0.5, rnd() - 0.5));

let delauneyDiagram = d3.Delaunay.from<Segment>(
  segments,
  (p) => p.x,
  (p) => p.y,
);
let voronoiDiagram = delauneyDiagram.voronoi([-200, -200, 200, 200]);

function* expand() {
  for (const _ of d3.range(60)) {
    for (let seg of segments) {
      const i = seg.index;
      const pg = voronoiDiagram.cellPolygon(i);
      const [cx, cy] = d3.polygonCentroid(pg);
      const p = vec(seg.x, seg.y);
      const c = vec(cx, cy);
      const np = c.clone().sub(p).limit(3.6).add(p);
      seg.y = np.y;
      seg.x = np.x;
      seg.polygon = pg.map(([x, y]) => [x - np.x, y - np.y]);
      seg.vAngle = 0.01 - rnd() * 0.02;
    }

    delauneyDiagram = d3.Delaunay.from<Segment>(
      segments,
      (p) => p.x,
      (p) => p.y,
    );
    voronoiDiagram = delauneyDiagram.voronoi([-200, -200, 200, 200]);
    yield;
  }
}

const links: Array<d3.SimulationLinkDatum<Segment>> = [];

const sim = d3.forceSimulation(segments);
const nodeForce = d3.forceManyBody();
nodeForce.strength(-200);
let linkForce: d3.ForceLink<Segment, d3.SimulationLinkDatum<Segment>>;

function establishSim() {
  for (const seg of segments) {
    const nbs = [...voronoiDiagram.neighbors(seg.index)].filter(
      (n) => n > seg.index,
    );
    for (const nbIndex of nbs) {
      const nb = segments[nbIndex];
      links.push({ source: seg, target: nb, index: links.length });
    }
  }

  linkForce = d3.forceLink(links);
  linkForce.strength(0.1);
  sim
    .force('link', linkForce)
    .force('charge', nodeForce)
    .force('center', d3.forceCenter());
  sim.stop();
}

const expander = expand();
let expanded = false;
let setup = false;
async function render() {
  ctx.save();
  ctx.fillStyle = c.white;
  ctx.fillRect(0, 0, wid, hei);
  ctx.translate(rad, rad);

  if (expanded) {
    if (!setup) {
      establishSim();
      setup = true;
    }

    sim.tick();
  } else {
    const task = expander.next();
    expanded = task.done!;
  }

  if (links.length > 0) {
    for (const link of links) {
      if (typeof link.source === 'object' && typeof link.target === 'object') {
        ctx.lineWidth = 5;
        ctx.strokeStyle = c.purple;
        ctx.beginPath();
        h.drawLine(
          [
            [link.source.x, link.source.y],
            [link.target.x, link.target.y],
          ],
          ctx,
        );
        ctx.stroke();
      }
    }

    for (let seg of sim.nodes()) seg.rotate();
  }

  for (let seg of sim.nodes()) {
    ctx.save();
    ctx.fillStyle = c.red;
    ctx.strokeStyle = c.white;
    ctx.translate(seg.x, seg.y);
    ctx.rotate(seg.angle);
    ctx.beginPath();
    h.drawLoop(seg.polygon!, true, ctx);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  await client.capture();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
