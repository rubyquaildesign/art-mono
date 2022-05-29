import { List, Map as IMap, Record, Set as ISet, Stack } from 'immutable';
import { Cell, Tile, WfcSpace } from './types';

const getEntropy = (count: number) => -(Math.log(1 / count) / Math.log(2));
enum DebugValue {
  COLLAPSE = 'collapsed',
  CHANGED = 'changed',
  NO_CHANGE = 'noChange',
  SOURCE_CELL = 'sourceCell',
  CHECKED_CELL = 'checkedCell',
  CONFLICT = 'conflict',
  DEFAULT = '',
}
export type Debug = typeof DebugValue;
function getRandomArrayEntry<T>(array: T[]) {
  if (array.length === 0) throw new Error(`passed empty array`);
  const arrayLength = array.length;
  const choice = Math.floor(Math.random() * arrayLength);
  return array[choice];
}
// Select a random tile from all possible cells

type Keyable = string | number | symbol;

export class WaveFunctionCollapse<
  SlotType,
  SocketType,
  CellId,
  TileId,
  T extends WfcSpace<SlotType, SocketType, TileId, CellId> = WfcSpace<
    SlotType,
    SocketType,
    TileId,
    CellId
  >,
> {
  declare wfc: WfcSpace<SlotType, SocketType, TileId, CellId>;
  field: T['Field'] = IMap<CellId, T['Cell']>();
  wave: T['Field'] = this.field;
  stack: Stack<CellId> = Stack();
  entropy: IMap<CellId, number> = IMap();
  isDebug = false;
  debug?: IMap<CellId, DebugValue> = IMap();
  history: T['History'] = List();
  tiles: IMap<TileId, T['Tile']> = IMap();
  triedTiles: ISet<TileId> = ISet();
  updateEntryFactory: T['UpdateEntryFactory'] = Record(
    {
      entropy: IMap(),
      field: IMap(),
      newTiles: ISet(),
      sourceCell: undefined as any,
      stack: Stack(),
      updatedCell: undefined as any,
    },
    'update',
  );

  collapseEntryFactory: T['CollapseEntryFactory'] = Record(
    {
      entropy: IMap(),
      field: IMap(),
      collapsedCell: undefined as any,
      toTile: undefined as any,
      stack: Stack(),
      usedTiles: ISet(),
    },
    'collapse',
  );

  private updateCellToTiles(
    cell: CellId,
    sourceCell: CellId,
    newTiles: ISet<TileId>,
  ) {
    this.entropy = this.entropy.update(cell, (_) =>
      newTiles.size === 1 ? 1 : newTiles.size - Math.random() * 0.01,
    );
    this.wave = this.wave.update(cell, (c) => {
      let newCell = c!;
      newCell = newCell.set('tileMap', newTiles);
      if (newTiles.size === 1) newCell = newCell.set('collapsed', true);
      return newCell;
    });
    this.stack = this.stack.unshift(cell);
    this.history = this.history.push(
      this.updateEntryFactory({
        entropy: this.entropy,
        field: this.wave,
        newTiles,
        sourceCell,
        stack: this.stack,
        updatedCell: cell,
      }),
    );
    if (this.isDebug) {
      this.debug = this.debug!.set(cell, DebugValue.CHANGED);
    }
    return this.wave.get(cell)!.collapsed;
  }

  private collapseCell(cell: CellId, usedTiles: ISet<TileId> = ISet([])) {
    // Check Boundaries
    const boundaries = this.adjacentCells!(cell)
      .filter((v) => v === 'boundary')
      .map((v) => this.boundarySocket!);
    const nonBounded = this.tiles
      .filter((tile) =>
        tile.plugs.every((options, slt) => {
          if (!boundaries.has(slt)) return true;
          if (options.includes(boundaries.get(slt)!)) return true;
          return false;
        }),
      )
      .keySeq()
      .toSet();
    const availableTiles = this.wave.get(cell)!.tileMap;
    const options = availableTiles.intersect(nonBounded).subtract(usedTiles);
    let choice: TileId;
    if (options.size === 0) return false;
    if (options.size === 1) {
      choice = options.first();
    } else if (this.tileWeighting) {
      const weighted = options
        .toOrderedMap()
        .map((tile) => this.tileWeighting!.get(tile, 1))
        .toArray();
      let total = 0;
      for (const entry of weighted) total += entry[1];
      const threshold = Math.random() * total;
      total = 0;
      for (const entry of weighted) {
        total += entry[1];
        if (total >= threshold) {
          choice = entry[0];
          break;
        }
      }
    } else {
      choice = getRandomArrayEntry(options.toArray());
    }
    this.wave = this.wave.update(cell, (c) =>
      c!.set('tileMap', ISet([choice])).set('collapsed', true),
    );
    this.entropy = this.entropy.set(cell, 1);
    if (this.isDebug) {
      this.debug = this.debug!.set(cell, DebugValue.COLLAPSE);
    }
    this.stack = this.stack.unshift(cell);
    this.history = this.history.push(
      this.collapseEntryFactory({
        collapsedCell: cell,
        entropy: this.entropy,
        field: this.wave,
        stack: this.stack,
        toTile: choice!,
        usedTiles: usedTiles.add(choice!),
      }),
    );
    return true;
  }

  rollback() {
    const lastValue = this.history.findLastIndex(
      (v) => (v as T['CollapseEntry']).collapsedCell !== undefined,
    );
    console.log('rolling back to', lastValue);
    if (lastValue === -1)
      throw new Error(`well shit, this can't be rolled back`);
    const lastCollapse = this.history.get(lastValue) as T['CollapseEntry'];
    this.triedTiles = lastCollapse.usedTiles;
    if (lastValue === 0) {
      this.history = this.history.clear();
      this.wave = this.field;
      this.entropy = this.field.map(() => this.tiles.size + Math.random() / 16);
      this.stack = this.stack.clear();
      return true;
    }
    this.history = this.history.slice(0, lastValue);
    const now = this.history.last()!;
    this.wave = now.field;
    this.entropy = now.entropy;
    this.stack = now.stack;
    return true;
  }

  boundarySocket?: SocketType;
  tileWeighting?: IMap<TileId, number>;
  matchingSlot?: (slot: SlotType) => SlotType;
  adjacentCells?: (cellId: CellId) => IMap<SlotType, CellId | 'boundary'>;

  possibleAdjacentTiles(
    slot: SlotType,
    sockets: ISet<SocketType>,
  ): ISet<TileId> {
    if (this.matchingSlot === undefined)
      throw new Error(`no matching slot argument`);
    const matchingSlot = this.matchingSlot(slot);
    return this.tiles
      .filter((tile) => {
        return sockets.includes(tile.sockets.get(matchingSlot)!);
      })
      .map((tile) => tile.id)
      .toSet();
  }

  solveGenerator() {
    // Check to make sure the functions exist;
    type yieldType = [
      wave: typeof this.wave,
      entropy: typeof this.entropy,
      debug: typeof this.debug,
    ];
    type That = this;
    if (!this.matchingSlot) throw new Error('missing matching slot funciton');
    if (!this.adjacentCells) throw new Error('missing adjacent cells function');
    if (this.boundarySocket === undefined)
      throw new Error(`no boundary socket set`);
    // The generator
    const gen = function* (this: That) {
      //  Setup the entropy and wave variables
      if (this.isDebug) this.debug = this.field.map((_) => DebugValue.DEFAULT);
      const entropy = this.field.map(
        () => this.tiles.size + Math.random() / 16,
      );
      this.entropy = entropy;
      const wave = this.field;
      this.wave = this.field;

      let done = this.entropy.every((v) => v < 1);
      const waveStack: Stack<CellId> = Stack();
      this.stack = waveStack;
      // Start going through the wave
      while (!done) {
        // Create a stack for the wave

        // Clear debug
        if (this.isDebug)
          this.debug = this.field.map((_) => DebugValue.DEFAULT);
        // Get smallest entropyCell
        const startingId = this.entropy
          .entrySeq()
          .filter(([id, v]) => v !== 1)
          .sortBy((v) => v[1])
          .first()![0];
        // Collapse cell with smallest entropy

        const canCollapse = this.collapseCell(startingId, this.triedTiles);
        yield [this.wave, this.entropy, this.debug] as yieldType;
        if (!canCollapse) {
          this.rollback();
          yield [this.wave, this.entropy, this.debug] as yieldType;
          continue;
        }
        while (this.stack.size > 0) {
          // Get top of stack
          const currentCellId = this.stack.first<CellId>()!;

          this.stack = this.stack.shift();
          if (this.isDebug) {
            this.debug = this.debug!.set(currentCellId, DebugValue.SOURCE_CELL);
            yield [this.wave, this.entropy, this.debug] as yieldType;
          }
          const neighbours = this.adjacentCells!(currentCellId);
          for (const [slot, slotResident] of neighbours) {
            if (slotResident === 'boundary') continue;
            const neighbouringCell = this.wave.get(slotResident)!;
            const collapsed = neighbouringCell.collapsed;
            if (collapsed) continue;
            if (this.isDebug) {
              this.debug = this.debug!.set(
                slotResident,
                DebugValue.CHECKED_CELL,
              );
              yield [this.wave, this.entropy, this.debug] as yieldType;
            }
            const thisCell = this.wave.get(currentCellId)!;
            const plugs = thisCell.tileMap
              .map((k) => this.tiles.get(k)!)
              .flatMap((tile) => tile.plugs.get(slot)!)
              .toSet();
            let possibleTiles = this.possibleAdjacentTiles(slot, plugs);
            const available: ISet<TileId> = neighbouringCell.tileMap;
            // Boundaries
            const availables = available;
            const adjs = this.adjacentCells!(slotResident);
            if (adjs.includes('boundary')) {
              const bdSlots = adjs
                .filter((v) => v === 'boundary')
                .keySeq()
                .toSet();
              const canDo = possibleTiles.filter((t) => {
                const tile = this.tiles.get(t)!;
                for (const slt of bdSlots) {
                  if (tile.sockets.get(slt) !== this.boundarySocket!)
                    return false;
                }
                return true;
              });
              possibleTiles = possibleTiles.intersect(canDo);
            }
            if (available.isSubset(possibleTiles)) {
              if (this.isDebug) {
                this.debug = this.debug!.set(
                  slotResident,
                  DebugValue.NO_CHANGE,
                );
                yield [this.wave, this.entropy, this.debug] as yieldType;
              }
              continue;
            }
            const intersection = possibleTiles.intersect(available);

            if (intersection.size === 0) {
              this.rollback();
              yield [this.wave, this.entropy, this.debug] as yieldType;
              break;
            }

            const collapsedATile = this.updateCellToTiles(
              slotResident,
              currentCellId,
              intersection,
            );
            if (this.isDebug) {
              this.debug = this.debug!.set(slotResident, DebugValue.CHANGED);
              yield [this.wave, this.entropy, this.debug] as yieldType;
            }
          }
          if (this.isDebug) {
            this.debug = this.debug!.set(currentCellId, DebugValue.DEFAULT);
          }
        }

        done = this.wave.every((v) => v.collapsed);
      }
      return [this.wave, this.entropy, this.debug] as yieldType;
    };
    return gen.call(this);
  }
}
