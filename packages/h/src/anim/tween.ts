import type { Group } from './group';
import { seq } from './seq';
import { defaultGroup } from './defGroup';

type DrawFunc<U> = (t: U) => any;
type EasingFunc = (t: number) => number;
type InterpFunc<U> = (t: number) => U;

export class Tween<U = number> {
  #isPaused = false;
  #isPlaying = false;
  #stay = true;
  #drawBefore = false;
  #duration = 20;
  #initRepeat = 0;
  #repeat = 0;
  #repeatDelayFrames?: number;
  #yoyo = false;
  #reversed = false;
  #delayFrames = 0;
  #currentFrame = 0;
  #interpFunc?: InterpFunc<U>;
  #chainedTweens: Array<Tween<any>> = [];
  #id = seq.nextId();
  #isChainDone = false;
  #group: Group;
  #drawFunc: DrawFunc<U>;
  #goingToEnd = false;

  constructor(drawFunc: DrawFunc<U>, group = defaultGroup) {
    this.#group = group;
    this.#drawFunc = drawFunc;
    this.#interpFunc = ((t: number) => t) as any;
  }

  #easeFunc: EasingFunc = (t) => t;

  get id() {
    return this.#id;
  }

  get isPlaying() {
    return this.#isPlaying;
  }

  get isPaused() {
    return this.#isPaused;
  }

  duration(d = 20) {
    this.#duration = d;
    return this;
  }

  start() {
    if (this.#isPlaying) {
      return this;
    }

    if (this.#group) this.#group.add(this);

    this.#repeat = this.#initRepeat;

    this.#isPlaying = true;
    this.#isPaused = false;
    this.#isChainDone = false;
    this.#currentFrame = 0 - this.#delayFrames;
  }

  update(autoStart = true): boolean {
    let elapsed = this.#currentFrame / this.#duration;
    if (elapsed < 0) elapsed = 0;
    const value = this.#easeFunc(this.#reversed ? 1 - elapsed : elapsed);
    if (this.#isPaused) {
      this.#drawFunc(this.#interpFunc(value));
      return true;
    }

    if (!this.#goingToEnd && !this.#isPlaying) {
      if (this.#stay) this.#drawFunc(this.#interpFunc(value));
      if (this.#currentFrame >= this.#duration) return false;
      if (autoStart) this.start();
    }

    this.#goingToEnd = false;

    if (this.#currentFrame < 0) {
      if (this.#drawBefore) this.#drawFunc(this.#interpFunc(value));
      this.#currentFrame++;
      return true;
    }

    this.#drawFunc(this.#interpFunc(value));
    if (elapsed === 1) {
      if (this.#repeat > 0 || this.#repeat === -1) {
        if (this.#repeat > 0) this.#repeat--;
        if (this.#yoyo) {
          this.#reversed = !this.#reversed;
        }

        // eslint-disable-next-line no-negated-condition
        if (this.#repeatDelayFrames !== undefined) {
          this.#currentFrame = 0 - this.#repeatDelayFrames;
        } else {
          this.#currentFrame = 0 - this.#delayFrames;
        }

        return true;
      }

      for (const chainedTween of this.#chainedTweens) {
        chainedTween.start();
      }

      this.#isPlaying = false;
      return false;
    }

    this.#currentFrame++;
    return true;
  }

  stop() {
    if (!this.#isChainDone) {
      this.#isChainDone = true;
      this.stopChained();
    }

    if (!this.#isPlaying) {
      return this;
    }

    this.#isPlaying = false;
    this.#isPaused = false;
    return this;
  }

  stopChained() {
    for (const tween of this.#chainedTweens) {
      tween.stop();
    }

    return this;
  }

  end() {
    this.#goingToEnd = true;
    this.#currentFrame = this.#duration;
    this.update();
  }

  pause() {
    if (this.#isPaused || !this.#isPlaying) {
      return this;
    }

    if (this.#group) this.#group.remove(this);

    return this;
  }

  resume() {
    if (!this.#isPaused || !this.#isPlaying) {
      return this;
    }

    this.#isPaused = false;
    if (this.#group) this.#group.add(this);

    return this;
  }

  group(group = defaultGroup) {
    this.#group = group;
    return this;
  }

  delay(amount = 0) {
    this.#delayFrames = amount;
    return this;
  }

  repeat(times = 0) {
    this.#initRepeat = times;
    this.#repeat = times;
    return this;
  }

  repeatDelay(amt?: number) {
    this.#repeatDelayFrames = amt;
    return this;
  }

  yoyo(yoyo = false) {
    this.#yoyo = yoyo;
    return this;
  }

  easeing(ease: EasingFunc = (t) => t) {
    this.#easeFunc = ease;
    return this;
  }

  interpolation(interp: InterpFunc<U> = ((t: number) => t) as any) {
    this.#interpFunc = interp;
  }

  chain(...tweens: Array<Tween<any>>) {
    this.#chainedTweens = tweens;
    return this;
  }

  drawAfterCompletion(hold: boolean) {
    this.#stay = hold;
    return this;
  }

  drawBeforeStart(before: boolean) {
    this.#drawBefore = before;
    return this;
  }
}
