import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

interface ConstructorOptions<
  SlotIdentifierType,
  SocketType,
  Slots extends SlotIdentifierType[] = SlotIdentifierType[],
> {
  slots: Slots;
  sockets: Map<Slots[number], SocketType>;
  id?: string;
  matchingFunction?: (
    inputSlot: SlotIdentifierType,
    slots: SlotIdentifierType[],
  ) => SlotIdentifierType;
  isRotatable?: boolean;
  isReflectable?: boolean;
}
const defaultOptions: Partial<ConstructorOptions<any, any>> = {
  isReflectable: false,
  isRotatable: true,
  id: nanoid(),
  matchingFunction: <T>(slot: T, slots: T[]) => {
    const i = [...slots].indexOf(slot);
    const l = Math.floor(slots.length / 2);
    return slots[(i + l) % slots.length];
  },
};

abstract class Tile<SlotIdentifierType, Socket> {
  sockets: Map<SlotIdentifierType, Socket>;
  slots: SlotIdentifierType[];

  id: string;

  private readonly matchingFunction: (
    inputSlot: SlotIdentifierType,
    slots: SlotIdentifierType[],
  ) => SlotIdentifierType;

  constructor(options: ConstructorOptions<SlotIdentifierType, Socket>) {
    const verifiedOptions: Required<
      ConstructorOptions<SlotIdentifierType, Socket>
    > = Object.assign<any, any, any>({}, defaultOptions, options);
    this.sockets = verifiedOptions.sockets;
    this.slots = verifiedOptions.slots;
    this.matchingFunction = verifiedOptions.matchingFunction;
    this.id = verifiedOptions.id;
  }

  getSocketForSlot(slot: SlotIdentifierType): Socket {
    return this.sockets.get(slot)!;
  }

  getOpposingSlot(slot: SlotIdentifierType): SlotIdentifierType {
    return this.matchingFunction(slot, this.slots);
  }
}
