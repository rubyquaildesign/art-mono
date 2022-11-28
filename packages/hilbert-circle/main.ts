import * as h from '@rupertofly/h';
import {
	range,
	easeCubicInOut,
	interpolateRainbow,
	interpolateSinebow,
} from 'd3';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';
import { deBoorSpline, splineDeBoor, Vec } from '@rupertofly/h';

const [wid, hei] = [1080, 1920];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
canvas.width = wid;
canvas.height = hei;
const ctx = canvas.getContext('2d')!;
const {
	drawLoop,
	drawShape,
	bezierSpline,
	splineBuilder,
	Tween,
	anim,
	Vec,
	Vec: { lerp, r2d, d2r },
} = h;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

const client = new Capture(6969, canvas);
client.start({
	frameRate: 60,
	lengthIsFrames: true,
	maxLength: 60 * 120,
	name: 'hilbert-circle',
});

const RAD = wid / 2;
const PI = Math.PI;
const TAU = Math.PI * 2;
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
ctx.fillStyle = c.black;
ctx.strokeStyle = c.white;
ctx.fillRect(0, 0, wid, hei);
ctx.lineWidth = 4;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
function hilbert(degree: number) {
	const numberPts = (2 ** degree) ** 2;
	const pts = [vec(0, 0), vec(0, 1), vec(1, 1), vec(1, 0)] as const;
	const output = range(numberPts).map(i => {
		let index = i & 3;
		let v = pts[index];
		let ii = i;
		for (let j = 1; j < degree; j++) {
			ii >>>= 2;
			index = ii & 3;
			const length = 2 ** j;
			switch (index) {
				case 0:
					v = vec(v.y, v.x);
					break;
				case 1:
					v = v.add(vec(0, length));
					break;
				case 2:
					v = v.add(length);
					break;
				default:
					v = vec(length - 1 - v.y, length - 1 - v.x).add(vec(length, 0));
					break;
			}
		}

		return v;
	});
	return output;
}

const MIN_DEGREE = 1;
const MAX_DEGREE = 8;
const BAND_HEIGHT = 450;
const hilberts = new Map<number, Vec[]>();
for (const i of range(MIN_DEGREE, MAX_DEGREE + 1, 1)) {
	const n = hilbert(i)
		.map(v => v.mul([PI / 2 ** i, BAND_HEIGHT / 2 ** i]))
		.map(v => v.add(vec(0, 50)));
	hilberts.set(i, [...n, ...n.map(v => v.add(vec(PI, 0)))]);
}

const SELECTED_SPLINE = 5;
const total = 2 ** (ceil(Math.log2(hilberts.get(SELECTED_SPLINE)!.length)) + 8);
console.log(hilberts);
const sp = deBoorSpline(
	hilberts.get(SELECTED_SPLINE)!,
	2 ** (ceil(Math.log2(hilberts.get(SELECTED_SPLINE)!.length)) + 8),
	5,
	false,
);
const sp2 = deBoorSpline(
	hilberts.get(SELECTED_SPLINE)!,
	2 ** (ceil(Math.log2(hilberts.get(SELECTED_SPLINE)!.length)) + 8),
	1,
	false,
);
// Uncomment for central
ctx.translate(wid / 2, hei / 2);

ctx.beginPath();
ctx.stroke();
const s = new Path2D();
const n = sp.next();
sp2.next();
let pt: Vec = vec(0, 0);
if (!n.done) {
	pt = n.value[0];
	const adjustedPt = vec(cos(pt.x - PI / 2) * pt.y, sin(pt.x - PI / 2) * pt.y);
	s.moveTo(adjustedPt.x, adjustedPt.y);
}

let previous: Vec = pt;
let section = 0;
async function render() {
	let isDone = false;
	for (let x = 0; x < 140; x++) {
		const n = sp.next();
		const m = sp2.next();
		let pt: Vec;
		if (!n.done && !m.done) {
			section++;
			const t = section / total;
			ctx.strokeStyle = interpolateSinebow(t);
			pt = lerp(n.value[0], m.value[0], easeCubicInOut(t));

			const adjustedPt = vec(
				cos(pt.x - PI / 2) * pt.y,
				sin(pt.x - PI / 2) * pt.y,
			);
			const adjustedPre = vec(
				cos(previous.x - PI / 2) * previous.y,
				sin(previous.x - PI / 2) * previous.y,
			);
			ctx.beginPath();
			ctx.moveTo(adjustedPre.x, adjustedPre.y);
			ctx.lineTo(adjustedPt.x, adjustedPt.y);
			ctx.stroke();
			previous = pt;
		} else isDone = true;
	}

	ctx.fillStyle = c.black;
	ctx.strokeStyle = c.white;
	if (isDone) await client.stop(true);
	else {
		await client.capture();
		window.requestAnimationFrame(render);
	}
}

void render();
