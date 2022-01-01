import './style.css';
import * as h from '@rupertofly/h';

const tau = Math.PI * 2;
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
ctx.lineWidth = 12;
ctx.lineCap = 'round';
ctx.fillStyle = '#faf5f5';
ctx.fillRect(0, 0, 1920, 1920);
ctx.shadowColor = '#00000011';
ctx.shadowOffsetY = 2;
const { width: wid, height: hei } = canvas;
const gridSize = 24;
const offsetX = Math.floor(((200 - 20) % gridSize) / 2);
const offsetY = Math.floor(((200 - 20) % gridSize) / 2);
ctx.translate(wid / 2, hei / 4);
console.log(wid / 2, hei / 2);
const xCount = Math.floor(480 / gridSize);
const yCount = Math.floor(480 / gridSize);
ctx.strokeStyle = '#eaacb8';
ctx.shadowColor = '#00000011';
ctx.shadowOffsetY = 4;
const normSin = (t: number) => 0.5 + Math.sin(t) / 2;
const toRad = (deg: number) => deg * (tau / 360);
const iso = (pt: h.Vp, h = 0) => {
  const [px, py] = pt;
  const x = (px - py) * 2;
  const y = (px + py) * 1 - h;
  return [x, y] as [number, number];
};

for (let i = 0; i < xCount; i++) {
  const x = i * gridSize;
  const rnd = Math.random();

  if (rnd < 0.5) {
    for (let j = 0; j < yCount - 1; j++) {
      if (j % 2 === 1) {
        const y = j * gridSize;
        const y2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#eaacb8';
        ctx.shadowColor = '#00000011';
        ctx.shadowOffsetY = 4;
        h.drawLine([iso([x, y]), iso([x, y2])], ctx);
        ctx.stroke();
      } else {
        const y = j * gridSize;
        const y2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#7acbf588';
        ctx.shadowColor = '#00000000';
        ctx.shadowOffsetY = 2;
        h.drawLine([iso([x, y], -3), iso([x, y2], -3)], ctx);
        ctx.stroke();
      }
    }
  } else {
    for (let j = 0; j < yCount - 1; j++) {
      if ((j + 1) % 2 === 1) {
        const y = j * gridSize;
        const y2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#eaacb8';
        ctx.shadowColor = '#00000011';
        ctx.shadowOffsetY = 4;
        h.drawLine([iso([x, y]), iso([x, y2])], ctx);
        ctx.stroke();
      } else {
        const y = j * gridSize;
        const y2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#7acbf588';
        ctx.shadowColor = '#00000000';
        ctx.shadowOffsetY = 2;
        h.drawLine([iso([x, y], -3), iso([x, y2], -3)], ctx);
        ctx.stroke();
      }
    }
  }
}

for (let i = 0; i < yCount; i++) {
  const y = i * gridSize;
  const rnd = Math.random();

  if (rnd < normSin((i / yCount) * tau * 16)) {
    for (let j = 0; j < xCount - 1; j++) {
      if (j % 2 === 1) {
        const x = j * gridSize;
        const x2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#eaacb8';
        ctx.shadowColor = '#00000011';
        ctx.shadowOffsetY = 4;
        h.drawLine([iso([x, y]), iso([x2, y])], ctx);
        ctx.stroke();
      } else {
        const x = j * gridSize;
        const x2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#7acbf588';
        ctx.shadowColor = '#00000000';
        ctx.shadowOffsetY = 2;
        h.drawLine([iso([x, y], -3), iso([x2, y], -3)], ctx);
        ctx.stroke();
      }
    }
  } else {
    for (let j = 0; j < xCount - 1; j++) {
      if ((j + 1) % 2 === 1) {
        const x = j * gridSize;
        const x2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#eaacb8';
        ctx.shadowColor = '#00000011';
        ctx.shadowOffsetY = 2;
        h.drawLine([iso([x, y]), iso([x2, y])], ctx);
        ctx.stroke();
      } else {
        const x = j * gridSize;
        const x2 = (j + 1) * gridSize;
        ctx.beginPath();
        ctx.strokeStyle = '#7acbf588';
        ctx.shadowColor = '#00000000';
        ctx.shadowOffsetY = 2;
        h.drawLine([iso([x, y], -3), iso([x2, y], -3)], ctx);
        ctx.stroke();
      }
    }
  }
}
