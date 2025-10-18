#version 300 es

precision highp float;

uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
in vec2 uv;

out vec4 fragColor;

void main() {
  float distance_ = 1.0 - min(length((uv - center) / scale), 1.0);
  fragColor = vec4(force * distance_, 0.0, 1.0);
}
