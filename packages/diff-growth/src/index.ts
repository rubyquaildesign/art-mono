import KDBush from 'kdbush';
import * as d3 from 'd3';
import { Vec, Vp } from '@rupertofly/h/src/vec';

enum InjectionMode {
  RANDOM,
  CURVATURE,
}

export class Node extends Vec {
  isFixed = false;
  velocity = 0;
  nextPos = new Vec([this.x, this.y]);
  minDist: number;
  repRad: number;
  constructor(x: number, y: number, private readonly settings: Settings) {
    super([x, y]);
    this.minDist = this.settings.minDist;
    this.repRad = this.settings.repRad;
  }

  addToNext(value: Vp) {
    this.nextPos.add(value);
  }

  limitNext(dist: number) {
    this.nextPos.limit(dist);
  }

  fix() {
    this.isFixed = true;
    return this;
  }

  iterate() {
    if (!this.isFixed) {
      const { x, y } = this.clone().add(
        this.nextPos.sub(this).setLength(this.settings.maxVelocity),
      );
      this.x = x;
      this.y = y;
    }

    this.nextPos = this.clone();
  }
}

export class Settings {
  maxVelocity = 0.4;
  minDist = 3;
  maxDist = 8;
  repRad = 16;
  attrForce = 0.7;
  alignForce = 0.01;
  injectInterval = 12;
  repulsionForce = 0.6;
  useBrownian = true;
  brownianRange = 0.1;
}

export class Path {
  isClosed = false;
  hasBounds = false;
  nodes: Node[];
  timeSinceInject = 0;
  injectionMode: InjectionMode = InjectionMode.CURVATURE;
  useBrownian: boolean;
  bounds: Vp[];
  rbfunc: () => number;
  constructor(nodes: Node[], private readonly settings: Settings) {
    this.nodes = nodes;
    this.useBrownian = settings.useBrownian;
    this.rbfunc = d3.randomUniform(
      -1 * this.settings.brownianRange,
      this.settings.brownianRange,
    );
  }

  iterate(tree: KDBush<Node>) {
    for (const [i, n] of this.nodes.entries()) {
      if (this.useBrownian) this.applyBmotion(i);
      this.applyAttr(i);
      this.applyRepulse(i, tree);
      this.applyAlign(i);
      this.applyBds(i);
      n.iterate();
    }

    this.splitEdges().prune();
    if (this.timeSinceInject >= this.settings.injectInterval) {
      this.injectCurve();
      this.timeSinceInject = 0;
    } else this.timeSinceInject++;
    return this;
  }

  applyBmotion(index: number) {
    this.nodes[index].add(new Vec(this.rbfunc(), this.rbfunc()));
  }

  applyAttr(index: number) {
    let distance: number;
    let leastMinDist: number;
    const n = this.nodes[index];
    const isFixed = this.nodes[index].isFixed;
    const { nextNode, prevNode } = this.getConnectedNodes(index);
    const force = new Vec(0, 0);
    if (nextNode && !isFixed) {
      distance = n.dist(nextNode);
      leastMinDist = Math.min(n.minDist, nextNode.minDist);
      if (distance > leastMinDist)
        force.add(prevNode.clone().sub(n).setLength(this.settings.attrForce));
    }

    if (prevNode && !isFixed) {
      distance = n.dist(prevNode);
      leastMinDist = Math.min(n.minDist, prevNode.minDist);
      if (distance > leastMinDist)
        force.add(nextNode.clone().sub(n).setLength(this.settings.attrForce));
    }

    n.nextPos.add(force);
    this.nodes[index] = n;
    return this;
  }

  applyRepulse(index: number, tree: KDBush<Node>) {
    const n = this.nodes[index];
    const nbs: Node[] = tree
      .within(n.x, n.y, this.settings.repRad)
      .map((i) => this.nodes[i]);
    const repAmt = new Vec([0, 0]);
    for (const node of nbs) {
      const length = node.dist(n);
      if (length < 0.0001) continue;
      const ds =
        (this.settings.repRad / node.dist(n)) * this.settings.repulsionForce;
      repAmt.add(n.clone().sub(node).setLength(ds));
    }

    n.nextPos.add(repAmt);
    this.nodes[index] = n;
    return this;
  }

  applyAlign(index: number) {
    const { prevNode, nextNode } = this.getConnectedNodes(index);
    const n = this.nodes[index];
    if (prevNode && nextNode && !n.isFixed) {
      const midPoint = this.getMidpointNode(prevNode, nextNode);
      n.nextPos.add(
        midPoint.sub(n.nextPos).setLength(this.settings.alignForce),
      );
    }

    this.nodes[index] = n;
    return this;
  }

  splitEdges() {
    for (const [i, n] of this.nodes.entries()) {
      const { prevNode } = this.getConnectedNodes(i);
      if (prevNode && n.dist(prevNode) >= this.settings.maxDist) {
        const mN = this.getMidpointNode(n, prevNode);
        if (i === 0) {
          this.nodes.splice(this.nodes.length, 0, mN);
        } else {
          this.nodes.splice(i, 0, mN);
        }
      }
    }

    return this;
  }

  prune() {
    for (const [i, n] of this.nodes.entries()) {
      const { prevNode } = this.getConnectedNodes(i);
      if (prevNode && n.dist(prevNode) < this.settings.minDist) {
        if (i === 0) {
          if (!this.nodes[this.nodes.length - 1].isFixed)
            this.nodes.splice(-1, 1);
        } else if (!this.nodes[i - 1].isFixed) this.nodes.splice(i - 1, 1);
      }
    }

    return this;
  }

  injectCurve() {
    const lastN = this.nodes.length - 1;
    for (const [i, n] of this.nodes.entries()) {
      const { prevNode: pn, nextNode: nn } = this.getConnectedNodes(i);
      if (!pn || !nn) continue;
      const a = nn.y - pn.y;
      const b = nn.x - pn.x;
      const ang = Math.abs(Math.atan(a / b));
      if (ang > 20) {
        const pmn = this.getMidpointNode(n, pn);
        const nmn = this.getMidpointNode(n, nn);

        if (i === 0) {
          this.nodes.splice(lastN, 0, pmn);
          this.nodes.splice(0, 0, nmn);
        } else this.nodes.splice(i, 1, pmn, nmn);
      }
    }

    return this;
  }

  applyBds(index: number) {
    if (
      this.bounds &&
      !d3.polygonContains(this.bounds as any, this.nodes[index] as any)
    ) {
      this.nodes[index].isFixed = true;
    }
  }

  getConnectedNodes(index: number) {
    let previousNode: Node;
    let nextNode: Node;
    const lastN = this.nodes.length - 1;

    if (index === 0 && this.isClosed) {
      previousNode = this.nodes[lastN];
    } else if (index >= 1) previousNode = this.nodes[index - 1];

    if (index === lastN && this.isClosed) nextNode = this.nodes[0];
    else if (index <= lastN) nextNode = this.nodes[index + 1];

    return { prevNode: previousNode, nextNode };
  }

  getMidpointNode(n1: Node, n2: Node, fix = false) {
    const node = new Node((n1.x + n2.x) / 2, (n1.y + n2.y) / 2, this.settings);
    node.isFixed = fix;
    return node;
  }

  addNode(node: Node) {
    this.nodes.push(node);
    return this;
  }

  toArray() {
    return this.nodes.slice();
  }
}

export class World {
  paths: Path[] = [];
  settings = new Settings();
  tree: KDBush<Node> = new KDBush([]);
  constructor(settings?: Settings) {
    if (settings) this.settings = settings;
    this.buildTree();
  }

  buildTree() {
    this.tree = new KDBush<Node>(
      this.paths
        .map((p) => p.nodes)
        .slice(0)
        .flat(),
      (n) => n.x,
      (n) => n.y,
    );

    return this;
  }

  iterate() {
    this.buildTree();
    if (this.paths.length > 0) {
      for (const path of this.paths) {
        path.iterate(this.tree);
      }
    }
  }

  addPath(path: Path) {
    this.paths.push(path);
  }
}
