#version 300 es

in vec3 inPosition;
in vec2 inTexCoord;

out vec2 drawTexCoord;

const vec2 positions[4] = vec2[4](
  vec2( 1, -1),
  vec2( 1,  1),
  vec2(-1, -1),
  vec2(-1,  1)
);

const vec2 texCoords[4] = vec2[4](
  vec2(1, 0),
  vec2(1, 1),
  vec2(0, 0),
  vec2(0, 1)
);

void main() {
  gl_Position = vec4(positions[gl_VertexID], 1, 1);
  drawTexCoord = texCoords[gl_VertexID];
} /* main */

/* target.vert */