import React, { Suspense, useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import PfpAccessories from './PfpAccessories.jsx'

export const PFP_BACKDROPS = {
  moon: {
    label: 'Moonlit',
    top: '#03084a',
    bottom: '#0b3fc9',
    accent: '#60a5fa',
    ring: '#38bdf8',
    key: '#fff4e6',
    rim: '#60a5fa',
  },
  cyber: {
    label: 'Cyber Neon',
    top: '#18043d',
    bottom: '#9d174d',
    accent: '#22d3ee',
    ring: '#e879f9',
    key: '#fdf2f8',
    rim: '#22d3ee',
  },
  gold: {
    label: 'Golden Bull',
    top: '#2e1005',
    bottom: '#d97706',
    accent: '#fde047',
    ring: '#facc15',
    key: '#fef9c3',
    rim: '#fb923c',
  },
  rekt: {
    label: 'Liquidated',
    top: '#1c0309',
    bottom: '#991b1b',
    accent: '#f87171',
    ring: '#ef4444',
    key: '#fee2e2',
    rim: '#f43f5e',
  },
  matrix: {
    label: 'Emerald',
    top: '#022114',
    bottom: '#059669',
    accent: '#4ade80',
    ring: '#34d399',
    key: '#ecfdf5',
    rim: '#4ade80',
  },
}

function StudioBackdrop({ theme }) {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(theme.top) },
        uBottom: { value: new THREE.Color(theme.bottom) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uBottom;
        varying vec3 vPos;
        void main() {
          float h = clamp(vPos.y * 1.15 + 0.45, 0.0, 1.0);
          vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [])

  useEffect(() => {
    mat.uniforms.uTop.value.set(theme.top)
    mat.uniforms.uBottom.value.set(theme.bottom)
  }, [theme, mat])

  return (
    <mesh material={mat}>
      <sphereGeometry args={[45, 32, 24]} />
    </mesh>
  )
}

function FloatingStudioCubes({ accent }) {
  const meshRef = useRef()
  const { cubes, dummy } = useMemo(() => {
    let seed = 99123
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    const list = []
    for (let i = 0; i < 85; i++) {
      const x = (rand() - 0.5) * 18
      const y = -2.2 + rand() * 7.2
      const z = -2.4 - rand() * 9.0
      list.push({
        x,
        y,
        z,
        s: 0.1 + rand() * 0.22,
        phase: rand() * Math.PI * 2,
        speed: 0.5 + rand() * 1.1,
      })
    }
    return { cubes: list, dummy: new THREE.Object3D() }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i]
      dummy.position.set(c.x, c.y + Math.sin(t * c.speed + c.phase) * 0.22, c.z)
      dummy.rotation.set(t * 0.3 + c.phase, t * 0.45, 0)
      dummy.scale.setScalar(c.s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, cubes.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={accent}
        emissive={accent}
        emissiveIntensity={0.7}
        roughness={0.35}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

function StudioPedestal({ ringColor }) {
  const ringRef = useRef()
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4
    }
  })

  return (
    <group position={[0, -1.08, 0]}>
      {/* Main dark cyber-voxel stage cylinder */}
      <mesh receiveShadow position={[0, -0.18, 0]}>
        <cylinderGeometry args={[1.55, 1.85, 0.36, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* Glowing top rim */}
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.48, 0.045, 12, 32]} />
        <meshBasicMaterial color={ringColor} toneMapped={false} />
      </mesh>
      {/* Glowing backdrop portal ring behind hamster */}
      <mesh position={[0, 1.32, -1.55]}>
        <torusGeometry args={[1.55, 0.05, 16, 48]} />
        <meshBasicMaterial color={ringColor} toneMapped={false} />
      </mesh>
    </group>
  )
}

function PfpHamster({ hat, glasses, aura, spin }) {
  const { scene } = useGLTF('/models/hamster.glb', '/draco/')
  const rootRef = useRef()

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
          child.material.envMapIntensity = 0.9
          if (typeof child.material.roughness === 'number') {
            child.material.roughness = Math.max(child.material.roughness, 0.55)
          }
          child.material.needsUpdate = true
        }
      }
    })
    return clone
  }, [scene])

  useFrame((state, delta) => {
    if (!rootRef.current) return
    const t = state.clock.elapsedTime
    const breathe = Math.sin(t * 2.1) * 0.014
    rootRef.current.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5)
    if (spin) {
      rootRef.current.rotation.y += delta * 0.55
    } else {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        Math.sin(t * 0.8) * 0.08,
        0.08
      )
    }
  })

  return (
    <group ref={rootRef} position={[0, -1.06, 0]}>
      <primitive object={normalizedScene} />
      <PfpAccessories hat={hat} glasses={glasses} aura={aura} />
    </group>
  )
}

export default function PfpStudioScene({
  backdrop,
  hat,
  glasses,
  aura,
  spin,
}) {
  const { size, camera } = useThree()
  const isMobile = size.width < 768
  const theme = PFP_BACKDROPS[backdrop] || PFP_BACKDROPS.moon

  useEffect(() => {
    if (isMobile) {
      camera.position.set(0, 0.15, 7.25)
    } else {
      camera.position.set(0, 0.25, 4.15)
    }
    camera.updateProjectionMatrix()
  }, [isMobile, camera])

  return (
    <>
      <StudioBackdrop theme={theme} />

      <OrbitControls
        target={isMobile ? [0, -0.92, 0] : [0, 0.12, 0]}
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={3.0}
        maxDistance={8.5}
        maxPolarAngle={Math.PI * 0.56}
        minPolarAngle={Math.PI * 0.25}
      />

      {/* Studio Portrait Lighting */}
      <hemisphereLight args={[theme.accent, '#1e293b', 0.9]} />

      <directionalLight
        position={[3.5, 4.5, 5.5]}
        intensity={2.1}
        color={theme.key}
        castShadow
      />

      <directionalLight
        position={[-4.5, 4.0, -3.0]}
        intensity={2.0}
        color={theme.rim}
      />

      <pointLight
        position={[0, 1.4, -2.2]}
        intensity={3.5}
        distance={10}
        color={theme.ring}
      />

      <Environment resolution={256} frames={1}>
        <Lightformer
          form="circle"
          intensity={3.0}
          color={theme.key}
          position={[4, 4, 5]}
          scale={5}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color={theme.rim}
          position={[-5, 3, -3]}
          scale={[6, 4, 1]}
        />
      </Environment>

      <FloatingStudioCubes accent={theme.accent} />
      <StudioPedestal ringColor={theme.ring} />

      <ContactShadows
        position={[0, -1.06, 0]}
        opacity={0.65}
        scale={4.0}
        blur={2.0}
        far={2.4}
      />

      <Suspense fallback={null}>
        <PfpHamster hat={hat} glasses={glasses} aura={aura} spin={spin} />
      </Suspense>

      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.9}
          mipmapBlur
          intensity={0.52}
          radius={0.62}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.36} />
      </EffectComposer>
    </>
  )
}
