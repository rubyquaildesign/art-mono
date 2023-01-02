import { Vp } from './vec';

type ToXy = (pt: Vp) => XYPt;
type ToVp = (pt: XYPt) => Vp;

export function toXyFactory(factor = 100_000) {
	const ft = factor;
	const converter: ToXy = (pt: Vp) => {
		return { x: Math.round(pt[0] * ft), y: Math.round(pt[1] * ft) };
	};

	return converter;
}

export function toVpFactory(factor = 100_000) {
	const ft = factor;
	const converter: ToVp = pt => [pt.x / ft, pt.y / ft];
	return converter;
}

export function toXy(pt: Vp, factor = 100_000): XYPt {
	return { x: Math.round(pt[0] * factor), y: Math.round(pt[1] * factor) };
}

export function toVp(pt: XYPt, factor = 100_000): Vp {
	return [pt.x / factor, pt.y / factor];
}

export function toXyLoop(loop: Vp[], factor = 100_000) {
	const converter = toXyFactory(factor);
	return loop.map(p => converter(p));
}

export function toVpLoop(loop: XYPt[], factor = 100_000) {
	const converter = toVpFactory(factor);
	return loop.map(p => converter(p));
}

export function toXyShape(shape: Vp[][], factor = 100_000) {
	const converter = toXyFactory(factor);
	return shape.map(lp => lp.map(pt => converter(pt)));
}

export function toVpShape(shape: XYPt[][], factor = 100_000) {
	const converter = toVpFactory(factor);
	return shape.map(lp => lp.map(pt => converter(pt)));
}
