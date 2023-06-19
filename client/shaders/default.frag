#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;
layout(location = 1) out vec4 outPosition;

in vec3 drawPosition;
in vec2 drawTexCoord;
in vec3 drawNormal;
in float drawID;

uniform sampler2D Texture0;

void main() {
  vec3 lightDir = normalize(vec3(0.30, 0.47, 0.80));

  outColorID = vec4(vec3(clamp(dot(drawNormal, lightDir), 0.0, 1.0)), drawID);
  outPosition = vec4(drawPosition, 1);
} /* main */