import { Vec } from '../../h/index';
const p = [new Vec(0, -3), new Vec(1, 3)] as const;
const q = [new Vec(0, 0), new Vec(12, 1)] as const;
const r = p[1].clone().sub(p[0]);
const s = q[1].clone().sub(q[0]);
console.log(r, s);
console.log(r.cross(r));

const den = r.cross(s);

const t = q[0].clone().sub(p[0]).cross(s) / den;

const intersection = new Vec(p[0].x + t * r.x, p[0].y + t * r.y);

console.log(intersection);
