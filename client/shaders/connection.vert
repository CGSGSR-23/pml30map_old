#version 300 es

precision highp float;

in vec3 inPosition;

uniform cameraBuffer {
  mat4 transformWorld;
  mat4 transformViewProj;
  vec3 cameraLocation;
  float currentID;
};

uniform positionBuffer {
  vec4 linePositions[2];
  vec2 right;
};

out vec3 drawPosition;
out float drawID;

const vec2 coords[4] = vec2[4](
  vec2(0, 0),
  vec2(0, 1),
  vec2(1, 0),
  vec2(1, 1)
);

void main() {
  gl_Position = (transformViewProj * transformWorld) * vec4(inPosition, 1);
  drawPosition = (transformWorld * vec4(inPosition, 1)).xyz;

  drawID = currentID;
}