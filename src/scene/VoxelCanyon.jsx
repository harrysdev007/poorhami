import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Cosmic twilight sky dome for the Meme Gallery world (deep violet-indigo
 * with electric cyan horizon glow).
 */
export function GallerySky() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color('#07022b') },
        uMidColor: { value: new THREE.Color('#180a5e') },
        uHorizonColor: { value: new THREE.Color('#0e3c9c') },
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
          float h = clamp(dir.y * 1.35 + 0.14, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.4, h));
          col = mix(col, uTopColor, smoothstep(0.35, 0.92, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [])

  const starsRef = useRef()
  const { stars, dummy } = useMemo(() => {
    let seed = 54321
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    const palette = [
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#67e8f9'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#f472b6'),
      new THREE.Color('#ffffff'),
    ]
    const list = []
    for (let i = 0; i < 150; i++) {
      list.push({
        x: (rand() - 0.5) * 46,
        y: 0.8 + rand() * 14,
        z: -13 - rand() * 22,
        s: 0.08 + rand() * 0.15,
        phase: rand() * Math.PI * 2,
        speed: 1.1 + rand() * 2.5,
        color: palette[Math.floor(rand() * palette.length)],
      })
    }
    return { stars: list, dummy: new THREE.Object3D() }
  }, [])

  useEffect(() => {
    if (!starsRef.current) return
    stars.forEach((s, i) => starsRef.current.setColorAt(i, s.color))
    if (starsRef.current.instanceColor) {
      starsRef.current.instanceColor.needsUpdate = true
    }
  }, [stars])

  useFrame((state) => {
    if (!starsRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i]
      const tw = 0.65 + 0.45 * Math.sin(t * s.speed + s.phase)
      dummy.position.set(s.x, s.y, s.z)
      dummy.rotation.set(0, t * 0.2 + s.phase, 0)
      dummy.scale.setScalar(s.s * tw)
      dummy.updateMatrix()
      starsRef.current.setMatrixAt(i, dummy.matrix)
    }
    starsRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh material={skyMat}>
        <sphereGeometry args={[65, 32, 24]} />
      </mesh>

      {/* Twinkling voxel stars */}
      <instancedMesh ref={starsRef} args={[null, null, stars.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Ringed Neon Planet in upper right sky */}
      <RingedPlanet position={[6.8, 4.4, -17]} />
    </group>
  )
}

function RingedPlanet({ position }) {
  const groupRef = useRef()
  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y += delta * 0.08
    groupRef.current.position.y = position[1] + Math.sin(t * 0.45) * 0.1
  })

  return (
    <group ref={groupRef} position={position} rotation={[0.32, 0, -0.28]}>
      <mesh>
        <sphereGeometry args={[1.65, 48, 48]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#6d28d9"
          emissiveIntensity={0.65}
          roughness={0.6}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.15, 3.05, 64]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.48}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/**
 * VoxelCanyon: A completely different voxel landscape from the home meadow —
 * terraced obsidian-violet voxel canyon cliffs framing a glowing animated
 * cyber-cyan voxel lake with luminous crystal spires & rising energy motes!
 */
export default function VoxelCanyon() {
  const terrainRef = useRef()
  const waterRef = useRef()
  const crystalRef = useRef()
  const motesRef = useRef()

  const waterUniforms = useRef({
    uTime: { value: 0 },
  })

  const { cliffBlocks, waterBlocks, crystalBlocks, motes } = useMemo(() => {
    let seed = 88213
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    const rockPalette = [
      new THREE.Color('#1e1b4b'), // deep indigo stone
      new THREE.Color('#312e81'), // twilight violet
      new THREE.Color('#1e293b'), // obsidian slate
      new THREE.Color('#3b0764'), // dark amethyst
      new THREE.Color('#172554'), // midnight blue
      new THREE.Color('#4c1d95'), // glowing purple edge
    ]

    const waterPalette = [
      new THREE.Color('#0891b2'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#0284c7'),
      new THREE.Color('#22d3ee'),
      new THREE.Color('#1d4ed8'),
    ]

    const crystalPalette = [
      new THREE.Color('#22d3ee'), // bright cyan crystal
      new THREE.Color('#e879f9'), // neon magenta crystal
      new THREE.Color('#a78bfa'), // violet crystal
      new THREE.Color('#34d399'), // emerald crystal
    ]

    const cliffs = []
    const water = []
    const crystals = []

    const step = 0.42
    for (let gx = -12.5; gx <= 12.5; gx += step) {
      for (let gz = -10.5; gz <= 5.5; gz += step) {
        if (gz < -6.5 && rand() < 0.3) continue

        // Canyon profile: flat glowing lake basin in center (|x| < 4.5),
        // terraced cliffs rising steeply on the left, right, and far back!
        const distCenter = Math.abs(gx)
        const backRise = gz < -4.2 ? Math.pow((-4.2 - gz) * 0.45, 1.45) : 0
        const sideRise =
          distCenter > 3.8 ? Math.pow((distCenter - 3.8) * 0.42, 1.45) : 0
        const noise =
          Math.sin(gx * 0.55 + gz * 0.35) * 0.25 +
          Math.cos(gx * 0.3 - gz * 0.6) * 0.2

        const elevation = sideRise + backRise + noise

        if (elevation < 0.28) {
          // Animated glowing voxel water surface
          const col = waterPalette[Math.floor(rand() * waterPalette.length)]
          water.push({
            x: gx,
            y: -1.65,
            z: gz,
            s: step * 0.96,
            color: col,
          })
        } else {
          // Quantized terraced voxel cliff column
          const quantH = Math.max(0.35, Math.round(elevation * 2.5) / 2.5)
          const col = rockPalette[Math.floor(rand() * rockPalette.length)].clone()
          // Subtle brighter tint on higher terraces
          col.offsetHSL(0, 0, Math.min(0.14, quantH * 0.035))
          cliffs.push({
            x: gx,
            y: -1.65 + quantH * 0.5,
            z: gz,
            w: step * 0.98,
            h: quantH + 0.5,
            color: col,
          })

          // Occasional glowing voxel crystals perched on the canyon ledges
          if (quantH > 0.55 && quantH < 2.6 && gz > -7.5 && rand() < 0.045) {
            const cc = crystalPalette[Math.floor(rand() * crystalPalette.length)]
            const ch = 0.28 + rand() * 0.55
            crystals.push({
              x: gx,
              y: -1.65 + quantH + ch * 0.42,
              z: gz,
              w: 0.1 + rand() * 0.09,
              h: ch,
              rotY: rand() * Math.PI,
              rotZ: (rand() - 0.5) * 0.28,
              color: cc,
            })
          }
        }
      }
    }

    // Rising neon energy motes over the canyon lake
    const moteList = []
    for (let i = 0; i < 65; i++) {
      moteList.push({
        x: (rand() - 0.5) * 14,
        y: -1.2 + rand() * 4.5,
        z: -5.5 + rand() * 8.5,
        speed: 0.35 + rand() * 0.55,
        phase: rand() * Math.PI * 2,
        s: 0.032 + rand() * 0.04,
        color: crystalPalette[Math.floor(rand() * crystalPalette.length)],
      })
    }

    return {
      cliffBlocks: cliffs,
      waterBlocks: water,
      crystalBlocks: crystals,
      motes: moteList,
    }
  }, [])

  // Animated rippling voxel water material
  const waterMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.35,
      emissive: '#083344',
      emissiveIntensity: 0.75,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = waterUniforms.current.uTime
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;`
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float ripple = sin(uTime * 2.1 + instPos.x * 0.9 + instPos.z * 0.7) * 0.075
                     + cos(uTime * 1.5 - instPos.x * 0.5 + instPos.z * 1.1) * 0.05;
        transformed.y += ripple;`
      )
    }
    return mat
  }, [])

  useEffect(() => {
    const dummy = new THREE.Object3D()

    if (terrainRef.current) {
      cliffBlocks.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(b.w, b.h, b.w)
        dummy.updateMatrix()
        terrainRef.current.setMatrixAt(i, dummy.matrix)
        terrainRef.current.setColorAt(i, b.color)
      })
      terrainRef.current.instanceMatrix.needsUpdate = true
      if (terrainRef.current.instanceColor) {
        terrainRef.current.instanceColor.needsUpdate = true
      }
    }

    if (waterRef.current) {
      waterBlocks.forEach((w, i) => {
        dummy.position.set(w.x, w.y, w.z)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(w.s, 0.22, w.s)
        dummy.updateMatrix()
        waterRef.current.setMatrixAt(i, dummy.matrix)
        waterRef.current.setColorAt(i, w.color)
      })
      waterRef.current.instanceMatrix.needsUpdate = true
      if (waterRef.current.instanceColor) {
        waterRef.current.instanceColor.needsUpdate = true
      }
    }

    if (crystalRef.current) {
      crystalBlocks.forEach((c, i) => {
        dummy.position.set(c.x, c.y, c.z)
        dummy.rotation.set(0, c.rotY, c.rotZ)
        dummy.scale.set(c.w, c.h, c.w)
        dummy.updateMatrix()
        crystalRef.current.setMatrixAt(i, dummy.matrix)
        crystalRef.current.setColorAt(i, c.color)
      })
      crystalRef.current.instanceMatrix.needsUpdate = true
      if (crystalRef.current.instanceColor) {
        crystalRef.current.instanceColor.needsUpdate = true
      }
    }

    if (motesRef.current) {
      motes.forEach((m, i) => motesRef.current.setColorAt(i, m.color))
      if (motesRef.current.instanceColor) {
        motesRef.current.instanceColor.needsUpdate = true
      }
    }
  }, [cliffBlocks, waterBlocks, crystalBlocks, motes])

  const moteDummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    waterUniforms.current.uTime.value = t

    if (motesRef.current) {
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        const rise = ((t * m.speed + m.phase) % 4.6) - 1.2
        const x = m.x + Math.sin(t * 0.9 + m.phase) * 0.28
        const pulse = 0.6 + 0.45 * Math.sin(t * 2.5 + m.phase)
        moteDummy.position.set(x, rise, m.z)
        moteDummy.rotation.set(t * 0.7, t * 1.1, 0)
        moteDummy.scale.setScalar(m.s * pulse)
        moteDummy.updateMatrix()
        motesRef.current.setMatrixAt(i, moteDummy.matrix)
      }
      motesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Terraced obsidian-violet voxel cliffs */}
      <instancedMesh
        ref={terrainRef}
        args={[null, null, cliffBlocks.length]}
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.78} metalness={0.18} />
      </instancedMesh>

      {/* Rippling cyber-cyan voxel lake */}
      <instancedMesh
        ref={waterRef}
        args={[null, null, waterBlocks.length]}
        material={waterMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* Glowing neon voxel crystal spires */}
      <instancedMesh
        ref={crystalRef}
        args={[null, null, crystalBlocks.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive="#67e8f9"
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.2}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Rising neon energy motes */}
      <instancedMesh ref={motesRef} args={[null, null, motes.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
