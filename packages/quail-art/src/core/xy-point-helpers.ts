import { type Vp, Vec } from './vec.js';
type XYPt = Readonly<{ x: number; y: number }>;
type ToXy = (pt: Vp) => XYPt;
type ToVec = (pt: XYPt) => Vec;

export function toXyFactory(factor = 100_000) {
	const ft = factor;
	const converter: ToXy = (pt: Vp) => {
		return { x: Math.round(pt[0] * ft), y: Math.round(pt[1] * ft) };
	};

	return converter;
}

export function toVecFactory(factor = 100_000) {
	const ft = factor;
	const converter: ToVec = (pt) => new Vec(pt.x / ft, pt.y / ft);
	return converter;
}

export function toXy(pt: Vp, factor = 100_000): XYPt {
	return { x: Math.round(pt[0] * factor), y: Math.round(pt[1] * factor) };
}

export function toVec(pt: XYPt, factor = 100_000): Vp {
	return new Vec(pt.x / factor, pt.y / factor);
}

export function toXyLoop(loop: Vp[], factor = 100_000) {
	const converter = toXyFactory(factor);
	return loop.map((p) => converter(p));
}

export function toVecLoop(loop: XYPt[], factor = 100_000) {
	const converter = toVecFactory(factor);
	return loop.map((p) => converter(p));
}

export function toXyShape(shape: Vp[][], factor = 100_000) {
	const converter = toXyFactory(factor);
	return shape.map((lp) => lp.map((pt) => converter(pt)));
}

export function toVecShape(shape: XYPt[][], factor = 100_000) {
	const converter = toVecFactory(factor);
	return shape.map((lp) => lp.map((pt) => converter(pt)));
}
