#version 100

precision mediump float;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

#pragma glslify: aastep = require('glsl-aastep') 

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uSource;
uniform float uThreshold;
uniform vec4 uPosColour;
uniform vec4 uNegColour;

varying vec2 vUV;

void main(void){
  float test = texture2D(uSource,vUV).r;
  float value = aastep(uThreshold,test);
  gl_FragColor = mix(uNegColour,uPosColour,value);
}