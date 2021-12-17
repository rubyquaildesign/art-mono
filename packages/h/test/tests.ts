import test from 'tape';
import { Delaunay } from 'd3-delaunay';
import { path } from 'd3-path';
import {
  drawLine,
  drawFauxQuadLoop,
  drawLoop,
  drawBezierLoop,
} from '../src/drawing';
import { bezierSpline, djikstraPath, flr, spline } from '../src/main';

test('test Maths', (t) => {
  t.plan(3);
  t.is(3, flr(3), 'floor works');
  t.is(3, flr(3.9), 'still works');
  t.isNot(3, flr(4), `damn, you're good`);
});
test('line', (t) => {
  t.equal(
    drawLine([
      [0, 1],
      [1, 1],
    ]),
    'M0,1L1,1',
    'draw line',
  );
  t.end();
});
test('quadLine', (t) => {
  t.equal(
    drawFauxQuadLoop(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      true,
    ),
    'M0,0Q1,0,1,1Q0,1,0,0',
    'draw quad',
  );
  t.throws(() => {
    drawFauxQuadLoop(
      [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      true,
    );
  });
  t.throws(() => {
    drawFauxQuadLoop(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      false,
    );
  });
  t.doesNotThrow(() => {
    drawFauxQuadLoop(
      [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      false,
    );
  });
  t.end();
});
test('djikstra', (t) => {
  t.doesNotThrow(() => {
    type pt = [number, number];
    const pts: pt[] = Array.from({ length: 32 })
      .fill(0)
      .map(() => [Math.random(), Math.random()]);
    const del = Delaunay.from(pts);
    const route = djikstraPath(0, 1, (a) => del.neighbors(a));

    t.comment(route.toString());
  });
  t.end();
});
test('spline', (t) => {
  const points = [
    [-1, -1],
    [1, -1],
    [2, 0],
    [10, 10],
    [0.5, 0],
    [-1, 1],
  ] as Array<[number, number]>;

  const pth = path();

  const op = spline(points, 2, true, 64);

  drawLoop(op, true, pth);
  // Console.log(pth.toString());
  t.end();
});
test('fancy spline', (t) => {
  const points = [
    [-2, 2],
    [-1.5, -2],
    [-1, 2],
    [-0.5, -2],
    [0, 2],
    [0.5, -2],
    [1, 2],
    [1.5, -2],
    [2, 2],
    [2, 0],
  ] as Pt[];

  const pth = path();
  let op: Loop;
  t.doesNotThrow(() => {
    op = bezierSpline(points, 3, false);
  });
  // T.comment(JSON.stringify(op.map((p) => p.map((n) => n.toFixed(2)))));
  drawBezierLoop(op, false, pth);
  // DrawLoop(op, false, pth);
  // writeSvg(points, pth.toString(), op);
  // console.log(pth.toString());
  t.end();
});
