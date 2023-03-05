import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as c from 'colours';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const [width, height] = [canvas.width, canvas.height];

const ctx = canvas.getContext('2d')!;

const {
	drawLoop,
	drawShape,
	Tween,
	anim,
	Vec: { lerp, r2d, d2r },
} = h;
const rad = width / 2;
const PI = Math.PI;
const TAU = Math.PI * 2;
const vec = (x: number, y: number) => new h.Vec(x, y);
const { random, floor, ceil, abs, atan2, sin, cos, tan, min, max, sqrt } = Math;
const forExport = {
	random,
	floor,
	ceil,
	abs,
	d3,
	c,
	atan2,
	sin,
	cos,
	tan,
	min,
	max,
	rad,
	PI,
	TAU,
	sqrt,
	vec,
	h,
	drawLoop,
	drawShape,
	Tween,
	anim,
	lerp,
	r2d,
	d2r,
	ctx,
	canvas,
	width,
	height,
};
Object.entries(forExport).forEach(([key, value]) => {
	(window as any)[key] = value;
});
declare global {
	const {
		random,
		floor,
		ceil,
		abs,
		atan2,
		sin,
		cos,
		tan,
		min,
		max,
		PI,
		TAU,
		rad,
		sqrt,
		vec,
		h,
		drawLoop,
		drawShape,
		Tween,
		anim,
		lerp,
		r2d,
		d2r,
		ctx,
		canvas,
		width,
		height,
		c,
		d3,
	}: typeof forExport;
}
