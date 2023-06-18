#version 300 es

precision highp float;

uniform cameraBuffer
{
  mat4 transformWorld;
  mat4 transformViewProj;
  vec3 cameraLocation;
  float currentID;
};

out vec3 drawPosition;
out vec2 drawTexCoord;
out float drawID;


uniform bannerBuffer {
  vec4 cameraUp;
  vec4 cameraRight;
  vec4 bannerLocationHeight;
};

const vec2 positions[4] = vec2[4](
  vec2( 1, -1),
  vec2( 1,  1),
  vec2(-1, -1),
  vec2(-1,  1)
);

const vec2 texCoords[4] = vec2[4](
  vec2(1, 1),
  vec2(1, 0),
  vec2(0, 1),
  vec2(0, 0)
);

void main() {
  vec3 position =
    bannerLocationHeight.xyz +
    cameraRight.xyz * positions[gl_VertexID].x * 1.5 +
    cameraUp.xyz    * (positions[gl_VertexID].y + bannerLocationHeight.w) * 1.5;

  gl_Position = (transformViewProj * transformWorld) * vec4(position, 1);
  drawPosition = (transformWorld * vec4(position, 1)).xyz;
  drawTexCoord = texCoords[gl_VertexID];

  drawID = currentID;
} /* main */