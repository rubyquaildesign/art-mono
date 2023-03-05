import Capture from '@rupertofly/capture-client';
import './src/lib';
// #region helpers

let client: Capture | undefined;
const doRecord: boolean = false;
if (doRecord) {
	client = new Capture(6969, canvas);
	client.start({
		frameRate: 30,
		lengthIsFrames: true,
		maxLength: 90,
		name: '{{cookiecutter.pack_name}}',
	});
}

// #endregion helpers
ctx.fillStyle = c.white;
ctx.strokeStyle = c.black;
ctx.fillRect(0, 0, width, height);

// Uncomment for central
// ctx.translate(rad, rad);
let play = true;
let frameCount = 0;
async function player() {
	render();
	frameCount++;
	if (doRecord && client) {
		await client.capture();
	}
	if (play) {
		window.requestAnimationFrame(player);
	}
}
function render() {}
log b2