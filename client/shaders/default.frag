#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;

in vec3 drawPosition;
in vec2 drawTexCoord;
in vec3 drawNormal;

uniform sampler2D Texture0;

void main() {
  vec3 lightDir = normalize(vec3(1));

  outColorID = vec4(vec3(clamp(dot(drawNormal, lightDir), 0.0, 1.0)), 0);
}