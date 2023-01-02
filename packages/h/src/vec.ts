const PI = Math.PI;
const TAU = PI * 2;
const DEG = 180 / PI;
const { sin, cos, atan2, round, floor, ceil, abs } = Math;
const EPSILON = 1e-6;
type Point = [number, number];
export type TransformMatrix = [
	[number, number, number],
	[number, number, number],
];
export type Vp = Point | number[];

const pointConstructor: new (...p: [number, number]) => [number, number] =
	Array as any;
export class Vec extends pointConstructor implements Point, Array<number> {
	static fromObject(input: { x: number; y: number }) {
		return new Vec([input.x, input.y]);
	}

	static rad2deg(r: number) {
		return r * DEG;
	}

	static deg2rad(d: number) {
		return d / DEG;
	}

	static determinate(i: Vec, j: Vec) {
		/* Matrix is  =
    | i.x  j.x |
    | i.y  j.y |

    det is equal to (i.x)(j.y) - (j.x)(i.y)
     */
		return i.x * j.y - j.x * i.y;
	}

	static direction(i: Vec, j: Vec, k: Vec) {
		return Math.sign(Vec.determinate(k.sub(i), j.sub(i)));
	}

	static lerp(p0: Vp, p1: Vp, t: number) {
		return new Vec(p0).add(new Vec(p1).sub(p0).mul(t));
	}

	static dcQuadBeziercurve(p0: Vp, p1: Vp, p2: Vp, t: number) {
		const q1 = this.lerp(p0, p1, t);
		const q2 = this.lerp(p1, p2, t);
		const op = this.lerp(q1, q2, t);
		return op;
	}

	static dcCubicBezierCurve([p0, p1, p2, p3]: Vp[], t: number) {
		const { lerp } = this;
		const c1 = lerp(p0, p1, t);
		const c2 = lerp(p1, p2, t);
		const c3 = lerp(p2, p3, t);
		const q1 = lerp(c1, c2, t);
		const q2 = lerp(c2, c3, t);
		const op = lerp(q1, q2, t);
		return op;
	}

	static _bezPn1 = (t: number) => {
		const t3 = t ** 3;
		const t2 = t ** 2;
		return -1 * t3 + 3 * t2 + -3 * t + 1;
	};

	static _bezPn2 = (t: number) => {
		const t3 = t ** 3;
		const t2 = t ** 2;
		return 3 * t3 + -6 * t2 + 3 * t + 0;
	};

	static _bezPn3 = (t: number) => {
		const t3 = t ** 3;
		const t2 = t ** 2;
		return -3 * t3 + 3 * t2 + 0 * t + 0;
	};

	static _bezPn4 = (t: number) => {
		const t3 = t ** 3;
		return t3;
	};

	static _derivitivePn1 = (t: number) => {
		const t2 = t ** 2;
		return -3 * t2 + 6 * t - 3;
	};

	static _derivitivePn2 = (t: number) => {
		const t2 = t ** 2;
		return 9 * t2 + -12 * t + 3;
	};

	static _derivitivePn3 = (t: number) => {
		const t2 = t ** 2;
		return -9 * t2 + 6 * t + 0;
	};

	static _derivitivePn4 = (t: number) => {
		const t2 = t ** 2;
		return 3 * t2 + 0 * t + 0;
	};

	static #accCoef1(t: number) {
		return -6 * t + 6;
	}

	static #accCoef2(t: number) {
		return 18 * t - 12;
	}

	static #accCoef3(t: number) {
		return -18 * t + 6;
	}

	static #accCoef4(t: number) {
		return 6 * t;
	}

	static distance(a: Vec, b: Vec) {
		return a.dist(b);
	}

	get x() {
		return this[0];
	}

	get y() {
		return this[1];
	}

	constructor(x: number, y: number);
	constructor(input: Vp);
	constructor(a: Vp | number, b?: number) {
		if (typeof a === 'number' && typeof b === 'number') {
			super(a, b);
		} else if (Array.isArray(a)) {
			super(a[0] ?? 0, a[1] ?? 0);
		} else {
			super(0, 0);
		}
	}

	*[Symbol.iterator]() {
		yield this[0];
		yield this[1];
		return undefined;
	}

	magnitude() {
		return this.len();
	}

	updateX(nx: number) {
		return new Vec(nx, this.y);
	}

	updateY(ny: number) {
		return new Vec(this.x, ny);
	}

	get tup() {
		return new Vec(this.x, this.y) as readonly [x: number, y: number];
	}

	add(no: number): Vec;
	add(vec: Vp): Vec;
	add(inp: Vp | number) {
		if (typeof inp === 'number') return new Vec(this.x + inp, this.y + inp);
		return new Vec(this.x + inp[0], this.y + inp[1]);
	}

	sub(no: number): Vec;
	sub(vec: Vp): Vec;
	sub(inp: Vp | number) {
		if (typeof inp === 'number') return new Vec(this.x - inp, this.y - inp);
		return new Vec(this.x - inp[0], this.y - inp[1]);
	}

	mul(no: number): Vec;
	mul(vec: Vp): Vec;
	mul(inp: Vp | number) {
		if (typeof inp === 'number') return new Vec(this.x * inp, this.y * inp);
		return new Vec(this.x * inp[0], this.y * inp[1]);
	}

	div(no: number): Vec;
	div(vec: Vp): Vec;
	div(inp: Vp | number) {
		if (typeof inp === 'number') {
			if (inp === 0) return new Vec(0, 0);
			return new Vec(this.x / inp, this.y / inp);
		}

		const nx = inp[0] === 0 ? 0 : this.x / inp[0];
		const ny = inp[1] === 0 ? 0 : this.y / inp[1];
		return new Vec(nx, ny);
	}

	perpendicular(useX = false) {
		if (useX) {
			return this.invertX();
		}

		return this.invertY();
	}

	setLength(length: number) {
		const ang = this.angle();
		return this._update(cos(ang), sin(ang)).mul(length);
	}

	clampLength(length: number) {
		if (this.magnitude() > length) return this.setLength(length);
		return this;
	}

	invertX() {
		return this.mul([-1, 1]);
	}

	invertY() {
		return this.mul([1, -1]);
	}

	invert() {
		return this.mul(-1);
	}

	round() {
		return this._update(round(this.x), round(this.y));
	}

	mixX(inp: Vp, amnt = 0.5) {
		const nx = (1 - amnt) * this.x + amnt * inp[0];
		return this.updateX(nx);
	}

	mixY(inp: Vp, amnt = 0.5) {
		const ny = (1 - amnt) * this.y + amnt * inp[1];
		return this.updateY(ny);
	}

	mix(inp: Vp, amnt = 0.5) {
		const nx = (1 - amnt) * this.x + amnt * inp[0];
		const ny = (1 - amnt) * this.y + amnt * inp[1];
		return this._update(nx, ny);
	}

	/**
	* @description Clones vec
	* @returns  vec
    @deprecated
	*/
	clone() {
		return new Vec(this);
	}

	call(functor: (n: number) => number): Vec;
	call(xfunctor: (n: number) => number, yfunctor: (n: number) => number): Vec;
	call(functor: (n) => number, b?: (n) => number) {
		if (b) {
			return this._update(functor(this.x), b(this.y));
		}

		return this._update(functor(this.x), functor(this.y));
	}

	dot(inp: Vp) {
		return this.x * inp[0] + this.y * inp[1];
	}

	cross(inp: Vp) {
		return Vec.determinate(this, new Vec(inp[0], inp[1]));
	}

	angle() {
		const a = atan2(this.y, this.x);
		return (TAU + a) % TAU;
	}

	rotate(amt: number) {
		const { x, y } = this;
		const nx = x * cos(amt) - y * sin(amt);
		const ny = x * sin(amt) + y * cos(amt);
		return this._update(nx, ny);
	}

	rotateTo(ang: number) {
		return this.rotate(ang - this.angle());
	}

	distSq(inp: Vp) {
		const dx = this._distX(inp);
		const dy = this._distY(inp);
		return dx ** 2 + dy ** 2;
	}

	dist(inp: Vp) {
		return Math.sqrt(this.distSq(inp));
	}

	manhattenDist(inp: Vp) {
		return abs(inp[0] - this.x) + abs(inp[1] - this.y);
	}

	isEqualTo(inp: Vp) {
		return abs(inp[0] - this.x) < EPSILON && abs(inp[1] - this.y) < EPSILON;
	}

	angleBetween(inp: Vp) {
		const [x2, y2] = inp;
		const ang = Math.acos(
			(this.x * x2 + this.y * y2) / (this.len() * new Vec(x2, y2).len()),
		);
		return ang;
	}

	lenSq() {
		const { x, y } = this;
		return x ** 2 + y ** 2;
	}

	len() {
		return Math.sqrt(this.lenSq());
	}

	limitSq(max: number, value?: number) {
		value = value ?? max;
		if (this.lenSq() > max) {
			return this.setLength(value);
		}

		return this;
	}

	limit(max: number, value?: number) {
		value = value ?? max;
		if (this.len() > max) {
			return this.setLength(value);
		}

		return this;
	}

	norm() {
		const length = this.len();
		if (length === 0) {
			return this._update(1, 0);
		}

		return this.div(length);
	}

	toString(): string {
		return `x:${this.x}, y:${this.y}`;
	}

	projectOn(inp: Vp) {
		const [ix, iy] = inp;
		const { x, y } = this;
		const coeff = (x * ix + y * iy) / (ix * ix + iy * iy);
		return new Vec(inp).mul(coeff);
	}

	isZero() {
		return this.x === 0 && this.y === 0;
	}

	equals([ix, iy]: Vp) {
		return this.x === ix && this.y === iy;
	}

	matTransform(mat: TransformMatrix): Vec;
	matTransform(
		u: number,
		i: number,
		o: number,
		j: number,
		k: number,
		l: number,
	): Vec;
	matTransform(...args: Array<number | TransformMatrix>) {
		if ((args[0] as TransformMatrix).length !== undefined) {
			return this._matTransform(args[0] as TransformMatrix);
		}

		const a = args as number[];
		const tm: TransformMatrix = [
			[a[0], a[1], a[2]],
			[a[3], a[4], a[5]],
		];
		return this._matTransform(tm);
	}

	private _update(x: number, y: number) {
		return new Vec(x, y);
	}

	private _matTransform(mat: TransformMatrix) {
		const x = mat[0][0] * this.x + mat[0][1] * this.y + mat[0][2];
		const y = mat[1][0] * this.x + mat[1][1] * this.y + mat[1][2];
		return new Vec(x, y);
	}

	private _distX(inp: Vp) {
		return this.x - inp[0];
	}

	private _distY(inp: Vp) {
		return this.y - inp[1];
	}
}
type P = [number, number];
const i = new Vec(1, 1);
const g = i[2];
const x = [...i];
Math.atan2(...i.tup);
