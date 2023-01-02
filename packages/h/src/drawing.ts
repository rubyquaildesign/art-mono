import * as P from 'd3-path';
import * as M from './maths';
import { BSpline } from './b-spline';
import { bsplineMat } from './splineMatForm';

type Drawable =
	| P.Path
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;
type TDPT = [number, number];
function isCtx(
	ctx: Drawable,
): ctx is CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
	if (typeof window === 'undefined') return false;

	return ctx instanceof CanvasRenderingContext2D;
}

export function drawLine(line: Line, ctx?: P.Path): string;
export function drawLine(line: Line, ctx: CanvasRenderingContext2D): void;
export function drawLine(line: Line, ctx: Drawable = P.path()) {
	ctx.moveTo(...(line[0] as TDPT));
	ctx.lineTo(...(line[1] as TDPT));
	if (!isCtx(ctx)) {
		return ctx.toString();
	}
}

export function drawLoop(
	loop: Loop | Iterable<Pt>,
	close: boolean,
	ctx?: P.Path,
): string;
export function drawLoop(
	loop: Loop | Iterable<Pt>,
	close: boolean,
	ctx: CanvasRenderingContext2D,
): void;
export function drawLoop(
	loop: Loop | Iterable<Pt>,
	close: boolean,
	ctx: Drawable = P.path(),
) {
	let count = 0;

	for (const point of loop) {
		if (count < 1) ctx.moveTo(...(point as TDPT));
		else ctx.lineTo(...(point as TDPT));
		count++;
	}

	if (close) ctx.closePath();
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawBezierLoop(
	loop: Loop,
	close: boolean,
	ctx?: P.Path,
): string;
export function drawBezierLoop(
	loop: Loop,
	close: boolean,
	ctx: CanvasRenderingContext2D,
): void;
export function drawBezierLoop(
	loop: Loop,
	close: boolean,
	ctx: Drawable = P.path(),
) {
	for (let i = 0; i <= loop.length - 3; i += 4) {
		if (i === 0) ctx.moveTo(...(loop[0] as TDPT));
		else ctx.lineTo(...(loop[i] as TDPT));
		ctx.bezierCurveTo(
			loop[i + 1][0],
			loop[i + 1][1],
			loop[i + 2][0],
			loop[i + 2][1],
			loop[i + 3][0],
			loop[i + 3][1],
		);
	}

	if (close) ctx.closePath();
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawShape(shape: Shape, ctx?: P.Path): string;
export function drawShape(shape: Shape, ctx: CanvasRenderingContext2D): void;
export function drawShape(shape: Shape, ctx: Drawable = P.path()) {
	if (isCtx(ctx)) ctx.beginPath();
	for (const loop of shape) drawLoop(loop, true, ctx);
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawBezierShape(shape: Shape, ctx?: P.Path): string;
export function drawBezierShape(
	shape: Shape,
	ctx: CanvasRenderingContext2D,
): void;
export function drawBezierShape(shape: Shape, ctx: Drawable = P.path()) {
	if (isCtx(ctx)) ctx.beginPath();
	for (const loop of shape) drawBezierLoop(loop, true, ctx);
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawDot(
	point: Pt,
	radius: number,
	ctx: CanvasRenderingContext2D,
) {
	const [x, y] = point;

	ctx.beginPath();
	ctx.ellipse(x, y, radius, radius, 0, 0, M.TAU);
	ctx.closePath();
}

// ? FUTURE ABILITY Solve the equation to generate a mid point from the 2nd last point and the 2nd point for a closing loop
export function drawFauxQuadLoop(
	loop: Loop,
	close: boolean,
	ctx?: P.Path,
): string;
export function drawFauxQuadLoop(
	loop: Loop,
	close: boolean,
	ctx: CanvasRenderingContext2D,
): void;
export function drawFauxQuadLoop(
	loop: Loop,
	close: boolean,
	ctx: Drawable = P.path(),
) {
	const toDraw = loop.slice();
	const ptsNo = toDraw.length;

	if (close && ptsNo % 2)
		throw new Error(
			`in order to close a Faux quad loop, there needs to be an even number of input points. ${ptsNo} points where put in`,
		);
	if (!close && !(ptsNo % 2))
		throw new Error(
			`in order to draw a open Faux quad loop, there needs to be an odd number of input points. ${ptsNo} points where put in`,
		);
	const start = toDraw.shift() as [number, number];

	if (close) toDraw.push(start);
	ctx.moveTo(...start);
	for (let i = 0; i < toDraw.length; i += 2) {
		const [x1, y1, x2, y2] = [...toDraw[i], ...toDraw[i + 1]];

		ctx.quadraticCurveTo(x1, y1, x2, y2);
	}

	if (!isCtx(ctx)) return ctx.toString();
}

export function drawFauxCubicLoop(
	loop: Loop,
	close: boolean,
	ctx?: P.Path,
): string;
export function drawFauxCubicLoop(
	loop: Loop,
	close: boolean,
	ctx: CanvasRenderingContext2D,
): void;
export function drawFauxCubicLoop(
	loop: Loop,
	close: boolean,
	ctx: Drawable = P.path(),
) {
	const toDraw = loop.slice();
	const inputLength = toDraw.length;
	const start = toDraw.shift() as [number, number];

	if (close) toDraw.push(start);
	ctx.moveTo(...start);
	let lasti = 0;

	for (let i = 0; i < inputLength - 2; i++) {
		const [x1, y1, x2, y2, x3, y3] = [
			...toDraw[i],
			...toDraw[i + 1],
			...toDraw[i + 2],
		];

		ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
		lasti = i + 3;
	}

	let x1: number;
	let y1: number;
	let x2: number;
	let y2: number;
	switch (inputLength - lasti) {
		case 1:
			ctx.lineTo(...(toDraw[lasti] as TDPT));
			break;
		case 2:
			[x1, y1] = toDraw[lasti];
			[x2, y2] = toDraw[lasti + 1];

			ctx.quadraticCurveTo(x1, y1, x2, y2);
			break;
		default:
			break;
	}

	if (!isCtx(ctx)) return ctx.toString();
}

export function drawBSpline(
	spline: BSpline,
	ctx: Drawable,
	resolution = spline.controlPoints.length * 10,
) {
	const start = bsplineMat(spline, 0);
	ctx.moveTo(start.x, start.y);
	for (let i = 1; i <= resolution; i++) {
		const t = i / resolution;
		const pt = bsplineMat(spline, t);
		ctx.lineTo(pt.x, pt.y);
	}

	if (spline.type === 'closed') ctx.closePath();
}
