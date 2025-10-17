import { range } from 'd3';
import { Vec } from '../core/vec.js';
import { type Matrix, matrix, multiply } from 'mathjs';
import matrices from './mat.json';
type Loop = [number, number][];
type SplineType = 'closed' | 'clamped' | 'open';

const internalMats: Matrix[] = [];
Object.keys(matrices).forEach((k) => {
	const key = k as keyof typeof matrices;
	const data = matrices[key].data;
	const mat = matrix(data);
	internalMats[Number.parseInt(key, 10)] = mat;
});

export function bsplineMat(spline: BasisSpline, t: number) {
	if (t >= 1) t = 1;
	const u = t * (spline.knots.length - spline.degree);
	const knotIndex = t === 1 ? u - 1 : Math.floor(u);
	const x = u - knotIndex;
	const sourcePoints = range(spline.degree + 1).map((d) => {
		return spline.controlPoints[spline.knots[knotIndex + d]];
	});

	return matsplineMult(spline.degree, x, sourcePoints);
}

export function cubicBSplineToBezierSpline(spline: BasisSpline) {
	if (spline.degree !== 3) throw new Error('spline is not degree 3');
	return range(spline.knots.length - 3).map((i) => {
		const pts = range(4).map((j) => spline.controlPoints[spline.knots[i + j]]);
		return bezierFromCubicBSplineSection(pts);
	});
}

function matsplineMult(degree: number, x: number, sourcePoints: Vec[]) {
	const inputMatrix = matrix(range(degree + 1).map((i) => x ** i));
	if (internalMats[degree] === undefined) {
		throw new Error(`no matrix for degree of ${degree}`);
	}

	const mat = internalMats[degree];
	const factors = multiply(inputMatrix, mat).toArray() as number[];
	const result = range(degree + 1).reduce((a, b) => {
		return a.add(sourcePoints[b].mul(factors[b]));
	}, new Vec(0, 0));
	return result;
}

type CubicSplineInput = Vec[];
function bezierFromCubicBSplineSection(pts: CubicSplineInput) {
	if (pts.length < 4) throw new Error(`input is less then 4`);
	const a = matsplineMult(3, 0, pts);
	const d = matsplineMult(3, 1, pts);
	const b = Vec.lerp(pts[1], pts[2], 1 / 3);
	const c = Vec.lerp(pts[1], pts[2], 2 / 3);
	return [a, b, c, d];
}

function binarySearch(nums: number[], target: number): number {
	let left = 0;
	let right: number = nums.length - 1;
	if (nums[left] === target) return 0;
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
	public totalLength?: number;
	public interpolateLut?: (t: number) => number;
	public depth: number;
	constructor(
		cps: Loop,
		degree: number,
		type: SplineType,
		useLUT = false,
		depth = 0,

		knots?: number[],
	) {
		if (!(depth in lutDepthEnum)) {
			throw Error('depth is not 0,1,2,3');
		}
		this.type = type;
		this.useLUT = useLUT;
		this.depth = lutDepthEnum[depth as LUTDepth];
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
			const distances: number[] = [];
			let dist = 0;
			let previous = bsplineMat(this, 0);
			for (let i = 1; i < this.depth; i++) {
				const t = i / (this.depth - 1);
				const next = bsplineMat(this, t);
				const sum = dist + next.sub(previous).len();
				distances[i] = sum;
				dist = sum;
				previous = next;
			}

			const max = distances[this.depth - 1];
			this.totalLength = max;
			this.lut = distances.map((dist) => dist / max);
			this.lut[0] = 0;
			this.lut[this.depth - 1] = 1;
			const newLut = [] as number[];
			newLut[0] = 0;
			const maxValue = this.depth - 1;
			for (let i = 1; i < this.depth; i++) {
				const input = i / (this.depth - 1);
				let u = binarySearch(this.lut, input);
				if (u === -1) {
					u = this.depth - 1;
					newLut[i] = 1;
					continue;
				}

				const inputLower = u / maxValue;
				const inputUpper = (u + 1) / maxValue;
				const outputLower = this.lut[u];
				const outputUpper = this.lut[u + 1];
				const output = ((input - inputLower) / (inputUpper - inputLower)) * (outputUpper - outputLower) + outputLower;
				newLut[i] = output;
			}

			newLut[maxValue] = 1;
			this.lut = newLut;

			this.interpolateLut = (t: number) => {
				if (!this.lut) throw Error('no lut found');
				const lut = this.lut;
				if (t === 1) return 1;
				const u = t * (this.depth - 1);
				const a = Math.floor(u);
				const b = a + 1;
				const x = u - a;
				return lut[a] + x * (lut[b] - lut[a]);
			};
		}
	}
}

export function bSpline(cps: Vec[], degree: number, closed: SplineType = 'clamped', useLUT = false, depth = 2) {
	return new BasisSpline(cps, degree, closed, useLUT, depth);
}
