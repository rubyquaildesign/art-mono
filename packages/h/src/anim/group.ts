import type { Tween } from './tween';

export class Group {
  #tweens: Record<string, Tween<any>> = {};
  #addedTweens: Record<string, Tween<any>> = {};
  getTweens() {
    return Object.keys(this.#tweens).map((id) => this.#tweens[id]);
  }

  removeTweens(): this {
    this.#tweens = {};
    return this;
  }

  add<U>(tween: Tween<U>) {
    this.#tweens[tween.id] = tween;
    this.#addedTweens[tween.id] = tween;
  }

  remove(tw: Tween<any> | number | string) {
    const id = typeof tw === 'number' || typeof tw === 'string' ? tw : tw.id;
    this.#tweens[id] = undefined;
    this.#addedTweens[id] = undefined;
  }

  update(preserve = false) {
    let ids = Object.keys(this.#tweens);
    if (ids.length === 0) return false;
    while (ids.length > 0) {
      this.#addedTweens = {};
      for (const tweenId of ids) {
        const tween = this.#tweens[tweenId];
        const autostart = !preserve;
        if (!tween) continue;
        const result = tween.update(autostart);
        if (!result && !preserve) {
          this.#tweens[tweenId] = undefined;
        }
      }

      ids = Object.keys(this.#addedTweens);
    }
  }
}
