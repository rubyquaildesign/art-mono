import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';

const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;

// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 30 * 12,
  name: '06-trade-styles',
});

const rad = wid / 2;
const pi = Math.PI;
const tau = Math.PI * 2;
const {
  random: rnd,
  floor: flr,
  ceil,
  abs,
  atan2,
  sin,
  cos,
  tan,
  min,
  max,
  sqrt,
} = Math;
// #endregion helpers
ctx.fillStyle = c.black;
ctx.strokeStyle = c.green;
// ctx.shadowColor = c.black + 'f1';
// ctx.shadowBlur = 16;
ctx.fillRect(0, 0, wid, hei);
ctx.lineWidth = 4;
// Uncomment for central
// ctx.translate(rad, rad);

function rotX(a: number) {
  ctx.transform(1, 0, 0, cos(a), 0, -sin(a));
}

function rotY(a: number) {
  ctx.transform(cos(a), 0, 0, 1, sin(a), 0);
}

function rotZ(a: number) {
  ctx.transform(cos(a), sin(a), -sin(a), cos(a), 0, 0);
}
const spp = d3.randomUniform(-0.1, 0.1);
class Loop {
  r: number;
  az = 0;
  ax = 0;
  ay = 0;
  vz = 0;
  vx = 0;
  vy = 0;
  amps = d3.range(12).fill(1);
  freq = 0;
  time = 0;
  constructor(i: number) {
    this.r = i * 16;
    this.vx = spp();
    this.vy = spp();
    this.vz = spp();
    this.freq = flr(rnd() * 6);
  }

  draw() {
    ctx.save();
    rotZ(this.az);
    rotX(this.ax);
    rotY(this.ay);
    ctx.beginPath();
    const resolution = flr(this.r * pi);
    const points = d3.range(12).map((a, i) => {
      const angle = (i / 12) * tau;
      return [
        cos(angle * (0.01 * (this.time * (1 + this.freq / 10)))) * this.r,
        sin(angle) * this.r,
      ] as h.Vp;
    });
    const toDraw = [...h.spline(points, 3, true, resolution)];
    h.drawLoop(toDraw, true, ctx);
    ctx.stroke();
    ctx.restore();
  }

  update() {
    this.ax += this.vx;
    this.ay += this.vy;
    this.az += this.vz;

    this.ax = (tau + this.ax) % tau;
    this.ay = (tau + this.ay) % tau;
    this.az = (tau + this.az) % tau;
    this.time++;
  }
}
const circles: Loop[] = [];

for (const i of d3.range(25)) {
  circles.push(new Loop(i));
}

async function render() {
  ctx.fillRect(0, 0, wid, hei);
  ctx.save();
  ctx.translate(rad, rad);
  for (const crcl of circles) {
    crcl.update();
    crcl.draw();
  }
  ctx.restore();
  await client.capture();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
