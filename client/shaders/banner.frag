#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;
layout(location = 1) out vec4 outPosition;

in vec3 drawPosition;
in vec2 drawTexCoord;
in float drawID;

uniform sampler2D Texture0;

void main() {
  vec3 color = texture(Texture0, drawTexCoord).xyz;

  if (color.r + color.g + color.b <= 2.0)
    discard;

  outColorID = vec4(color, drawID);
  outPosition = vec4(drawPosition, 1);
} /* main */