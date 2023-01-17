import {
	toVecLoop,
	toXyLoop,
	toXyShape,
	type Vec,
	type Vp,
} from '@rupertofly/h';
import * as Clip from 'js-angusj-clipper';

const clipperLib = await Clip.loadNativeClipperLibInstanceAsync(
	Clip.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback,
);
const factor = 1e8;
function isLoop(a: Vp[] | Vp[][]): a is Vp[] {
	return typeof a[0][0] === 'number';
}

export function offset(loopOrShape: Vp[] | Vp[][], amount: number): Vec[][] {
	const inputIsLoop = isLoop(loopOrShape);
	const op = inputIsLoop
		? toXyLoop(loopOrShape, factor)
		: toXyShape(loopOrShape, factor);
	const output = clipperLib.offsetToPaths({
		delta: amount * factor,
		offsetInputs: [
			{
				data: op,
				endType: Clip.EndType.ClosedPolygon,
				joinType: Clip.JoinType.Miter,
			},
		],
	});
	if (!output) throw new Error('clip failed');
	return output.map(c => toVecLoop(c, factor));
}

export function union(inputs: Array<Vp[] | Vp[][]>): Vec[][] {
	const input = inputs.map(ip =>
		isLoop(ip) ? toXyLoop(ip, factor) : toXyShape(ip, factor),
	);
	const output = clipperLib.clipToPaths({
		clipType: Clip.ClipType.Union,
		subjectFillType: Clip.PolyFillType.NonZero,
		subjectInputs: input.map(lp => ({ data: lp, closed: true })),
	});
	if (!output) throw new Error('clip failed');
	return output.map(c => toVecLoop(c, factor));
}

export function intersection(
	inputA: Vp[] | Vp[][],
	inputB: Vp[] | Vp[][],
): Vec[][] {
	const A = isLoop(inputA)
		? toXyLoop(inputA, factor)
		: toXyShape(inputA, factor);
	const B = isLoop(inputB)
		? toXyLoop(inputB, factor)
		: toXyShape(inputB, factor);
	const output = clipperLib.clipToPaths({
		clipType: Clip.ClipType.Intersection,
		subjectFillType: Clip.PolyFillType.NonZero,
		subjectInputs: [{ closed: true, data: A }],
		clipInputs: [{ data: B }],
	});
	if (!output) throw new Error('clip failed');
	return output.map(c => toVecLoop(c, factor));
}

export function subtract(
	inputA: Vp[] | Vp[][],
	inputB: Vp[] | Vp[][],
): Vec[][] {
	const A = isLoop(inputA)
		? toXyLoop(inputA, factor)
		: toXyShape(inputA, factor);
	const B = isLoop(inputB)
		? toXyLoop(inputB, factor)
		: toXyShape(inputB, factor);
	const output = clipperLib.clipToPaths({
		clipType: Clip.ClipType.Difference,
		subjectFillType: Clip.PolyFillType.NonZero,
		subjectInputs: [{ closed: true, data: A }],
		clipInputs: [{ data: B }],
	});
	if (!output) throw new Error('clip failed');
	return output.map(c => toVecLoop(c, factor));
}

export function xor(inputA: Vp[] | Vp[][], inputB: Vp[] | Vp[][]): Vec[][] {
	const A = isLoop(inputA)
		? toXyLoop(inputA, factor)
		: toXyShape(inputA, factor);
	const B = isLoop(inputB)
		? toXyLoop(inputB, factor)
		: toXyShape(inputB, factor);
	const output = clipperLib.clipToPaths({
		clipType: Clip.ClipType.Xor,
		subjectFillType: Clip.PolyFillType.NonZero,
		subjectInputs: [{ closed: true, data: A }],
		clipInputs: [{ data: B }],
	});
	if (!output) throw new Error('clip failed');
	return output.map(c => toVecLoop(c, factor));
}

export function clean<T extends Vp[] | Vp[][]>(
	input: T,
	distance = 1e-2,
): T extends Vp[] ? Vec[] : Vec[][] {
	const isL = isLoop(input);
	const ip = isL ? toXyLoop(input, factor) : toXyShape(input, factor);

	const output = isL
		? clipperLib.cleanPolygon(ip as any, distance * factor)
		: clipperLib.cleanPolygons(ip as any, distance * factor);
	if (!output) throw new Error('clip failed');
	return isL
		? toVecLoop(output as Clip.Path, factor)
		: (output.map(c => toVecLoop(c as Clip.Path, factor)) as any);
}

export function isClockwise(input: Vp[], yDown = true): boolean {
	const ip = toXyLoop(input, factor);
	const isOrientation = clipperLib.orientation(ip);
	return yDown ? isOrientation : !isOrientation;
}
