import type { Vec } from './vec';

const { floor, ceil, round, pow } = Math;
class Matrix<
	ROWS extends number = 2,
	COLS extends number = 2,
	T = number,
> extends Array<T> {
	private static getIndex(r: number, c: number, columns: number) {
		return (c % columns) + r * columns;
	}

	private static _update<R, COLS extends number, ROWS extends number>(
		mat: Matrix<ROWS, COLS, R>,
		values: R[],
	) {
		return new this(mat.rows, mat.columns, undefined, values);
	}

	/* eslint-disable max-params */
	private static matmul<
		AR extends number,
		BC extends number,
		CM extends number,
		AValue,
		BValue,
		CValue,
	>(
		/* eslint-enable max-params */
		a: Matrix<AR, CM, AValue>,
		b: Matrix<CM, BC, BValue>,
		mul: (a: AValue, b: BValue) => CValue,
		add: (a: CValue, b: CValue) => CValue,
		defaultValue: CValue,
	) {
		if (b.rows !== a.columns) throw new Error(`columns are incompatible`);
		const nc: BC = b.columns;
		const nr: AR = a.rows;
		const newArray: CValue[] = Array.from({
			length: nr * nc,
		});
		for (let i = 0; i < nr; i++) {
			for (let j = 0; j < nc; j++) {
				const n = Matrix.getIndex(i, j, nc);
				let sum = defaultValue;
				for (let k = 0; k < a.columns; k++)
					sum = add(sum, mul(a.get(i, k), b.get(k, j)));
				newArray[n] = sum;
			}
		}

		return new Matrix(a.rows, b.columns, newArray);
	}

	rows: ROWS;
	columns: COLS;

	get size() {
		return this.columns * this.rows;
	}

	constructor(rows: ROWS, cols: COLS, defaultValue?: T, source?: T[]) {
		super(rows * cols);
		this.rows = rows;
		this.columns = cols;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				const index = this.getIndex(i, j);
				this[index] = source ? source[index] : defaultValue;
			}
		}
	}

	getIndex(r: number, c: number) {
		return Matrix.getIndex(r, c, this.columns);
	}

	fromIndex(i: number): [r: number, c: number] {
		const c = i % this.columns;
		const r = floor(i / this.rows);
		return [r, c];
	}

	get(r: number, c: number) {
		return this[this.getIndex(r, c)];
	}

	update(r: number, c: number, value: T) {
		const v = [...this];
		v[this.getIndex(r, c)] = value;
		return this._update(v);
	}

	equivilant<R>(other: Matrix<any, any, R>): other is Matrix<ROWS, COLS, R> {
		return other.rows === this.rows && other.columns === this.columns;
	}

	add<R, C>(
		other: Matrix<ROWS, COLS, R>,
		f: (a: T, b: R) => C = (a: T, b: R) => (Number(a) * Number(b)) as any as C,
	) {
		if (!this.equivilant(other)) throw new Error(`Matrices are incompatible`);
		return this._update(this.map((v, i) => f(v, other[i])));
	}

	mul<OC extends number, OV, RV>(
		other: OV | Matrix<COLS, OC, OV>,
		add: (a: RV, b: RV) => RV,
		mul: (a: T, b: OV) => RV,
		defaultValue: RV,
	) {
		if (!(other instanceof Matrix))
			return this._update<RV>(this.map(v => mul(v, other)));
		return Matrix.matmul(this, other, mul, add, defaultValue);
	}

	inverseMul<OC extends number, OV, RV>(
		other: Matrix<COLS, OC, OV>,
		add: (a: RV, b: RV) => RV,
		mul: (a: OV, b: T) => RV,
		defaultValue: RV,
	) {
		return Matrix.matmul(other, this, mul, add, defaultValue);
	}

	hadamard(mat: Matrix<ROWS, COLS>) {
		return this._update(this.map((v, i) => v * mat[i]));
	}

	get table(): T[][] {
		const op: T[][] = [];
		for (let i = 0; i < this.rows; i++) {
			op[i] = [];
			for (let j = 0; j < this.columns; j++) {
				op[i][j] = this.get(i, j);
			}
		}

		return op;
	}

	private _updateAll<R extends number, C extends number>(
		r: R,
		c: C,
		values: number[],
	) {
		const t: Matrix<any, any> = this._update([...this]);
		t.rows = r;
		t.columns = c;
		return t._update([...values]) as Matrix<R, C>;
	}
}
console.table(
	new Matrix(2, 2, 0, [1, 2]).mul(
		new Matrix(2, 1, 0, [1, 0, 0, 1]),
		(a, b) => a + b,
		(a, b) => a * b,
		0,
	).table,
);
