import { Vec } from './vec';

const fractional = (t: number) => t >= 0 && t <= 1;
enum IntersectionType {
	overlap = 'overlap',
	intersect = 'intersect',
	parallel = 'parallel',
	sepperate = 'sepperate',
}
type Overlap = {
	kind: IntersectionType.overlap;
	tRange: [number, number];
	intersects: true;
};
type Intersect = {
	kind: IntersectionType.intersect;
	pt: Vec;
	tFromA: number;
	intersects: true;
};
type Parallel = { kind: IntersectionType.parallel; intersects: false };
type Sepperate = { kind: IntersectionType.sepperate; intersects: false };
type IntersectionResult = Overlap | Intersect | Parallel | Sepperate;
type ProjectionResult = { onLine: boolean; t: number; pt: Vec };
export class Line {
	start: Vec;
	end: Vec;

	constructor(a: Vec, b: Vec) {
		this.start = a;
		this.end = b;
	}

	get vector() {
		return this.end.sub(this.start);
	}

	get length() {
		return this.vector.len();
	}

	get arr(): [Vec, Vec] {
		return [this.start, this.end];
	}

	updateStart(n: Vec) {
		this.start = n.clone();
		return this;
	}

	updateEnd(n: Vec) {
		this.end = n.clone();
		return this;
	}

	cloneLine() {
		return new Line(this.start, this.end);
	}

	reverse() {
		const temporary = this.start;
		this.updateStart(this.end).updateEnd(temporary);
		return this;
	}

	intersectionPoint(other: Line): IntersectionResult {
		const r = this.vector;
		const s = other.vector;
		const p = this.start;
		const q = other.start;
		const diffVec = q.sub(p);
		// Co-linear case
		if (r.cross(s) === 0 && q.sub(p).cross(r) === 0) {
			// Lines are colinear
			const t0 = diffVec.dot(r) / r.dot(r);
			const t1 = t0 + s.dot(r) / r.dot(r);
			if (s.dot(r) < 0) {
				if (t1 > 1 || t0 < 0)
					return { kind: IntersectionType.parallel, intersects: false };
				const minPoint = Math.max(0, t1);
				const maxPoint = Math.min(1, t0);
				return {
					kind: IntersectionType.overlap,
					intersects: true,
					tRange: [minPoint, maxPoint],
				};
			}

			if (t0 > 1 || t1 < 0)
				return { kind: IntersectionType.parallel, intersects: false };
			const minPoint = Math.max(0, t0);
			const maxPoint = Math.min(1, t1);
			return {
				kind: IntersectionType.overlap,
				intersects: true,
				tRange: [minPoint, maxPoint],
			};
		}

		if (r.cross(s) === 0 && q.sub(p).cross(r) !== 0)
			return {
				kind: IntersectionType.parallel,
				intersects: false,
			};
		const t = diffVec.cross(s) / r.cross(s);
		const u = diffVec.cross(r) / r.cross(s);
		if (r.cross(s) && fractional(t) && fractional(u))
			return {
				kind: IntersectionType.intersect,
				intersects: true,
				pt: p.add(r.mul(t)),
				tFromA: t,
			};
		return { kind: IntersectionType.sepperate, intersects: false };
	}

	projectPointToLine(point: Vec): ProjectionResult {
		const l2 = this.vector.lenSq();
		const pStart = point.sub(this.start);
		const t = pStart.dot(this.vector) / l2;
		const onLine = fractional(t);
		return { onLine, t, pt: this.vector.mul(t).add(this.start) };
	}

	minDistToPoint(point: Vec) {
		const l2 = this.vector.lenSq();
		if (l2 === 0) {
			return point.dist(this.start);
		}

		const proj = this.projectPointToLine(point);
		if (proj.onLine) return point.dist(proj.pt);
		if (proj.t < 0) return point.dist(this.start);
		return point.dist(this.end);
	}

	clockwiseDir() {
		return (
			-1 *
			Math.sign(new Vec(0, 1).cross(this.vector)) *
			new Vec(0, 1).angleBetween(this.vector)
		);
	}

	isEqualTo(other: Line) {
		return (
			(this.start.isEqualTo(other.end) && this.end.isEqualTo(other.start)) ||
			(this.start.isEqualTo(other.start) && this.end.isEqualTo(other.end))
		);
	}

	clone() {
		return new Line(this.start, this.end);
	}

	offsetStart(offset: number) {
		const t = this.vector.setLength(offset);
		return this.updateStart(this.start.add(t));
	}

	offsetEnd(offset: number) {
		const t = this.start.sub(this.end).setLength(offset);
		return this.updateEnd(this.end.add(t));
	}

	offsetBoth(offset: number) {
		return this.offsetStart(offset).offsetEnd(offset);
	}
}
