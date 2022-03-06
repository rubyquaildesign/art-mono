import { randomBates } from 'd3';
import Quadtree from '@timohausmann/quadtree-js';
import { Vec } from '../../h/index';
import { Segment } from './Segment';

export const ep = 10 ** -2;
export const createAngleRand = (limit: number) => {
  const rFunc = randomBates(3);
  const n = limit * 2;
  return () => rFunc() * n - limit;
};
export const vecDiff = (a: Vec, b: Vec) => {
  return a.clone().sub(b).lenSq() < ep;
};
export interface Line {
  0: Vec;
  1: Vec;
}
export function distToLine(point: Vec, a: Vec, b: Vec) {
  const aToP = point.clone().sub(a);
  const aToB = b.clone().sub(a);
  const projected = aToP.projectOn(aToB.clone().norm());
  const resultPoint = projected.clone().add(a);
  return {
    distToPoint: resultPoint.dist(point),
    pointOnLine: resultPoint,
    distAlongLine: Math.sign(aToP.dot(aToB) * projected.len()),
    lineLength: aToB.len(),
  };
}
export function angDiff(a: number, b: number) {
  const diff = Math.abs(a - b) % Math.PI;
  return Math.min(diff, Math.abs(diff - Math.PI));
}
export function addSegment(seg: Segment, segList: Segment[], qTree: Quadtree) {
  segList.push(seg);
  qTree.insert(seg.limits);
}
export enum Orientation {
  Collinear,
  Clockwise,
  Counterclockwise,
}
