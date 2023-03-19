#version 100

precision mediump float;

attribute vec2 aPosition;

uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUV;

void main(void) {
  float x = (2. * aPosition.x) - 1.;
  float y = (2. * (1. - aPosition.y)) - 1.;
	vUV = vec2(aPosition);
	gl_Position = vec4(x,y,0.,1.);

}