import { Matrix, matrix, multiply } from 'mathjs';
import { range } from 'd3-array';
import z from 'zod';
import matrices from './mat.json';
import type { BSpline } from './b-spline';
import { Vec } from './vec';

const internalMats: Matrix[] = [];
Object.keys(matrices).forEach(k => {
	const key = k as keyof typeof matrices;
	const data = matrices[key].data;
	const mat = matrix(data);
	internalMats[Number.parseInt(key, 10)] = mat;
});

export function bsplineMat(spline: BSpline, t: number) {
	const u = t * (spline.knots.length - spline.degree);
	const knotIndex = Math.floor(u);
	const x = u - knotIndex;
	const sourcePoints = range(spline.degree + 1).map(d => {
		return spline.controlPoints[spline.knots[knotIndex + d]];
	});

	return matsplineMult(spline.degree, x, sourcePoints);
}

export function cubicBSplineToBezierSpline(spline: BSpline) {
	z.object({ degree: z.literal(3) }).parse(spline);
	return range(spline.knots.length - 3).map(i => {
		const pts = range(4).map(j => spline.controlPoints[spline.knots[i + j]]);
		return bezierFromCubicBSplineSection(pts);
	});
}

function matsplineMult(degree: number, x: number, sourcePoints: Vec[]) {
	const inputMatrix = matrix(range(degree + 1).map(i => x ** i));
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

const cubicSplineInput = z.instanceof(Vec).array().length(4);
function bezierFromCubicBSplineSection(pts: z.infer<typeof cubicSplineInput>) {
	cubicSplineInput.parse(pts);
	const a = matsplineMult(3, 0, pts);
	const d = matsplineMult(3, 1, pts);
	const b = Vec.lerp(pts[1], pts[2], 1 / 3);
	const c = Vec.lerp(pts[1], pts[2], 2 / 3);
	return [a, b, c, d];
}
