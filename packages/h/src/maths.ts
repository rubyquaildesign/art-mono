export const PI = Math.PI;
export const TAU = 2 * Math.PI;
const sqrt = Math.sqrt;
const EPSILON = 1e-12;
export function equivilant(a: number, b: number) {
	return Math.abs(a - b) < EPSILON;
}

export function rndm(): number;
export function rndm(max: number): number;
export function rndm(min: number, max: number): number;
export function rndm(...args: number[]) {
	if (args[0] === undefined) {
		return Math.random();
	}

	if (args[1] === undefined) {
		return args[0] * Math.random();
	}

	return args[0] + Math.random() * (args[1] - args[0]);
}

export function flr(value: number): number {
	return Math.floor(value);
}

function lengthAr(a: [number, number], b: [number, number]): number {
	const xDist = (b[0] - a[0]) ** 2;
	const yDist = (b[1] - a[1]) ** 2;

	return sqrt(xDist + yDist);
}

function lenxy(a: XYPt, b: XYPt): number {
	const xDist = (b.x - a.x) ** 2;
	const yDist = (b.y - a.y) ** 2;

	return sqrt(xDist + yDist);
}

function isXYPt(a: XYPt | Pt): a is XYPt {
	return (a as XYPt).x !== undefined;
}

export function length<T extends XYPt | Pt>(a: T, b: T) {
	if (isXYPt(a) && isXYPt(b)) {
		return lenxy(a, b);
	}

	return lengthAr(a as [number, number], b as [number, number]);
}

export function sub(a: Pt, b: Pt): Pt {
	return [a[0] - b[0], a[1] - b[1]];
}
