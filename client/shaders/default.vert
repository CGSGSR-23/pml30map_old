#version 300 es

precision highp float;

in vec3 inPosition;
in vec2 inTexCoord;
in vec3 inNormal;

uniform cameraBuffer
{
  mat4 transformWorld;
  mat4 transformViewProj;
  vec3 cameraLocation;
  float currentID;
};

out vec3 drawPosition;
out vec2 drawTexCoord;
out vec3 drawNormal;
out float drawID;

void main()
{
  gl_Position = (transformViewProj * transformWorld) * vec4(inPosition, 1);

  drawPosition = (transformWorld * vec4(inPosition, 1)).xyz;
  drawTexCoord = inTexCoord;
  drawNormal = normalize(inNormal * mat3(inverse(transpose(transformWorld))));

  drawID = currentID;
}