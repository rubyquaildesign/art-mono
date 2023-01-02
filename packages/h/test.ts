import { range } from 'd3-array';
import { hcl, lab } from 'd3';
import { factorial, matrix, multiply } from 'mathjs';
import client from '@rupertofly/capture-client';
import { bSpline } from './src/b-spline';
import * as hil from './src/simple-hilbert';
import * as dr from './src/drawing';
import { bsplineMat } from './src/splineMatForm';

function getC(i, n) {
	const a = factorial(n);
	const b = factorial(i) * factorial(n - i);
	return a / b;
}

const colours: string[] = range(12).map(d => {
	const t = d / 13;
	const theta = t * 360;
	return hcl(theta, 140, 80 - 5 * Math.sin(t * 5 * Math.PI)).toString();
});

function getM(i, j, k) {
	const a = 1 / factorial(k - 1);
	const b = getC(k - 1 - i, k - 1);
	let sum = 0;
	for (let s = j; s <= k - 1; s++) {
		const x = (-1) ** (s - j);
		const y = getC(s - j, k);
		const z = (k - s - 1) ** (k - 1 - i);
		sum += x * y * z;
	}

	return a * b * sum;
}

function createBSplineMatrix(k, factor = 1) {
	const mat: number[][] = [];
	for (let row = 0; row <= k - 1; row++) {
		const rarr: number[] = [];
		for (let col = 0; col <= k - 1; col++) {
			const d = getM(row, col, k);
			rarr.push(d / factor);
		}

		mat.push(rarr);
	}

	return mat;
}

const cubicBMat = matrix(createBSplineMatrix(4));
const vMap = matrix(range(4).map(d => 0.01 ** d));
const d = multiply(vMap, cubicBMat);
console.log(d.toArray() as number[]);
const hibertDeg = 5;
const hd = range((2 ** hibertDeg) ** 2)
	.map(d => hil.hilbertToVector(hibertDeg, d))
	.map(v => v.mul(900 / 2 ** hibertDeg));
const canvas: HTMLCanvasElement = document.querySelector('#canvas')!;
const ctx = canvas.getContext('2d')!;
ctx.lineWidth = 52;
ctx.lineCap = 'round';
ctx.translate((canvas.width - 900) / 2, (canvas.width - 900) / 2);
const ccc = new client(6969, canvas);
const s = bSpline(hd, 2, 'open', false);
console.log(String.fromCodePoint(0x61));
const controlPoints = range(26).map(d => String.fromCodePoint(0x61 + d));
const degree = 2;
const openKnots = range(controlPoints.length);
const closedKnots = [...range(controlPoints.length), ...range(degree)];
const clampedKnots = [
	...range(degree - 1).fill(0),
	...range(controlPoints.length),
	...range(degree - 1).fill(controlPoints.length - 1),
];
const pre = document.createElement('pre');
document.body.append(pre);
const kns = clampedKnots;
range(kns.length - degree).forEach(i => {
	const pts = range(degree + 1).map(offset => controlPoints[kns[i + offset]]);
	const item = `${i.toString(10).padStart(2, ' ')}: ${pts.join('')}\n`;
	pre.append(item);
});
// ccc.start({
// 	frameRate: 30,
// 	lengthIsFrames: true,
// 	maxLength: 30 * 30,
// 	name: 'shapes',
// });
ctx.shadowColor = '#00000000';
ctx.shadowBlur = 5;
ctx.shadowOffsetX = 1;
ctx.shadowOffsetY = 3;
await render();
async function render() {
	const loop = range(3000).map(ix => {
		const t = ix / 3000;
		return bsplineMat(s, t);
	});
	// console.log(loop);

	range(3000 - 1).forEach(ix => {
		const t = ix / 3000;
		const u = t * (s.knots.length - s.degree);
		const k = Math.floor(u);
		ctx.strokeStyle = colours[k % colours.length];
		ctx.beginPath();
		dr.drawLine([loop[ix], loop[ix + 1]], ctx);
		ctx.stroke();
	});
}
