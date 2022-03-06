import * as h from '@rupertofly/h';
import * as d3 from 'd3';
import * as ns from 'open-simplex-noise';
import * as c from 'colours';
import cap from '@rupertofly/capture-client';
import * as TG from 'town-gen';
const [wid, hei] = [1080, 1080];
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;

// #region helpers
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
ctx.translate(rad, rad);
console.log(d3);

const noiseSource = ns.makeNoise2D(12);
const noise = noiseSource;
const client = new cap(6969, canvas);
client.start({
  frameRate: 30,
  lengthIsFrames: true,
  maxLength: 90,
  name: '01-10000',
});
function splodgeShape(
  radius: number,
  dispSize: number,
  noiseScale = 1,
  resolution?: number,
) {
  const res = resolution ? resolution : ceil(radius * tau);
  const nsPos = new h.Vec(rnd() * 256, rnd() * 256);
  const points = d3.range(res).map((i) => {
    const ang = (i / res) * tau;
    const displacement = noise(
      nsPos.x + cos(ang) * noiseScale,
      nsPos.y + sin(ang) * noiseScale,
    );
    const r = radius + displacement * dispSize;
    return new h.Vec(r * cos(ang), r * sin(ang));
  });
  return points;
}
function drawSplodge(x: number, y: number, r: number, c: string) {
  const splodge = splodgeShape(r, r / 4, 3, 300).map((s) =>
    s.add(new h.Vec(x, y)),
  );
  ctx.beginPath();
  ctx.fillStyle = c;
  h.drawLoop(splodge, true, ctx);
  ctx.fill();
}
const toneMap = d3
  .scaleLinear([c.red, c.orange, c.blue])
  .domain([-400, 0, 400])
  .interpolate(d3.interpolateLab);
const perFrame = ceil(10_000 / 90);
function* renderDrawing() {
  for (let t = 0; t < 10_000; t++) {
    const r = sqrt(rnd()) * 400;
    const a = rnd() * tau;
    const x = cos(a) * r;
    const y = sin(a) * r;
    const col = d3.rgb(toneMap(y));
    drawSplodge(x, y, 10, col.formatHex() + '19');
    if (t % perFrame === 0) yield;
  }
}

const draw = renderDrawing();
async function render(): Promise<void> {
  draw.next();
  await client.capture();
  window.requestAnimationFrame(render);
}

void render();
