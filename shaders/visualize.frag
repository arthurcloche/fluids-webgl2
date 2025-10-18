#version 300 es

precision highp float;

uniform sampler2D velocity;
uniform sampler2D pressure;
uniform float velocity_scale;
uniform float velocity_offset;
uniform float show_pressure;
uniform float show_velocity;
in vec2 uv;

out vec4 fragColor;

void main() {
  vec3 color = vec3(0.0);
  
  if (show_pressure > 0.5) {
    color.r = texture(pressure, uv).x;
  }
  
  if (show_velocity > 0.5) {
    color.gb = (texture(velocity, uv) * velocity_scale + velocity_offset).xy;
  }
  
  fragColor = vec4(color, 1.0);
}
