/*
Polar form beziers are represented as forms from a to be, eg
deg2 = (a,a),(a,b),(b,b).
deg3 = (a,a,a),(a,a,b),(a,b,b),(b,b,b)
a point on a bezier of t would be equal to (t,t,t)

for a b-spline of degree n, with a knot vector consisting of inceasing knots, the polar value arguements consist of groups of n adjacent knots. eg for a deg3 b-spline, it's first value would be (0,1,2), next would be (1,2,3) etc

argument order doesn't matter

for any single polar point, changing one argument can be calualted if you know two other points, eg deg2 (0,a) and (0,b) point (0,c) will equal( (b - c) * (0,a) + (c - a) * (0,b) ) / (b - a)

a knot vector is a series of knots that specify the intervals for bezier curves that make up b-splines, there are always n-1 knots appended to both ends of the knot vector

*/

function ptScalDiv(s: number, pt: Pt) {
  return [pt[0] / s, pt[1] / s];
}

function ptScalMult(s: number, pt: Pt) {
  return pt.map((d) => d * s) as Pt;
}

function ptAdd(ptA: Pt, ptB: Pt) {
  return [ptA[0] + ptB[0], ptA[1] + ptB[1]] as Pt;
}

function computeAffine({
  ptA,
  ptB,
  a,
  b,
  c,
}: {
  ptA: Pt;
  ptB: Pt;
  a: number;
  b: number;
  c: number;
}) {
  const top = ptAdd(ptScalMult(b - c, ptA), ptScalMult(c - a, ptB));
  return ptScalDiv(b - a, top) as Pt;
}

function splineSegToBezier({
  a,
  b,
  c,
  d,
  controlPoints,
}: {
  a: number;
  b: number;
  c: number;
  d: number;
  controlPoints: Pt[];
}) {
  const Xab = controlPoints[a];
  const abc = controlPoints[b];
  const bcd = controlPoints[c];
  const cdY = controlPoints[d];

  const bbc = computeAffine({ ptA: abc, ptB: bcd, a, b: d, c: b });
  const bcc = computeAffine({ ptA: abc, ptB: bcd, a, b: d, c });
  const abb = computeAffine({ ptA: Xab, ptB: abc, a: a - 1, b: c, c: b });
  const ccd = computeAffine({ ptA: bcd, ptB: cdY, a: b, b: d + 1, c });
  const ccc = computeAffine({ ptA: bcc, ptB: ccd, a: b, b: d, c });
  const bbb = computeAffine({ ptA: abb, ptB: bbc, a, b: c, c: b });
  return [bbb, bbc, bcc, ccc] as BezierCurve;
}

// Const testPoints = [
//   [1.5, 0.5],
//   [0.5, 0],
//   [-0.5, 0.5],
//   [0.5, 1.5],
//   [1.5, 0.5],
//   [0.5, 0],
//   [-0.5, 0.5],
//   [0.5, 1.5],
// ] as Pt[];
// Console.log(
//   splineSegToBezier({a: 0, b: 1, c: 2, d: 3, controlPoints: testPoints}),
// );
// console.log(
//   splineSegToBezier({a: 1, b: 2, c: 3, d: 4, controlPoints: testPoints}),
// );
// console.log(
//   splineSegToBezier({a: 2, b: 3, c: 4, d: 5, controlPoints: testPoints}),
// );
// console.log(
//   splineSegToBezier({a: 3, b: 4, c: 5, d: 6, controlPoints: testPoints}),
// );
export function splineToBezier(pts: Loop, close = false): Loop {
  if (pts.length < 4) throw new Error('too few points for spline');
  const cp = [...pts];
  if (close) {
    cp.push(...pts.slice(0, 5));
  } else {
    const n = pts[pts.length - 1];
    cp.unshift(pts[0], pts[0], pts[0]);
    cp.push(n, n, n);
  }

  const output: Array<BezierCurve | Pt[]> = [];
  for (let i = 0; i < cp.length - 4; i++) {
    const bz = splineSegToBezier({
      a: i,
      b: i + 1,
      c: i + 2,
      d: i + 3,
      controlPoints: cp,
    });
    output.push(bz);
    // Else output.push(bz.slice(1, 4));
  }

  return output.flat();
}
