import Quadtree from '@timohausmann/quadtree-js';
import Ns from 'simplex-noise';
import { randomNormal, RandomNormal } from 'd3';
import { Vec } from '../../h/index';
import { PriorityQueue } from './pq';
import {
  ep,
  addSegment,
  angDiff,
  vecDiff,
  distToLine,
  createAngleRand,
} from './util';
import { config } from './config';
import { Segment, Meta, segFactory } from './Segment';

const isDebug = true;
const rnd = () => Math.random();
const noise = new Ns(Math.random());

const clamp = (input: number, min: number, max: number) => {
  return input > min ? (input < max ? input : max) : min;
};
const simpleClamp = (input: number, size: number) =>
  clamp(input, -1 * size, size);
const H_PI = Math.PI / 2;
const TAU = Math.PI * 2;
const rndForwardAng = () =>
  simpleClamp(randomNormal(0, config.forwardAngDev)(), config.forwardAngDev);
const rndBranchAng = () =>
  simpleClamp(randomNormal(0, config.branchAngDev)(), config.branchAngDev);
type SegLimit = {
  x: number;
  y: number;
  width: number;
  height: number;
  segment: Segment;
};
const localConstraints = (seg: Segment, segList: Segment[]) => {
  const action: { priority: number; meta: any; function?: () => boolean } = {
    priority: 0,
    meta: {},
  };

  for (const [i, other] of segList.entries()) {
    if (other === seg) continue;

    // Priority 4 Actions: Intersection Check
    if (action.priority <= 4) {
      const intersects = seg.intersectionPoint(other);
      if (
        intersects.kind === 'intersect' &&
        intersects.tFromA > 0.0001 &&
        intersects.tFromA < 1 - 0.0001
      ) {
        const tToOther = intersects.tFromA;
        const hasT = action.meta.t !== undefined;
        if (!hasT || action.meta.t > tToOther) {
          action.meta.t = tToOther;
          action.priority = 4;
          action.function = () => {
            if (
              seg.vector.angleBetween(other.vector) <
              config.interesectionDeviation
            ) {
              return false;
            }
            other.split(intersects.pt, seg, segList);
            seg.updateEnd(intersects.pt);
            seg.meta.severed = true;
            seg.meta.endReason = 'Crossed Intersection';
            seg.meta.color = 'cyan';
            return true;
          };
        }
      }
    }

    // Priority 3 Actions: Snap to Crossing
    if (action.priority <= 3) {
      const dst = seg.end.dist(other.end);
      if (dst <= config.snapDist) {
        const point = other.end;
        action.priority = 3;
        action.function = () => {
          seg.updateEnd(point);
          seg.meta.severed = true;
          seg.meta.endReason = 'Snapped to crossing';
          seg.meta.color = 'orange';
          const links = other.startIsBackwards()
            ? other.forwardsLinks
            : other.backwardsLinks;
          if (links.some((s) => s.isEqualTo(seg))) return false;

          for (const linkedSeg of links) {
            linkedSeg.linksContainingEnd(other)?.push(seg);
            seg.forwardsLinks.push(linkedSeg);
          }
          links.push(seg);
          seg.forwardsLinks.push(other);
          return true;
        };
      }
    }

    // Priority 2 Actions: Intersections within Radius
    if (action.priority <= 2) {
      const ptd = other.projectPointToLine(seg.end);
      const minD = other.minDistToPoint(seg.end);
      if (minD < config.snapDist && ptd.onLine) {
        const point = ptd.pt;
        action.priority = 2;
        action.function = () => {
          seg.updateEnd(point);
          seg.meta.severed = true;
          seg.meta.endReason = 'snapped to create intersection';
          seg.meta.color = 'green';

          const angDiff = seg.vector.angleBetween(other.vector);
          if (angDiff < config.interesectionDeviation) return false;

          other.split(point, seg, segList);

          return true;
        };
      }
    }
  }
  if (action.function) {
    return action.function();
  }
  return true;
};

export type HeatFunction = (v: Vec) => number;
const getBranches = (
  previousSeg: Segment,
  newBranches: Segment[],
  heatFunc: (pos: Vec) => number,
) => {
  const template = (dir: number, length: number, time: number, meta: Meta) =>
    segFactory.fromDirection(previousSeg.end, time, meta, dir, length);

  const templateContinue = (dir: number) =>
    template(dir, previousSeg.length, 0, {
      hw: previousSeg.meta.hw,
      branchCount: previousSeg.meta.branchCount ?? 0,
    });

  const templateBranch = (dir: number, m: Meta) =>
    template(
      dir,
      config.segLength,
      (previousSeg.meta.hw ? config.hwBranchDelay : 0) + previousSeg.time,
      {
        ...m,
        branchCount: m.branchCount !== undefined ? m.branchCount + 1 : 1,
      },
    );

  const continueStraight = templateContinue(previousSeg.vector.absAngle());

  const straightPop =
    heatFunc(continueStraight.start) + heatFunc(continueStraight.end);

  if (previousSeg.meta.hw) {
    // Moving Straight Forward
    const randomStraight = templateContinue(
      previousSeg.dir() + rndForwardAng(),
    );
    const rndStraightPop =
      heatFunc(randomStraight.start) + heatFunc(randomStraight.end);
    let roadPop: number;
    if (rndStraightPop > straightPop) {
      newBranches.push(randomStraight);
      roadPop = rndStraightPop;
    } else {
      newBranches.push(continueStraight);
      roadPop = straightPop;
    }

    // Do we branch
    if (roadPop > config.branchPopThreshold) {
      const lProb = rnd();
      if (lProb < config.hwBranchProb) {
        // Should we branch left?
        newBranches.push(
          templateBranch(previousSeg.dir() - H_PI + rndBranchAng(), {
            creationReason: 'hwBranch',
            hw: false,
          }),
        );
      } else {
        const rProb = rnd();
        if (rProb < config.hwBranchProb) {
          newBranches.push(
            templateBranch(previousSeg.dir() + H_PI + rndBranchAng(), {
              creationReason: 'hwBranch',
            }),
          );
        }
      }
    }
  } else if (straightPop > config.branchPopThreshold)
    newBranches.push(continueStraight);
  if (straightPop > config.branchPopThreshold) {
    const lRand = rnd();
    const rRand = rnd();
    const tsh = config.branchProb;
    if (rRand < tsh)
      newBranches.push(
        templateBranch(previousSeg.dir() - H_PI + rndBranchAng(), {
          creationReason: 'normalBranch',
        }),
      );
    else if (lRand < tsh)
      newBranches.push(
        templateBranch(previousSeg.dir() + H_PI + rndBranchAng(), {
          creationReason: 'normalBranch',
        }),
      );
  }
  for (const branch of newBranches) {
    branch.setupBranchLinks = function () {
      for (const link of previousSeg.forwardsLinks) {
        this.backwardsLinks.push(link);
        link.linksContainingEnd(previousSeg)?.push(this);
      }
      previousSeg.forwardsLinks.push(this);
      this.backwardsLinks.push(previousSeg);
    };
  }
  return newBranches;
};

const testHeatFunction = (vector: Vec) => {
  const c = new Vec(0, 0);
  const n = noise.noise2D(vector.x / 100, vector.y / 100) * 50;
  return 200 - c.dist(vector) + n;
};

export function* generate(heatFunc: HeatFunction = testHeatFunction) {
  const queue = new PriorityQueue<Segment>();
  const rootSegment = new Segment(
    new Vec(0, 0),
    new Vec(config.hwSegLength, 0).rotate(rnd() * TAU),
    0,
    { hw: true, creationReason: 'root' },
  );
  const oppositeSegment = segFactory.fromExisting(rootSegment);
  const newEnd = rootSegment.end.clone().rotate(Math.PI);
  oppositeSegment.updateEnd(newEnd);
  oppositeSegment.backwardsLinks.push(rootSegment);
  rootSegment.backwardsLinks.push(oppositeSegment);
  queue.put(rootSegment, rootSegment.time);
  queue.put(oppositeSegment, oppositeSegment.time);
  const segments: Segment[] = [];

  while (queue.length > 0 && segments.length < config.segLimit) {
    const rejected: Segment[] = [];
    const thisSeg = queue.get();
    if (!thisSeg) continue;
    const isAccepted = localConstraints(thisSeg, segments);
    if (isAccepted) {
      if (thisSeg.setupBranchLinks) thisSeg.setupBranchLinks();
      segments.push(thisSeg);
      if (!thisSeg.meta.severed) {
        for (const seg of getBranches(thisSeg, [], heatFunc)) {
          seg.time += thisSeg.time + 1;
          queue.put(seg, seg.time);
        }
      }
    }
    rejected.push(thisSeg);
    yield { segments, rejected };
  }
  return segments;
}
