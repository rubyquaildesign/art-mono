import interpolate from 'b-spline';
import { range } from 'd3-array';
import { Vec } from './vec';

/**
 * Creates and iterator walking through the spline of a given loop outputing the points of the new loop
 * @param loop - a loop of Pts to extract a spline from
 * @param degree - the degree of the spline to extract
 * @param close - whether to close the spline or not
 * @param outputResolution - resolution of the output loop
 */
export function* spline(
  loop: Loop,
  degree: number,
  close: boolean,
  outputResolution?: number,
) {
  const resolution = outputResolution ?? loop.length;
  const length = loop.length;
  const toDraw = loop.slice(0);
  let knots: number[] = range(degree + 1);
  knots.fill(0);

  knots.push(
    ...range(0, length - (degree + 1)).map((d) => d + 1),
    ...range(degree + 1).fill(length - degree),
  );
  if (close) {
    toDraw.push(...toDraw.slice(0, degree));
    knots = range(toDraw.length + (degree + 1));
  }

  for (let index = 0; index < resolution; index++) {
    const t = index / resolution;

    yield interpolate(t, degree, toDraw, knots);
  }

  if (!close) yield toDraw[toDraw.length - 1];
}

export function splineBuilder(loop: Loop, degree: number, close: boolean) {
  const length = loop.length;
  const toDraw = loop.slice(0);
  let knots: number[] = range(degree + 1);
  knots.fill(0);

  knots.push(
    ...range(0, length - (degree + 1)).map((d) => d + 1),
    ...range(degree + 1).fill(length - degree),
  );
  if (close) {
    toDraw.push(...toDraw.slice(0, degree));
    knots = range(toDraw.length + (degree + 1));
  }
  const outputFunction: (t: number) => Pt = (t) =>
    new Vec(interpolate(t, degree, toDraw, knots));
  return outputFunction;
}

export function LUTBuilder(points: Pt[]) {
  const vecPts = points.map((p) => new Vec(p[0], p[1]));
  const pathSize = vecPts.length;
  let splineLength = 0;
  for (let i = 0; i < pathSize - 1; i++) {
    const d = vecPts[i].dist(vecPts[i + 1]);
    splineLength += d;
  }
  const lut = range(pathSize).map((i) => ({
    i,
    dist: 0,
    outputT: i / (pathSize - 1),
    inputT: 0,
  }));

  for (let i = 1; i < pathSize; i++) {
    const distSoFar = lut[i - 1].dist;
    const previousPoint = vecPts[i - 1];
    const thisPoint = vecPts[i];
    const thisDist = previousPoint.dist(thisPoint);
    lut[i].dist = thisDist + distSoFar;
    lut[i].inputT = lut[i].dist / splineLength;
  }
  return {
    lut,
    get: (t: number) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const bI = lut.findIndex((d) => d.inputT > t);
      const a = lut[bI - 1];
      const b = lut[bI];
      const delta = t - a.inputT;
      const _t = delta / (b.inputT - a.inputT);
      const outPutDelta = b.outputT - a.outputT;
      const output = a.outputT + outPutDelta * _t;
      return output;
    },
    getDist: (dist: number) => {
      const bI = lut.findIndex((d) => d.dist > dist);
      const a = lut[bI - 1];
      const b = lut[bI];
      const delta = dist - a.dist;
      const _t = delta / (b.dist - a.dist);
      const outPutDelta = b.outputT - a.outputT;
      const output = a.outputT + outPutDelta * _t;
      return output;
    },
  };
}
