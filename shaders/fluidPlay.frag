#version 300 es

precision highp float;

uniform sampler2D velocity;
uniform sampler2D pressure;
uniform sampler2D textTexture;
uniform vec2 px;
uniform float time;

in vec2 uv;
out vec4 fragColor;

// Get normals from pressure gradient stored in the simulation
// The pressure gradient gives us surface direction information
vec3 getNormals(vec2 coord) {
    // Sample pressure in a cross pattern to compute gradient
    float pL = texture(pressure, coord - vec2(px.x, 0.0)).r;
    float pR = texture(pressure, coord + vec2(px.x, 0.0)).r;
    float pT = texture(pressure, coord + vec2(0.0, px.y)).r;
    float pB = texture(pressure, coord - vec2(0.0, px.y)).r;

    // Compute gradient (rate of change in x and y)
    vec2 gradient = vec2(pR - pL, pT - pB) * 0.5;

    // Convert to normal vector
    // z component is computed to maintain unit length
    float z = sqrt(max(0.0, 1.0 - dot(gradient, gradient)));

    return normalize(vec3(gradient, z));
}


vec3 irri(float x){
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.);
  vec3 d = vec3(0.,0.334,0.667);
  
  return a + b * cos( 6.28318 * ( c * x + d ));

}

void main() {
    vec4 vel = texture(velocity, uv);
    vec4 pres = texture(pressure, uv);
    vec3 normal = getNormals(uv);

    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    float diffuse = max(0.0, dot(normal, lightDir));
    float ambient = 0.3;
    float lighting = ambient + diffuse * 0.7;

    vec2 offset = ((vel.xy)) * 0.125;
    vec4 textColor = texture(textTexture, uv - offset);
    vec3 litColor = textColor.rgb * lighting;

    float velocityMag = length(vel.xy);
    vec3 velocityColor = irri(pres.r);//vec3(0.2, 0.5, 0.8) * velocityMag * 0.5;
    vec3 finalColor = mix(litColor, velocityColor, velocityMag * 0.3);

    fragColor = vec4(finalColor, 1.0);
}
