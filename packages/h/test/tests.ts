import test from 'tape';
import { Delaunay } from 'd3-delaunay';
import { path } from 'd3-path';
import {
	drawLine,
	drawFauxQuadLoop,
	drawLoop,
	drawBezierLoop,
} from '../src/drawing';
import { djikstraPath, flr } from '../src/main';

test('test Maths', t => {
	t.plan(3);
	t.is(3, flr(3), 'floor works');
	t.is(3, flr(3.9), 'still works');
	t.isNot(3, flr(4), `damn, you're good`);
});
test('line', t => {
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
test('quadLine', t => {
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
test('djikstra', t => {
	t.doesNotThrow(() => {
		type pt = [number, number];
		const pts: pt[] = Array.from({ length: 32 })
			.fill(0)
			.map(() => [Math.random(), Math.random()]);
		const del = Delaunay.from(pts);
		const route = djikstraPath(0, 1, a => del.neighbors(a));

		t.comment(route.toString());
	});
	t.end();
});
