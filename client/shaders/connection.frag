#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;
layout(location = 1) out vec4 outPosition;

in vec3 drawPosition;
in float drawID;

uniform sampler2D Texture0;

void main() {
  outColorID = vec4(0.3, 0.3, 0.3, drawID);
  outPosition = vec4(drawPosition, 1);
} /* main */