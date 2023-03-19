#version 100

precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uFlip;
uniform sampler2D uSource;

varying vec2 vUV;

void main(void){
  vec2 uv = uFlip > 0. ? vec2(vUV.x,1. - vUV.y) : vUV;
  vec4 texColor = texture2D(uSource,uv);
  gl_FragColor = texColor;
}