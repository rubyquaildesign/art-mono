import Quadtree from '@timohausmann/quadtree-js';
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

const debug = true;

type SegLimit = {
  x: number;
  y: number;
  width: number;
  height: number;
  segment: Segment;
};
function localConstraints(
  seg: Segment,
  segList: Segment[],
  qTree: Quadtree,
  debugData: any = {},
) {
  const action: {
    priority: number;
    function?: () => boolean;
    meta: { t?: number };
  } = {
    priority: 0,
    function: undefined,
    meta: {},
  };
  const quadTreeMatches = qTree.retrieve<SegLimit>(seg.road.limit);
  const segmentMatches = quadTreeMatches.map((l) => l.segment);

  for (const otherSegment of segmentMatches) {
    if (action.priority <= 4) {
      const isIntersecting = seg.road.intersects(otherSegment.road);
      if (isIntersecting && seg.road.intersectionPoint(otherSegment.road)) {
        const intPoint = seg.road.intersectionPoint(otherSegment.road);
        if (
          intPoint &&
          (!action.meta?.t || intPoint.tAlongRoad < action.meta.t)
        ) {
          action.meta.t = intPoint.tAlongRoad;
          action.priority = 4;
          action.function = () => {
            if (angDiff(otherSegment.dir, seg.dir) < Math.PI / 6) return false;
            otherSegment.split(intPoint.point, seg, segList, qTree);
            seg.road.end = intPoint.point;
            seg.metaInfo.severed = true;

            return true;
          };
        }
      }
    }
    if (
      action.priority <= 3 &&
      seg.road.end.dist(otherSegment.road.end) <= config.snapDist
    ) {
      const point = otherSegment.road.end;
      action.priority = 3;
      action.function = () => {
        seg.road.end = point;
        seg.metaInfo.severed = true;
        if (seg.metaInfo.hw) return false;
        const links = otherSegment.startIsBackwards
          ? otherSegment.links.forwards
          : otherSegment.links.backwards;
        if (
          links.some((l) => {
            const { start: ls, end: le } = l.road;
            const { start: ss, end: se } = seg.road;
            return (
              (vecDiff(ls, se) && vecDiff(le, ss)) ||
              (vecDiff(ls, ss) && vecDiff(le, se))
            );
          })
        ) {
          seg.metaInfo.endReason = 'reason 3';
          return false;
        }
        for (const link of links) {
          link.linksForEndContaining(otherSegment)?.push(seg);
          seg.links.forwards.push(link);
        }
        links.push(seg);
        seg.links.forwards.push(otherSegment);
        return true;
      };
    }
    if (action.priority <= 2) {
      const { distAlongLine, distToPoint, lineLength, pointOnLine } =
        distToLine(
          seg.road.end,
          otherSegment.road.start,
          otherSegment.road.end,
        );
      if (
        distToPoint < config.snapDist &&
        distToPoint > ep &&
        distAlongLine >= 0 &&
        distAlongLine <= lineLength
      ) {
        const pt = pointOnLine;
        action.priority = 2;
        action.function = () => {
          if (
            angDiff(otherSegment.dir, seg.dir) < Math.PI / 6 &&
            !seg.metaInfo.hw
          ) {
            seg.road.end = pt;
            seg.metaInfo.severed = true;
            seg.metaInfo.endReason = 'reason 2';
            return false;
          }
          seg.road.end = pt;
          seg.metaInfo.severed = true;
          seg.metaInfo.endReason = 'split due to intersection';
          otherSegment.split(pt, seg, segList, qTree);
          return true;
        };
      }
    }
  }
  if (action.function) {
    return action.function();
  }
  return true;
}

export type HeatFunction = (x: number, y: number) => number;

function globalGoalGenerate(previousSegment: Segment, heatFunc: HeatFunction) {
  const newBranches: Segment[] = [];
  if (!previousSegment.metaInfo.severed) {
    const template = (direction: number, length: number, t: number, q?: Meta) =>
      segFactory.usingDirection(
        previousSegment.road.end,
        t,
        q,
        direction,
        length,
      );

    const templateContinue = (dir: number) =>
      template(dir, previousSegment.length, 0, previousSegment.metaInfo);
    const templateBranch = (dir: number, q?: Meta) =>
      template(
        dir,
        config.segLength,
        previousSegment.metaInfo.hw ? config.hwBranchDelay : 0,
        {},
      );

    const continueStraight = templateContinue(previousSegment.dir);
    const straightPop = continueStraight.road.getHeat(heatFunc);

    if (previousSegment.metaInfo.hw) {
      const randStraight = templateContinue(
        previousSegment.dir + createAngleRand(config.forwardAngDev)(),
      );
      const randomPop = randStraight.road.getHeat(heatFunc);
      let roadPop = 0;

      if (randomPop > straightPop) {
        randStraight.metaInfo.creationReason = 'randomlyForward';
        newBranches.push(randStraight);
        roadPop = randomPop;
      } else {
        continueStraight.metaInfo.creationReason = 'continuingForward';
        newBranches.push(continueStraight);
        roadPop = straightPop;
      }

      if (roadPop > config.branchPopThreshold) {
        if (Math.random() < config.hwBranchProb) {
          const left = templateBranch(
            previousSegment.dir -
              Math.PI / 2 +
              createAngleRand(config.branchAngDev)(),
          );
          left.metaInfo.creationReason = 'branching Left';
          newBranches.push(left);
        }
        if (Math.random() < config.branchProb) {
          const right = templateBranch(
            previousSegment.dir +
              Math.PI / 2 +
              createAngleRand(config.branchAngDev)(),
          );
          right.metaInfo.creationReason = 'branching Right';
          newBranches.push(right);
        }
      }
    } else if (straightPop > config.branchPopThreshold) {
      continueStraight.metaInfo.creationReason = 'continuingStraight not HW';
      newBranches.push(continueStraight);
    }

    if (straightPop > config.branchPopThreshold) {
      if (Math.random() < config.branchProb) {
        const left = templateBranch(
          previousSegment.dir -
            Math.PI / 2 +
            createAngleRand(config.branchAngDev)(),
        );
        left.metaInfo.creationReason = 'branching Left not HW';
        newBranches.push(left);
      }
      if (Math.random() < config.branchProb) {
        const right = templateBranch(
          previousSegment.dir +
            Math.PI / 2 +
            createAngleRand(config.branchAngDev)(),
        );
        right.metaInfo.creationReason = 'branching Right not HW';
        newBranches.push(right);
      }
    }
  }
  if (newBranches.length === 0) previousSegment.metaInfo.ending = true;
  for (const branch of newBranches) {
    branch.setupBranchLinks = () => {
      for (const link of previousSegment.links.forwards) {
        branch.links.backwards.push(link);
        link.linksForEndContaining(previousSegment)!.push(branch);
      }
      previousSegment.links.forwards.push(branch);
      branch.links.backwards.push(previousSegment);
    };
  }
  return newBranches;
}
const testHeatFunction = (x: number, y: number) => {
  const c = new Vec(0, 0);
  const t = new Vec(x, y);
  return 500 - c.dist(t);
};

export function* generate(heatFunc: HeatFunction = testHeatFunction) {
  const queue = new PriorityQueue<Segment>();
  const rootSeg = new Segment(
    new Vec(-300, -100),
    new Vec(-300 + config.segLength, -100 + config.segLength),
    0,
    { hw: true },
  );
  const opposite = segFactory.fromExisting(rootSeg);
  opposite.road.end = new Vec(
    -300 + -1 * config.segLength,
    -100 + -1 * config.segLength,
  );
  opposite.links.backwards.push(rootSeg);
  rootSeg.links.backwards.push(opposite);
  queue.put(rootSeg, rootSeg.timeDelay);
  queue.put(opposite, opposite.timeDelay);
  const segments: Segment[] = [];
  const qtree = new Quadtree(
    { x: -600, y: -600, width: 1200, height: 1200 },
    12,
    12,
  );
  let ids = 0;
  while (queue.length > 0 && segments.length < config.segLimit) {
    const seg = queue.get()!;

    const accepted = localConstraints(seg, segments, qtree);
    if (accepted) {
      if (seg.setupBranchLinks) seg.setupBranchLinks();
      addSegment(seg, segments, qtree);
      seg.id = ids;
      ids++;
      const newSegments = globalGoalGenerate(seg, heatFunc);
      for (const newSeg of newSegments) {
        newSeg.timeDelay +=
          seg.metaInfo.hw && !newSeg.metaInfo.hw
            ? seg.timeDelay + 5
            : seg.timeDelay + 1;
        queue.put(newSeg, newSeg.timeDelay);
      }
    }
    const rejects: Segment[] = [];
    if (!accepted) {
      rejects.push(seg);
    }
    yield { segments, rejects };
  }

  return { segments, qtree, heatmap: heatFunc, cfg: config };
}
