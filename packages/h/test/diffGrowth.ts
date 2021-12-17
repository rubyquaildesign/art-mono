import { PI, rndm, Vec, Vp } from '../src/main';
import { polygonContains } from 'd3-polygon';
import { quadtree, Quadtree, QuadtreeLeaf } from 'd3-quadtree';
function limitPure(vec: Vec, scaler: number): Vec {
  if (vec.magnitude() > scaler) {
    return vec.clone().norm().mulScaler(scaler);
  } else return vec.clone();
}
const MAX_FORCE = 1;
const MAX_SPEED = 1.5;
const DESIRED_SEPARATION = 24;
const COHESION_RATIO = 1.01;
const MAX_EDGE_LEN = 16;
const DES_SEP_SQ = Math.pow(DESIRED_SEPARATION, 2);
function search(
  quadtree: Quadtree<Node>,
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
) {
  const results: Node[] = [];
  quadtree.visit((node, x1, y1, x2, y2) => {
    if (!node.length) {
      let d = (node as QuadtreeLeaf<Node>).data;
      let x = d.position.x;
      let y = d.position.y;
      if (x >= xmin && x < xmax && y >= ymin && y < ymax) {
        results.push(d);
      }
    }
    return x1 >= xmax || y1 >= ymax || x2 < xmin || y2 < ymin;
  });
  return results;
}
export class Node {
  position: Vec;
  velocity: Vec;
  acceleration: Vec;
  constructor(x: number, y: number) {
    this.acceleration = new Vec([0, 0]);
    this.velocity = new Vec([0, 1]).rotate(Math.random() * 2 * PI);
    this.position = Vec.fromObject({ x, y });
  }
  update(clip?: Vp[]) {
    this.velocity.add(this.acceleration);
    if (this.velocity.magnitude() > MAX_SPEED) {
      this.velocity.norm().mulScaler(MAX_SPEED);
    }
    let np = this.position.clone().add(this.velocity);
    if (clip) {
      if (polygonContains(clip as [number, number][], [np.x, np.y]))
        this.position.add(this.velocity);
      else {
        this.velocity.mulScaler(0.5).rotate(Math.PI);
      }
    } else {
      this.position.add(this.velocity);
    }
    this.acceleration.mulScaler(0);
    return this;
  }
  sepparate(nodes: Array<Node>): Vec {
    const steer = new Vec([0, 0]);
    let count = 0;
    for (let other of nodes) {
      let dist = this.position.distSq(other.position);
      if (dist > 0 && dist < DES_SEP_SQ) {
        let diff = this.position
          .clone()
          .sub(other.position)
          .norm()
          .divScaler(Math.sqrt(dist));
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) {
      steer.divScaler(count);
    }
    if (steer.len() > 0) {
      steer.setLength(MAX_SPEED).sub(this.velocity);
      if (steer.len() > MAX_FORCE) {
        steer.setLength(MAX_FORCE);
      }
    }
    return steer;
  }
  seek(target: Vec): Vec {
    let desired = target.clone().sub(this.position);
    if (desired.magnitude() > MAX_SPEED) desired.norm().mulScaler(MAX_SPEED);
    let steer = desired.clone().sub(this.velocity);
    steer = limitPure(steer, MAX_FORCE);
    return steer;
  }
  applyForce(force: Vp) {
    this.acceleration.add(force);
    return this;
  }
  edgeCohesion(nodes: Array<Node>): Vec {
    let sum = new Vec([0, 0]);
    const lastIndex = nodes.length - 1;
    const thisIndex = nodes.indexOf(this);
    if (thisIndex === -1) return new Vec([0, 0]);
    // begin the weird
    if (thisIndex !== 0 && thisIndex !== lastIndex) {
      sum.add(nodes[thisIndex - 1].position).add(nodes[thisIndex + 1].position);
    } else if (thisIndex === 0) {
      sum.add(nodes[lastIndex].position).add(nodes[thisIndex + 1].position);
    } else if (thisIndex === lastIndex) {
      sum.add(nodes[thisIndex - 1].position).add(nodes[0].position);
    }
    sum.divScaler(2);
    return this.seek(sum);
  }
  differentiate(nodes: Array<Node>, seppNodes: Array<Node>) {
    let sepperation = this.sepparate(seppNodes);
    let cohesion = this.edgeCohesion(nodes);
    sepperation.mulScaler(COHESION_RATIO);
    this.applyForce(sepperation);
    this.applyForce(cohesion);
    return this;
  }
  run(nodes: Array<Node>, seppList: Array<Node>, clip?: Vp[]) {
    this.differentiate(nodes, seppList);

    this.update(clip);
    return this;
  }
}
export class DifferentialLine extends Array<Node> {
  quadtree: Quadtree<Node>;
  clip: Vp[];
  constructor(clip?: Vp[]) {
    super();
    if (clip) this.clip = clip;
    this.quadtree = quadtree<Node>()
      .x((n) => n.position.x)
      .y((n) => n.position.y);
  }
  run() {
    for (let node of this) {
      let nodes = search(
        this.quadtree,
        node.position.x + -10 * DESIRED_SEPARATION,
        node.position.y + -10 * DESIRED_SEPARATION,
        node.position.x + 10 * DESIRED_SEPARATION,
        node.position.y + 10 * DESIRED_SEPARATION,
      );
      node.run(this, nodes || [], this.clip);
    }
    // this.refreshQuadTree();
    this.growth();
  }
  add(node: Node) {
    this.push(node);
    this.quadtree.add(node);
    return this;
  }
  addAt(node: Node, index: number) {
    this.splice(index, 0, node);
    this.quadtree.add(node);
    return this;
  }
  differentiate() {
    let seppForces = this.getSeppForces();
    let cohesForces = this.edgeCohesion();
    for (let i = 0; i < this.length; i++) {
      let sepp = seppForces[i];
      let cohes = cohesForces[i];
      sepp.mulScaler(COHESION_RATIO);
      let n = this[i];
      n.applyForce(sepp);
      n.applyForce(cohes);
      n.update();
    }
  }
  getSepperationForce(n1: Node, n2: Node) {
    let p1 = n1.position;
    let p2 = n2.position;
    let steer = new Vec([0, 0]);
    let sqd = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
    if (sqd > 0 && sqd < DES_SEP_SQ) {
      let diff = p1.clone().sub(p2);
      diff.norm().divScaler(Math.sqrt(sqd));
      steer.add(diff);
    }
    return steer;
  }
  getSeppForces(): Vec[] {
    let n = this.length;
    let seppForces: Vec[] = [];
    let nearNodes = [] as number[];
    for (let i = 0; i < n; i++) {
      seppForces[i] = new Vec([0, 0]);
      nearNodes[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      let thisNode = this[i];
      for (let j = i + 1; j < n; j++) {
        let nextNode = this[j];
        let forceIJ = this.getSepperationForce(thisNode, nextNode);
        if (forceIJ.magnitude() > 0) {
          seppForces[i].add(forceIJ);
          seppForces[j].add(forceIJ);
          nearNodes[i]++;
          nearNodes[j]++;
        }
      }
      if (nearNodes[i] > 0) {
        seppForces[i].divScaler(nearNodes[i]);
      }
      if (seppForces[i].magnitude() > 0) {
        seppForces[i].norm().mulScaler(MAX_SPEED);
        seppForces[i].sub(this[i].velocity);
        seppForces[i] = limitPure(seppForces[i], MAX_SPEED);
      }
    }
    return seppForces;
  }
  edgeCohesion(): Vec[] {
    let cohesionForces: Vec[] = [];
    for (let i = 0; i < this.length; i++) {
      const sum = new Vec([0, 0]);
      const lastIndex = this.length - 1;
      const thisIndex = i;
      // begin the weird
      if (thisIndex !== 0 && thisIndex !== lastIndex) {
        sum.add(this[thisIndex - 1].position).add(this[thisIndex + 1].position);
      } else if (thisIndex === 0) {
        sum.add(this[lastIndex].position).add(this[thisIndex + 1].position);
      } else if (thisIndex === lastIndex) {
        sum.add(this[thisIndex - 1].position).add(this[0].position);
      }
      sum.divScaler(2);
      cohesionForces[i] = this[thisIndex].seek(sum);
    }
    return cohesionForces;
  }
  refreshQuadTree() {
    this.quadtree = quadtree<Node>()
      .x((n) => n.position.x)
      .y((n) => n.position.y)
      .addAll(this);

    return this;
  }
  growth() {
    for (let i = 0; i < this.length - 1; i++) {
      let thisNode = this[i];
      let nextNode = this[i + 1];
      let dist = thisNode.position.dist(nextNode.position);
      if (dist > MAX_EDGE_LEN) {
        let index = i + 1;
        let midNode = thisNode.position
          .clone()
          .add(nextNode.position)
          .divScaler(2);
        this.addAt(new Node(midNode.x, midNode.y), index);
      }
    }
  }
  positions() {
    return this.map((node) => node.position);
  }
}
