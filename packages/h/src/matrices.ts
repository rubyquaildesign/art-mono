import { range } from 'd3-array';

export class Matrix extends Array<number[]> {
	static fromDomMatrix(input: DOMMatrix) {
		if (!input.is2D) throw new Error(`3D matrices are not supported`);
		return new this([
			[input.a, input.c, input.e],
			[input.b, input.d, input.f],
		]);
	}

	numRows: number;
	numCols: number;

	constructor(data: number[][]) {
		super(0);
		this.numCols = data[0].length;
		this.numRows = data.length;
		if (data.some(row => row.length !== this.numCols)) {
			console.error(data);
			throw new Error(`import misssized`);
		}

		for (let i = 0; i < this.numRows; i++) {
			this[i] = [];
			for (let j = 0; j < this.numCols; j++) {
				this[i][j] = data[i][j];
			}
		}
	}

	mapMatrix(func: (v: number, x: number, y: number) => number) {
		const output: number[][] = [];
		for (let r = 0; r < this.numRows; r++) {
			output[r] = [];
			for (let c = 0; c < this.numCols; c++) {
				output[r][c] = func(this[r][c], c, r);
			}
		}

		return new Matrix(output);
	}

	setPos(newValue: number, col: number, row: number) {
		if (col >= this.numCols)
			throw new Error(
				`col ${col} is larger then matrix size of ${this.numCols}`,
			);
		if (row >= this.numRows)
			throw new Error(
				`col ${row} is larger then matrix size of ${this.numRows}`,
			);
		const op = new Matrix(this);
		op[row][col] = newValue;
		return op;
	}

	mul(other: Matrix) {
		if (other.numRows !== this.numCols)
			throw new Error(`number of columns in the first matrix (${this.numCols}) should be
    the same as the number of rows in the second${other.numRows}`);
		const productRow = range(other.numCols).fill(0);
		const product: number[][] = [];
		for (let p = 0; p < this.numRows; p++) {
			product[p] = productRow.slice();
		}

		for (let i = 0; i < this.numRows; i++)
			for (let j = 0; j < other.numCols; j++)
				for (let k = 0; k < this.numCols; k++) {
					product[i][j] += this[i][k] * other[k][j];
				}

		return new Matrix(product);
	}
}
