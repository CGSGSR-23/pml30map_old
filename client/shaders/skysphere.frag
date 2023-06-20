#version 300 es

precision highp float;

layout(location = 0) out vec4 outColorID;

uniform projectionInfo {
  vec3 camDir;
  float doTransit;

  vec3 camRight;
  float transitionCoefficent;

  vec3 camUp;
  float sphereRotation;

  float transitSphereRotation;
};

uniform sampler2D Texture0;
uniform sampler2D Texture1;

in vec2 drawTexCoord;
in float drawID;

#define PI 3.1415926535

void main() {
  vec3 dir = camDir.xyz + camRight.xyz * drawTexCoord.x + camUp.xyz * drawTexCoord.y;
  vec2 basicTexCoord = vec2(
    sign(dir.z) * acos(dir.x / length(dir.xz)) / PI / 2.0 + 1.75,
    acos(dir.y / length(dir)) / PI
  );
  vec2 texCoord = vec2(
    fract(basicTexCoord.x + sphereRotation / PI / 2.0),
    basicTexCoord.y
  );

  if (doTransit == 1.0) {
    vec2 secondTexCoord = vec2(
      fract(basicTexCoord.x + transitSphereRotation / PI / 2.0),
      basicTexCoord.y
    );
    outColorID = vec4(
      mix(texture(Texture0, texCoord).xyz, texture(Texture1, secondTexCoord).xyz, transitionCoefficent),
      drawID
    );
  } else {
    outColorID = vec4(texture(Texture0, texCoord).xyz, drawID);
  }

  outColorID.xyz = outColorID.xyz;
} /* main */

/* default_pbr.frag */