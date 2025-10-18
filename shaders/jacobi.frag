#version 300 es

precision highp float;

uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float alpha;
uniform float beta;
uniform vec2 px;
in vec2 uv;

out vec4 fragColor;

void main() {
  float x0 = texture(pressure, uv - vec2(px.x, 0)).r;
  float x1 = texture(pressure, uv + vec2(px.x, 0)).r;
  float y0 = texture(pressure, uv - vec2(0, px.y)).r;
  float y1 = texture(pressure, uv + vec2(0, px.y)).r;
  float d = texture(divergence, uv).r;
  float relaxed = (x0 + x1 + y0 + y1 + alpha * d) * beta;
  fragColor = vec4(relaxed);
}
