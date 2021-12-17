import {
  randomUniform,
  Delaunay,
  polygonCentroid,
  interpolateRainbow,
  scaleLinear,
  easeCubicInOut,
  easeBounceInOut,
  easeBounceOut,
  easeBounce,
  easeQuadInOut,
  easeCircleInOut,
  easeSinInOut,
  range,
  interpolateLab,
} from 'd3';
import { iterate } from 'iterare';
import Cc from '@rupertofly/capture-client';
import * as h from '../src/main';
import * as CLIP from 'js-angusj-clipper/web';
import { drawRoundLoop } from '../src/main';
import { reverse } from 'd3-array';
import { DifferentialLine, Node } from './diffGrowth';

const det = (a: h.Vp, b: h.Vp) => a[0] * b[1] - b[0] * a[1];
const clipper = await CLIP.loadNativeClipperLibInstanceAsync(
  CLIP.NativeClipperLibRequestedFormat.WasmOnly,
);
console.log(clipper);

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d');
const width = 1080;
const height = 1920;
canvas.width = width;
canvas.height = height;
const client = new Cc(6969, canvas);
const pointCount = 256;
ctx.fillStyle = '#2d2a2e';
ctx.fillRect(0, 0, width, height);
const randWid = randomUniform(width);
const randHei = randomUniform(height);
const ptsIter = iterate(new Float32Array(pointCount * 2)).map((i) =>
  i % 2 ? randHei() : randWid(),
);
const ptsArray = new Float32Array(ptsIter);
const del = new Delaunay(ptsArray);
const v = del.voronoi([0, 0, width, height]);
const colours = [
  '#ff6188',
  '#fc9867',
  '#ffd866',
  '#a9dc76',
  '#78dce8',
  '#ab9df2',
] as const;
const domain = range(0, colours.length, 1 / colours.length);
const colscale = scaleLinear<string>()
  .domain(domain)
  .range(colours)
  .interpolate(interpolateLab);
for (let relaxCount = 0; relaxCount < 2000; relaxCount++) {
  for (const vp of iterate(v.cellPolygons())) {
    const [x, y] = polygonCentroid(vp as any);
    ptsArray.set([x, y], vp.index * 2);
  }

  v.update();
}

function sample<T>(object: ArrayLike<T>) {
  return object[Math.floor(Math.random() * object.length)];
}

function weightedChoice<T>(choices: [T, number][]) {
  const weights = choices.map(([_, w]) => w);
  let target = weights.reduce((a, b) => a + b, 0) * Math.random();
  for (const [value, weight] of choices) {
    target -= weight;
    if (target < 0) {
      return value;
    }
  }
}

const weight = iterate(v.cellPolygons())
  .map((pg) => {
    return {
      pg,
      point: new h.Vec(
        Array.from(ptsArray.slice(pg.index * 2, pg.index * 2 + 2)),
      ),
    };
  })
  .map(({ pg, point }) => {
    const d = point.dist([width / 2, height / 2]);
    const t = scaleLinear([0, (width / 2) * Math.SQRT2], [0, 1]).clamp(true)(d);
    const col = interpolateRainbow(t);
    ctx.fillStyle = col;
    // ctx.beginPath();
    // h.drawLoop(pg, true, ctx);
    // ctx.fill();
    return t;
  })
  .toArray();
const start = sample(del.hull);
const full: number[] = [];
function continueLine(visitedSoFar: number[]): number[] {
  const thisI = visitedSoFar[visitedSoFar.length - 1];
  full.push(thisI);
  const n = v.neighbors(thisI);
  const options = iterate(n)
    .filter((element) => !del.hull.includes(element))
    .filter((element) => !visitedSoFar.includes(element))
    .filter((pointI) => !full.includes(pointI))
    .map((element) => [element, weight[element]] as [number, number])
    .map(
      ([v, w]) => [v, del.hull.includes(v) ? 1 / 1000 : w] as [number, number],
    )
    .toArray();
  if (options.length === 0) return visitedSoFar;
  const next = weightedChoice(options);

  return continueLine([...visitedSoFar, next]);
}
function splitIntoChunk<T>(arr: T[], chunk: number) {
  const output: T[][] = [];
  for (let i = 0; i < arr.length; i += chunk) {
    let tempArray: T[];
    tempArray = arr.slice(i, i + chunk);
    output.push(tempArray);
  }
  return output;
}

function chunk<T>(array: T[], size: number) {
  const n = Math.ceil(array.length / size);
  return array.reduce((acc: T[][], value: T, ind: number) => {
    const subIndex = ind % n;

    if (!Array.isArray(acc[subIndex])) {
      acc[subIndex] = [value];
    } else {
      acc[subIndex].push(value);
    }

    return acc;
  }, []);
}

ctx.strokeStyle = '#a9dc76';
ctx.lineWidth = 8;
ctx.lineCap = 'round';
const lines: number[][] = [];
let availablePts = del.hull.filter((pt) => !full.includes(pt));
const st = sample(availablePts);
lines.push(continueLine([st]));
availablePts = availablePts.filter((pt) => !full.includes(pt));

console.log(lines);
// client.start({
//   frameRate: 60,
//   lengthIsFrames: true,
//   maxLength: 60 * 10,
//   name: 'spaghetti',
// });
const shapes: h.Vp[][][] = [];
for (const [i, line] of lines.entries()) {
  if (line.length < 3) continue;
  const pts = line.map((i) => Array.from(ptsArray.slice(i * 2, i * 2 + 2)));
  console.log(pts);
  const shape = iterate(line)
    .map((i) => v.cellPolygon(i))
    .map((pg) => h.toXyLoop(pg))
    .toArray();
  const finalXYShapes = clipper.clipToPaths({
    clipType: CLIP.ClipType.Union,
    subjectFillType: CLIP.PolyFillType.EvenOdd,
    subjectInputs: shape.map((sp) => ({ data: sp, closed: true })),
    cleanDistance: 0,
    strictlySimple: false,
  });
  const offsetShape = clipper.offsetToPaths({
    offsetInputs: [
      {
        data: finalXYShapes,
        endType: CLIP.EndType.ClosedPolygon,
        joinType: CLIP.JoinType.Miter,
      },
    ],
    delta: -500000,
  });
  shapes.push(h.toVpShape(offsetShape));
  const points = [
    ...h.spline(pts, Math.min(pts.length - 1, 3), false, pts.length * 24),
  ];
  h.anim.add(
    new h.Tween((t) => {
      ctx.strokeStyle = interpolateRainbow((t + i / lines.length) % 1);
      ctx.beginPath();
      h.drawLoop(points.slice(0, Math.floor(t * points.length)), false, ctx);
      ctx.stroke();
    })
      .duration(300)
      .easeing(easeSinInOut)
      .repeatDelay(0)
      .drawAfterCompletion(true)
      .yoyo(true)
      .repeat(-1),
  );
}

async function render() {
  ctx.lineWidth = 1;
  ctx.fillStyle = '#2d2a2e';
  ctx.strokeStyle = '#f0f0f022';

  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  v.render(ctx);
  ctx.stroke();
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 2;
  shapes.forEach((sp) => {
    ctx.beginPath();
    sp.map((lp) => drawRoundLoop(lp, 10, ctx));
    ctx.stroke();
  });
  ctx.lineWidth = 6;
  const line = lines[0];
  const pts = line.map((i) => Array.from(ptsArray.slice(i * 2, i * 2 + 2)));
  ctx.strokeStyle = '#a9dc7633';

  ctx.beginPath();
  // h.drawLoop(h.spline(pts, 3, false, 5000), false, ctx);
  ctx.stroke();
  const colours = ['#ff618855', '#78dce855', '#ffd86655'];
  const beziers = h.splineToBezier(pts, false);
  const bezCurves = splitIntoChunk(beziers, 4);
  bezCurves.pop();
  bezCurves.shift();
  const allLeft: h.Vp[][] = [];
  const allRight: h.Vp[][] = [];
  for (const [i, bez] of bezCurves.entries()) {
    const colour = colours[i % 3];
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(bez[0][0], bez[0][1]);
    ctx.bezierCurveTo(
      bez[1][0],
      bez[1][1],
      bez[2][0],
      bez[2][1],
      bez[3][0],
      bez[3][1],
    );
    ctx.stroke();
    let left: h.Vp[] = [];
    let right: h.Vp[] = [];
    for (let i of range(30)) {
      const t = i / 30;
      const m = h.Vec.bernsteinCubicBezierCurve(bez, t);
      const pt = h.Vec.cubicBezierCurveDerivitive(bez, t);
      const acc = h.Vec.cubicBezierCurveSecondDerivitive(bez, t);
      const k = det(pt, acc) / pt.magnitude() ** 3;
      const max = Math.min(6, Math.abs(1 / k));
      left.push(
        pt
          .clone()
          .setLength(max)
          .rotate(h.PI / 2)
          .add(m),
      );
      right.push(
        pt
          .clone()
          .setLength(max)
          .rotate(h.TAU - h.PI / 2)
          .add(m),
      );
    }

    ctx.beginPath();
    h.drawLoop(left, false, ctx);
    ctx.stroke();
    ctx.beginPath();
    h.drawLoop(right, false, ctx);
    ctx.stroke();
    allLeft.push(left);
    allRight.push(right);
  }
  const a = allLeft.flat(1);
  const b = reverse(allRight.flat(1));
  const loop = [...a, ...b].filter((v) => !isNaN(v[0]) && !isNaN(v[1]));
  const ln = new DifferentialLine(shapes[0][0]);
  for (const pt of loop) ln.add(new Node(pt[0], pt[1]));
  for (let i of range(80)) {
    ln.run();
    console.log(`iterations done: ${i + 1}`);
  }
  const grownPts = ln.positions();
  console.log(ln);

  ctx.fillStyle = '#a9dc76';
  ctx.beginPath();
  h.drawRoundLoop(grownPts, 3, ctx);
  ctx.fill();

  ctx.fillStyle = '#fc986733';
  ctx.beginPath();
  h.drawLoop(loop, true, ctx);
  ctx.fill();

  console.log();

  // await client.capture();
  // window.requestAnimationFrame(render);
}
requestAnimationFrame(render);
