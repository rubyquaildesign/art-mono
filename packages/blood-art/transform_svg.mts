/* eslint-disable no-undef */
import { $ } from 'zx';
import 'zx/globals'; // eslint-disable-line n/file-extension-in-import

import { JSDOM } from 'jsdom';

const svgString = await fs.readFile('./source_items.svg', {
	encoding: 'utf8',
});
const DOM = new JSDOM(svgString, { contentType: 'text/xml' });
const collisionPaths = DOM.window.document.querySelectorAll<SVGPathElement>('#Collisions path');

let collisions: Record<string, [number, number][]> = {};  // eslint-disable-line 

for (let path of collisionPaths) {
  const name = path.id;
  const pathPoints= path.getAttribute('d')?.replace('M','').split('L').map(pstr => pstr.split(',').map(nstr => parseFloat(nstr))) as [number,number][] ;
  collisions[name] = pathPoints;
}
console.log(collisions);
await fs.writeJson('./src/collision_points.json',collisions,{spaces:'\t'})