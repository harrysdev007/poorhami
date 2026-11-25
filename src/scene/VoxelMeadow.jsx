import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Shared terrain height function so the meadow base, voxel grass blades,
 * wildflowers, and the hamster all align to the exact same curved hill surface!
 * Gently slopes downward from left to right, matching the reference photo.
 */
export function getHillHeight(x, z) {
  // Gentle downward slope from left (-x) to right (+x)
  const slope = -x * 0.085
  // Subtle rounded hill curvature
  const arch = -0.012 * x * x - 0.018 * (z + 2) * (z + 2) * 0.35
  // Soft organic undulation
  const wave =
    Math.sin(x * 0.35 + z * 0.25) * 0.08 +
    Math.cos(x * 0.22 - z * 0.4) * 0.06
  return -1.05 + slope + arch + wave
}

export default function VoxelMeadow({ windStrength = 1.0 }) {
  const grassRef = useRef()
  const flowerRef = useRef()
  const grassUniforms = useRef({
    uTime: { value: 0 },
    uWind: { value: windStrength },
  })

  // Solid base ground mesh underneath the grass voxels so there are no gaps
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(46, 30, 72, 52)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, getHillHeight(x, z) - 0.02)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Generate lush fine-grained 3D voxel grass tufts
  const { grassData, flowerData } = useMemo(() => {
    let seed = 13379
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    const grassPalette = [
      new THREE.Color('#00b838'), // rich emerald
      new THREE.Color('#16c43e'), // vibrant meadow green
      new THREE.Color('#0a8f2c'), // deep lush green
      new THREE.Color('#2cd447'), // fresh lime
      new THREE.Color('#12a834'), // classic grass
      new THREE.Color('#47c41d'), // sunlit tip
      new THREE.Color('#087a24'), // shadow green
    ]

    const flowerPalette = [
      new THREE.Color('#facc15'), // yellow buttercup
      new THREE.Color('#fef08a'), // pale yellow
      new THREE.Color('#ffffff'), // white daisy
      new THREE.Color('#fb923c'), // warm orange
      new THREE.Color('#f43f5e'), // red-pink wildflower
      new THREE.Color('#fde047'), // bright gold
    ]

    const grass = []
    const flowers = []

    // Fine, dense voxel grass meadow covering the full visible horizon
    const stepX = 0.165
    const stepZ = 0.165
    for (let gx = -13.5; gx <= 14.5; gx += stepX) {
      for (let gz = -11.0; gz <= 6.2; gz += stepZ) {
        // Sparser in deep distance to maintain 60fps
        if (gz < -5.5 && rand() < 0.45) continue
        if (Math.abs(gx) > 8.5 && rand() < 0.35) continue

        const x = gx + (rand() - 0.5) * 0.13
        const z = gz + (rand() - 0.5) * 0.13
        const y = getHillHeight(x, z)

        const w = 0.065 + rand() * 0.048
        const h = 0.13 + rand() * 0.22
        const rotY = rand() * Math.PI
        const color = grassPalette[Math.floor(rand() * grassPalette.length)].clone()
        color.offsetHSL((rand() - 0.5) * 0.015, 0.05, (rand() - 0.5) * 0.06)

        grass.push({ x, y, z, w, h, rotY, color })

        // Scatter colorful voxel wildflowers across the meadow
        const distToHamster = Math.hypot(x - 2.05, z - 0.65)
        if (distToHamster > 1.1 && gz > -6.5 && rand() < 0.022) {
          const fc = flowerPalette[Math.floor(rand() * flowerPalette.length)]
          flowers.push({
            x,
            y: y + h * 0.78,
            z,
            s: 0.055 + rand() * 0.04,
            rotY: rand() * Math.PI,
            color: fc,
          })
          if (rand() < 0.6) {
            flowers.push({
              x: x + (rand() - 0.5) * 0.11,
              y: y + h * 0.72,
              z: z + (rand() - 0.5) * 0.11,
              s: 0.045 + rand() * 0.032,
              rotY: rand() * Math.PI,
              color:
                rand() < 0.5
                  ? new THREE.Color('#ffffff')
                  : flowerPalette[Math.floor(rand() * flowerPalette.length)],
            })
          }
        }
      }
    }

    return { grassData: grass, flowerData: flowers }
  }, [])

  // Custom MeshStandardMaterial with GPU wind sway on the top of each grass voxel!
  const grassMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.02,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = grassUniforms.current.uTime
      shader.uniforms.uWind = grassUniforms.current.uWind

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uWind;`
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // Only bend the upper part of each grass voxel (y > 0)
        float tipFactor = clamp((position.y + 0.5), 0.0, 1.0);
        vec4 instOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float swayX = sin(uTime * 1.9 + instOrigin.x * 0.65 + instOrigin.z * 0.45) * 0.16 * uWind;
        float swayZ = cos(uTime * 1.45 + instOrigin.x * 0.4 + instOrigin.z * 0.7) * 0.1 * uWind;
        transformed.x += swayX * tipFactor * tipFactor;
        transformed.z += swayZ * tipFactor * tipFactor;`
      )
    }

    return mat
  }, [])

  // Populate grass InstancedMesh
  useEffect(() => {
    if (!grassRef.current) return
    const dummy = new THREE.Object3D()
    grassData.forEach((g, i) => {
      dummy.position.set(g.x, g.y + g.h * 0.42, g.z)
      dummy.rotation.set(0, g.rotY, 0)
      dummy.scale.set(g.w, g.h, g.w)
      dummy.updateMatrix()
      grassRef.current.setMatrixAt(i, dummy.matrix)
      grassRef.current.setColorAt(i, g.color)
    })
    grassRef.current.instanceMatrix.needsUpdate = true
    if (grassRef.current.instanceColor) {
      grassRef.current.instanceColor.needsUpdate = true
    }
  }, [grassData])

  // Populate flower InstancedMesh
  useEffect(() => {
    if (!flowerRef.current) return
    const dummy = new THREE.Object3D()
    flowerData.forEach((f, i) => {
      dummy.position.set(f.x, f.y, f.z)
      dummy.rotation.set(0, f.rotY, 0)
      dummy.scale.set(f.s, f.s * 0.75, f.s)
      dummy.updateMatrix()
      flowerRef.current.setMatrixAt(i, dummy.matrix)
      flowerRef.current.setColorAt(i, f.color)
    })
    flowerRef.current.instanceMatrix.needsUpdate = true
    if (flowerRef.current.instanceColor) {
      flowerRef.current.instanceColor.needsUpdate = true
    }
  }, [flowerData])

  useFrame((state) => {
    grassUniforms.current.uTime.value = state.clock.elapsedTime
    grassUniforms.current.uWind.value = THREE.MathUtils.lerp(
      grassUniforms.current.uWind.value,
      windStrength,
      0.06
    )
  })

  return (
    <group>
      {/* Solid lush green hill base */}
      <mesh geometry={groundGeo} receiveShadow>
        <meshStandardMaterial color="#15803d" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Instanced 3D voxel grass tufts with GPU wind wave */}
      <instancedMesh
        ref={grassRef}
        args={[null, null, grassData.length]}
        material={grassMaterial}
        receiveShadow
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* Instanced 3D voxel wildflowers */}
      <instancedMesh
        ref={flowerRef}
        args={[null, null, flowerData.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.55}
          metalness={0.0}
          emissive="#422006"
          emissiveIntensity={0.22}
        />
      </instancedMesh>
    </group>
  )
}
