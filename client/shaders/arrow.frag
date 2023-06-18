#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;
layout(location = 1) out vec4 outPosition;

in vec3 drawPosition;
in float drawDistCoef;
in float drawID;

void main() {
  outColorID = vec4(vec3(pow(drawDistCoef * 2.0 + 0.4, 1.0)), drawID);
  outPosition = vec4(drawPosition, 1);
} /* main */