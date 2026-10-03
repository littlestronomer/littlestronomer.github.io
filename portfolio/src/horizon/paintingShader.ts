// Draws the painting across the whole screen as a stack of layers made by
// scripts/make_painting_layers.py, back to front: the sky and water with nothing standing
// in them, the paper plane, the trees, the girl, then her dress and hair. Each layer moves
// on its own. The paper boat floats in the water on top of them all.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  uniform sampler2D uPainting;
  uniform sampler2D uBackground;  // sky and water with the trees, the girl and their reflections painted out
  uniform sampler2D uUnder;       // the girl with her dress and hair painted out
  uniform sampler2D uMatte;       // r = trees and their reflections, g = the girl and hers, b = how far leaves sway
  uniform sampler2D uCloth;       // r = her dress, g = her hair, b = how far they move
  uniform vec4 uRegion;           // the rectangle those four textures cover: left, bottom, right, top
  uniform sampler2D uSkyPatch;    // the sky where the painted paper plane was, with the plane painted out
  uniform vec4 uSkyPatchRegion;   // the rectangle uSkyPatch covers: left, bottom, right, top
  uniform sampler2D uPlaneArt;    // the flying paper plane, nose to the right
  uniform vec4 uPlane;            // its middle (texture space), heading (radians, anticlockwise) and width (painting heights)
  uniform vec2 uViewport;         // canvas size in CSS pixels
  uniform vec2 uPaintingSize;     // painting size on screen in CSS pixels
  uniform vec2 uScroll;           // how far the painting is shifted left and cropped from the bottom
  uniform sampler2D uBoatArt;     // the paper boat; its waterline is BOAT_WATERLINE up from the bottom edge
  uniform vec4 uBoatPlace;        // boat's middle and the calm water level (CSS pixels from the bottom left), then its width and height
  uniform vec3 uBoatPose;         // how far it has bobbed up (CSS pixels), how far it leans clockwise (radians), how much it stirs the water
  uniform float uTime;
  uniform float uHorizon;
  uniform float uTreeBase;
  uniform float uGirlBase;
  uniform float uAspect;

  varying vec2 vUv;

  // How much each part moves. Distances are fractions of the painting's height,
  // in both directions; they are converted to texture coordinates where they are used.
  const float CLOUD_SPEED = 0.005;     // how fast clouds drift right, per second
  const float CLOUD_CHURN = 0.005;     // how far the inside of a cloud billows
  const float WATER_PULL = 0.019;      // how far ripples bend reflections, at the bottom edge
  const float BOAT_WAKE = 0.0024;      // how far the boat's rings bend reflections
  const float LEAF_BEND = 0.005;       // how far the treetops lean in a gust
  const float LEAF_FLUTTER = 0.003;    // how far a single clump of leaves shakes
  const float LEAF_GLINT = 0.09;       // how much a leaf brightens as it flips over
  const float DRESS_FLUTTER = 0.006;   // how far the hem of the dress moves
  const float HAIR_FLUTTER = 0.004;    // how far the tips of her hair move
  const float BOAT_WATERLINE = 0.14;   // keep in step with BOAT_WATERLINE in walk.ts
  const float PLANE_ART_ASPECT = 0.5;  // the plane drawing's height over its width

  // 2D simplex noise by Ian McEwan and Stefan Gustavson (MIT license).
  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // A repeatable random number between 0 and 1 for each cell of a grid.
  float hash(vec2 cell) {
    return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  }

  // The wind blows from left to right, and its gusts roll across the painting the same way.
  // Returns 0 in a lull and 1 at the peak of a gust.
  float gustAt(float x, float t) {
    return smoothstep(-0.5, 0.9, snoise(vec2(x * 1.4 - t * 0.35, t * 0.05)));
  }

  // Where a painting position falls inside the layers' rectangle (0 to 1 across it).
  vec2 toRegion(vec2 uv) {
    return (uv - uRegion.xy) / (uRegion.zw - uRegion.xy);
  }

  float insideRegion(vec2 position) {
    vec2 inside = step(vec2(0.0), position) * step(position, vec2(1.0));
    return inside.x * inside.y;
  }

  // One of the layer textures at a painting position; zero outside the rectangle.
  vec4 layerAt(sampler2D layer, vec2 uv) {
    vec2 position = toRegion(uv);
    return texture2D(layer, clamp(position, 0.0, 1.0)) * insideRegion(position);
  }

  // Where a screen point (CSS pixels) lands on the boat drawing, 0 to 1 across it, with the
  // boat bobbed up and leaning.
  vec2 onBoat(vec2 point) {
    vec2 local = point - vec2(uBoatPlace.x, uBoatPlace.y + uBoatPose.x);
    float c = cos(uBoatPose.y);
    float s = sin(uBoatPose.y);
    local = vec2(c * local.x - s * local.y, s * local.x + c * local.y);
    return vec2(local.x / uBoatPlace.z + 0.5, local.y / uBoatPlace.w + BOAT_WATERLINE);
  }

  // Where a painting position lands on the plane drawing, 0 to 1 across it, with the plane
  // turned to its heading.
  vec2 onPlane(vec2 uv) {
    vec2 local = vec2((uv.x - uPlane.x) * uAspect, uv.y - uPlane.y);
    float c = cos(uPlane.z);
    float s = sin(uPlane.z);
    local = vec2(c * local.x + s * local.y, -s * local.x + c * local.y);
    return local / vec2(uPlane.w, uPlane.w * PLANE_ART_ASPECT) + 0.5;
  }

  // Height of the water's surface around the boat above the calm level, in CSS pixels.
  float swellAt(float x, float t) {
    return 1.8 * sin(x * 0.11 - t * 2.1) + 1.0 * sin(x * 0.23 + t * 3.0 + 1.3);
  }

  // The sky and water behind everything. Past the painting's side edges it continues as
  // their mirror image, so drifting clouds never run out.
  vec3 background(vec2 uv) {
    float x = mod(uv.x, 2.0);
    uv.x = x > 1.0 ? 2.0 - x : x;
    vec2 position = toRegion(uv);
    vec2 patchPosition = (uv - uSkyPatchRegion.xy) / (uSkyPatchRegion.zw - uSkyPatchRegion.xy);
    vec3 painted = texture2D(uPainting, uv).rgb;
    painted = mix(painted, texture2D(uSkyPatch, clamp(patchPosition, 0.0, 1.0)).rgb, insideRegion(patchPosition));
    vec3 cleared = texture2D(uBackground, clamp(position, 0.0, 1.0)).rgb;
    return mix(painted, cleared, insideRegion(position));
  }

  void main() {
    // Where this pixel lands on the painting (0 to 1, origin at the bottom left).
    vec2 uv = (vUv * uViewport + uScroll) / uPaintingSize;
    float t = uTime;
    vec2 toTexture = vec2(1.0 / uAspect, 1.0);

    // Ripples on the water, seen in perspective: finer toward the horizon, pulling harder
    // on the reflections toward the bottom of the screen. The paper boat adds rings of its own.
    float below = max(uHorizon - uv.y, 0.0);
    float onWater = smoothstep(0.0, 0.01, below);
    float reach = 1.0 / (below + 0.04);
    vec2 surface = vec2(uv.x * uAspect * reach, reach) * vec2(1.6, 2.4);
    float swell = snoise(surface + vec2(t * 0.05, t * 0.22));
    float chop = snoise(surface * 2.3 + vec2(-t * 0.08, t * 0.4));
    vec2 ripple = vec2(0.25 * swell, swell + 0.55 * chop) * below * WATER_PULL;
    vec2 screen = vUv * uViewport;
    float boatDistance = length((screen - uBoatPlace.xy) * vec2(1.0, 3.2));
    float wake = sin(boatDistance * 0.16 - t * 3.4) * exp(-boatDistance * 0.013) * smoothstep(4.0, 24.0, boatDistance);
    ripple.y += wake * BOAT_WAKE * uBoatPose.z;
    ripple *= onWater;
    float shimmer = (0.045 * swell * smoothstep(0.0, 0.15, below) + 0.05 * wake * uBoatPose.z) * onWater;

    // 1. Sky and water. Clouds drift right and billow; the water mirrors them about the
    //    horizon, so their reflections drift and billow with them.
    bool reflected = uv.y < uHorizon;
    vec2 cloudPoint = reflected ? vec2(uv.x, 2.0 * uHorizon - uv.y) : uv;
    vec2 churn = vec2(cloudPoint.x * uAspect, cloudPoint.y) * 2.4 + vec2(t * 0.03, 0.0);
    float billowing = smoothstep(0.0, 0.04, abs(uv.y - uHorizon));
    vec2 billow = vec2(snoise(churn), snoise(churn + 9.1) * (reflected ? -1.0 : 1.0)) * CLOUD_CHURN * billowing;
    vec2 drift = vec2(t * CLOUD_SPEED, 0.0);
    vec3 color = background(uv + (billow - drift + ripple) * toTexture) * (1.0 + shimmer);

    // The paper plane glides in front of the clouds, behind the trees, and the water mirrors
    // it like the rest of the sky. Its drawing is premultiplied.
    vec4 plane = texture2D(uPlaneArt, onPlane(uv));
    color = color * (1.0 - plane.a) + plane.rgb;
    vec4 planeMirrored = texture2D(uPlaneArt, onPlane(vec2(uv.x, 2.0 * uHorizon - uv.y) + ripple * toTexture));
    float planeReflection = reflected ? 0.6 : 0.0;
    color = color * (1.0 - planeMirrored.a * planeReflection) + planeMirrored.rgb * planeReflection;

    // 2. The trees. Gusts bend the treetops, every clump of leaves shakes to its own rhythm,
    //    and a leaf that flips over shows its lighter underside for a moment. The reflection
    //    of the leaves copies that motion upside down and also rides the ripples.
    bool treeReflected = uv.y < uTreeBase;
    vec2 treePoint = treeReflected ? vec2(uv.x, 2.0 * uTreeBase - uv.y) : uv;
    vec2 treeFlip = vec2(1.0, treeReflected ? -1.0 : 1.0);
    float sway = layerAt(uMatte, uv).b;
    vec2 leafMove = vec2(0.0);
    float glint = 0.0;
    if (sway > 0.002) {
      float gust = gustAt(treePoint.x * uAspect, t);
      float lean = 0.55 + 0.45 * sin(t * 1.7 + treePoint.x * 8.0);
      leafMove = vec2(-lean * gust, 0.12 * sin(t * 2.3)) * LEAF_BEND;

      // Find which clump this pixel belongs to: the nearest of the jittered grid points.
      vec2 cells = vec2(treePoint.x * uAspect, treePoint.y) * 60.0;
      vec2 cell = floor(cells);
      vec2 clump = cell;
      float nearest = 8.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 neighbour = cell + vec2(float(i), float(j));
          vec2 toPoint = neighbour + vec2(hash(neighbour), hash(neighbour + 19.19)) - cells;
          float distance2 = dot(toPoint, toPoint);
          if (distance2 < nearest) {
            nearest = distance2;
            clump = neighbour;
          }
        }
      }
      float seed = hash(clump + 7.7);
      vec2 shake = vec2(sin(t * (6.0 + 5.0 * seed) + seed * 40.0), cos(t * (8.0 + 4.0 * seed) + seed * 23.0));
      leafMove += shake * LEAF_FLUTTER * (0.3 + 0.7 * gust);
      leafMove *= treeFlip * sway;
      glint = LEAF_GLINT * gust * sway * pow(max(sin(t * (3.0 + 4.0 * seed) + seed * 60.0), 0.0), 6.0);
    }
    vec2 treeUv = uv + (leafMove + (treeReflected ? ripple : vec2(0.0))) * toTexture;
    color = mix(color, texture2D(uPainting, treeUv).rgb * (1.0 + glint), layerAt(uMatte, treeUv).r);

    // 3. The girl stands still. Her body comes from the layer with the dress and hair painted
    //    out, so they can move over it without dragging her legs or arms along.
    bool girlReflected = uv.y < uGirlBase;
    vec2 girlRipple = girlReflected ? ripple : vec2(0.0);
    vec2 girlUv = uv + girlRipple * toTexture;
    color = mix(color, layerAt(uUnder, girlUv).rgb, layerAt(uMatte, girlUv).g);

    // 4. Her dress billows and ripples along the hem, and her hair streams, in the same
    //    gusts as the trees. Her reflection copies both upside down.
    vec4 cloth = layerAt(uCloth, uv);
    if (cloth.r + cloth.g + cloth.b > 0.002) {
      vec2 girlPoint = girlReflected ? vec2(uv.x, 2.0 * uGirlBase - uv.y) : uv;
      vec2 girlFlip = vec2(1.0, girlReflected ? -1.0 : 1.0);
      float gust = gustAt(girlPoint.x * uAspect, t);
      vec2 g = vec2(girlPoint.x * uAspect, girlPoint.y);
      float swing = sin(t * 2.4 + 1.6 * sin(t * 0.9));
      float hem = sin(t * 9.0 - g.x * 260.0 + g.y * 160.0);
      vec2 dressMove = vec2(-(0.6 * swing + 0.4 * hem), 0.35 * hem) * (0.5 + 0.5 * gust) * DRESS_FLUTTER;
      float strand = sin(t * 11.0 - g.x * 320.0) + 0.5 * sin(t * 17.0 + g.y * 420.0);
      vec2 hairMove = vec2(-0.5 * strand, 0.8 * strand) * (0.45 + 0.55 * gust) * HAIR_FLUTTER;

      vec2 dressUv = uv + (dressMove * cloth.b * girlFlip + girlRipple) * toTexture;
      color = mix(color, texture2D(uPainting, dressUv).rgb, layerAt(uCloth, dressUv).r);
      vec2 hairUv = uv + (hairMove * cloth.b * girlFlip + girlRipple) * toTexture;
      color = mix(color, texture2D(uPainting, hairUv).rgb, layerAt(uCloth, hairUv).g);
    }

    // 5. The paper boat sits in the water. Below the wavy waterline its hull shows faintly
    //    through the water, bent by the ripples, and the water mirrors the dry part of the
    //    boat with the ripples running through the reflection. The drawing is premultiplied.
    vec2 bend = ripple * uPaintingSize.y;
    float level = uBoatPlace.y + swellAt(screen.x, t);
    float depth = level - screen.y;
    float underwater = smoothstep(-0.7, 0.7, depth);
    vec4 dry = texture2D(uBoatArt, onBoat(screen));
    vec4 wet = texture2D(uBoatArt, onBoat(screen + bend * 0.5));
    vec4 mirrored = texture2D(uBoatArt, onBoat(vec2(screen.x, 2.0 * level - screen.y) + bend * 1.5));
    float seeThrough = 0.45 * underwater;
    color = color * (1.0 - wet.a * seeThrough) + mix(wet.rgb, color * wet.a, 0.55) * seeThrough;
    color *= 1.0 - 0.12 * wet.a * underwater * (1.0 - smoothstep(0.0, 6.0, depth));
    float reflection = 0.42 * underwater * (1.0 - smoothstep(0.0, uBoatPlace.w * 0.8, depth));
    color = color * (1.0 - mirrored.a * reflection) + mirrored.rgb * reflection;
    color = color * (1.0 - dry.a * (1.0 - underwater)) + dry.rgb * (1.0 - underwater);
    // Where the water meets the paper it catches a thin line of light.
    float meniscus = 1.0 - smoothstep(0.0, 1.4, abs(depth));
    color = mix(color, vec3(1.0), 0.25 * meniscus * max(dry.a, wet.a));

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
