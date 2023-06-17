#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;

uniform projectionInfo {
  vec4 camDir;
  vec4 camRight;
  vec3 camUp;
  float sphereRotation;
};

uniform sampler2D Texture0;

in vec2 drawTexCoord;
in float drawID;

#define PI 3.1415926535

void main() {
  vec3 dir = camDir.xyz + camRight.xyz * drawTexCoord.x + camUp.xyz * drawTexCoord.y;

  float azimuth = sign(dir.z) * acos(dir.x / length(dir.xz)) + sphereRotation;
  float elevator = acos(dir.y / length(dir));

  outColorID = vec4(texture(Texture0, vec2((azimuth / PI + 1.0) / 2.0, elevator / PI)).xyz, drawID);
} /* main */

/* default_pbr.frag */