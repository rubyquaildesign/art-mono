/* eslint-disable @typescript-eslint/member-ordering */
import loader from 'box2d-wasm';
import { settings } from './settings';
import { lChain, rChain } from './path-strings';

export class LiquidSim {
	b2: Awaited<ReturnType<typeof loader>>;
	world: Box2D.b2World;
	particleSystem: Box2D.b2ParticleSystem;
	gravity: Box2D.b2Vec2;
	settings: typeof settings;
	destroyRC: () => void;
	destroyLC: () => void;
	leftChainPts: Box2D.b2Vec2;
	rightChainPts: Box2D.b2Vec2;
	leftChain: Box2D.b2ChainShape;
	rightChain: Box2D.b2ChainShape;
	private constructor(
		instance: Awaited<ReturnType<typeof loader>>,
		defaultSettings: typeof settings,
	) {
		this.settings = defaultSettings;
		const settings = this.settings;
		this.b2 = instance;
		const b2 = this.b2;
		this.gravity = new b2.b2Vec2(0, settings.gravity);
		this.world = new b2.b2World(this.gravity);
		const bd = new b2.b2BodyDef();
		const leftB = this.world.CreateBody(bd);
		const rightB = this.world.CreateBody(bd);
		b2.destroy(bd);
		[this.leftChainPts, this.destroyLC] = b2.pointsToVec2Array(
			lChain.map(([x, y]) => ({
				x: x / settings.simulationRatio,
				y: y / settings.simulationRatio,
			})),
		);
		[this.rightChainPts, this.destroyRC] = b2.pointsToVec2Array(
			rChain.map(([x, y]) => ({
				x: x / settings.simulationRatio,
				y: y / settings.simulationRatio,
			})),
		);
		this.leftChain = new Box2D.b2ChainShape();
		this.rightChain = new Box2D.b2ChainShape();
		this.leftChain.CreateChain(this.leftChainPts, rChain.length, 0, 0);
		this.rightChain.CreateChain(this.rightChainPts, rChain.length, 0, 0);
		const leftFix = leftB.CreateFixture(this.leftChain, 1);
		const rightFix = leftB.CreateFixture(this.rightChain, 1);
		leftFix.SetFriction(settings.vesselFriction);
		rightFix.SetFriction(settings.vesselFriction);
		const psd = new b2.b2ParticleSystemDef();
		console.log(psd);

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
}
