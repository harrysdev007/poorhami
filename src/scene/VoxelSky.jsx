import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SkyDome: Deep cobalt/indigo gradient sky matching the reference background.
 */
function SkyDome() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color('#00044a') },
        uMidColor: { value: new THREE.Color('#00128f') },
        uHorizonColor: { value: new THREE.Color('#0636d4') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y * 1.4 + 0.12, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.38, h));
          col = mix(col, uTopColor, smoothstep(0.32, 0.92, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [])

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[65, 32, 24]} />
    </mesh>
  )
}

/**
 * VoxelStars: Crisp 3D pixel-cube stars scattered across the night sky
 * with gentle twinkling & subtle cyan/white/magenta palette.
 */
function VoxelStars({ count = 130 }) {
  const meshRef = useRef()

  const { data, dummy } = useMemo(() => {
    const items = []
    let seed = 9187
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    const palette = [
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#f0abfc'),
      new THREE.Color('#93c5fd'),
    ]

    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 44
      const y = 0.6 + rand() * 14.5
      const z = -12 - rand() * 20
      const baseScale = 0.09 + rand() * 0.16
      const phase = rand() * Math.PI * 2
      const speed = 1.2 + rand() * 2.6
      const color = palette[Math.floor(rand() * palette.length)]
      items.push({ x, y, z, baseScale, phase, speed, color })
    }

    return { data: items, dummy: new THREE.Object3D() }
  }, [count])

  useEffect(() => {
    if (!meshRef.current) return
    data.forEach((star, i) => {
      meshRef.current.setColorAt(i, star.color)
    })
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [data])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < data.length; i++) {
      const s = data[i]
      const twinkle = 0.68 + 0.45 * Math.sin(t * s.speed + s.phase)
      const scale = s.baseScale * twinkle
      dummy.position.set(s.x, s.y + Math.sin(t * 0.3 + s.phase) * 0.05, s.z)
      dummy.rotation.set(0, t * 0.15 + s.phase, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/**
 * VoxelClouds: Layered clusters of light-blue/cyan 3D voxel cubes drifting
 * gently near the horizon, recreating the iconic voxel clouds in the photo.
 */
function VoxelClouds() {
  const meshRef = useRef()

  const { voxels, dummy } = useMemo(() => {
    let seed = 31337
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    // Cloud cluster definitions matching left, center-low, and right banks
    const clusters = [
      { cx: -11.5, cy: 0.4, cz: -16.5, rx: 5.2, ry: 1.5, rz: 1.8, blocks: 95, speed: 0.22 },
      { cx: -5.8, cy: 1.6, cz: -19.0, rx: 3.4, ry: 1.1, rz: 1.4, blocks: 48, speed: 0.18 },
      { cx: -0.6, cy: -0.4, cz: -17.5, rx: 4.5, ry: 1.2, rz: 1.6, blocks: 72, speed: 0.24 },
      { cx: 6.5, cy: 0.1, cz: -18.0, rx: 4.2, ry: 1.3, rz: 1.5, blocks: 65, speed: 0.2 },
      { cx: 12.2, cy: 1.2, cz: -15.8, rx: 5.5, ry: 2.2, rz: 2.0, blocks: 120, speed: 0.26 },
      { cx: 14.0, cy: 3.6, cz: -17.5, rx: 3.5, ry: 1.8, rz: 1.6, blocks: 55, speed: 0.16 },
    ]

    const palette = [
      new THREE.Color('#38bdf8'),
      new THREE.Color('#60a5fa'),
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#2563eb'),
      new THREE.Color('#93c5fd'),
      new THREE.Color('#bae6fd'),
    ]

    const gridStep = 0.55
    const result = []

    for (const c of clusters) {
      for (let i = 0; i < c.blocks; i++) {
        // Gaussian-ish clustered offsets snapped to voxel grid
        const u = (rand() + rand() - 1) * c.rx
        const v = (rand() + rand() - 1) * c.ry
        const w = (rand() + rand() - 1) * c.rz
        const gx = Math.round(u / gridStep) * gridStep
        const gy = Math.round(v / gridStep) * gridStep
        const gz = Math.round(w / gridStep) * gridStep
        const size = gridStep * (0.88 + rand() * 0.28)
        const color = palette[Math.floor(rand() * palette.length)]

        result.push({
          baseX: c.cx + gx,
          baseY: c.cy + gy,
          baseZ: c.cz + gz,
          size,
          speed: c.speed,
          phase: rand() * Math.PI * 2,
          color,
        })
      }
    }

    return { voxels: result, dummy: new THREE.Object3D() }
  }, [])

  useEffect(() => {
    if (!meshRef.current) return
    voxels.forEach((v, i) => {
      meshRef.current.setColorAt(i, v.color)
    })
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [voxels])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const wrapSpan = 36

    for (let i = 0; i < voxels.length; i++) {
      const v = voxels[i]
      // Smooth continuous horizontal drift with wrap-around
      let x = v.baseX + t * v.speed
      x = ((((x + wrapSpan / 2) % wrapSpan) + wrapSpan) % wrapSpan) - wrapSpan / 2
      const y = v.baseY + Math.sin(t * 0.5 + v.phase) * 0.1
      dummy.position.set(x, y, v.baseZ)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(v.size, v.size * 0.85, v.size)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, voxels.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.75}
        metalness={0.0}
        emissive="#1d4ed8"
        emissiveIntensity={0.45}
        transparent
        opacity={0.78}
      />
    </instancedMesh>
  )
}

export default function VoxelSky() {
  return (
    <group>
      <SkyDome />
      <VoxelStars count={140} />
      <VoxelClouds />
    </group>
  )
}
