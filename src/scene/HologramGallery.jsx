import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export const MEME_ITEMS = [
  {
    id: 1,
    src: '/memes/meme-1.jpg',
    title: 'Down -88.9%',
    caption: 'Late night charts, cold coffee, and red candles only.',
    position: [-3.45, 0.35, -1.15],
    rotation: [0, 0.36, 0.02],
  },
  {
    id: 2,
    src: '/memes/meme-2.jpg',
    title: '2:00 AM Laundromat',
    caption: 'Washing the last pair of socks with $1 coffee.',
    position: [-1.78, 0.78, -0.35],
    rotation: [0, 0.18, -0.015],
  },
  {
    id: 3,
    src: '/memes/meme-3.jpg',
    title: 'Down -99.7%',
    caption: 'Empty fries box, ripped Poorhami hoodie, rainy window.',
    position: [0.0, 0.55, 0.15],
    rotation: [0, 0.0, 0.01],
  },
  {
    id: 4,
    src: '/memes/meme-4.jpg',
    title: 'Night Bus Liquidation',
    caption: '-100.00% liquidated. Taking the last bus home.',
    position: [1.78, 0.78, -0.35],
    rotation: [0, -0.18, 0.015],
  },
  {
    id: 5,
    src: '/memes/meme-5.jpg',
    title: '¥98 Cup Ramen',
    caption: 'The only dinner the portfolio can still afford.',
    position: [3.45, 0.35, -1.15],
    rotation: [0, -0.36, -0.02],
  },
]

function HologramCard({ item, index, onSelect }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(item.src)

  // Configure crisp texture sampling
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
  }, [texture])

  // Custom holographic shader: crisp meme image + scanlines + traveling holo-beam + cyan/violet rim
  const holoMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: texture },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uSeed: { value: index * 1.73 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uHover;
        uniform float uSeed;
        varying vec2 vUv;

        void main() {
          // Subtle periodic micro-glitch horizontal shimmer
          float glitchBand = smoothstep(0.97, 1.0, sin(uTime * 1.4 + uSeed + vUv.y * 10.0));
          vec2 uv = vUv;
          uv.x += glitchBand * 0.004 * sin(uTime * 35.0);

          vec4 tex = texture2D(uMap, uv);

          // Fine holographic scanlines
          float scan = sin(vUv.y * 190.0 - uTime * 3.5) * 0.045;
          // Traveling vertical projection sweep
          float sweepPos = fract(uTime * 0.22 + uSeed * 0.31);
          float sweep = exp(-pow((vUv.y - sweepPos) * 14.0, 2.0)) * 0.22;

          // Edge holographic fresnel-like cyan/violet rim glow
          vec2 edgeDist = min(vUv, 1.0 - vUv);
          float border = smoothstep(0.085, 0.0, min(edgeDist.x, edgeDist.y));

          vec3 holoTint = mix(vec3(0.22, 0.85, 1.0), vec3(0.76, 0.45, 1.0), vUv.y);

          vec3 col = tex.rgb;
          // Slight holographic blue-cyan lift, clearer on hover
          col = mix(col, col * vec3(0.88, 0.98, 1.12) + holoTint * 0.08, 0.35 - uHover * 0.2);
          col += holoTint * (sweep + border * (0.55 + uHover * 0.35));
          col += scan;

          float alpha = mix(0.88, 0.98, uHover) + border * 0.12;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `,
    })
  }, [texture, index])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    holoMaterial.uniforms.uTime.value = t
    holoMaterial.uniforms.uHover.value = THREE.MathUtils.lerp(
      holoMaterial.uniforms.uHover.value,
      hovered ? 1.0 : 0.0,
      delta * 7
    )

    if (!groupRef.current) return
    const floatY = Math.sin(t * 1.45 + index * 1.15) * 0.12
    const targetY = item.position[1] + floatY + (hovered ? 0.14 : 0)
    const targetZ = item.position[2] + (hovered ? 0.32 : 0)
    const targetScale = hovered ? 1.09 : 1.0

    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.08
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.08
    )
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1)
    )
    groupRef.current.rotation.y =
      item.rotation[1] + Math.sin(t * 0.7 + index) * 0.04
    groupRef.current.rotation.z =
      item.rotation[2] + Math.cos(t * 0.9 + index) * 0.015
  })

  const frameW = 1.48
  const frameH = 1.48
  const borderColor = hovered ? '#a5f3fc' : '#22d3ee'

  return (
    <group>
      {/* Floating Hologram Card */}
      <group
        ref={groupRef}
        position={item.position}
        rotation={item.rotation}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(item)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {/* Holographic image plane */}
        <mesh material={holoMaterial}>
          <planeGeometry args={[frameW, frameH]} />
        </mesh>

        {/* Glowing thin holographic outer rim */}
        <mesh position={[0, frameH / 2 + 0.02, 0]}>
          <boxGeometry args={[frameW + 0.08, 0.025, 0.025]} />
          <meshBasicMaterial color={borderColor} toneMapped={false} />
        </mesh>
        <mesh position={[0, -frameH / 2 - 0.02, 0]}>
          <boxGeometry args={[frameW + 0.08, 0.025, 0.025]} />
          <meshBasicMaterial color={borderColor} toneMapped={false} />
        </mesh>
        <mesh position={[-frameW / 2 - 0.02, 0, 0]}>
          <boxGeometry args={[0.025, frameH + 0.06, 0.025]} />
          <meshBasicMaterial color={borderColor} toneMapped={false} />
        </mesh>
        <mesh position={[frameW / 2 + 0.02, 0, 0]}>
          <boxGeometry args={[0.025, frameH + 0.06, 0.025]} />
          <meshBasicMaterial color={borderColor} toneMapped={false} />
        </mesh>

        {/* Subtle glowing voxel corner accents */}
        {[
          [-frameW / 2 - 0.03, frameH / 2 + 0.03],
          [frameW / 2 + 0.03, frameH / 2 + 0.03],
          [-frameW / 2 - 0.03, -frameH / 2 - 0.03],
          [frameW / 2 + 0.03, -frameH / 2 - 0.03],
        ].map(([cx, cy], idx) => (
          <mesh key={idx} position={[cx, cy, 0.015]}>
            <boxGeometry args={[0.07, 0.07, 0.04]} />
            <meshBasicMaterial color="#e879f9" toneMapped={false} />
          </mesh>
        ))}

        {/* Soft translucent holographic projection beam cone underneath */}
        <mesh position={[0, -frameH / 2 - 0.72, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.72, 1.38, 4, 1, true]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={hovered ? 0.16 : 0.09}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Glowing Voxel Holo-Projector Pad hovering just above the water */}
      <group position={[item.position[0], -1.35, item.position[2]]}>
        <mesh>
          <boxGeometry args={[0.52, 0.1, 0.52]} />
          <meshStandardMaterial
            color="#1e1b4b"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.32, 0.04, 0.32]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export default function HologramGallery({ onSelectMeme }) {
  return (
    <group>
      {MEME_ITEMS.map((item, idx) => (
        <HologramCard
          key={item.id}
          item={item}
          index={idx}
          onSelect={onSelectMeme}
        />
      ))}
    </group>
  )
}
