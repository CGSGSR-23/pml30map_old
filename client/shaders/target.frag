#version 300 es

precision highp float;

layout(location = 0) out vec4 outColor;

in vec2 drawTexCoord;

// ColorID
uniform sampler2D Texture0;

void main() {
  outColor = vec4(texture(Texture0, drawTexCoord).xyz, 1);
} /* main */

/* target.frag */