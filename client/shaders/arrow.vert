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
out float drawDistCoef;
out float drawID;

const vec2 positions[4] = vec2[4](
  vec2(1,  0),
  vec2(0,  1.5),
  vec2(5,  0),
  vec2(0, -1.5)
);

const float distCoefs[4] = float[4](1.0, 0.0, 0.0, 0.0);

void main() {
  vec4 p = vec4(positions[gl_VertexID].x + 3.0, -16.0, positions[gl_VertexID].y, 1);

  gl_Position = (transformViewProj * transformWorld) * p;
  drawPosition = (transformWorld * p).xyz;
  drawDistCoef = distCoefs[gl_VertexID];

  drawID = currentID;
} /* main */