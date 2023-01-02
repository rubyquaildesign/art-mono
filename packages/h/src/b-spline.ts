import { range } from 'd3';
import { Vec } from './vec';
import type { Loop } from './types';
import { bsplineMat } from './splineMatForm';

type SplineType = 'closed' | 'clamped' | 'open';

function mod(diviend: number, divisor: number) {
	const quotiont = Math.floor(diviend / divisor);
	return diviend - divisor * quotiont;
}

function binarySearch(nums: number[], target: number): number {
	let left = 0;
	let right: number = nums.length - 1;

	while (left <= right) {
		const mid: number = Math.floor((left + right) / 2);

		if (nums[mid] <= target && nums[mid + 1] > target) return mid;
		if (target < nums[mid]) right = mid - 1;
		else left = mid + 1;
	}

	return -1;
}

const lutDepthEnum = {
	0: 256,
	1: 512,
	2: 1024,
	3: 2048,
} as const;
type LUTDepth = keyof typeof lutDepthEnum;
class BasisSpline {
	public controlPoints: Vec[];
	public type: SplineType;
	public knots: number[];
	public degree: number;
	public useLUT: boolean;
	public lut?: number[];
	public interpolateLut?: (t: number) => number;
	public depth: number;
	constructor(
		cps: Loop,
		degree: number,
		type: SplineType,
		useLUT = false,
		depth = 2,
		knots?: number[],
	) {
		this.type = type;
		this.useLUT = useLUT;
		this.depth = lutDepthEnum[depth];
		this.degree = degree;
		this.controlPoints = cps.map(([x, y]) => new Vec(x, y));
		const noPoints = this.controlPoints.length;
		if (type === 'open') {
			this.knots = knots || [...range(noPoints)];
		} else if (type === 'clamped') {
			const lastIndex = cps.length - 1;

			this.knots = knots || [
				...Array.from<number>({ length: degree - 1 }).fill(0),
				...range(noPoints),
				...Array.from<number>({ length: degree - 1 }).fill(lastIndex),
			];
		} else {
			this.knots = knots || [...range(noPoints), ...range(degree)];
		}

		if (this.useLUT) {
			this.lut = [] as number[];
			let dist = 0;
			const maxValue = this.depth - 1;
			this.lut[0] = 0;
			this.lut[maxValue] = 1;
			let previous = bsplineMat(this, 0);
			for (let i = 1; i < this.depth; i++) {
				const t = i / maxValue;
				const next = bsplineMat(this, t);
				const sum = dist + next.sub(previous).len();
				this.lut[i] = sum;
				dist = sum;
				previous = next;
			}

			const max = this.lut[this.depth - 1];
			this.lut = this.lut.map(dist => dist / max);
			this.lut[0] = 0;
			this.lut[this.depth - 1] = 1;
			const newLut = [] as number[];
			newLut[0] = 0;
			for (let i = 1; i < this.depth; i++) {
				const t = i / maxValue;
				let u = binarySearch(this.lut, t);
				if (u === -1) u = maxValue;
				const ia = u / maxValue;
				const ib = (u + 1) / maxValue;
				const oa = this.lut[u];
				const ob = this.lut[u + 1];
				const offset = (t - ia) * (ib - ia);
				const output = ia + (ib - ia) * ((t - oa) / (ob - oa));
				newLut[i] = output;
			}

			newLut[maxValue] = 1;
			this.lut = newLut;

			this.interpolateLut = (t: number) => {
				const lut = this.lut;
				const u = t * (this.depth - 1);
				const a = Math.floor(u);
				const b = a + 1;
				const x = u - a;
				return lut[a] + x * (lut[b] - lut[a]);
			};
		}
	}
}

export function bSpline(
	cps: Vec[],
	degree: number,
	closed: SplineType = 'clamped',
	useLUT = false,
	depth = 2,
) {
	return new BasisSpline(cps, degree, closed, useLUT, depth);
}

// export function deboor(interval: number, spline: BSpline, noLut = false) {
// 	let t = interval === 1 ? 1 - 1e-6 : interval;
// 	if (spline.useLUT && !noLut) {
// 		const d = spline.depth;
// 		const i = spline.lut.findIndex(v => t <= v);
// 		const a = spline.lut[i];
// 		const b = spline.lut[i + 1];
// 		// t = (i + (b - a) * (t - a)) / d;
// 		t = spline.interpolateLut(t);
// 		t = t < 0 ? 0 : t >= 1 ? 1 - 1e-6 : t;
// 		t = Number.isNaN(t) ? 1 - 1e-6 : t;
// 	}

// 	const { degree, controlPoints, knots } = spline;
// 	const startingIndex = spline.degree;
// 	const lastIndex = knots.length;
// 	const u = t * (lastIndex - startingIndex) + startingIndex;
// 	const k = Math.floor(u);

// 	const c = controlPoints;
// 	const workingPoints = range(0, degree + 1).map(
// 		j => controlPoints[knots[k + j]],
// 	);
// 	for (const r of range(1, degree + 1)) {
// 		for (const j of range(degree, r - 1, -1)) {
// 			const a = u - n[j + k - degree];
// 			const b = n[j + 1 + k - r] - n[j + k - degree];
// 			const alpha = a / b;
// 			workingPoints[j] = workingPoints[j - 1]
// 				.mul(1 - alpha)
// 				.add(workingPoints[j].mul(alpha));
// 		}
// 	}

// 	return workingPoints[degree];
// }

// function deriveSpline(spline: BasisSpline) {
// 	const m = spline.controlPoints.length;
// 	const n = m - 1;
// 	const p = spline.degree;
// 	const knots = spline.knots;
// 	const type = spline.type;
// 	const cps = spline.controlPoints;
// 	const np = range(n).map(i => {
// 		const t = knots[i + p + 1] - knots[i + 1];
// 		const alpha = p / t;
// 		return cps[i + 1].sub(cps[i]).mul(alpha);
// 	});
// 	const newSpline = bSpline(np, p - 1, spline.type, false);
// 	newSpline.knots = knots;
// 	if (type === 'open' || type === 'closed') {
// 		newSpline.startingIndex = p - 1;
// 		newSpline.lastIndex = np.length;
// 	} else {
// 		const nd = p - 1;
// 		newSpline.knots = knots.slice(1, -1);
// 		newSpline.startingIndex = 0;
// 		newSpline.lastIndex = -1 + (np.length + nd + 1 - nd * 2);
// 	}

// 	return newSpline;
// }

// function insertKnot(spline: BasisSpline, knotPosition: number) {
// 	const t = knotPosition;
// 	const { degree, controlPoints, knots, startingIndex, lastIndex } = spline;

// 	const u = startingIndex + (lastIndex - startingIndex) * ((t - 0) / (1 - 0)); // x
// 	let k: number;
// 	for (let n = 0; n < controlPoints.length; n++) {
// 		if (u >= knots[n] && u < knots[n + 1]) {
// 			k = n;
// 			break;
// 		}
// 	}

// 	const newPoints = range(0, controlPoints.length + 1).map(i => {
// 		let a: number;
// 		if (i <= k - degree + 1) {
// 			a = 1;
// 			return controlPoints[i];
// 		}

// 		if (i >= k + 1) {
// 			a = 0;
// 			return controlPoints[i - 1];
// 		}

// 		if (k - degree + 1 <= i && i <= k) {
// 			const aa = u - knots[i];
// 			const ab = knots[k + degree] - knots[i];
// 			a = aa / ab;
// 			const newPoint = controlPoints[i - 1]
// 				.mul(1 - a)
// 				.add(controlPoints[i].mul(a));
// 			return newPoint;
// 		}

// 		throw new Error(`fml`);
// 	});
// 	const newKnots = knots.slice(0);
// 	newKnots.splice(k + 1, 0, u);
// 	const newSpline = bSpline(newPoints, spline.degree, spline.type, false);
// 	newSpline.knots = newKnots;
// 	if (spline.type === 'open' || spline.type === 'closed') {
// 		newSpline.startingIndex = spline.degree;
// 		newSpline.lastIndex = newKnots[newKnots.length - (degree + 1)];
// 	} else {
// 		const nd = degree;
// 		newSpline.knots = knots.slice(1, -1);
// 		newSpline.startingIndex = 0;
// 		newSpline.lastIndex = newKnots[newKnots.length - (degree + 1)];
// 	}

// 	return newSpline;
// }

export type BSpline = InstanceType<typeof BasisSpline>;
