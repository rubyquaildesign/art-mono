import { buildClipper } from '../geometry';

const clipLib = await buildClipper();
console.log(clipLib);
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(globalThis as any).clip = clipLib;
declare global {
	const clip: typeof clipLib;
}
