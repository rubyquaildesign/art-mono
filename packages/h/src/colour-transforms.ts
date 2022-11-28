type CSpace = 'p3' | 'srgb';
const rnd = Math.round;
class XYZColour {
	x: number;
	y: number;
	z: number;
	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}
abstract class Colour {
	r: number;
	g: number;
	b: number;
	space: CSpace;
	abstract isValid: boolean;
	constructor(r: number, g: number, b: number) {
		this.r = r;
		this.g = g;
		this.b = b;
	}

	abstract toString(): string;
	abstract clamp(): any;
}
class P3Colour extends Colour {
	space: 'p3' = 'p3';
	toString() {
		const { r, g, b } = this;
		if (!this.isValid) return this.clamp.toString();
		return `color(display-p3 ${this.r.toFixed(3)} ${this.g.toFixed(
			3,
		)} ${this.b.toFixed(3)})`;
	}

	get isValid() {
		const { r, g, b } = this;
		return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1;
	}

	clamp(): SRGBColour {
		const { r, g, b } = this;
		const nr = r > 1 ? 1 : r < 0 ? 0 : r;
		const ng = g > 1 ? 1 : g < 0 ? 0 : g;
		const nb = b > 1 ? 1 : b < 0 ? 0 : b;
		return new SRGBColour(nr, ng, nb);
	}
}
class SRGBColour extends Colour {
	space: 'srgb' = 'srgb';
	toString(): string {
		const { r, g, b } = this;
		if (!this.isValid) return this.clamp.toString();
		return `rgb(${rnd(r)} ${rnd(g)} ${rnd(b)})`;
	}

	get isValid() {
		const { r, g, b } = this;
		return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
	}

	clamp(): SRGBColour {
		const { r, g, b } = this;
		const nr = r > 255 ? 255 : r < 0 ? 0 : r;
		const ng = g > 255 ? 255 : g < 0 ? 0 : g;
		const nb = b > 255 ? 255 : b < 0 ? 0 : b;
		return new SRGBColour(nr, ng, nb);
	}
}

function sRgbToXYZ(input: SRGBColour) {
	const matrix = [
		[0.412_456_4, 0.357_576_1, 0.180_437_5],
		[0.212_672_9, 0.715_152_2, 0.072_175],
		[0.019_333_9, 0.119_192, 0.950_304_1],
	];
	const { r: rawR, g: rawG, b: rawB } = input;
	const [x, y, z] = [rawR, rawG, rawB]
		.map(v => v / 255)
		.map(v => (v <= 0.040_45 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
		.map(
			(v, i, array) =>
				matrix[i][0] * array[0] +
				matrix[i][1] * array[1] +
				matrix[i][2] * array[2],
		);
	return new XYZColour(x, y, z);
}
