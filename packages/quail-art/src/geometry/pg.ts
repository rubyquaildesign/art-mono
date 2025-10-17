import { polygonCentroid } from 'd3';

type TDLPT = Array<[number, number]>;
type Pt = [number, number];
type Loop = Pt[];
function sqr(x: number) {
	return x * x;
}

function dist2(v: Pt, w: Pt) {
	return sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
}

function distToSegmentSquared(p: Pt, v: Pt, w: Pt) {
	const l2 = dist2(v, w);

	if (l2 === 0) return dist2(p, v);
	let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;

	t = Math.max(0, Math.min(1, t));

	return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
}

export function distToSegment(p: Pt, v: Pt, w: Pt) {
	return Math.sqrt(distToSegmentSquared(p, v, w));
}

export function minDistFromCentroid(poly: Loop) {
	const c = polygonCentroid(poly as TDLPT);
	const r: number[] = [];

	for (let i = 0; i < poly.length; i++) {
		const thisP = poly[i];
		const nextP = poly[(i + 1) % poly.length];

		r.push(distToSegment(c, thisP, nextP));
	}

	return Math.min(...r);
}
