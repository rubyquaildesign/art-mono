import { extent } from 'd3';
import Quadtree from '@timohausmann/quadtree-js';
import { Vec, Vp } from '../../h/index';
import { collide } from './sat-col';
import { Line, Orientation, ep, addSegment } from './util';
import { config } from './config';

export type HeatFunction = (x: number, y: number) => number;
const TAU = Math.PI * 2;
export interface Meta {
  severed?: boolean;
  hw?: boolean;
  ending?: boolean;
  endReason?: number | string;
  creationReason?: string;
}
export const segFactory = {
  fromExisting(seg: Segment, time?: number, road?: Road, meta?: any) {
    const t = time ?? seg.timeDelay;
    const r = road ?? seg.road;
    const m = meta ?? { ...seg.metaInfo };
    return new Segment(r.start, r.end, t, m);
  },

  usingDirection(
    start: Vec,
    t: number,
    m: any,
    dir = Math.PI / 2,
    length = config.segLength,
  ) {
    dir = (TAU + dir) % TAU;
    const end = new Vec(
      start.x + Math.cos(dir + Math.PI) * length,
      start.y + Math.sin(dir + Math.PI) * length,
    );
    return new Segment(start, end, t, m);
  },
};

type VecLine = [Vec, Vec];

export class Road extends Array<Vec> implements VecLine {
  constructor(
    public start: Vec,
    public end: Vec,
    public width = config.segWidth,
  ) {
    super(start, end);
  }

  toString(): string {
    return `${this.start} -> ${this.end}`;
  }

  get dir() {
    return this.end.clone().sub(this.start).absAngle();
  }

  get length() {
    return this.start.dist(this.end);
  }

  get coords(): [number, number, number, number] {
    return [this.start.x, this.start.y, this.end.x, this.end.y];
  }

  get points(): Vec[] {
    const dirVec = new Vec(1, 0).rotate(this.dir);
    const leftVec = dirVec.clone().rotate(Math.PI / 2);
    const rightVec = dirVec.clone().rotate(-1 * (Math.PI / 2));
    const startL = this.start.clone().add(leftVec);
    const startR = this.start.clone().add(rightVec);
    const endL = this.end.clone().add(leftVec);
    const endR = this.end.clone().add(rightVec);
    return [startL, endL, endR, startR];
  }

  get limit() {
    const pts = this.points;
    const [minX, maxX] = extent(pts.map((p) => p.x))!;
    const [minY, maxY] = extent(pts.map((p) => p.y));
    return {
      x: minX!,
      y: minY!,
      width: Math.abs(maxX! - minX!),
      height: Math.abs(maxY! - maxX!),
    } as const;
  }

  private static onSegment(p: Vec, q: Vec, r: Vec) {
    const { max, min } = Math;
    return (
      q.x <= max(p.x, r.x) &&
      q.x >= min(p.x, r.x) &&
      q.y <= max(p.y, r.y) &&
      q.y >= min(p.y, r.y)
    );
  }

  private static orientation(p: Vec, q: Vec, r: Vec): Orientation {
    const value = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    return value === 0
      ? Orientation.Collinear
      : value > 0
      ? Orientation.Clockwise
      : Orientation.Counterclockwise;
  }

  intersects(other: Line) {
    const p1 = this.start;
    const q1 = this.end;

    const p2 = other[0];
    const q2 = other[1];

    const o1 = Road.orientation(p1, q1, p2);
    const o2 = Road.orientation(p1, q1, q2);
    const o3 = Road.orientation(p2, q2, p1);
    const o4 = Road.orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === Orientation.Collinear && Road.onSegment(p1, p2, q1)) return true;
    if (o2 === Orientation.Collinear && Road.onSegment(p1, q2, q1)) return true;
    if (o3 === Orientation.Collinear && Road.onSegment(p2, p1, q2)) return true;
    if (o4 === Orientation.Collinear && Road.onSegment(p2, q1, q2)) return true;
    return false;
  }

  intersectionPoint(other: Line) {
    if (!this.intersects(other)) {
      throw new Error(`nope these lines don't intersect`);
    }

    const r = this.end.clone().sub(this.start);
    const s = other[1].clone().sub(other[0]);

    const den = r.cross(s);

    const t = other[0].clone().sub(this.start).cross(s) / den;
    if (Number.isNaN(t) || Math.abs(t) < 0.001 || Math.abs(1 - t) < 0.001)
      return false;
    return {
      point: this.start.clone().add(r.clone().mulScaler(t)),
      tAlongRoad: t,
    };
  }

  hasCollided(other: Vp[]): boolean {
    return collide(this.points, other);
  }

  bboxIntersection(other: Line) {
    return (
      this.start.x <= other[1].x &&
      this.end.x >= other[0].x &&
      this.start.y <= other[1].y &&
      this.end.y >= other[0].y
    );
  }

  getHeat(hFunc: HeatFunction) {
    return hFunc(this.start.x, this.start.y) + hFunc(this.end.x, this.end.y);
  }
}
export class Segment {
  id?: number;
  timeDelay: number;
  metaInfo: Meta;
  links: { backwards: Segment[]; forwards: Segment[] } = {
    backwards: [],
    forwards: [],
  };

  setupBranchLinks?: () => unknown;
  maxSpeed = 80;
  capacity = 2;
  road: Road;

  constructor(start: Vec, end: Vec, t: number, q: Meta) {
    this.road = new Road(start.clone(), end.clone());
    this.timeDelay = t;
    this.metaInfo = { ...q };
  }

  get length() {
    return this.road.length;
  }

  get dir() {
    return this.road.dir;
  }

  get limits() {
    return { ...this.road.limit, segment: this };
  }

  get startIsBackwards() {
    if (this.links.backwards.length > 0) {
      return (
        this.road.start.distSq(this.links.backwards[0].road.start) < ep ||
        this.road.start.distSq(this.links.backwards[0].road.end) < ep
      );
    }
    return (
      this.road.end.distSq(this.links.forwards[0].road.start) < ep ||
      this.road.end.distSq(this.links.forwards[0].road.end) < ep
    );
  }

  get nbs(): Segment[] {
    return [...this.links.forwards, ...this.links.backwards];
  }

  endContaining(seg: Segment) {
    const startBack = this.startIsBackwards;
    if (this.links.backwards.includes(seg)) {
      return startBack ? ('start' as const) : ('end' as const);
    }
    if (this.links.forwards.includes(seg)) {
      return startBack ? ('end' as const) : ('start' as const);
    }
    return undefined;
  }

  linksForEndContaining(seg: Segment) {
    const l = this.links;
    if (l.backwards.includes(seg)) return l.backwards;
    if (l.forwards.includes(seg)) return l.forwards;
    return undefined;
  }

  split(
    splitPoint: Vec,
    segment: Segment,
    segList: Segment[],
    qTree: Quadtree,
  ) {
    const isBack = this.startIsBackwards;

    const splitpart = segFactory.fromExisting(this);
    splitpart.road.end = splitPoint;
    this.road.start = splitPoint;
    splitpart.links.backwards = this.links.backwards.slice(0);
    splitpart.links.forwards = this.links.forwards.slice(0);
    let firstSplit: Segment;
    let lastSplit: Segment;
    let fixLinks: Segment[];
    if (isBack) {
      firstSplit = splitpart;
      lastSplit = this;
      fixLinks = splitpart.links.backwards;
    } else {
      firstSplit = this;
      lastSplit = splitpart;
      fixLinks = splitpart.links.forwards;
    }

    for (const link of fixLinks) {
      let ix = link.links.backwards.indexOf(this);
      if (ix >= 0) {
        link.links.backwards[ix] = splitpart;
      } else {
        ix = link.links.forwards.indexOf(this);
        link.links.forwards[ix] = splitpart;
      }
    }
    splitpart.metaInfo.creationReason = 'created from split';
    this.metaInfo.endReason += '  IS SPLIT  ';
    addSegment(splitpart, segList, qTree);

    firstSplit.links.forwards = [];
    firstSplit.links.forwards.push(segment, lastSplit);

    lastSplit.links.backwards = [segment, firstSplit];

    segment.links.forwards.push(firstSplit, lastSplit);
  }
}
