import { range } from 'd3';
import { Vec } from './vec.js';
/** B-splines use several bézier curves joined end to end
 *
 * a _k_ degree B-spline defined by _n+1_ control points _n - k + 1_ Bézier curves
 */

/**
 * knot vector length is equal to the degree plus the control point length + 1
 *
 * if we have a degree 3 b-spline with 5 control points, we should have 9 knots
 */
const CURVE_TYPE = {
	open: 'open',
	clamped: 'clamped',
	closed: 'closed',
} as const;
type CurveType = typeof CURVE_TYPE[keyof typeof CURVE_TYPE];

export function createCurve(
	controlPoints: Vec[],
	degree: number,
	type: CurveType = 'open',
) {
	const n = controlPoints.length - 1;
	const p = degree;
	const m = n + p + 1;
	const knotLength = m + 1;
	const clampedLength = knotLength - p * 2;
	let knots: number[] = [];
	let domain: [number, number];
	const curveCps = controlPoints;
	switch (type) {
		case 'open':
			range(knotLength).forEach(i => knots.push(i));
			domain = [knots[p], knots[m - p]];
			break;
		case 'clamped':
			knots = [
				...range(p).map(() => 0),
				...range(clampedLength).map(i => i),
				...range(p).map(() => clampedLength - 1),
			];
			domain = [knots[0], knots[m]];
			break;
		case 'closed': {
			curveCps.push(controlPoints[0]);
			const workingKnots = range(n + 1).map(i => i);
			range(0, p + 2).forEach(i => {
				workingKnots[n + i + 1] = workingKnots[i];
			});
			knots = workingKnots;
			domain = [knots[0], knots[n + 1] + (n + 1)];
		}
	}

	return { knots, domain, cps: curveCps, type, degree };
}

type Curve = ReturnType<typeof createCurve>;
export function curveDeBoor(t: number, curve: Curve) {
	const {
		domain: [low, high],
		cps,
		knots,
		type,
		degree,
	} = curve;
	const knotsLength = knots.length;
	const u = t * (high - low) + low;
	const p = degree;

	const start = type === 'open' ? p : type === 'closed' ? 0 : low;
	const end =
		type === 'open' ? knotsLength - p : type === 'closed' ? high : high;
	let k = end;
	let h = degree;
	let s = 0;
	for (let i = start; i <= end; i++) {
		const uk = knots[i];
		const uk_ = knots[i + 1];
		if (u < uk || u >= uk_) continue;
		k = i;
		if (u === uk) {
			s =
				type === 'closed' || type === 'open'
					? 1
					: knots.filter(v => v === u).length - 1;
		}

		h = degree - s;
		break;
	}

	const workingPoints: Vec[][] = [];
	const firstLayer: Vec[] = [];
	const f = k - p;
	const l = k - s;
	for (let i = f; i <= l; i++) {
		firstLayer[i] = cps[i];
	}

	workingPoints[0] = firstLayer;
	for (let r = 1; r <= h; r++) {
		const layer = [];
		workingPoints[r] = layer;
		for (let i = k - p + r; i <= k - s; i++) {
			const alpha = (u - knots[i]) / (knots[i + p - r + 1] - knots[i]);
			const pointA = workingPoints[r - 1][i - 1];
			const pointB = workingPoints[r - 1][i];
			const workingPoint = pointA.mul(1 - alpha).add(pointB.mul(alpha));
			workingPoints[r][i] = workingPoint;
		}
	}

	return workingPoints[p - s][k - s];
}

function adjacentSame<T = number>(array: T[], index: number): number {
	let count = 1;
	for (let i = index - 1; i >= 0; i--) {
		if (array[i] === array[index]) {
			count++;
		} else {
			break;
		}
	}

	return count;
}

function findKnotIndexForU(u: number, deg: number, knots: number[]) {
	const start = deg - 1;
	const last = knots.length - deg;
	let s = 0;
	let index = 0;
	if (u < knots[start] || u > knots[last]) {
		throw new Error(`knot ${u} is out of bounds between ${start} and ${last}`);
	}

	for (const [i, knot] of knots.entries()) {
		if (knot > u) {
			if (s === 0) return [s, i - 1] as const;
		} else if (knot === u) {
			index = u;
			s += 1;
		}
	}

	if (s > 0) return [s, index] as const;
}

function getAllNumbersBetween(x: number, y: number) {
	const numbers: number[] = [];
	// Handle too few arguments.
	if (x < y)
		for (let i = x; i < y; i++) {
			numbers.push(i);
		}
	else if (y < x)
		for (let i = y; i < x; i++) {
			numbers.push(i);
		}
	else numbers.push(x);
	return numbers;
}

export function basis(
	t: number,
	tKnots: number[],
	i: number,
	j: number,
): number {
	const result = 1;
	// Zero case
	if (j === 1) {
		if (tKnots[i] <= t && t < tKnots[i + 1]) return 1;
		return 0;
	}

	let a = (t - tKnots[i]) / (tKnots[i + j] - tKnots[i]);

	let b = (tKnots[i + j + 1] - t) / (tKnots[i + j + 1] - tKnots[i + 1]);
	a = Number.isFinite(a) ? a : 0;
	b = Number.isFinite(b) ? b : 0;
	const c = a * basis(t, tKnots, i, j - 1);
	const d = b * basis(t, tKnots, i + 1, j - 1);
	return c + d;
}

export function deboor(
	t: number,
	degree: number,
	knots: number[],
	controlPoints: Vec[],
): Vec {
	const m = controlPoints.length - 1;
	let knotIndex = m;
	for (let l = degree - 1; l < knots.length; l++) {
		if (t >= knots[l] && t < knots[l + 1]) {
			knotIndex = l;
			break;
		}
	}

	let knotsToAdd: number; // h
	let s = 0;
	if (knots[knotIndex] === t) {
		s = adjacentSame(knots, knotIndex);
		knotsToAdd = degree - s;
	} else {
		knotsToAdd = degree;
	}

	const workingPoints: Map<number, Map<number, Vec>> = new Map();
	workingPoints.set(0, new Map());
	const firstLayer = workingPoints.get(0);
	range(knotIndex - (degree - 1), knotIndex + 1).forEach(i => {
		if (!(i in controlPoints))
			throw new Error(`no index ${i} in control Point array`);
		firstLayer.set(i, controlPoints[i]);
	});
	for (let addedKnot = 1; addedKnot <= knotsToAdd; addedKnot++) {
		workingPoints.set(addedKnot, new Map());
		const thisLayer = workingPoints.get(addedKnot);
		for (
			let i = knotIndex - (degree - 1) + addedKnot;
			i <= knotIndex - s;
			i++
		) {
			const alpha =
				(t - knots[i]) / (knots[i + degree + addedKnot + 1] - knots[i]);
			const previousLayer = workingPoints.get(addedKnot - 1);
			if (!previousLayer)
				throw new Error(`no layer at postion ${addedKnot - 1}`);
			const pointA = previousLayer.get(i - 1);
			if (!pointA)
				throw new Error(`no controlPoint generated at index ${i - 1}`);
			const pointB = previousLayer.get(i);
			if (!pointB) throw new Error(`no controlPoint generated at index ${i}`);
			const newPoint = pointA.mul(1 - alpha).add(pointB.mul(alpha));

			thisLayer.set(i, newPoint);
		}
	}

	return workingPoints.get(degree - s).get(knotIndex - s);
}

export function knotCreator(
	degree: number,
	controlPointLength: number,
	closed = false,
): number[] {
	const n = controlPointLength - 1;

	const rawKnots: number[] = [];
	for (let i = 0; i <= n; i += 1) {
		rawKnots.push(i);
	}

	return closed
		? [...rawKnots, ...rawKnots.slice(0, degree + 1)]
		: [
				...Array.from<number>({ length: degree - 1 }).fill(0),
				...rawKnots,
				...Array.from<number>({ length: degree - 1 }).fill(n),
		  ];
}

console.log(`curve creator`);
console.log(
	createCurve(
		range(12).map(i => new Vec(i, 0)),
		1,
		'open',
	),
);
console.log(
	createCurve(
		range(12).map(i => new Vec(i, 0)),
		1,
		'clamped',
	),
);
console.log(
	createCurve(
		range(12).map(i => new Vec(i, 0)),
		8,
		'closed',
	),
);
console.log('curve created');

console.log(`d3, count 7`);
const testKnots = knotCreator(4, 9, false);
console.log(testKnots);
console.log(
	range(0, 8, 0.2).map(u => [u, ...findKnotIndexForU(u, 4, testKnots)]),
);

console.log(knotCreator(3, 7, true));
console.log(knotCreator(3, 7, false));
console.log(
	knotCreator(3, 7, false).length,
	'-',
	knotCreator(3, 7, true).length,
	'-',
	3 + 7,
);
console.log(`d3, count 8`);

console.log(knotCreator(3, 8, true));
console.log(knotCreator(3, 8, false));
