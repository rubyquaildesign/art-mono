export {};
declare global {
	type Pt = [number, number] | number[];
	type Loop = Pt[];
	type Line = [Pt, Pt];
	type Shape = Loop[];
	type Extent = [number, number, number, number];
	type XYPt = { x: number; y: number };
	type BezierCurve = [Pt, Pt, Pt, Pt];
}
