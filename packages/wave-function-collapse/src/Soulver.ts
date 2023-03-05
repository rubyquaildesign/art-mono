/**
 * @desc This is the main file for solving the Wave Function
 */

import {
	castDraft,
	castImmutable,
	Draft,
	enableMapSet,
	nothing,
	produce,
	enablePatches,
	Patch,
} from 'immer';
import iter from 'iterare';
import { WfcSpace } from './immer-types';
import { intersection, isSuperset, difference, union } from './set-helpers';

enableMapSet();
enablePatches();
type Keyable = string | number | symbol;

/**
 * Gets entropy for a *Count* amount of elements
 * @param count amound of elements
 * @returns  {number} entropy
 */
function getEntropy(probobilities: Iterable<number>) {
	let sum = 0;
	for (const x of probobilities) {
		sum += x * Math.log2(x);
	}

	return -1 * sum;
}

function getRandomArrayEntry<T>(array: T[], rnd: () => number) {
	if (array.length === 0) throw new Error(`passed empty array`);
	const arrayLength = array.length;
	const choice = Math.floor(rnd() * arrayLength);
	return array[choice];
}

/**
 * Debug value
 * @enum
 */
enum DebugValue {
	collapse = 'collapsed', // A Cell that has collapsed through a random
	changed = 'changed', // A Cell that has had it's available tiles changed
	noChange = 'noChange', // A Cell that has had no change to it's available tiles
	sourceCell = 'sourceCell',
	checkedCell = 'checkedCell',
	conflict = 'conflict',
	default = '',
}
export type Debug = typeof DebugValue;

// Select a random tile from all possible cells

/**
 * Wave function collapse class
 * @template SlotType The Type of the slots
 * @template SocketType The Typing of the sockets
 * @template CellId The typing for the cell ids
 * @template TileId The typing for the tile ids
 * @template T used for generics
 */

type Wfc<T> = T extends WaveFunctionCollapse<
	infer Sk,
	infer Sl,
	infer Tl,
	infer C
>
	? WfcSpace<Sk, Sl, Tl, C>
	: never;

export class WaveFunctionCollapse<
	SocketType extends Keyable,
	SlotType extends Keyable,
	TileId,
	CellId,
	WFC extends WfcSpace<SocketType, SlotType, TileId, CellId> = WfcSpace<
		SocketType,
		SlotType,
		TileId,
		CellId
	>,
> {
	declare wfc: WfcSpace<SocketType, SlotType, TileId, CellId>;

	field: ReadonlyMap<CellId, WFC['cell']> = new Map();
	wave = this.field;
	entropy: ReadonlyMap<CellId, number> = new Map();
	pendingCells: CellId[] = [];

	tiles: ReadonlyMap<TileId, WFC['tile']> = new Map();
	boundarySocket?: SocketType;

	possibilityMap?: Map<TileId, Map<SlotType, Set<TileId>>>;

	history: WFC['history'] = [];
	patches: Patch[] = [];
	triedTiles: ReadonlySet<TileId> = new Set();
	random: () => number = Math.random;

	isDebug = false;
	debug?: ReadonlyMap<CellId, DebugValue> = new Map();

	tileWeighting?: (tile: TileId, cell: CellId) => number;
	matchingSlot?: (slot: SlotType) => SlotType;
	adjacentCells?: (cellId: CellId) => Map<SlotType, CellId | 'boundary'>;

	private readonly _setDebugValue = produce<
		typeof this.debug,
		[CellId, DebugValue]
	>((draft, id: CellId, debug: DebugValue) => {
		draft!.set(castDraft(id), castDraft(debug));
	});

	gen = function* (
		this: WaveFunctionCollapse<SocketType, SlotType, TileId, CellId>,
	) {
		//  Setup the entropy and wave variables
		this.setupPossibilityMap();
		this.debug = new Map(
			[...this.field].map(([id]) => [id, DebugValue.default]),
		);
		Object.freeze(this.debug);
		this.entropy = new Map(
			[...this.field].map(([id]) => [id, this.tiles.size + this.random() / 16]),
		);
		Object.freeze(this.entropy);
		this.pendingCells = [];

		for (const [id] of iter(this.field).filter(([id, v]) => v.collapsed)) {
			this.pendingCells.push(id);
		}

		Object.freeze(this.field);
		this.wave = produce(
			this.field,
			draft => {
				const changedCells: CellId[] = [];
				for (const [id, cell] of draft) {
					const boundarySlots: Map<SlotType, SocketType> = new Map();
					for (const [slot, sock] of this.adjacentCells!(id as CellId)) {
						if (sock !== 'boundary') continue;
						boundarySlots.set(slot, this.boundarySocket!);
					}

					if (boundarySlots.size === 0) continue;
					let hasChanged = false;
					for (const tile of cell.tileMap) {
						const tileObject = this.tiles.get(tile as TileId)!;
						const canBePlaced = iter(boundarySlots).every(([slt, sk]) =>
							tileObject.plugs[slt].has(sk),
						);
						if (!canBePlaced) {
							cell.tileMap.delete(tile);
							hasChanged = true;
							changedCells.push(id as CellId);
						}
					}
				}

				this.pendingCells.push(...changedCells);
			},
			patches => {
				this.patches = [...this.patches, ...patches];
			},
		);

		let isCollapseDone = iter(this.wave).every(([id, v]) => v.collapsed);

		// Start going through the wave
		while (!isCollapseDone) {
			// Create a stack for the wave
			if (this.pendingCells.length === 0) {
				// Clear debug
				if (this.isDebug)
					this.debug = new Map(
						[...this.field].map(([id]) => [id, DebugValue.default]),
					);

				// Get smallest entropyCell
				const startingId = this.getCellwithLeastEntropy();

				// Collapse cell with smallest entropy
				const canCollapse = this.collapseCell(startingId, this.triedTiles);
				yield [this.wave, this.entropy, this.debug];
				if (!canCollapse) {
					this.rollback();
					yield [this.wave, this.entropy, this.debug];
					continue;
				}
			}

			stackLoop: while (this.pendingCells.length > 0) {
				// Get top of stack
				const currentCellId = this.pendingCells.shift()!;

				const currentCell = this.wave.get(currentCellId)!;
				if (this.isDebug) {
					this.setDebugValue(currentCellId, DebugValue.sourceCell);
					yield [this.wave, this.entropy, this.debug];
				}

				const neighbours = this.adjacentCells!(currentCellId);
				const possibleTiles = iter(currentCell.slots)
					.map(slot => {
						let tiles: Set<TileId> = new Set();
						for (const tId of currentCell.tileMap) {
							const tileOptions = this.possibilityMap!.get(tId);
							if (!tileOptions) throw new Error(`can't find tile ${tId}`);
							const options = tileOptions.get(slot);
							if (!options)
								throw new Error(
									`can't find options for tile ${tId} at slot ${String(slot)}`,
								);
							tiles = union(tiles, options);
						}

						return [slot, tiles] as [SlotType, Set<TileId>];
					})
					.toMap();
				for (const [slot, slotResident] of neighbours) {
					if (slotResident === 'boundary') continue;
					const neighbouringCell = this.wave.get(slotResident);
					const possibilities = possibleTiles.get(slot)!;
					if (neighbouringCell === undefined)
						throw new Error(`no cell at ${slotResident}`);
					if (neighbouringCell.collapsed) continue;
					this.debug = produce(this.debug, draft => {
						draft.set(castDraft(slotResident), DebugValue.checkedCell);
					});
					if (this.isDebug) {
						yield [this.wave, this.entropy, this.debug];
					}

					const available = neighbouringCell.tileMap;
					// Boundaries

					const noChange = isSuperset(possibilities, available);
					if (noChange && this.isDebug) {
						this.setDebugValue(slotResident, DebugValue.noChange);
						yield [this.wave, this.entropy, this.debug];
					}

					if (noChange) continue;

					const intersectTiles = intersection(possibilities, available);

					if (intersectTiles.size === 0 || available.size === 0) {
						console.log(`contradiction found at ${slotResident},rolling back`);
						this.rollback();
						yield [this.wave, this.entropy, this.debug];
						break stackLoop;
					}

					const collapsedAtile = this.updateCellToTiles(
						slotResident,
						currentCellId,
						intersectTiles,
					);
					if (this.isDebug || collapsedAtile) {
						this.setDebugValue(slotResident, DebugValue.changed);
						yield [this.wave, this.entropy, this.debug];
					}
				}

				this.setDebugValue(currentCellId, DebugValue.default);
			}

			isCollapseDone = iter(this.wave.values()).every(
				({ collapsed }) => collapsed,
			);
		}

		return [this.wave, this.entropy, this.debug];
	};

	getCellwithLeastEntropy(): CellId {
		const firstEntry = iter(this.entropy)
			.filter(([id, v]) => v !== 1)
			.toArray()
			.sort((a, b) => a[1] - b[1])[0];
		if (firstEntry === undefined) throw new Error(`can't get smallest cell`);
		return firstEntry[0];
	}

	rollback() {
		// Get last value
		console.log(this.history);

		let lastValue = -1;
		for (let i = this.history.length - 1; i >= 0; i--) {
			const entry = this.history[i];
			if ((entry as Wfc<this>['collapseEntry']).collapsedCell !== undefined) {
				lastValue = i;
				break;
			}
		}

		// Get the last history entry where a cell was collapsed to a random entry

		console.log('rolling back to', lastValue);

		// Throw an error if there's nothing to rollback to
		if (lastValue === -1)
			throw new Error(`well shit, this can't be rolled back`);

		const lastCollapse = this.history[lastValue] as Wfc<this>['collapseEntry'];
		this.triedTiles = lastCollapse.usedTiles;
		if (lastValue === 0) {
			this.history = [];
			this.wave = this.field;
			this.entropy = new Map(
				[...this.field].map(([id]) => [
					id,
					this.tiles.size + this.random() / 16,
				]),
			);
			this.pendingCells = [];
			return true;
		}

		this.history = this.history.slice(0, lastValue);
		const now = this.history[this.history.length - 1];
		this.wave = now.field;
		this.entropy = now.entropy;
		this.pendingCells = [];
		return true;
	}

	setupPossibilityMap() {
		if (!this.matchingSlot) throw new Error('no matching slot');
		this.possibilityMap = new Map();
		for (const [currentTileId, currentTile] of this.tiles) {
			const tMap = new Map<SlotType, Set<TileId>>();
			for (let [slot, sockets] of Object.entries(currentTile.plugs) as Array<
				[string | number, Set<SocketType>]
			>) {
				if (
					typeof [...iter(this.field).take(1).toArray()[0][1].slots][0] ===
					'number'
				)
					slot = Number.parseInt(slot as string, 10);
				const inverseSlot = this.matchingSlot(slot as SlotType);
				const tileSet = new Set<TileId>();
				for (const [matchingId, matchingTile] of this.tiles) {
					const sock = matchingTile.sockets[inverseSlot];
					if (sockets.has(sock)) {
						tileSet.add(matchingId);
					}
				}

				tMap.set(slot as SlotType, tileSet);
			}

			this.possibilityMap.set(currentTileId, tMap);
		}
	}

	private updateCellToTiles(
		cell: CellId,
		sourceCell: CellId,
		newTiles: ReadonlySet<TileId>,
	) {
		this.entropy = produce(this.entropy, draft => {
			const nt = newTiles.size;
			const newEntropy = nt === 1 ? 1 : nt - this.random() * 0.01;
			draft.set(castDraft(cell), newEntropy);
		});
		this.wave = produce(
			this.wave,
			draft => {
				const c = draft.get(castDraft(cell));
				if (c === undefined) throw new Error(`cell isn't in wave`);
				for (const tm of c.tileMap) {
					if (!newTiles.has(tm as TileId)) c.tileMap.delete(tm);
				}

				c.collapsed = c.tileMap.size === 1;
				c.observed = false;
			},
			(patches, iPatches) => {
				this.patches = [...this.patches, ...patches];
			},
		);

		this.pendingCells.push(cell);

		this.history = produce(this.history, draft => {
			const element: WFC['updateEntry'] = {
				entropy: this.entropy,
				field: this.wave,
				newTiles,
				sourceCell,
				updatedCell: cell,
				stack: [...this.pendingCells],
			};
			draft.push(castDraft(element));
		});
		this.debug = produce(this.debug, draft => {
			if (!draft) return nothing;
			draft.set(castDraft(cell), DebugValue.changed);
		});

		return this.wave.get(cell)!.collapsed;
	}

	private collapseCell(
		cell: CellId,
		usedTiles: ReadonlySet<TileId> = new Set([]),
	) {
		// Check Boundaries
		const cellObject = this.wave.get(cell)!;

		const availableTiles = cellObject.tileMap;
		const options = difference(availableTiles, usedTiles);
		let choice: TileId;
		if (options.size === 0) return false;
		if (options.size === 1) {
			choice = iter(options).toArray()[0];
		} else if (this.tileWeighting) {
			const weighted = new Map(
				[...options].map(tile => [tile, this.tileWeighting!(tile, cell)]),
			);
			let total = 0;
			for (const entry of weighted) total += entry[1];
			const threshold = this.random() * total;
			total = 0;
			for (const entry of weighted) {
				total += entry[1];
				if (total >= threshold) {
					choice = entry[0];
					break;
				}
			}
		} else {
			choice = getRandomArrayEntry([...options], () => this.random());
		}

		this.wave = produce(
			this.wave,
			draft => {
				const c = draft.get(castDraft(cell))!;
				c.tileMap.clear();
				c.tileMap.add(castDraft(choice));
				c.collapsed = true;
				c.observed = true;
			},
			patches => {
				this.patches = [...this.patches, ...patches];
			},
		);

		this.entropy = produce(this.entropy, draft => {
			draft.set(castDraft(cell), 1);
		});
		this.debug = produce(this.debug, draft => {
			draft?.set(castDraft(cell), DebugValue.collapse);
		});

		this.pendingCells.push(cell);
		this.history = produce(this.history, draft => {
			const uds = new Set(usedTiles);
			uds.add(choice);
			const element: WFC['collapseEntry'] = {
				entropy: this.entropy,
				field: this.wave,
				stack: [...this.pendingCells],
				collapsedCell: cell,
				toTile: choice,
				usedTiles: uds,
			};
			draft.push(castDraft(element));
		});
		return true;
	}

	private setDebugValue(id: CellId, debug: DebugValue) {
		this.debug = this._setDebugValue(this.debug, id, debug);
	}
}
