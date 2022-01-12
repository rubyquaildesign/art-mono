import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import * as clip from 'js-angusj-clipper';
const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;

// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 30 * 30,
  name: '04-next-fidenza',
});

const vec = (x: number, y: number) => new h.Vec(x, y);
const rad = wid / 2;
const pi = Math.PI;
const tau = Math.PI * 2;
const clipLib = await clip.loadNativeClipperLibInstanceAsync(
  clip.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback,
);
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
class Flowfield {
  r: number;
  field: Float32Array;

  constructor(scale: number, radius: number, seed = Math.random()) {
    this.r = radius;
    const d = this.r * 2;
    this.field = new Float32Array(d ** 2);
    const noise = ns.makeNoise2D(seed);
    const centre = vec(0, 0);
    for (let i = 0; i < this.field.length; i++) {
      const x = (i % d) - this.r;
      const y = flr(i / d) - this.r;
      const pos = vec(x, y);
      const dist = pos.dist(centre) / this.r;
      const sqDist = Math.cbrt(dist);
      const cVec = pos.clone();
      const noiseValue = pi + pi * noise(x * scale, y * scale);
      const nVec = vec(1, 0).rotateTo(noiseValue);
      const thisVec = cVec
        .clone()
        .mulScaler(sqDist * 0.01)
        .add(nVec.clone().mulScaler(1 - sqDist))
        .add(
          pos
            .clone()
            .rotate(pi / 4)
            .mulScaler((1 - sqDist) * 0.0001),
        );

      this.field.set([thisVec.absAngle()], i);
    }
  }

  get(x: number, y: number) {
    const _x = this.r + x;
    const _y = this.r + y;
    const i = _y * (this.r * 2) + _x;
    return this.field[i];
  }
}
const f = new Flowfield(0.1, 64);
ctx.lineWidth = 1;

for (let x = -64; x < 64; x++) {
  for (let y = -64; y < 64; y++) {
    const p = vec(x * (400 / 64), y * (400 / 64));
    const v = f.get(x, y);
    const colour = d3.interpolateRainbow(v / tau);
    if (vec(x, y).dist(vec(0, 0)) > f.r) continue;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    h.drawLine([p, p.clone().add(vec(1, 0).rotate(v).setLength(8))], ctx);
    ctx.stroke();
  }
}

const cover = d3.range(128).map((i) => {
  const t = tau * (i / 128);
  return vec(cos(t) * 64, sin(t) * 64);
});
class Particle {
  pos: h.Vec;
  vel = vec(0, 0);
  speedLim = 0.3;
  readonly col = [c.red, c.orange, c.yellow, c.green, c.blue, c.purple, ''][
    flr(rnd() * 7)
  ];
  constructor(x: number, y: number) {
    this.pos = vec(x, y);
  }

  push(v: h.Vec) {
    this.vel = this.vel.clone().add(v).limit(this.speedLim);
    return this;
  }

  update() {
    this.pos.add(this.vel);
    return this;
  }

  draw(scale = 1) {
    h.drawDot(this.pos.clone().mulScaler(scale), 3, ctx);
  }
}
const pcls = d3.range(512).map((i) => {
  return new Particle(
    cos(rnd() * tau) * sqrt(rnd()) * 50,
    sin(rnd() * tau) * sqrt(rnd()) * 50,
  );
});
ctx.lineWidth = 0.1;
let fc = 0;
async function render() {
  ctx.save();
  ctx.fillStyle = c.white;
  ctx.strokeStyle = c.black;
  ctx.fillRect(0, 0, wid, hei);
  ctx.translate(rad, rad);
  ctx.scale(400 / 64, 400 / 64);

  const v = d3.Delaunay.from(
    pcls,
    (p) => p.pos.x,
    (p) => p.pos.y,
  );
  const vor = v.voronoi([-64, -64, 64, 64]);
  const xyPGs: { pcl: Particle; pgon: any[][] }[] = [];
  for (let [i, p] of pcls.entries()) {
    ctx.fillStyle = p.col;
    // p.draw();

    const { x, y } = p.pos;
    const ff = f.get(flr(x), flr(y));
    const cp = vor.cellPolygon(i);
    const clippedPg = clipLib.clipToPaths({
      clipType: clip.ClipType.Intersection,
      subjectFillType: clip.PolyFillType.EvenOdd,
      subjectInputs: [{ closed: true, data: h.toXyShape([cp]) }],
      clipInputs: [{ data: h.toXyShape([cover]) }],
    });
    if (!clippedPg) continue;
    if (!clippedPg[0]) continue;
    xyPGs.push({ pcl: p, pgon: clippedPg });
    const newPg = h.toVpShape(clippedPg)[0];
    const r = h.minDistFromCentroid(newPg);
    const [cx, cy] = d3.polygonCentroid(newPg as any);
    // h.drawDot([cx, cy], r, ctx);

    const spaceForce = vec(cx, cy).sub(p.pos);
    p.push(spaceForce.clone().limit(2 / spaceForce.len())).push(
      vec(1, 0).rotateTo(ff).mulScaler(0.2),
    );
    p.update();
  }

  function drawGroup(col: string) {
    const pgs = xyPGs.filter((d) => d.pcl.col === col);
    const redJoins = clipLib.clipToPaths({
      clipType: clip.ClipType.Union,
      subjectFillType: clip.PolyFillType.EvenOdd,
      subjectInputs: pgs.map((r) => ({ closed: true, data: r.pgon })),
    })!;
    const offsetJoins = clipLib.offsetToPaths({
      delta: -3 * 10000,
      offsetInputs: redJoins.map((p) => ({
        data: p,
        endType: clip.EndType.ClosedPolygon,
        joinType: clip.JoinType.Square,
      })),
    })!;
    const drawable = h
      .toVpShape(offsetJoins)
      .map((lp) => [
        ...h.spline(lp, min(lp.length - 1, 5), true, lp.length * 5),
      ]);
    ctx.fillStyle = col;
    h.drawShape(drawable, ctx);
    ctx.fill();
  }

  drawGroup(c.red);
  drawGroup(c.green);
  drawGroup(c.blue);
  drawGroup(c.yellow);
  drawGroup(c.orange);
  drawGroup(c.purple);
  // for (let x = -64; x < 64; x++) {
  //   for (let y = -64; y < 64; y++) {
  //     const p = vec(x, y);
  //     const v = f.get(x, y);
  //     const colour = d3.interpolateRainbow(v / tau);
  //     if (vec(x, y).dist(vec(0, 0)) > f.r) continue;
  //     ctx.strokeStyle = 'black';
  //     ctx.beginPath();
  //     h.drawLine([p, p.clone().add(vec(1, 0).rotate(v).setLength(8))], ctx);
  //     ctx.stroke();
  //   }
  // }
  ctx.restore();
  if (fc > 30) await client.capture();
  fc++;
  requestAnimationFrame(render);
}
render();
