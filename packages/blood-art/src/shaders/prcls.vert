#version 100

precision mediump float;

attribute vec2 aPosition;

uniform vec2 uResolution;
uniform float uTime;
uniform float uRatio;
uniform float uParticleSize;

varying vec2 vUV;

void main(void) {
  // Convert aPosition into ResolutionScale
  float resX = aPosition.x * uRatio;
  float resY = aPosition.y * uRatio;
  vUV = vec2(resX, resY) / uResolution;

  // Convert resScale to Clip
  float clipX = -1. + (vUV.x * 2.);
  float clipY = -1. + ((1. - vUV.y)*2.);

  gl_PointSize = uParticleSize*1.;
  gl_Position = vec4(clipX,clipY,1.,1.);
}