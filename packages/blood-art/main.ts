import Capture from '@rupertofly/capture-client';
import './src/lib';
import b2 from 'box2d-wasm/dist/es/Box2D';
import { range } from 'd3';
import type { Vec } from '@rupertofly/h';
import Renderer from './src/renderer';
import { lChain, leftString, rChain, rightString } from './src/path-strings';
import { settings } from './src/settings';
import { LiquidSim } from './src/liq-sim';
// #region helpers
const display = document.createElement('pre');
document.body.append(display);
let client: Capture | undefined;
const doRecord = false;
const leftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
const rightPath = document.createElementNS(
	'http://www.w3.org/2000/svg',
	'path',
);
leftPath.setAttribute('d', leftString);
rightPath.setAttribute('d', rightString);
const leftPoints: Vec[] = [];
const rightPoints: Vec[] = [];
const leftLength = leftPath.getTotalLength();
const rightLength = rightPath.getTotalLength();
const sim = await LiquidSim.build();
sim.createParticles([350, 300], 10);

const PATH_RES = 128;
for (let i = 0; i < PATH_RES; i++) {
	const t = i / (PATH_RES - 1);
	const l = leftPath.getPointAtLength(t * leftLength);
	leftPoints.push(vec(l.x, l.y));
	const r = rightPath.getPointAtLength(t * rightLength);
	rightPoints.push(vec(r.x, r.y));
}

if (doRecord) {
	client = new Capture(6969, canvas);
	client.start({
		frameRate: 30,
		lengthIsFrames: true,
		maxLength: 30 * 60,
		name: 'blood-art',
	});
}

// #endregion helpers
function calculateIterations(
	gravity: number,
	radius: number,
	timeStep: number,
) {
	const max = 8;
	const threshhold = 0.1;
	const iterations = ceil(sqrt(gravity / (radius * threshhold)) * timeStep);
	return iterations < 1 ? 1 : iterations > max ? max : iterations;
}

// Uncomment for central
// ctx.translate(rad, rad);
const play = true;
let frameCount = 0;
let previousFrameTime: number = Date.now();
let lastFrameTime = 0;
async function player() {
	const frameTime = Date.now();
	lastFrameTime = frameTime - previousFrameTime;
	previousFrameTime = frameTime;
	render();
	frameCount++;
	if (doRecord && client) {
		await client.capture();
	}

	if (play) {
		window.requestAnimationFrame(player);
	}
}

let buff = sim.particleBuffer();
console.log(buff);
const draw = new Renderer();

function render() {
	draw.setFrameC(frameCount);
	draw.gl.clear({ color: [0, 0, 0, 1] });
	buff = sim.particleBuffer();
	draw.setPrclBuffer(buff, sim.numParticles);
	draw.aFBO.use(() => {
		draw.gl.clear({ color: [0, 0, 0, 0] });
	});
	draw.renderParticles(draw.aFBO);
	draw.blurStep(draw.aFBO, draw.bFBO, true);
	draw.aFBO.use(() => {
		draw.gl.clear({ color: [0, 0, 0, 0] });
	});
	draw.blurStep(draw.bFBO, draw.aFBO, false);
	draw.clipStep(draw.aFBO, draw.bFBO, [0.7, 0.15, 0.1, 1], [1, 1, 1, 1]);
	draw.renderToScreen(draw.bFBO, false);
	draw.renderToScreen(draw.staticDrawTextureFG);

	for (let i = 0; i < sim.numParticles * 2; i += 2) {
		const x = buff[i];
		const y = buff[i + 1];
	}

	const addPts = [
		[586.845, 128.579],
		[537.237, 173.246],
		[550.62, 188.109],
		[600.228, 143.442],
		[586.845, 128.579],
	];
	sim.step();
	display.textContent = `ParticleCount: ${sim.particleSystem
		.GetParticleCount()
		.toString()
		.padStart(8, ' ')}`;
	if (frameCount % 100 === 9) {
		sim.createParticles([368, 119.6], 4, sim.flags.viscous);
	}

	if (frameCount % 500 === 9) {
		sim.createParticlesShape(addPts, sim.flags.viscous);
	}
}

await player();
