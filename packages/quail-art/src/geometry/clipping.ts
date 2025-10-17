import type { ClipperLibWrapper, ClipParams, OffsetParams } from 'js-angusj-clipper/universal';
import * as clipperLibrary from 'js-angusj-clipper/universal/index.js';
import type { Vec } from '../core/vec.js';
import { toVecShape, toXyShape } from '../core/xy-point-helpers.js';
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function getLoopDepth(arr: any): number {
	return Array.isArray(arr) ? 1 + getLoopDepth(arr[0]) : 0;
}
console.log('clippo');
console.log(clipperLibrary);

type Point = [number, number] | Vec | number[];
type Loop = Point[];
type Shape = Loop[];
type VecShape = Vec[][];
const c = clipperLibrary;
const jts = {
	miter: c.JoinType.Miter,
	round: c.JoinType.Round,
	square: c.JoinType.Square,
};
type JoinType = keyof typeof jts;
export class Clip {
	factor = 1e3;
	preserveColinear = false;
	ajc: ClipperLibWrapper;
	constructor(ajc: ClipperLibWrapper, factor?: number) {
		this.ajc = ajc;
		if (factor !== undefined) {
			this.factor = factor;
		}
	}

	private isLoop(source: Loop | Shape): source is Loop {
		if (typeof source[0][0] === 'number') {
			return true;
		}
		return false;
	}

	private toShape(inputSet: Loop | Shape): Shape {
		return this.isLoop(inputSet) ? [inputSet] : inputSet;
	}

	union(inputShapes: Shape | Shape[]): VecShape | undefined {
		const extractedShapes: Shape[] = this.isLoop(inputShapes[0])
			? ([inputShapes] as Shape[])
			: (inputShapes as Shape[]);
		const workingShapes = extractedShapes.map((sh) => toXyShape(sh, this.factor));
		const clipOptions = {
			clipType: c.ClipType.Union,
			subjectFillType: c.PolyFillType.NonZero,
			preserveCollinear: this.preserveColinear,
			subjectInputs: workingShapes.map((poly) => ({
				closed: true,
				data: poly,
			})),
		} satisfies ClipParams;
		const result = this.ajc.clipToPaths(clipOptions);

		return toVecShape(result, this.factor);
	}

	intersect(subjectShape: Shape | Loop, clipShape: Shape | Loop): VecShape | undefined {
		const workingSubj = toXyShape(this.toShape(subjectShape), this.factor);
		const workingClip = toXyShape(this.toShape(clipShape), this.factor);
		const clipOptions = {
			clipType: c.ClipType.Intersection,
			subjectFillType: c.PolyFillType.EvenOdd,
			preserveCollinear: this.preserveColinear,
			subjectInputs: [
				{
					closed: true,
					data: workingSubj,
				},
			],
			clipInputs: [
				{
					data: workingClip,
				},
			],
		} satisfies ClipParams;
		const result = this.ajc.clipToPaths(clipOptions);

		return toVecShape(result, this.factor);
	}

	offset(
		subjectSet: Shape | Loop | Shape[],
		ammount: number,
		joinType: JoinType = 'miter',
		miterLimit = 2,
	): VecShape | undefined {
		const inputType = getLoopDepth(subjectSet);
		if (inputType > 4 || inputType < 2) throw new Error(`bad input not shape loop or list of shapes`);
		const workingShape =
			inputType === 4
				? subjectSet.map((s) => toXyShape(s as Shape))
				: [this.toShape(subjectSet as Shape | Loop)].map((s) => toXyShape(s, this.factor));
		const workingAmmount = Math.round(ammount * this.factor);
		const offsetSettings: OffsetParams = {
			delta: workingAmmount,
			miterLimit,
			arcTolerance: 5,
			offsetInputs: workingShape.map((sh) => ({
				data: sh,
				endType: c.EndType.ClosedPolygon,
				joinType: jts[joinType],
			})),
		};
		const output = this.ajc.offsetToPaths(offsetSettings);
		return output === undefined ? undefined : toVecShape(output, this.factor);
	}
}
export async function buildClipper(factor?: number) {
	console.log('building');

	const lib = await clipperLibrary.loadNativeClipperLibInstanceAsync(
		clipperLibrary.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback,
	);
	return new Clip(lib, factor);
}
