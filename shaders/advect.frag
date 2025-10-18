#version 300 es

precision highp float;

uniform sampler2D source;
uniform sampler2D velocity;
uniform float dt;
uniform float scale;
uniform vec2 px1;
in vec2 uv;

out vec4 fragColor;

void main() {
  fragColor = texture(source, uv - texture(velocity, uv).xy * dt * px1) * scale;
}
