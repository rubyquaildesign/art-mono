import type {
  List,
  Map as IMap,
  Record as IRecord,
  RecordOf,
  Set as ISet,
  Stack,
} from 'immutable';

export interface SocketI<T extends number | string | symbol> {
  id: T;
}
type Id = string | number;
type Keyable = string | number | symbol;

export type TileProps<SocketType, SlotType, TileId> = {
  sockets: IMap<SlotType, SocketType>;
  id: TileId;
  plugs: IMap<SlotType, ISet<SocketType>>;
};
export type Tile<SocketType, SlotType, TileId> = RecordOf<
  TileProps<SocketType, SlotType, TileId>
>;
export type TileFactory<SocketType, SlotType, TileId> = IRecord.Factory<
  TileProps<SocketType, SlotType, TileId>
>;
export type CellProps<SlotType, CellId, TileId> = {
  slots: ISet<SlotType>;
  collapsed: boolean;
  tileMap: ISet<TileId>;
  id: CellId;
};
type CollapseEntryProps<SlotType, TileId, CellId> = {
  field: Field<SlotType, CellId, TileId>;
  entropy: IMap<CellId, number>;
  stack: Stack<CellId>;
  collapsedCell: CellId;
  toTile: TileId;
  usedTiles: ISet<TileId>;
};
type UpdateEntryProps<SlotType, TileId, CellId> = {
  field: Field<SlotType, CellId, TileId>;
  entropy: IMap<CellId, number>;
  stack: Stack<CellId>;
  sourceCell: CellId;
  updatedCell: CellId;
  newTiles: ISet<TileId>;
};
export type CellFactory<SlotType, CellId, TileId> = IRecord.Factory<
  CellProps<SlotType, CellId, TileId>
>;
export type Cell<SlotType, CellId, TileId> = RecordOf<
  CellProps<SlotType, CellId, TileId>
>;
export type Field<SlotType, CellId, TileId> = IMap<
  CellId,
  Cell<SlotType, CellId, TileId>
>;

export interface WfcSpace<SlotType, SocketType, TileId, CellId> {
  CellProps: CellProps<SlotType, CellId, TileId>;
  CellFactory: CellFactory<SlotType, CellId, TileId>;
  Cell: Cell<SlotType, CellId, TileId>;
  TileProps: TileProps<SocketType, SlotType, TileId>;
  Tile: Tile<SocketType, SlotType, TileId>;
  TileFactory: TileFactory<SocketType, SlotType, TileId>;
  Field: Field<SlotType, CellId, TileId>;
  CollapseEntryFactory: IRecord.Factory<
    CollapseEntryProps<SlotType, TileId, CellId>
  >;
  CollapseEntry: RecordOf<CollapseEntryProps<SlotType, TileId, CellId>>;
  UpdateEntryFactory: IRecord.Factory<
    UpdateEntryProps<SlotType, TileId, CellId>
  >;
  UpdateEntry: RecordOf<UpdateEntryProps<SlotType, TileId, CellId>>;
  History: List<this['CollapseEntry'] | this['UpdateEntry']>;
}
type N = WfcSpace<string, string, string, string>;
type B = N['CellFactory'];
