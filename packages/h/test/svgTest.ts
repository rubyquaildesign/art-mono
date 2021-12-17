import { writeFileSync } from 'fs';
import { range } from 'd3-array';
import { path } from 'd3-path';
import * as h from '../src/main';

const NUM_POINTS = 5;
const testPoints = range(NUM_POINTS).map((i) => {
  const t = i / NUM_POINTS;
  const theta = t * (Math.PI * 2);
  return new h.Vec([Math.cos(theta) * 2, Math.sin(theta) * 2]);
});
testPoints.push(new h.Vec([0, 0]));
const testCatmull = h.catmulToBezier([
  ...testPoints,
  ...testPoints.slice(0, 3),
]);
// Const testSpline = h.bezierSpline(testPoints, 2, true);
const bPath = path();
h.drawBezierLoop(testCatmull, false, bPath);
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width=200 height=200 viewBox="-3 -3 6 6">
<rect x=-3 y=-3 width=6 height=6 fill="white"/>
  ${testPoints
    .map(
      (v) => `
  <circle cx=${v.x} cy=${v.y} r=0.1 fill="#0008"/>
  `,
    )
    .join('')}
<path d=${bPath.toString()} stroke="#f008" stroke-width="0.2" fill="#0000" />
${testCatmull.map(
  (p, i) =>
    `<text x=${p[0]} y=${p[1]} style="font: 0.1px monospace;">${i}</text> `,
)}
</svg>`;
writeFileSync('./test.svg', svgString);
