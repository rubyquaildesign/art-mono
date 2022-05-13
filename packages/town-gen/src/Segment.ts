import { extent } from 'd3';
import Quadtree from '@timohausmann/quadtree-js';
import { Vec, Vp, Line } from '../../h/index';
import { collide } from './sat-col';
import { config } from './config';

export type HeatFunction = (x: number, y: number) => number;
const TAU = Math.PI * 2;
const PI = Math.PI;

export interface Meta {
  severed?: boolean;
  hw?: boolean;
  ending?: boolean;
  endReason?: number | string;
  creationReason?: string;
  color?: string;
  branchCount?: number;
}
export const segFactory = {
  fromExisting: (
    seg: Segment,
    newTime?: number,
    newLine?: Line,
    newMeta?: Meta,
  ) => {
    const t = newTime ?? seg.time;
    const q = newMeta ?? seg.meta;
    const l = newLine ?? seg;

    return new Segment(l.start, l.end, t, q);
  },

  fromDirection: (
    start: Vec,
    time: number,
    q: Meta,
    dir: number = PI / 2,
    length = config.segLength,
  ) => {
    const end = new Vec(0, length).rotateTo(dir).add(start);
    return new Segment(start, end, time, q);
  },
};

export class Segment extends Line {
  backwardsLinks: Segment[] = [];
  forwardsLinks: Segment[] = [];
  time = 0;
  setupBranchLinks?: () => unknown;
  meta: Meta = {};
  constructor(start: Vec, end: Vec, time = 0, q: Meta = {}) {
    super(start.clone(), end.clone());
    this.time = time;
    this.meta = q;
  }

  startIsBackwards() {
    const bw = this.backwardsLinks;
    const fw = this.forwardsLinks;

    if (this.backwardsLinks.length > 0) {
      return (
        bw[0].start.isEqualTo(this.start) || bw[0].end.isEqualTo(this.start)
      );
    }
    return fw[0].start.isEqualTo(this.end) || fw[0].end.isEqualTo(this.end);
  }

  nbs() {
    return [...this.forwardsLinks, ...this.backwardsLinks];
  }

  endContaining(seg: Segment): 'start' | 'end' | undefined {
    const isBackwards = this.startIsBackwards();
    if (this.backwardsLinks.includes(seg)) return isBackwards ? 'start' : 'end';
    if (this.forwardsLinks.includes(seg)) return isBackwards ? 'end' : 'start';
    return undefined;
  }

  linksContainingEnd(seg: Segment) {
    if (this.backwardsLinks.includes(seg)) return this.backwardsLinks;
    if (this.forwardsLinks.includes(seg)) return this.forwardsLinks;
    return undefined;
  }

  split(point: Vec, seg: Segment, list: Segment[]) {
    const isBack = this.startIsBackwards();
    const splitPart = segFactory.fromExisting(this);
    splitPart.updateEnd(point);
    this.updateStart(point);
    list.push(splitPart);
    splitPart.backwardsLinks = this.backwardsLinks.slice(0);
    splitPart.forwardsLinks = this.forwardsLinks.slice(0);
    let firstSplit: Segment;
    let secondSplit: Segment;
    let fixedLinks: Segment[];

    if (isBack) {
      firstSplit = splitPart;
      secondSplit = this; // eslint-disable-line unicorn/no-this-assignment
      fixedLinks = splitPart.backwardsLinks;
    } else {
      firstSplit = this; // eslint-disable-line unicorn/no-this-assignment
      secondSplit = splitPart;
      fixedLinks = splitPart.forwardsLinks;
    }

    for (const link of fixedLinks) {
      const i = link.backwardsLinks.indexOf(this);
      if (i > -1) link.backwardsLinks[i] = splitPart;
      else link.forwardsLinks[link.forwardsLinks.indexOf(this)] = splitPart;
    }

    firstSplit.forwardsLinks = [seg, secondSplit];
    secondSplit.backwardsLinks = [seg, firstSplit];
    seg.forwardsLinks.push(firstSplit, secondSplit);
  }

  dir() {
    return this.vector.absAngle();
  }
}
