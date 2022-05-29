export abstract class Cell<TileMapType> {
  id: string | number;
  field: ArrayLike<Cell>;
  get neighbours(): Iterable<Cell<TileMapType>> {}
}
