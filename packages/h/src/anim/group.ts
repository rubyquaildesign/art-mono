import type { Tween } from './tween';

export class Group {
  #tweens: Map<number, Tween<any>> = new Map();
  #addedTweens: Map<number, Tween<any>> = new Map();
  getTweens() {
    return this.#tweens.values();
  }

  removeTweens(): this {
    this.#tweens.clear();
    return this;
  }

  add<U>(tween: Tween<U>) {
    this.#tweens.set(tween.id, tween);
    this.#addedTweens.set(tween.id, tween);
  }

  remove(tw: Tween<any> | number) {
    const id = typeof tw === 'number' || typeof tw === 'string' ? tw : tw.id;
    this.#tweens.delete(id);
    this.#addedTweens.delete(id);
  }

  update(preserve = false) {
    let ids = [...this.#tweens.keys()];
    if (ids.length === 0) return false;
    while (ids.length > 0) {
      this.#addedTweens = new Map();
      for (const tweenId of ids) {
        const tween = this.#tweens.get(tweenId);
        const autostart = !preserve;
        if (!tween) continue;
        const result = tween.update(autostart);
        if (!result && !preserve) {
          this.#tweens.delete(tweenId);
        }
      }

      ids = [...this.#addedTweens.keys()];
    }
  }
}
