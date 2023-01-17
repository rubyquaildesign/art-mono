import * as h from '@rupertofly/h';
import { range } from 'd3-array';
import * as a from './src/main';

const inputA = [
	[
		[0, 0],
		[100, 0],
		[100, 100],
		[0, 100],
	],
	[
		[10, 10],
		[10, 90],
		[90, 90],
		[90, 10],
	],
];
const inputB = [
	[
		[50, 50],
		[150, 50],
		[150, 150],
		[50, 150],
	],
	[
		[60, 60],
		[60, 80],
		[140, 140],
		[140, 60],
	],
];
const TAU = Math.PI * 2;
const c1Sides = 24;
const c2Sides = 10;
const inputC = [
	range(c1Sides).map(i =>
		new h.Vec(
			Math.cos((i / c1Sides) * TAU) * 100,
			Math.sin((i / c1Sides) * TAU) * 100,
		).add(50),
	),
	range(c2Sides).map(i =>
		new h.Vec(
			Math.cos(TAU - (i / c2Sides) * TAU) * 80,
			Math.sin(TAU - (i / c2Sides) * TAU) * 80,
		).add(50),
	),
];
const cvs: HTMLCanvasElement = document.querySelector('#canvas')!;
const ctx = cvs.getContext('2d')!;
ctx.translate(100, 100);
ctx.fillStyle = '#f005';
h.drawShape(inputA, ctx);
ctx.stroke();
ctx.fill();
h.drawShape(inputB, ctx);
ctx.stroke();
ctx.fill();
ctx.translate(200, 0);
const output = a.union([inputA, inputB]);
h.drawShape(output, ctx);
ctx.stroke();
ctx.fill();
ctx.translate(-200, 200);
const inter = a.intersection(inputA, inputB);
h.drawShape(inter, ctx);
ctx.stroke();
ctx.fill();
ctx.translate(200, 0);
const sub = a.subtract(inputA, inputB);
h.drawShape(sub, ctx);
ctx.stroke();
ctx.fill();
ctx.translate(-200, 300);
const xor = a.xor(inputA, inputB);
h.drawShape(xor, ctx);
ctx.stroke();
ctx.fill();
ctx.translate(300, 0);
ctx.beginPath();
h.drawLoop(a.clean(inputC[1], 16), true, ctx);
ctx.fill();
ctx.stroke();
