#version 100

precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uParticleSize;

varying vec2 vUV;

void main(void){
    float r = distance(gl_PointCoord,vec2(0.5,0.5));
    if (r <= 0.5){

    gl_FragColor = vec4(1.,1.,1.,1.);
    } else {
    discard;
    }
  
}