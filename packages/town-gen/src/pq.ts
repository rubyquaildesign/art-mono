type QueueItem<T> = { item: T; priority: number };

export class PriorityQueue<T> extends Array<QueueItem<T>> {
  put(item: T, priority: number) {
    const newPair: QueueItem<T> = { item, priority };
    const index = this.findIndex((qt) => qt.priority > newPair.priority);
    if (index === -1) {
      this.push(newPair);
    } else {
      this.splice(index, 0, newPair);
    }
    return this;
  }

  get() {
    return this.shift()?.item;
  }
}
export function minimalAngularDifference(d1: number, d2: number) {
  const diff = Math.abs(d1 - d2) % Math.PI;
  return Math.min(diff, Math.abs(diff - Math.PI));
}
