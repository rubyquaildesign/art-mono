import { GUI } from 'dat.gui';
import type * as DG from 'dat.gui';
import { capital } from 'case';

export const settings = {
	gravity: 10,
	simulationRatio: 100,
	vesselFriction: 5,
	staticPressureRelaxation: 0.5,
	viscosityStrength: 0.5,
	staticPressureIterations: 12,
	gravityScale: 3,
	particleSimRadius: 0.025,
	siphonForce: 100,
	particleStepIterations: 6,
	particleRenderRadius: 4,
	particleBlurRadius: 4,
	liquidRenderThreshold: 0.5,
};
function controllerBuilder<O extends Record<string, unknown> = typeof settings>(
	gui: GUI,
	property: keyof O & string,
	min: number,
	max: number,
	step?: number,
) {
	return gui
		.add(settings, property, min, max, step)
		.name(`${capital(property)}:`);
}

const gui = new GUI({ autoPlace: true, closed: false });
const simGui = gui.addFolder('Simulation');
const renderGui = gui.addFolder('Render');
export const controllers: Record<keyof typeof settings, DG.GUIController> = {
	gravity: controllerBuilder(simGui, 'gravity', 0, 20),
	simulationRatio: controllerBuilder(simGui, 'simulationRatio', 1, 500),
	vesselFriction: controllerBuilder(simGui, 'vesselFriction', 0, 20),
	staticPressureRelaxation: controllerBuilder(
		simGui,
		'staticPressureRelaxation',
		0,
		4,
	),
	staticPressureIterations: controllerBuilder(
		simGui,
		'staticPressureIterations',
		0,
		20,
		1,
	),
	viscosityStrength: controllerBuilder(simGui, 'viscosityStrength', 0, 1),
	gravityScale: controllerBuilder(simGui, 'gravityScale', 0, 10),
	particleSimRadius: controllerBuilder(simGui, 'particleSimRadius', 0, 1),
	siphonForce: controllerBuilder(simGui, 'siphonForce', 0, 100),
	particleStepIterations: controllerBuilder(
		simGui,
		'particleStepIterations',
		0,
		10,
		1,
	),
	particleRenderRadius: controllerBuilder(
		renderGui,
		'particleRenderRadius',
		1,
		10,
	),
	particleBlurRadius: controllerBuilder(renderGui, 'particleBlurRadius', 0, 12),
	liquidRenderThreshold: controllerBuilder(
		renderGui,
		'liquidRenderThreshold',
		0,
		1,
	),
};
