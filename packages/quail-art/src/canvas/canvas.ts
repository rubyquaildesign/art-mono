import '../entry/main.js';
import { draw } from '../lib/index.js';
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const width = canvas.width;
const height = canvas.height;
const ctx = canvas.getContext('2d')!;
const forExport = {
	width,
	height,
	r: min(width, height),
	canvas,
	ctx,
	d: draw,
};
Object.entries(forExport).forEach(([key, value]) => {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	(globalThis as any)[key] = value;
});
declare global {
	// eslint-disable-next-line no-var
	var { width, height, r, canvas, ctx, d }: typeof forExport;
}
export function setSize(width: number, height: number): void {
	canvas.width = width;
	canvas.height = height;
	globalThis.width = width;
	globalThis.height = height;
	globalThis.r = min(width, height);
}
