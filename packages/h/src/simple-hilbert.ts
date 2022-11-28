import { Vec } from './vec';

function rotateQuadrant(
	level: number,
	quadrant: Vec,
	flipX: boolean,
	flipY: boolean,
): Vec {
	let output = quadrant;
	if (!flipY && flipX) {
		output = output.updateX(level - 1 - output.x).updateY(level - 1 - output.y);
	}

	if (!flipY) {
		const temporary = output.x;
		output = output.updateX(output.y).updateX(temporary);
	}

	return output;
}

export function vectorToHilbert(level: number, pos: Vec): number {
	let shouldFlipX = false;
	let shouldFlipY = false;
	let d = 0;
	let p = pos;
	for (let s = level / 2; s > 0; s /= 2) {
		shouldFlipX = (p.x & s) > 0;
		shouldFlipY = (p.y & s) > 0;
		d += s * s * ((3 * (shouldFlipX ? 1 : 0)) ^ (shouldFlipY ? 1 : 0));
		p = rotateQuadrant(level, p, shouldFlipX, shouldFlipY);
	}

	return d;
}

export function hilbertToVector(level: number, index: number): Vec {
	const points = [new Vec(0, 0), new Vec(0, 1), new Vec(1, 1), new Vec(1, 0)];
	let ix = index & 3;
	let v = points[ix];
	let i = index;
	for (let j = 1; j < level; j++) {
		i >>>= 2;
		ix = i & 3;
		const length = 2 ** j;
		switch (ix) {
			case 0: {
				v = new Vec(v.y, v.x);
				break;
			}

			case 1: {
				v = v.add([0, length]);
				break;
			}

			case 2: {
				v = v.add(length);
				break;
			}

			case 3: {
				const temporary = length - 1 - v.x;
				v = v
					.updateX(length - 1 - v.y)
					.updateY(temporary)
					.add([length, 0]);
				break;
			}
			// No default
		}
	}

	return v;
}
