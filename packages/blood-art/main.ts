import Capture from '@rupertofly/capture-client';
import './src/lib';
import b2 from 'box2d-wasm/dist/es/Box2D';
import { range } from 'd3';
import type { Vec } from '@rupertofly/h';
import { lChain, leftString, rChain, rightString } from './src/path-strings';
import './src/settings';
// #region helpers

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

const PATH_RES = 128;
for (let i = 0; i < PATH_RES; i++) {
	const t = i / (PATH_RES - 1);
	const l = leftPath.getPointAtLength(t * leftLength);
	leftPoints.push(vec(l.x, l.y));
	const r = rightPath.getPointAtLength(t * rightLength);
	rightPoints.push(vec(r.x, r.y));
}

const b2d = await b2({
	locateFile(url, scriptDir) {
		console.log(url, scriptDir);
		return `/Box2D.simd.wasm`;
	},
});
console.log(b2d);
if (doRecord) {
	client = new Capture(6969, canvas);
	client.start({
		frameRate: 30,
		lengthIsFrames: true,
		maxLength: 90,
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

const gravity = new b2d.b2Vec2(0, 10);
const world = new b2d.b2World(gravity);
const bd = new b2d.b2BodyDef();
const ratio = 100;
const leftBody = world.CreateBody(bd);
const rightBody = world.CreateBody(bd);
const leftChain = new b2d.b2ChainShape();
const rightChain = new b2d.b2ChainShape();
const leftB2Pts: Box2D.b2Vec2[] = lChain.map(
	([x, y]) => new b2d.b2Vec2(x / ratio, y / ratio),
);
const rightB2Pts: Box2D.b2Vec2[] = rChain.map(
	([x, y]) => new b2d.b2Vec2(x / ratio, y / ratio),
);
const lb = b2d.pointsToVec2Array(leftB2Pts);
const rb = b2d.pointsToVec2Array(rightB2Pts);
leftChain.CreateChain(lb[0], leftB2Pts.length, 0 as any, 0 as any);
rightChain.CreateChain(rb[0], rightB2Pts.length, 0 as any, 0 as any);
console.log(leftPoints);

const leftFixture = leftBody.CreateFixture(leftChain, 0);
leftFixture.SetFriction(5);
const rightFixture = rightBody.CreateFixture(rightChain, 0);
rightFixture.SetFriction(5.5);

const psd = new b2d.b2ParticleSystemDef();
console.log(psd);
psd.staticPressureRelaxation = 0.5;
psd.viscousStrength = 0.05;
const particleSystem = world.CreateParticleSystem(psd);
const partd = new b2d.b2ParticleDef();
partd.flags = b2d.b2_viscousParticle;
partd.position = new b2d.b2Vec2(400 / ratio, 200 / ratio);
particleSystem.CreateParticle(partd);
particleSystem.SetMaxParticleCount(128_000);
particleSystem.SetStaticPressureIterations(12);
particleSystem.SetGravityScale(3);
particleSystem.SetRadius(0.025);
// particleSystem.SetDensity(1_000_000);
const pdShape = new b2d.b2PolygonShape();
pdShape.SetAsBox(
	15 / ratio,
	15 / ratio,
	new b2d.b2Vec2(400 / ratio, 200 / ratio),
	0,
);

const pd = new b2d.b2ParticleGroupDef();
// pd.set_flags(b2d.b2_viscousParticle);
pd.shape = pdShape;
// const group = particleSystem.CreateParticleGroup(pd);
const badShape = new b2d.b2PolygonShape();
badShape.SetAsBox(30 / ratio, 30 / ratio, new b2d.b2Vec2(0, 0), 0);
function logObjectForTyping(object: any) {
	console.log(object);
	console.log(JSON.stringify(object, null, 2));
	console.log(
		Object.keys(Object.getPrototypeOf(object))
			.map(d => `${d}: (...args:any) => any;`)
			.join('\n'),
	);
}

let shouldDrain = false;
const testCallback = Object.assign(new b2d.JSQueryCallback(), {
	ReportParticle(
		particleSystem: number | Box2D.b2ParticleSystem,
		index: number,
	): boolean {
		console.log(particleSystem, index);
		if (!shouldDrain) shouldDrain = true;
		return true;
	},
});

console.log(b2d.sizeof(b2d.b2Vec2));
const shape = new b2d.b2CircleShape();
shape.set_m_radius(10 / ratio);
shape.set_m_p(new b2d.b2Vec2(390 / ratio, 250 / ratio));
const addGroup = new b2d.b2ParticleGroupDef();
addGroup.shape = shape;
// addGroup.flags = 0;
const pdDef = new b2d.b2ParticleDef();
pdDef.set_position(new b2d.b2Vec2(300 / ratio, 200 / ratio));
pdDef.set_velocity(new b2d.b2Vec2(4, 3));
const pdDef2 = new b2d.b2ParticleDef();
pdDef2.set_position(new b2d.b2Vec2(500 / ratio, 200 / ratio));
pdDef2.set_velocity(new b2d.b2Vec2(-0.44, 0.3));

// pdDef.set_flags(b2d.b2_tensileParticle);
// pdDef2.set_flags(b2d.b2_tensileParticle);
const gp = b2d.getPointer;
console.log(world);
const testAaBb = new b2d.b2AABB();
const pushAaBb = new b2d.b2AABB();
const dumpAaBb = new b2d.b2AABB();

pushAaBb.set_lowerBound(new b2d.b2Vec2(330 / ratio, 470 / ratio));
pushAaBb.set_upperBound(new b2d.b2Vec2((330 + 20) / ratio, (470 + 20) / ratio));
testAaBb.set_lowerBound(new b2d.b2Vec2(287 / ratio, 306 / ratio));
testAaBb.set_upperBound(new b2d.b2Vec2((287 + 24) / ratio, (306 + 18) / ratio));
dumpAaBb.set_lowerBound(new b2d.b2Vec2(284 / ratio, 300 / ratio));
dumpAaBb.set_upperBound(new b2d.b2Vec2((284 + 24) / ratio, (300 + 18) / ratio));
console.log(gp(particleSystem.GetPositionBuffer()));
const pushForce = new b2d.b2Vec2(-5 / ratio, -250 / ratio);
const dumpForce = new b2d.b2Vec2(-100 / ratio, 0 / ratio);
console.log(pushForce);

const pushCallback = Object.assign(new b2d.JSQueryCallback(), {
	ReportParticle(ps: number | Box2D.b2ParticleSystem, index: number): boolean {
		if (!shouldDrain) return false;

		particleSystem.ParticleApplyForce(index, pushForce);
		return true;
	},
});
const dumpCallback = Object.assign(new b2d.JSQueryCallback(), {
	ReportParticle(ps: number | Box2D.b2ParticleSystem, index: number): boolean {
		if (!shouldDrain) return false;

		particleSystem.ParticleApplyForce(index, dumpForce);
		return true;
	},
});
function render() {
	ctx.fillStyle = c.white;
	ctx?.fillRect(0, 0, 800, 600);
	const iter = calculateIterations(5, psd.radius, lastFrameTime / 1100);
	particleSystem.QueryAABB(pushCallback, pushAaBb);
	particleSystem.QueryAABB(dumpCallback, dumpAaBb);
	world.Step(1 / 60, 3, 3, 6);
	const l = particleSystem.GetParticleCount();
	const pointBufferPtr = gp(particleSystem.GetPositionBuffer());
	const pointBuffer = b2d.reifyArray(
		pointBufferPtr,
		l / 2,
		b2d.sizeof(b2d.b2Vec2),
		b2d.b2Vec2,
	);

	for (const element of pointBuffer) {
		const [x, y] = [element.x * ratio, element.y * ratio];
		ctx.fillStyle = '#7e1911';
		h.drawDot([x, y], particleSystem.GetRadius() * ratio, ctx);
		ctx.fill();
		// console.log([x, y]);
	}

	const count = particleSystem.GetParticleCount();
	ctx.fillText(count.toString(10), 50, 50);
	ctx.fillText((1000 / lastFrameTime).toFixed(1), 50, 80);

	if (!((frameCount - 1) % 60)) {
		console.log(lastFrameTime);
	}

	if (frameCount % 10 === 0) {
		particleSystem.CreateParticleGroup(addGroup);
		particleSystem.QueryAABB(testCallback, testAaBb);
	}

	particleSystem.DestroyParticlesInShape(badShape, 0);
	ctx.strokeStyle = 'black';
	ctx.beginPath();
	h.drawLoop(leftPoints, false, ctx);
	ctx.stroke();
	ctx.beginPath();
	h.drawLoop(rightPoints, false, ctx);
	ctx.stroke();
}

await player();
