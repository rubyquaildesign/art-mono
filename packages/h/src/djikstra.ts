import TinyQueue from 'tinyqueue';

export type DistanceFunc<T = number> = (from: T, to: T) => number;
export type NeighbourFunc<T = number> = (here: T) => Iterable<T>;

/**
 * Djikstras path returns the djikstra's path between two nodes
 * @template T node form
 * @param start starting node
 * @param end ending node
 * @param getNeighbours function that returns neighbours for a node
 * @param [getDistance] function that gets the distance between two nodes, defaults to const 1
 * @returns path
 */
export function djikstraPath<T = number>(
	start: T,
	end: T,
	getNeighbours: NeighbourFunc<T>,
	getDistance: DistanceFunc<T> = () => 1,
) {
	const frontier = new TinyQueue<{ v: T; n: number }>(
		undefined,
		(a, b) => b.n - a.n,
	);
	frontier.push({ v: start, n: 0 });
	const cameFrom = new Map<T, T | null>();
	const distanceTo = new Map<T, number>();
	cameFrom.set(start, null);
	distanceTo.set(start, 0);
	while (frontier.length > 0) {
		const current = frontier.pop()!.v;
		if (current === end) {
			break;
		}

		for (const n of getNeighbours(current)) {
			const newDistance = distanceTo.get(current)! + getDistance(current, n);
			if (!distanceTo.has(n) || newDistance < distanceTo.get(n)!) {
				distanceTo.set(n, newDistance);
				frontier.push({ n: newDistance, v: n });
				cameFrom.set(n, current);
			}
		}
	}

	const path = [end];
	if (!cameFrom.has(end)) throw new Error('No Route Found');
	let next = cameFrom.get(end);
	while (next !== undefined && next !== null) {
		path.unshift(next);
		next = cameFrom.get(next);
	}

	return path;
}
