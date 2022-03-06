import { min as d3min, max as d3max, maxIndex } from 'd3';
import { Vec, Vp } from '../../h/index';
type complexVp = Vp[] | Vec[];

const vec = (x: number, y: number) => new Vec(x, y);
function isVecArray(a: complexVp): a is Vec[] {
  return a.every((v) => v instanceof Vec);
}
function shapeProject(shape: Vec[], axis: Vec) {
  const vc = axis.clone().norm();
  const dp = shape.map((p) => p.dot(vc));
  return [d3min(dp)!, d3max(dp)!] as [min: number, max: number];
}
export function collide(a: complexVp, b: complexVp) {
  a = isVecArray(a) ? a : a.map((v) => vec(v[0], v[1]));

  b = isVecArray(b) ? b : b.map((v) => vec(v[0], v[1]));

  const axis: Vec[] = [];
  for (let i = 0; i < a.length; i++) {
    const j = a[i] as Vec;
    const k = a[(i + 1) % a.length] as Vec;
    const n = j.clone().sub(k).perp();
    axis.push(n);
  }
  for (let i = 0; i < b.length; i++) {
    const j = b[i] as Vec;
    const k = b[(i + 1) % b.length] as Vec;
    const n = j.clone().sub(k).perp();
    axis.push(n);
  }
  const collide = axis.some((vector) => {
    const [amin, amax] = shapeProject(a as Vec[], vector);
    const [bmin, bmax] = shapeProject(b as Vec[], vector);
    return Math.max(amin, bmin) <= Math.min(amax, bmax);
  });

  return collide;
}
