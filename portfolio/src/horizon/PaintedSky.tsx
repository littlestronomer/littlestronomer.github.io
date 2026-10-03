import { Component, Suspense, useRef, type ReactNode } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei'
import { LinearFilter, NoColorSpace, SRGBColorSpace, Vector2, Vector3, Vector4, type Texture } from 'three'
import paintingUrl from './assets/painting.jpg'
import backgroundUrl from './assets/scene-background.png'
import underUrl from './assets/scene-under.png'
import matteUrl from './assets/scene-matte.png'
import clothUrl from './assets/scene-cloth.png'
import skyPatchUrl from './assets/scene-sky-patch.png'
import paperBoatUrl from './assets/paper-boat.svg'
import paperPlaneUrl from './assets/paper-plane.svg'
import { PLANE_WIDTH, planeAt } from './flight'
import { GIRL_BASE, HORIZON, PAINTING_ASPECT, REGION, SKY_PATCH, TREE_BASE } from './painting'
import { fragmentShader, vertexShader } from './paintingShader'
import type { Walk } from './walk'

type PaintedSkyProps = {
  walk: Walk
  animate: boolean
  /** Called if WebGL fails, so the page can fall back to the plain painting. */
  onUnavailable: () => void
}

const PaintingMaterial = shaderMaterial(
  {
    uPainting: null as Texture | null,
    uBackground: null as Texture | null,
    uUnder: null as Texture | null,
    uMatte: null as Texture | null,
    uCloth: null as Texture | null,
    uRegion: new Vector4(...REGION),
    uSkyPatch: null as Texture | null,
    uSkyPatchRegion: new Vector4(...SKY_PATCH),
    uPlaneArt: null as Texture | null,
    uPlane: new Vector4(),
    uViewport: new Vector2(1, 1),
    uPaintingSize: new Vector2(1, 1),
    uScroll: new Vector2(),
    uBoatArt: null as Texture | null,
    uBoatPlace: new Vector4(-1000, 0, 1, 1),
    uBoatPose: new Vector3(),
    uTime: 0,
    uHorizon: HORIZON,
    uTreeBase: TREE_BASE,
    uGirlBase: GIRL_BASE,
    uAspect: PAINTING_ASPECT,
  },
  vertexShader,
  fragmentShader,
)
const Painting = extend(PaintingMaterial)

// The painting is always shown at or above its own size, so mipmaps would only cost memory.
function prepare(texture: Texture, colorSpace: typeof SRGBColorSpace | typeof NoColorSpace) {
  texture.colorSpace = colorSpace
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
}

const asColour = (texture: Texture) => prepare(texture, SRGBColorSpace)
// Mattes hold opacity and motion amounts, not colours, so they must not be colour-converted.
const asData = (texture: Texture) => prepare(texture, NoColorSpace)

// The boat and the plane are drawn much smaller than their pictures, so they keep their
// mipmaps. Premultiplied alpha stops their edges picking up a dark fringe when filtered.
function asCutout(texture: Texture) {
  texture.colorSpace = SRGBColorSpace
  texture.premultiplyAlpha = true
  texture.anisotropy = 4
  texture.needsUpdate = true
}

function PaintingPlane({ walk, animate }: Omit<PaintedSkyProps, 'onUnavailable'>) {
  const material = useRef<InstanceType<typeof PaintingMaterial>>(null)
  const painting = useTexture(paintingUrl, asColour)
  const background = useTexture(backgroundUrl, asColour)
  const under = useTexture(underUrl, asColour)
  const matte = useTexture(matteUrl, asData)
  const cloth = useTexture(clothUrl, asData)
  const skyPatch = useTexture(skyPatchUrl, asColour)
  const boat = useTexture(paperBoatUrl, asCutout)
  const plane = useTexture(paperPlaneUrl, asCutout)

  useFrame(({ size }, delta) => {
    const shader = material.current
    if (!shader) return
    // Cover the screen like background-size: cover, so it lines up with the CSS fallback.
    const paintingHeight = Math.max(size.height, size.width / PAINTING_ASPECT)
    shader.uViewport.set(size.width, size.height)
    shader.uPaintingSize.set(paintingHeight * PAINTING_ASPECT, paintingHeight)
    shader.uScroll.set(walk.skyX, (paintingHeight - size.height) / 2)
    shader.uBoatPlace.set(walk.boatX, walk.boatLevel, walk.boatWidth, walk.boatHeight)
    shader.uBoatPose.set(walk.boatBob, walk.boatTilt, walk.boatStir)
    if (animate) shader.uTime += Math.min(delta, 0.1)
    const flight = planeAt(shader.uTime)
    shader.uPlane.set(flight.u, flight.v, flight.heading, PLANE_WIDTH)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <Painting
        ref={material}
        key={PaintingMaterial.key}
        uPainting={painting}
        uBackground={background}
        uUnder={under}
        uMatte={matte}
        uCloth={cloth}
        uSkyPatch={skyPatch}
        uPlaneArt={plane}
        uBoatArt={boat}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// Without WebGL the stage's CSS background still shows the painting, just without motion.
class SkyErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function PaintedSky({ walk, animate, onUnavailable }: PaintedSkyProps) {
  return (
    <SkyErrorBoundary onError={onUnavailable}>
      <Canvas
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        flat
        dpr={[1, 1.5]}
        frameloop={animate ? 'always' : 'demand'}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <PaintingPlane walk={walk} animate={animate} />
        </Suspense>
      </Canvas>
    </SkyErrorBoundary>
  )
}
