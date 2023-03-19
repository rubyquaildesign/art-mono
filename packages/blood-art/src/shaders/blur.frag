#version 100

precision mediump float;

#pragma glslify: blur = require('glsl-fast-gaussian-blur/13') 

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uSource;
uniform vec2 uDir;

varying vec2 vUV;

void main(void){
  vec4 bl = blur(uSource, vec2(vUV.x,vUV.y),uResolution,uDir);
  gl_FragColor = bl;
}