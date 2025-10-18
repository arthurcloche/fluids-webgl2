#version 300 es

precision highp float;

uniform sampler2D pressure;
uniform sampler2D velocity;
uniform float alpha;
uniform float beta;
uniform float scale;
uniform vec2 px;
in vec2 uv;

out vec4 fragColor;

void main() {
  float x0 = texture(pressure, uv - vec2(px.x, 0)).r;
  float x1 = texture(pressure, uv + vec2(px.x, 0)).r;
  float y0 = texture(pressure, uv - vec2(0, px.y)).r;
  float y1 = texture(pressure, uv + vec2(0, px.y)).r;
  vec2 v = texture(velocity, uv).xy;
  fragColor = vec4((v - (vec2(x1, y1) - vec2(x0, y0)) * 0.5) * scale, 1.0, 1.0);
}
