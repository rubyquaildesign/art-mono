/* eslint-disable unicorn/no-array-callback-reference */
/* eslint-disable @typescript-eslint/member-ordering */
import loader from 'box2d-wasm';
import type { Vp } from '@rupertofly/h';
import { settings } from './settings';
import {
	cupLeft,
	cupRight,
	backfill,
	handCollision,
	sickleCollision,
} from './collision_points.json';

type Library = Awaited<ReturnType<typeof loader>>;
function ptsDivRatio(input: number[]): { x: number; y: number } {
	return {
		x: input[0] / settings.simulationRatio,
		y: input[1] / settings.simulationRatio,
	};
}

export class LiquidSim {
	b2: Awaited<ReturnType<typeof loader>>;
	world: Box2D.b2World;
	particleSystem: Box2D.b2ParticleSystem;
	gravity: Box2D.b2Vec2;
	settings: typeof settings;
	destroyFunctions: Array<() => void> = [];
	leftChain: Box2D.b2ChainShape;
	rightChain: Box2D.b2ChainShape;
	knifeChain: Box2D.b2ChainShape;
	backChain: Box2D.b2ChainShape;
	handChain: Box2D.b2ChainShape;
	private constructor(instance: Library, defaultSettings: typeof settings) {
		this.settings = defaultSettings;
		const settings = this.settings;
		this.b2 = instance;
		const b2 = this.b2;
		this.gravity = new b2.b2Vec2(0, settings.gravity);
		this.world = new b2.b2World(this.gravity);
		const bd = new b2.b2BodyDef();
		const leftB = this.world.CreateBody(bd);
		const rightB = this.world.CreateBody(bd);
		const knifeB = this.world.CreateBody(bd);
		const backB = this.world.CreateBody(bd);
		const handB = this.world.CreateBody(bd);
		b2.destroy(bd);
		const [lcp, desLC] = b2.pointsToVec2Array(cupLeft.map(ptsDivRatio));
		this.destroyFunctions.push(desLC);
		const [rcp, desRC] = b2.pointsToVec2Array(cupRight.map(ptsDivRatio));
		this.destroyFunctions.push(desRC);
		const [kcp, desKC] = b2.pointsToVec2Array(sickleCollision.map(ptsDivRatio));
		this.destroyFunctions.push(desKC);
		const [bcp, desBC] = b2.pointsToVec2Array(backfill.map(ptsDivRatio));
		this.destroyFunctions.push(desBC);
		const [hcp, desHC] = b2.pointsToVec2Array(handCollision.map(ptsDivRatio));
		this.destroyFunctions.push(desHC);
		this.leftChain = new b2.b2ChainShape();
		this.rightChain = new b2.b2ChainShape();
		this.knifeChain = new b2.b2ChainShape();
		this.handChain = new b2.b2ChainShape();
		this.leftChain.CreateChain(lcp, cupLeft.length, 0, 0);
		this.rightChain.CreateChain(rcp, cupRight.length, 0, 0);
		this.knifeChain.CreateChain(kcp, sickleCollision.length, 0, 0);
		this.handChain.CreateChain(hcp, handCollision.length, 0, 0);
		const leftFix = leftB.CreateFixture(this.leftChain, 1);
		const rightFix = rightB.CreateFixture(this.rightChain, 1);
		const knifeFix = knifeB.CreateFixture(this.knifeChain, 1);
		const handFix = handB.CreateFixture(this.handChain, 0);
		leftFix.SetFriction(settings.vesselFriction);
		rightFix.SetFriction(settings.vesselFriction);
		knifeFix.SetFriction(settings.vesselFriction);

		const psd = new b2.b2ParticleSystemDef();

		psd.set_maxCount(64_000);
		psd.set_staticPressureIterations(settings.staticPressureIterations);
		psd.set_staticPressureRelaxation(settings.staticPressureRelaxation);
		psd.set_viscousStrength(settings.viscosityStrength);
		psd.set_radius(settings.particleSimRadius);
		psd.set_gravityScale(settings.gravityScale);
		this.particleSystem = this.world.CreateParticleSystem(psd);
		b2.destroy(psd);
	}

	static async build() {
		const box2DInstance = await loader({
			locateFile: () => `/Box2D.simd.wasm`,
		});
		return new this(box2DInstance, settings);
	}

	particleBuffer() {
		const { particleSystem, b2 } = this;
		const particlePointer = b2.getPointer(particleSystem.GetPositionBuffer());
		const particleLength = particleSystem.GetMaxParticleCount();
		const buffer = b2.HEAPF32.buffer;
		const positionArray = new Float32Array(
			buffer,
			particlePointer,
			particleLength * 2,
		);
		return positionArray;
	}

	get numParticles() {
		return this.particleSystem.GetParticleCount();
	}

	step() {
		const { world, settings } = this;
		world.Step(1 / 60, 3, 3, settings.particleStepIterations);
	}

	createParticles(position: Vp, radius: number, flags = 0) {
		const {
			particleSystem,
			b2,
			settings: { simulationRatio },
		} = this;
		const particleGroupDef = new b2.b2ParticleGroupDef();
		const particleGroupShape = new b2.b2CircleShape();
		particleGroupShape.set_m_radius(radius / simulationRatio);
		particleGroupDef.set_shape(particleGroupShape);
		particleGroupDef.set_flags(flags);
		const positionVector = new b2.b2Vec2(
			position[0] / simulationRatio,
			position[1] / simulationRatio,
		);
		particleGroupDef.set_position(positionVector);
		particleSystem.CreateParticleGroup(particleGroupDef);
		b2.destroy(particleGroupDef);
		b2.destroy(particleGroupShape);
		b2.destroy(positionVector);
	}

	createParticlesShape(position: Vp[], flags = 0) {
		const {
			particleSystem,
			b2,
			settings: { simulationRatio },
		} = this;
		const adjustedPgon = position.map(ptsDivRatio);
		const pgonShape = new b2.b2PolygonShape();
		const [pgonPoints, desHC] = b2.pointsToVec2Array(adjustedPgon);
		pgonShape.Set(pgonPoints, adjustedPgon.length);
		const particleGroupDef = new b2.b2ParticleGroupDef();
		particleGroupDef.set_flags(flags);
		particleGroupDef.set_shape(pgonShape);
		particleSystem.CreateParticleGroup(particleGroupDef);
		b2.destroy(pgonShape);
		b2.destroy(pgonPoints);
		b2.destroy(particleGroupDef);
	}

	get flags() {
		return {
			tensile: this.b2.b2_tensileParticle,
			viscous: this.b2.b2_viscousParticle,
		};
	}
}
