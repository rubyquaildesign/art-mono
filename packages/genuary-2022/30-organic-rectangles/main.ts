import * as h from '@rupertofly/h/src/main';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import Capture from '@rupertofly/capture-client';

const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const {
  drawLoop,
  drawShape,
  bezierSpline,
  splineBuilder,
  Tween,
  anim,
  Vec: { lerp, r2d, d2r },
} = h;
const vec = (x: number, y: number) => new h.Vec(x, y);
// #region helpers

const client = new Capture(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 90,
  name: '30-organic-rectangles',
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
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.fillRect(0, 0, wid, hei);

// Uncomment for central
// ctx.translate(rad, rad);
