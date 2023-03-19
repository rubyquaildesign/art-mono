#version 100

precision mediump float;

uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUV;

void main(void){
  float b = (sin(uTime/60.)/2.)+0.5;
  gl_FragColor = vec4(vUV,b,1.);
}