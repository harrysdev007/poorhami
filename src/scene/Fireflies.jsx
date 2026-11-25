import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getHillHeight } from './VoxelMeadow.jsx'

/**
 * Floating luminous voxel fireflies & moonlit pollen particles drifting
 * gently over the grass meadow to bring the night scene to life.
 */
export default function Fireflies({ count = 48 }) {
  const meshRef = useRef()

  const { particles, dummy } = useMemo(() => {
    let seed = 7741
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    const palette = [
      new THREE.Color('#fef08a'), // warm firefly gold
      new THREE.Color('#86efac'), // meadow glow
      new THREE.Color('#7dd3fc'), // moonlit cyan
      new THREE.Color('#fde047'), // bright gold
    ]

    const list = []
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 14
      const z = -4.5 + rand() * 8.5
      const groundY = getHillHeight(x, z)
      const y = groundY + 0.35 + rand() * 2.4
      const speed = 0.4 + rand() * 0.7
      const radius = 0.25 + rand() * 0.55
      const phase = rand() * Math.PI * 2
      const baseScale = 0.032 + rand() * 0.035
      const color = palette[Math.floor(rand() * palette.length)]
      list.push({ x, y, z, speed, radius, phase, baseScale, color })
    }

    return { particles: list, dummy: new THREE.Object3D() }
  }, [count])

  useEffect(() => {
    if (!meshRef.current) return
    particles.forEach((p, i) => {
      meshRef.current.setColorAt(i, p.color)
    })
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [particles])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const x = p.x + Math.sin(t * p.speed + p.phase) * p.radius
      const y = p.y + Math.cos(t * p.speed * 1.3 + p.phase) * 0.22
      const z = p.z + Math.cos(t * p.speed * 0.8 + p.phase) * p.radius * 0.6
      const pulse = 0.55 + 0.55 * Math.sin(t * 2.8 + p.phase * 2.0)
      const s = p.baseScale * pulse

      dummy.position.set(x, y, z)
      dummy.rotation.set(t * 0.6 + p.phase, t * 0.9, 0)
      dummy.scale.set(s, s, s)
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
