#version 300 es

precision highp float;

uniform sampler2D velocity;
uniform float dt;
uniform float scale;
in vec2 uv;

out vec4 fragColor;

vec2 velocityAt(vec2 coord) {
  return texture(velocity, coord - texture(velocity, coord).xy * dt).xy;
}

void main() {
  fragColor = vec4(scale * velocityAt(uv), 1.0, 1.0);
}
