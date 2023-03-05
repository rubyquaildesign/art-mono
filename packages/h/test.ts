import { range } from 'd3-array';
import { hcl, lab } from 'd3';
import { factorial, matrix, multiply } from 'mathjs';
import client from '@rupertofly/capture-client';
import { bSpline } from './src/b-spline';
import * as hil from './src/simple-hilbert';
import * as dr from './src/drawing';
import { bsplineMat } from './src/splineMatForm';
import { Vec } from './src/vec';
import { Matrix } from './src/matrices';

const colours: string[] = range(12).map(d => {
	const t = d / 13;
	const theta = t * 360;
	return hcl(theta, 140, 80 - 5 * Math.sin(t * 5 * Math.PI)).toString();
});

const canvas: HTMLCanvasElement = document.querySelector('#canvas')!;
const ctx = canvas.getContext('2d')!;
ctx.lineCap = 'round';
// ccc.start({
// 	frameRate: 30,
// 	lengthIsFrames: true,
// 	maxLength: 30 * 30,
// 	name: 'shapes',
// });
const { sin, cos, tan, PI, sqrt } = Math;
const TAU = PI * 2;
const isoMat = new Matrix([
	[sqrt(3), 0, -sqrt(3)],
	[1, 2, 1],
	[sqrt(2), -sqrt(2), sqrt(2)],
]).mapMatrix(v => v * (1 / sqrt(6)));
const pts = [
	[0, 0],
	[100, 0],
	[100, 100],
	[0, 100],
]
	.map(([x, y]) => new Vec(x, y))
	.map(([x, y]) => new Matrix([[x], [y], [100]]))
	.map(mat => isoMat.mul(mat))
	.map(mat =>
		new Matrix([
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 0],
		]).mul(mat),
	);
const pts2 = [
	[0, 0],
	[100, 0],
	[100, 100],
	[0, 100],
]
	.map(([x, y]) => new Vec(x, y))
	.map(([x, y]) => new Matrix([[x], [y], [1]]))
	.map(mat => isoMat.mul(mat))
	.map(mat =>
		new Matrix([
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 0],
		]).mul(mat),
	);

console.log(pts);

await render();
async function render() {
	ctx.fillStyle = '#fafafa';

	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.lineWidth = 5;
	ctx.strokeStyle = '#111111';
	ctx.translate(150, 150);
	ctx.beginPath();
	dr.drawLoop(
		pts.map(mat => new Vec(mat[0][0], mat[1][0])),
		true,
		ctx,
	);
	ctx.stroke();
	ctx.beginPath();
	dr.drawLoop(
		pts2.map(mat => new Vec(mat[0][0], mat[1][0])),
		true,
		ctx,
	);
	ctx.stroke();
	ctx.restore();
	// console.log(loop);
}
