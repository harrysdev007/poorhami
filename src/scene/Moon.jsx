import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Generates a high-detail procedural lunar surface texture (maria, craters,
 * bright ejecta rays like Tycho, and subtle cool-blue moonlight tint)
 * matching the glowing full moon in the reference image.
 */
function createMoonTexture() {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base bright silver-blue lunar highlands
  const baseGrad = ctx.createRadialGradient(
    size * 0.45,
    size * 0.45,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.6
  )
  baseGrad.addColorStop(0, '#f3f8ff')
  baseGrad.addColorStop(0.6, '#d9e8ff')
  baseGrad.addColorStop(1, '#b8d0f5')
  ctx.fillStyle = baseGrad
  ctx.fillRect(0, 0, size, size)

  // Deterministic pseudo-random helper
  let seed = 4219
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Large dark lunar maria (seas) — rich contrast so craters read clearly with bloom
  const maria = [
    { x: 0.32, y: 0.34, rx: 0.16, ry: 0.13, a: 0.68 },
    { x: 0.52, y: 0.28, rx: 0.14, ry: 0.11, a: 0.64 },
    { x: 0.66, y: 0.44, rx: 0.13, ry: 0.15, a: 0.66 },
    { x: 0.42, y: 0.52, rx: 0.12, ry: 0.1, a: 0.56 },
    { x: 0.22, y: 0.52, rx: 0.11, ry: 0.14, a: 0.54 },
    { x: 0.78, y: 0.33, rx: 0.1, ry: 0.09, a: 0.55 },
    { x: 0.56, y: 0.62, rx: 0.11, ry: 0.08, a: 0.5 },
  ]

  for (const m of maria) {
    for (let k = 0; k < 5; k++) {
      const ox = (rand() - 0.5) * 0.08 * size
      const oy = (rand() - 0.5) * 0.08 * size
      const r = (m.rx + (rand() - 0.5) * 0.05) * size
      const g = ctx.createRadialGradient(
        m.x * size + ox,
        m.y * size + oy,
        r * 0.05,
        m.x * size + ox,
        m.y * size + oy,
        r
      )
      g.addColorStop(0, `rgba(38, 66, 128, ${m.a})`)
      g.addColorStop(0.55, `rgba(62, 96, 162, ${m.a * 0.72})`)
      g.addColorStop(1, 'rgba(110, 144, 200, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(m.x * size + ox, m.y * size + oy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Medium & small craters
  for (let i = 0; i < 240; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 3 + Math.pow(rand(), 2.4) * 38
    const dark = 0.08 + rand() * 0.18

    // Crater shadow basin
    const cg = ctx.createRadialGradient(x, y, r * 0.1, x, y, r)
    cg.addColorStop(0, `rgba(74, 102, 156, ${dark})`)
    cg.addColorStop(0.75, `rgba(110, 140, 195, ${dark * 0.45})`)
    cg.addColorStop(0.92, `rgba(245, 250, 255, ${dark * 0.85})`)
    cg.addColorStop(1, 'rgba(245, 250, 255, 0)')
    ctx.fillStyle = cg
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Bright Tycho-like crater + radiating rays in lower region
  const tx = size * 0.44
  const ty = size * 0.72
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + (rand() - 0.5) * 0.25
    const len = size * (0.15 + rand() * 0.28)
    const grad = ctx.createLinearGradient(
      tx,
      ty,
      tx + Math.cos(angle) * len,
      ty + Math.sin(angle) * len
    )
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
    grad.addColorStop(0.4, 'rgba(235, 245, 255, 0.22)')
    grad.addColorStop(1, 'rgba(235, 245, 255, 0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = 3 + rand() * 8
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(tx + Math.cos(angle) * len, ty + Math.sin(angle) * len)
    ctx.stroke()
  }

  const tychoGlow = ctx.createRadialGradient(tx, ty, 2, tx, ty, 28)
  tychoGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  tychoGlow.addColorStop(0.5, 'rgba(235, 245, 255, 0.45)')
  tychoGlow.addColorStop(1, 'rgba(235, 245, 255, 0)')
  ctx.fillStyle = tychoGlow
  ctx.beginPath()
  ctx.arc(tx, ty, 28, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

function createHaloTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.14,
    size / 2,
    size / 2,
    size * 0.5
  )
  g.addColorStop(0, 'rgba(210, 235, 255, 0.75)')
  g.addColorStop(0.32, 'rgba(130, 190, 255, 0.34)')
  g.addColorStop(0.65, 'rgba(56, 130, 255, 0.1)')
  g.addColorStop(1, 'rgba(20, 60, 200, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function Moon({ position = [-6.2, 4.3, -15] }) {
  const moonRef = useRef()
  const haloRef = useRef()

  const moonTex = useMemo(() => createMoonTexture(), [])
  const haloTex = useMemo(() => createHaloTexture(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.025
      moonRef.current.position.y = position[1] + Math.sin(t * 0.35) * 0.08
    }
    if (haloRef.current) {
      const pulse = 1 + Math.sin(t * 0.9) * 0.035
      haloRef.current.scale.set(7.4 * pulse, 7.4 * pulse, 1)
      haloRef.current.position.y = position[1] + Math.sin(t * 0.35) * 0.08
    }
  })

  return (
    <group>
      {/* Glowing Moon Sphere */}
      <mesh ref={moonRef} position={position}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshStandardMaterial
          map={moonTex}
          emissiveMap={moonTex}
          emissive="#c4ddff"
          emissiveIntensity={0.68}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Atmospheric Corona / Halo Sprite */}
      <sprite ref={haloRef} position={[position[0], position[1], position[2] - 0.3]} scale={[7.4, 7.4, 1]}>
        <spriteMaterial
          map={haloTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}
