import { range } from 'd3';
import iter from 'iterare';
import { BSpline } from './b-spline.js';
import { Vec } from './vec.js';

const v = (x: number, y: number) => new Vec(x, y);

const zerothBasis = (u: number, a: number, b: number) =>
	u >= a && u < b ? 1 : 0;
const alpha = (nn1: number, i: number, a: number[], u: number) =>
	(u - a[i]) / (a[i + nn1 + 1] - a[i]);

function mod(diviend: number, divisor: number) {
	const quotiont = Math.floor(diviend / divisor);
	return diviend - divisor * quotiont;
}

function getK(k: number, array: any[], closed: boolean) {
	const n = array.length;
	if (k >= 0 && k < n) return k;
	if (closed) return mod(k, n);
	if (k < 0) return 0;
	return n;
}

function deBoor(knots: number[], controlPoints: Vec[], degree: number) {
	return (knotIndex: number, t: number) => {
		const workingPoints: Vec[] = [];
		for (let wPIndex = 0; wPIndex < degree + 1; wPIndex++) {
			workingPoints[wPIndex] = controlPoints[wPIndex + knotIndex - degree];
		}

		for (let recRound = 1; recRound < degree + 1; recRound++) {
			for (let j = degree; j > recRound - 1; j--) {
				const alpha =
					(t - knots[j + knotIndex - degree]) /
					(knots[j + 1 + knotIndex - recRound] - knots[j + knotIndex - degree]);
				const a = workingPoints[j - 1].mul(1 - alpha);
				const b = workingPoints[j].mul(alpha);
				workingPoints[j] = a.add(b);
			}
		}

		return workingPoints[degree];
	};
}

export function* splineDeBoor(
	spline: BSpline,
	resolution: number,
): Generator<Vec, void, never> {
	const low = 0;
	const high = 1;
	const knots = spline.knots;
	const tMapper = (r: number) => (r / resolution) * (high - low) + low;
	const splineBuilder = deBoor(
		spline.knots,
		spline.controlPoints,
		spline.degree,
	);
	for (const r of range(resolution)) {
		const tValue = tMapper(r);
		const findIndex = knots.findIndex(v => v > tValue) - 1;

		yield nd(
			spline.controlPoints,
			spline.knots,
			findIndex,
			tValue,
			spline.degree,
		);
	}
}

export function* deBoorSpline(
	rawControlPoints: Vec[],
	resolution: number,
	degree: number,
	closed: boolean,
) {
	const isDegreeOdd = degree % 2 === 1;
	const controlPoints = closed
		? [
				...rawControlPoints.slice(
					-1 * (isDegreeOdd ? (degree - 1) / 2 : degree / 2),
				),
				...rawControlPoints,
				...rawControlPoints.slice(
					0,
					isDegreeOdd ? (degree + 1) / 2 : degree / 2,
				),
		  ]
		: rawControlPoints;
	const n = closed ? controlPoints.length - 2 : controlPoints.length - 1;
	const rawKnotSize = degree + n + 2;
	const knots = knotGeneration(degree, closed, controlPoints.length);

	const dl = degree;
	const dh = rawKnotSize - degree;
	const low = knots[dl];
	const high = knots[dh];

	const tMapper = (r: number) => (r / resolution) * (high - low) + low;
	const output: Vec[] = [];
	const spline = deBoor(knots, controlPoints, degree);
	for (const r of range(resolution)) {
		const t = tMapper(r);
		let segment = dl;
		for (let s = dl; s < dh; s++) {
			if (t >= knots[s] && t <= knots[s + 1]) {
				segment = s;
				break;
			}
		}

		const p = spline(segment, t);
		yield [p, knots[segment], knots] as [Vec, number, number[]];
	}

	if (!closed)
		yield [controlPoints[controlPoints.length - 1], knots[dh], knots] as [
			Vec,
			number,
			number[],
		];
}

function knotGeneration(degree: number, closed: boolean, noCps: number) {
	const isDegreeOdd = degree % 2 === 1;
	const n = closed ? noCps - 2 : noCps - 1;
	const rawKnotSize = degree + n + 2;
	const knotEdgeSize = isDegreeOdd ? (degree + 1) / 2 : degree / 2 + 1;
	const rawKnots = range(
		0,
		closed ? rawKnotSize - degree : rawKnotSize - degree * 2,
	);
	const il = rawKnots.length;
	const knotHeader = closed
		? range(-knotEdgeSize + 1, 0)
		: range(degree).fill(0);
	const knotFooter = closed
		? range(il, il + knotEdgeSize)
		: range(degree).fill(il - 1);
	const knots = [...knotHeader, ...rawKnots, ...knotFooter];
	return knots;
}

export function nd(
	cps: Vec[],
	knots: number[],
	k: number,
	x: number,
	p: number,
) {
	const d: Vec[][] = [];
	for (let i = k - p; i < k; i++) {
		d[i] = [];
		d[i][0] = cps[i - 1];
	}

	for (let r = 1; r < p; r++) {
		for (let i = k - p + r; i < k; i++) {
			const alpha = (x - knots[i]) / (knots[i + 1 + p - r] - knots[i]);
			d[i][r] = d[i - 1][r - 1].mul(1 - alpha).add(d[i][r - 1].mul(alpha));
		}
	}

	return d[k - 1][p];
}
