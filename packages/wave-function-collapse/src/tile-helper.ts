import iter from 'iterare';
import { castDraft, produce } from 'immer';
import { Tile } from './immer-types';

type Keyable = string | number | symbol;

function rotateSlotCCW<SlotType extends Keyable, T>(
	content: Readonly<T[]>,
	slotOrder: SlotType[],
): T[] {
	const ogSlots = Array.from(slotOrder);

	if (ogSlots.length === 0) throw new Error(`length of input array is zero`);

	const first = ogSlots[0];
	const newSlots = produce(ogSlots, draft => {
		draft.shift();
		draft.push(castDraft(first));
	});
	const newSlotMap: T[] = [];

	for (const [newSlot, oldSlot] of newSlots.map(
		(v, i) => [i, ogSlots.indexOf(v)] as const,
	)) {
		newSlotMap[newSlot] = content[oldSlot];
	}

	return newSlotMap;
}

function rotateSlotCW<SlotType extends Keyable, T>(
	content: Readonly<T[]>,
	slotOrder: SlotType[],
): T[] {
	const ogSlots = Array.from(slotOrder);

	if (ogSlots.length === 0) throw new Error(`length of input array is zero`);

	const last = ogSlots[ogSlots.length - 1];
	const newSlots = produce(ogSlots, draft => {
		draft.unshift(castDraft(last));
		draft.pop();
	});
	const newSlotMap: T[] = [];

	for (const [newSlot, oldSlot] of newSlots.map(
		(v, i) => [i, ogSlots.indexOf(v)] as const,
	)) {
		newSlotMap[newSlot] = content[oldSlot];
	}

	return newSlotMap;
}

export function rotateSlots<SlotType extends Keyable, Sockets>(
	content: Readonly<Sockets[]>,
	slotOrder: SlotType[],
	numberRotations = 1,
): Sockets[] {
	if (numberRotations === 0) return content as Sockets[];

	const r = [];

	for (let i = 0; i < Math.abs(Math.round(numberRotations)); i++) {
		r.push(i);
	}

	const finalSlots = iter(r).reduce(
		c =>
			Math.sign(numberRotations) === 1
				? rotateSlotCW(c, slotOrder)
				: rotateSlotCCW(c, slotOrder),
		content,
	);

	return finalSlots as Sockets[];
}

export function constructSimpleTileFactory<
	SocketType extends Keyable,
	SlotType extends Keyable,
	TileId,
>(
	slots: Iterable<SlotType>,
): (id: TileId, sockets: SocketType[]) => Tile<SocketType, SlotType, TileId> {
	const sl = Array.from(slots);

	return (id, sockets) => {
		const socketArray = [...sockets];
		const socks: Partial<Record<SlotType, SocketType>> = {};
		const plugs: Partial<Record<SlotType, Set<SocketType>>> = {};

		for (const [i, socket] of socketArray.entries() as Iterable<
			[number, SocketType]
		>) {
			const slot = sl[i] ?? sl[0];
			socks[slot] = socket;
			plugs[slot] = new Set([socket]);
		}

		return {
			id,
			sockets: socks as Record<SlotType, SocketType>,
			plugs: plugs as Record<SlotType, Set<SocketType>>,
		};
	};
}
