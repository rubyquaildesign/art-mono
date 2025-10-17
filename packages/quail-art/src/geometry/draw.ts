import { path } from 'd3';
import { type bSpline, bsplineMat } from './path';

type BSpline = ReturnType<typeof bSpline>;
type Path = ReturnType<typeof path>;
type Drawable = Path | CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type TDPT = [number, number];
type Line = [TDPT, TDPT];
export type Loop = TDPT[];
export type Shape = Loop[];
type Pt = TDPT | number[];
type XYPt = { x: number; y: number };
export const PI = Math.PI;
export const TAU = 2 * Math.PI;
const sqrt = Math.sqrt;
const EPSILON = 1e-12;
export function equivilant(a: number, b: number) {
	return Math.abs(a - b) < EPSILON;
}

export function rndm(): number;
export function rndm(max: number): number;
export function rndm(min: number, max: number): number;
export function rndm(...args: number[]) {
	if (args[0] === undefined) {
		return Math.random();
	}

	if (args[1] === undefined) {
		return args[0] * Math.random();
	}

	return args[0] + Math.random() * (args[1] - args[0]);
}

export function flr(value: number): number {
	return Math.floor(value);
}

function lengthAr(a: [number, number], b: [number, number]): number {
	const xDist = (b[0] - a[0]) ** 2;
	const yDist = (b[1] - a[1]) ** 2;

	return sqrt(xDist + yDist);
}

function lenxy(a: XYPt, b: XYPt): number {
	const xDist = (b.x - a.x) ** 2;
	const yDist = (b.y - a.y) ** 2;

	return sqrt(xDist + yDist);
}

function isXYPt(a: XYPt | Pt): a is XYPt {
	return (a as XYPt).x !== undefined;
}

export function length<T extends XYPt | Pt>(a: T, b: T) {
	if (isXYPt(a) && isXYPt(b)) {
		return lenxy(a, b);
	}

	return lengthAr(a as [number, number], b as [number, number]);
}

export function sub(a: Pt, b: Pt): Pt {
	return [a[0] - b[0], a[1] - b[1]];
}

function isCtx(ctx: Drawable): ctx is CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
	if (typeof window === 'undefined') return false;

	return ctx instanceof CanvasRenderingContext2D;
}

export function drawLine(line: Line, ctx: Path): string;
export function drawLine(line: Line, ctx?: CanvasRenderingContext2D): undefined | string;
export function drawLine(line: Line, ctx: Drawable = getDrawable()) {
	ctx.moveTo(...(line[0] as TDPT));
	ctx.lineTo(...(line[1] as TDPT));
	if (!isCtx(ctx)) {
		return ctx.toString();
	}
}

export function drawLoop(loop: Loop | Iterable<Pt>, close: boolean, ctx: Path): string;
export function drawLoop(
	loop: Loop | Iterable<Pt>,
	close: boolean,
	ctx?: CanvasRenderingContext2D,
	drawType?: 'fill' | 'stroke',
): undefined | string;

export function drawLoop(
	loop: Loop | Iterable<Pt>,
	close: boolean,
	ctx: Drawable = getDrawable(),
	drawType?: 'fill' | 'stroke',
) {
	let count = 0;

	for (const point of loop) {
		if (count < 1) ctx.moveTo(...(point as TDPT));
		else ctx.lineTo(...(point as TDPT));
		count++;
	}

	if (close) ctx.closePath();
	if (isCtx(ctx) && drawType === 'fill') ctx.fill();
	if (isCtx(ctx) && drawType === 'stroke') ctx.stroke();
	if (!isCtx(ctx)) return ctx.toString();
}

function getDrawable(): Drawable {
	return typeof window !== 'undefined' && 'ctx' in window && window.ctx instanceof OffscreenCanvasRenderingContext2D
		? window.ctx
		: path();
}

export function drawBezierLoop(loop: Loop, close: boolean, ctx: Path): string;
export function drawBezierLoop(
	loop: Loop,
	close: boolean,
	ctx?: CanvasRenderingContext2D,
	drawType?: 'fill' | 'stroke',
): undefined | string;
export function drawBezierLoop(
	loop: Loop,
	close: boolean,
	ctx: Drawable = getDrawable(),
	drawType?: 'fill' | 'stroke',
) {
	for (let i = 0; i <= loop.length - 3; i += 4) {
		if (i === 0) ctx.moveTo(...(loop[0] as TDPT));
		else ctx.lineTo(...(loop[i] as TDPT));
		ctx.bezierCurveTo(loop[i + 1][0], loop[i + 1][1], loop[i + 2][0], loop[i + 2][1], loop[i + 3][0], loop[i + 3][1]);
	}

	if (close) ctx.closePath();
	if (isCtx(ctx) && drawType === 'fill') ctx.fill();
	if (isCtx(ctx) && drawType === 'stroke') ctx.stroke();
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawShape(shape: Shape, ctx: Path): string;
export function drawShape(
	shape: Shape,
	ctx?: CanvasRenderingContext2D,
	drawType?: 'fill' | 'stroke',
): undefined | string;
export function drawShape(shape: Shape, ctx: Drawable = getDrawable(), drawType?: 'fill' | 'stroke') {
	if (isCtx(ctx)) ctx.beginPath();
	for (const loop of shape) drawLoop(loop, true, ctx);
	if (isCtx(ctx) && drawType === 'fill') ctx.fill();
	if (isCtx(ctx) && drawType === 'stroke') ctx.stroke();
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawBezierShape(shape: Shape, ctx?: Path): string;
export function drawBezierShape(shape: Shape, ctx: CanvasRenderingContext2D, drawType?: 'fill' | 'stroke'): void;
export function drawBezierShape(shape: Shape, ctx: Drawable = path(), drawType?: 'fill' | 'stroke') {
	if (isCtx(ctx)) ctx.beginPath();
	for (const loop of shape) drawBezierLoop(loop, true, ctx);
	if (isCtx(ctx) && drawType === 'fill') ctx.fill();
	if (isCtx(ctx) && drawType === 'stroke') ctx.stroke();
	if (!isCtx(ctx)) return ctx.toString();
}

export function drawDot(
	point: Pt,
	radius: number,
	ctx = typeof window !== 'undefined' && 'ctx' in window && window.ctx instanceof OffscreenCanvasRenderingContext2D
		? window.ctx
		: undefined,
	drawType?: 'fill' | 'stroke',
) {
	const [x, y] = point;
	if (!ctx) throw Error('no context found');
	ctx.beginPath();
	ctx.ellipse(x, y, radius, radius, 0, 0, TAU);
	ctx.closePath();
	if (isCtx(ctx) && drawType === 'fill') ctx.fill();
	if (isCtx(ctx) && drawType === 'stroke') ctx.stroke();
}

// ? FUTURE ABILITY Solve the equation to generate a mid point from the 2nd last point and the 2nd point for a closing loop
export function drawFauxQuadLoop(loop: Loop, close: boolean, ctx?: Path): string;
export function drawFauxQuadLoop(loop: Loop, close: boolean, ctx: CanvasRenderingContext2D): void;
export function drawFauxQuadLoop(loop: Loop, close: boolean, ctx: Drawable = path()) {
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

export function drawFauxCubicLoop(loop: Loop, close: boolean, ctx?: Path): string;
export function drawFauxCubicLoop(loop: Loop, close: boolean, ctx: CanvasRenderingContext2D): void;
export function drawFauxCubicLoop(loop: Loop, close: boolean, ctx: Drawable = path()) {
	const toDraw = loop.slice();
	const inputLength = toDraw.length;
	const start = toDraw.shift() as [number, number];

	if (close) toDraw.push(start);
	ctx.moveTo(...start);
	let lasti = 0;

	for (let i = 0; i < inputLength - 2; i++) {
		const [x1, y1, x2, y2, x3, y3] = [...toDraw[i], ...toDraw[i + 1], ...toDraw[i + 2]];

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

export function drawBSpline(spline: BSpline, ctx: Drawable, resolution = spline.controlPoints.length * 10) {
	const start = bsplineMat(spline, 0);
	ctx.moveTo(start.x, start.y);
	for (let i = 1; i <= resolution; i++) {
		const t = i / resolution;
		const pt = bsplineMat(spline, t);
		ctx.lineTo(pt.x, pt.y);
	}

	if (spline.type === 'closed') ctx.closePath();
}
