#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;
layout(location = 1) out vec4 outPosition;

in vec3 drawPosition;
in vec2 drawTexCoord;
in float drawID;

void main() {
  outColorID = vec4(1, 1, 1, drawID);
  outPosition = vec4(drawPosition, 1);
} /* main */