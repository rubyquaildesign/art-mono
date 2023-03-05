import type { Immutable } from 'immer';

type Keyable = number | string | symbol;
export interface Tile<
	SockType extends Keyable,
	SlotType extends Keyable,
	TileType,
> {
	readonly sockets: Readonly<Record<SlotType, SockType>>;
	readonly id: TileType;
	readonly plugs: Readonly<Record<SlotType, ReadonlySet<SockType>>>;
}
export interface Cell<SlotType extends Keyable, TileType, CellId> {
	readonly slots: ReadonlySet<SlotType>;
	readonly collapsed: boolean;
	readonly observed: boolean;
	readonly tileMap: ReadonlySet<TileType>;
	readonly id: CellId;
}
export interface UpdateEntry<SlotType extends Keyable, TileType, CellId> {
	readonly field: ReadonlyMap<CellId, Cell<SlotType, TileType, CellId>>;
	readonly entropy: ReadonlyMap<CellId, number>;
	readonly stack: readonly CellId[];
	readonly sourceCell: CellId;
	readonly updatedCell: CellId;
	readonly newTiles: ReadonlySet<TileType>;
}
export interface CollapseEntry<SlotType extends Keyable, TileType, CellId> {
	readonly field: ReadonlyMap<CellId, Cell<SlotType, TileType, CellId>>;
	readonly entropy: ReadonlyMap<CellId, number>;
	readonly stack: readonly CellId[];
	readonly collapsedCell: CellId;
	readonly toTile: TileType;
	readonly usedTiles: ReadonlySet<TileType>;
}
export interface WfcSpace<
	SocketType extends Keyable,
	SlotType extends Keyable,
	TileType,
	CellId,
> {
	cell: Cell<SlotType, TileType, CellId>;
	tile: Tile<SocketType, SlotType, TileType>;
	updateEntry: UpdateEntry<SlotType, TileType, CellId>;
	collapseEntry: CollapseEntry<SlotType, TileType, CellId>;
	history: Array<this['collapseEntry'] | this['updateEntry']>;
}
