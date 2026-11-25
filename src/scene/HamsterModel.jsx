import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getHillHeight } from './VoxelMeadow.jsx'

export default function HamsterModel({ onPoke, positionX = 2.05, positionZ = 0.65, baseRotY = -0.22 }) {
  const { scene } = useGLTF('/models/hamster.glb', '/draco/')
  const groupRef = useRef()
  const bodyRef = useRef()
  const [hovered, setHovered] = useState(false)
  const hopTimeRef = useRef(-10)

  // Normalize scale and pivot so feet rest cleanly at local y = 0
  const normalizedScene = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const targetHeight = 2.25
    const scale = size.y > 0 ? targetHeight / size.y : 1

    clone.scale.setScalar(scale)
    clone.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale
    )

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          child.material = child.material.clone()
          child.material.envMapIntensity = 0.85
          // Keep fur soft & non-plastic
          if (typeof child.material.roughness === 'number') {
            child.material.roughness = Math.max(child.material.roughness, 0.55)
          }
          child.material.needsUpdate = true
        }
      }
    })

    return clone
  }, [scene])

  // Position on the meadow (right on desktop, centered on mobile)
  const basePos = useMemo(() => {
    const y = getHillHeight(positionX, positionZ) - 0.02
    return [positionX, y, positionZ]
  }, [positionX, positionZ])

  const handleClick = (e) => {
    e.stopPropagation()
    hopTimeRef.current = 0
    if (onPoke) onPoke()
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (!bodyRef.current) return

    // Advance click-hop animation timer
    if (hopTimeRef.current >= 0 && hopTimeRef.current < 1.0) {
      hopTimeRef.current += delta * 2.1
    }

    const hopP =
      hopTimeRef.current >= 0 && hopTimeRef.current <= 1
        ? hopTimeRef.current
        : -1
    const hopY = hopP >= 0 ? Math.sin(hopP * Math.PI) * 0.34 : 0
    const hopWiggle =
      hopP >= 0 ? Math.sin(hopP * Math.PI * 3) * 0.14 * (1 - hopP) : 0

    // Gentle living breathing & subtle weight shift
    const breathe = Math.sin(t * 2.1) * 0.018
    const squash = hopP >= 0 ? Math.sin(hopP * Math.PI) * 0.06 : 0
    bodyRef.current.scale.set(
      1 - breathe * 0.5 - squash * 0.5,
      1 + breathe + squash,
      1 - breathe * 0.5 - squash * 0.5
    )

    bodyRef.current.position.y = hopY

    // Subtle mouse-tracking look + idle sway
    const targetRotY = baseRotY + state.pointer.x * 0.24 + Math.sin(t * 0.85) * 0.045
    const targetRotX = -state.pointer.y * 0.08 + Math.sin(t * 1.3) * 0.018
    const targetRotZ = Math.sin(t * 0.9) * 0.025 + hopWiggle

    bodyRef.current.rotation.y = THREE.MathUtils.lerp(
      bodyRef.current.rotation.y,
      targetRotY,
      0.06
    )
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(
      bodyRef.current.rotation.x,
      targetRotX,
      0.06
    )
    bodyRef.current.rotation.z = THREE.MathUtils.lerp(
      bodyRef.current.rotation.z,
      targetRotZ,
      0.1
    )

    // Cursor pointer feedback on hover
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  })

  return (
    <group ref={groupRef} position={basePos}>
      <group
        ref={bodyRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={normalizedScene} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/hamster.glb', '/draco/')
