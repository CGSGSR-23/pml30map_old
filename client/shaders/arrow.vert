#version 300 es

precision highp float;

in vec3 inPosition;

uniform cameraBuffer
{
  mat4 transformWorld;
  mat4 transformViewProj;
  vec3 cameraLocation;
  float currentID;
};

out vec3 drawPosition;
out float drawID;

const vec2 positions[4] = vec2[4](
  vec2(1.5, -1),
  vec2(4.5,  0),
  vec2(2.5,  0),
  vec2(1.5,  1)
);

void main() {
  vec4 p = vec4(positions[gl_VertexID].x, 0, positions[gl_VertexID].y, 1);

  gl_Position = (transformViewProj * transformWorld) * p;
  drawPosition = (transformWorld * p).xyz;

  drawID = currentID;
} /* main */