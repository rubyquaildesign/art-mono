export interface Position {
	x: number;
	y: number;
}

export interface FillOptions {
	startX?: number;
	startY?: number;
	wrapMode?: WrapMode;
	maxCells?: number;
}

export const WrapMode = {
	WRAP: 'wrap',
	CLIP: 'clip',
	REPEAT: 'repeat',
} as const;
export type WrapMode = (typeof WrapMode)[keyof typeof WrapMode];

export interface CellIteratorResult {
	x: number;
	y: number;
	char: string;
}

export class TextBuffer {
	private _cells: string[][];
	private width: number;
	private height: number;

	constructor(width: number, height: number, fillChar: string = ' ') {
		this.width = width;
		this.height = height;
		this._cells = Array.from({ length: height }, () => Array.from({ length: width }, () => fillChar));
	}

	getWidth(): number {
		return this.width;
	}

	getHeight(): number {
		return this.height;
	}

	isValidPosition(x: number, y: number): boolean {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	setCell(x: number, y: number, char: string): void {
		if (this.isValidPosition(x, y)) {
			this._cells[y][x] = char.charAt(0) || ' ';
		}
	}

	getCell(x: number, y: number): string {
		if (this.isValidPosition(x, y)) {
			return this._cells[y][x];
		}
		return ' ';
	}

	positionToIndex(x: number, y: number): number {
		return y * this.width + x;
	}

	indexToPosition(index: number): Position {
		return {
			x: index % this.width,
			y: Math.floor(index / this.width),
		};
	}

	setCellByIndex(index: number, char: string): void {
		const pos = this.indexToPosition(index);
		this.setCell(pos.x, pos.y, char);
	}

	writeToCellsByIndex(index: number, characters: string): void {
		for (let i = 0; i < characters.length; i++) {
			const nx = index + i;
			const pos = this.indexToPosition(nx);
			const char = characters[i];
			this.setCell(pos.x, pos.y, char);
		}
	}

	getCellByIndex(index: number): string {
		const pos = this.indexToPosition(index);
		return this.getCell(pos.x, pos.y);
	}

	fill(char: string, options: FillOptions = {}): Position {
		const { startX = 0, startY = 0, wrapMode = WrapMode.WRAP, maxCells = this.width * this.height } = options;

		let currentX = startX;
		let currentY = startY;
		let cellsFilled = 0;

		while (cellsFilled < maxCells) {
			if (wrapMode === WrapMode.CLIP && !this.isValidPosition(currentX, currentY)) {
				break;
			}

			if (wrapMode === WrapMode.WRAP) {
				currentX = ((currentX % this.width) + this.width) % this.width;
				currentY = ((currentY % this.height) + this.height) % this.height;
			}

			if (this.isValidPosition(currentX, currentY)) {
				this.setCell(currentX, currentY, char);
				cellsFilled++;
			}

			currentX++;
			if (currentX >= this.width) {
				currentX = 0;
				currentY++;
				if (currentY >= this.height && wrapMode === WrapMode.WRAP) {
					currentY = 0;
				}
			}

			if (wrapMode === WrapMode.CLIP && currentY >= this.height) {
				break;
			}
		}

		return { x: currentX, y: currentY };
	}

	fillRect(x: number, y: number, width: number, height: number, char: string): void {
		for (let dy = 0; dy < height; dy++) {
			for (let dx = 0; dx < width; dx++) {
				this.setCell(x + dx, y + dy, char);
			}
		}
	}

	*cells(): Generator<CellIteratorResult> {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				yield { x, y, char: this._cells[y][x] };
			}
		}
	}

	*cellsInRect(x: number, y: number, width: number, height: number): Generator<CellIteratorResult> {
		const endX = Math.min(x + width, this.width);
		const endY = Math.min(y + height, this.height);
		const startX = Math.max(x, 0);
		const startY = Math.max(y, 0);

		for (let dy = startY; dy < endY; dy++) {
			for (let dx = startX; dx < endX; dx++) {
				yield { x: dx, y: dy, char: this._cells[dy][dx] };
			}
		}
	}

	clear(char: string = ' '): void {
		this.fill(char);
	}

	toString(): string {
		return this._cells.map((row) => row.join('')).join('\n');
	}

	createView(x: number, y: number, width: number, height: number): BufferView {
		return new BufferView(this, x, y, width, height);
	}
}

export class BufferView extends TextBuffer {
	private parentBuffer: TextBuffer;
	private offsetX: number;
	private offsetY: number;
	private viewWidth: number;
	private viewHeight: number;

	constructor(parent: TextBuffer, offsetX: number, offsetY: number, width: number, height: number) {
		super(width, height);
		this.parentBuffer = parent;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.viewWidth = width;
		this.viewHeight = height;
	}

	private translateToParent(x: number, y: number): Position {
		return {
			x: x + this.offsetX,
			y: y + this.offsetY,
		};
	}

	isValidPosition(x: number, y: number): boolean {
		if (x < 0 || x >= this.viewWidth || y < 0 || y >= this.viewHeight) {
			return false;
		}
		const parentPos = this.translateToParent(x, y);
		return this.parentBuffer.isValidPosition(parentPos.x, parentPos.y);
	}

	setCell(x: number, y: number, char: string): void {
		if (this.isValidPosition(x, y)) {
			const parentPos = this.translateToParent(x, y);
			this.parentBuffer.setCell(parentPos.x, parentPos.y, char);
		}
	}

	getCell(x: number, y: number): string {
		if (this.isValidPosition(x, y)) {
			const parentPos = this.translateToParent(x, y);
			return this.parentBuffer.getCell(parentPos.x, parentPos.y);
		}
		return ' ';
	}

	getWidth(): number {
		return this.viewWidth;
	}

	getHeight(): number {
		return this.viewHeight;
	}

	*cells(): Generator<CellIteratorResult> {
		for (let y = 0; y < this.viewHeight; y++) {
			for (let x = 0; x < this.viewWidth; x++) {
				if (this.isValidPosition(x, y)) {
					yield { x, y, char: this.getCell(x, y) };
				}
			}
		}
	}

	createView(x: number, y: number, width: number, height: number): BufferView {
		const parentPos = this.translateToParent(x, y);
		return new BufferView(this.parentBuffer, parentPos.x, parentPos.y, width, height);
	}
}
