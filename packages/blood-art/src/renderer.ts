/* eslint-disable @typescript-eslint/member-ordering */
import REGL, { type Framebuffer2D } from 'regl';
import './lib';
import { settings } from './settings';

// Shaders
import rectVert from './shaders/rect.vert';

import copyFrag from './shaders/copy.frag';
import testFrag from './shaders/test.frag';

import prclVert from './shaders/prcls.vert';
import prclFrag from './shaders/prcls.frag';

import blurFrag from './shaders/blur.frag';
import stepFrag from './shaders/threshold.frag';
import GL = REGL;

type DC = GL.DefaultContext;
type TextureLike = GL.Framebuffer2D | GL.Texture2D;
type Command<Props extends Record<string, unknown> = Record<string, unknown>> =
	GL.DrawCommand<DC, Props>;
type FilParameters = { from: TextureLike; to?: Framebuffer2D };

async function importImage(path: string) {
	const imageElement = document.createElement('img');
	imageElement.src = path;
	await new Promise<void>(resolve => {
		imageElement.addEventListener('load', _ => {
			resolve();
		});
	});
	return imageElement;
}

const fgImage = await importImage('/Top_Matte.png');
const gl = REGL({
	canvas: document.querySelector<HTMLCanvasElement>('#canvas')!,
	extensions: ['OES_standard_derivatives'],
	attributes: { depth: false, premultipliedAlpha: false },
});

export class Renderer {
	width = width;
	height = height;
	frameCount = 0;
	gl: GL.Regl;
	aFBO: GL.Framebuffer2D;
	bFBO: GL.Framebuffer2D;
	particlePosBuffer: GL.Buffer;
	prclCount = 0;
	staticDrawTextureBG: GL.Texture2D;
	staticDrawTextureFG: GL.Texture2D;
	LiquidStencil: GL.Texture2D;

	globalState = gl({
		uniforms: {
			uResolution: () => [width, height],
			uTime: () => this.frameCount,
		},
		depth: { enable: false },
	});

	constructor() {
		this.gl = gl;
		this.aFBO = gl.framebuffer({
			color: gl.texture({
				width,
				height,
				mag: 'linear',
				min: 'linear',
			}),
		});
		this.bFBO = gl.framebuffer({
			color: gl.texture({
				width,
				height,
				mag: 'linear',
				min: 'linear',
			}),
		});
		this.particlePosBuffer = gl.buffer({
			type: 'float32',
		});
		this.staticDrawTextureFG = gl.texture({
			width,
			height,
		});
		this.assignImageToFGDraw(fgImage);
	}

	setPrclBuffer(particles: Float32Array, count: number) {
		this.particlePosBuffer({
			data: particles,
			usage: 'stream',
			type: 'float32',
		});
		this.prclCount = count;
	}

	setFrameC(fc: number) {
		this.frameCount = fc;
		return this;
	}

	private assignImageToFGDraw(img: HTMLImageElement) {
		this.staticDrawTextureFG({
			width,
			height,
			data: img,
			premultiplyAlpha: false,
		});
	}

	private static readonly renderToScreen: Command<{
		fb: TextureLike;
		flip: boolean;
	}> = gl({
		vert: rectVert,
		frag: copyFrag,
		blend: {
			enable: true,
			func: {
				srcRGB: 'src alpha',
				srcAlpha: 'src alpha',
				dstRGB: 'one minus src alpha',
				dstAlpha: 'one minus src alpha',
			},
		},
		depth: { enable: false },
		attributes: {
			aPosition: [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
			],
		},
		primitive: 'triangle strip',
		framebuffer: null,
		count: 4,
		uniforms: {
			uFlip: (_, p) => (p.flip ? 1 : 0),
			uSource: (c, p) => p.fb,
		},
	});

	renderToScreen(source: GL.Framebuffer2D | GL.Texture2D, flip = false) {
		this.globalState(() => {
			Renderer.renderToScreen({ fb: source, flip });
		});
		return this;
	}

	private static readonly test: Command = gl({
		vert: rectVert,
		frag: testFrag,
		attributes: {
			aPosition: [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
			],
		},
		primitive: 'triangle strip',
		count: 4,
	});

	test() {
		this.globalState(() => {
			Renderer.test();
		});
		return this;
	}

	private static readonly renderParticles: Command<{
		dest: GL.Framebuffer2D | undefined;
		particles: GL.Buffer;
		count: number;
		flip: boolean;
	}> = gl({
		vert: prclVert,
		frag: prclFrag,
		primitive: 'points',
		attributes: {
			aPosition(c, p) {
				return { buffer: p.particles, stride: 8, offset: 0 };
			},
		},
		blend: {
			enable: true,
		},
		count: (c, p) => p.count,
		framebuffer: (c, p) => p.dest,
		uniforms: {
			uRatio() {
				return settings.simulationRatio;
			},
			uParticleSize() {
				return settings.particleRenderRadius;
			},
		},
	});

	renderParticles(dest?: GL.Framebuffer, flip = false) {
		this.globalState(() => {
			Renderer.renderParticles({
				count: this.prclCount,
				flip,
				particles: this.particlePosBuffer,
				dest,
			});
		});
	}

	private static readonly blurStep: Command<{
		from: TextureLike;
		to: Framebuffer2D | undefined;
		dir: [number, number];
	}> = gl({
		vert: rectVert,
		frag: blurFrag,
		attributes: {
			aPosition: [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
			],
		},
		primitive: 'triangle strip',
		count: 4,
		framebuffer: (c, p) => p.to,
		uniforms: {
			uDir: (c, p) => p.dir,
			uSource: (c, p) => p.from,
		},
	});

	blurStep(from: TextureLike, to?: Framebuffer2D, horizontal = true) {
		this.globalState(() => {
			Renderer.blurStep({
				dir: horizontal ? [1, 0] : [0, 1],
				from,
				to,
			});
		});
	}

	private static readonly clipStep: Command<
		FilParameters & { thresh: number; pos: number[]; neg: number[] }
	> = gl({
		vert: rectVert,
		frag: stepFrag,
		attributes: {
			aPosition: [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],
			],
		},
		primitive: 'triangle strip',
		count: 4,
		framebuffer: (c, p) => p.to,
		uniforms: {
			uThreshold: (c, p) => p.thresh,
			uPosColour: (c, p) => p.pos,
			uNegColour: (c, p) => p.neg,
			uSource: (c, p) => p.from,
		},
	});

	clipStep(
		from: TextureLike,
		to: Framebuffer2D | undefined,
		pos: [number, number, number, number],
		neg: [number, number, number, number],
	) {
		this.globalState(() => {
			Renderer.clipStep({
				from,
				to,
				thresh: settings.liquidRenderThreshold,
				pos,
				neg,
			});
		});
	}
}

export default Renderer;
