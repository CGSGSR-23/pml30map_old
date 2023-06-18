#version 300 es

precision highp float;

out vec2 drawTexCoord;
out float drawID;

uniform cameraBuffer
{
  mat4 transformWorld;
  mat4 transformViewProj;
  vec3 cameraLocation;
  float currentID;
};

const vec2 texCoords[4] = vec2[4](
  vec2(1, 0),
  vec2(1, 1),
  vec2(0, 0),
  vec2(0, 1)
);

void main() {
  drawTexCoord = texCoords[gl_VertexID] * 2.0 - vec2(1.0);
  drawID = currentID;
  gl_Position = vec4(drawTexCoord, 1.0, 1.0);
} /* main */