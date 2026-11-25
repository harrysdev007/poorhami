import React, { Suspense, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from '@react-three/drei'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import VoxelSky from './VoxelSky.jsx'
import Moon from './Moon.jsx'
import VoxelMeadow, { getHillHeight } from './VoxelMeadow.jsx'
import Fireflies from './Fireflies.jsx'
import HamsterModel from './HamsterModel.jsx'
import VoxelTitle from './VoxelTitle.jsx'

/**
 * Smooth living camera rig with subtle mouse parallax and gentle breathing drift
 * when OrbitControls is off.
 */
function CameraRig({ freeCamera, isMobile }) {
  const targetLook = useRef(new THREE.Vector3(0.45, 0.35, -1.2))
  const desiredPos = useRef(new THREE.Vector3(0.15, 0.55, 5.4))

  useFrame((state) => {
    if (freeCamera) return
    const t = state.clock.elapsedTime
    const px = isMobile ? state.pointer.x * 0.35 : state.pointer.x
    const py = isMobile ? state.pointer.y * 0.25 : state.pointer.y

    if (isMobile) {
      desiredPos.current.set(
        px * 0.35 + Math.sin(t * 0.35) * 0.06,
        0.85 + py * 0.18 + Math.cos(t * 0.45) * 0.04,
        6.95 + Math.sin(t * 0.28) * 0.06
      )
      targetLook.current.set(px * 0.12, 0.38 + py * 0.1, -0.8)
    } else {
      desiredPos.current.set(
        0.15 + px * 0.48 + Math.sin(t * 0.35) * 0.08,
        0.55 + py * 0.24 + Math.cos(t * 0.45) * 0.05,
        5.4 + Math.sin(t * 0.28) * 0.08
      )
      targetLook.current.set(0.45 + px * 0.18, 0.32 + py * 0.12, -1.2)
    }

    state.camera.position.lerp(desiredPos.current, 0.05)
    state.camera.lookAt(targetLook.current)
  })

  return null
}

export default function Scene({ freeCamera, windStrength, onPokeHamster }) {
  const { size } = useThree()
  const isMobile = size.width < 768

  const hamsterX = isMobile ? 0.08 : 2.05
  const hamsterZ = isMobile ? 0.65 : 0.65
  const hamsterGroundY = getHillHeight(hamsterX, hamsterZ) + 0.02

  return (
    <>
      {/* Deep night atmospheric fog blending far horizon into sky */}
      <color attach="background" args={['#020a5c']} />
      <fog attach="fog" args={['#06259e', 14, 42]} />

      {/* Camera controller */}
      <CameraRig freeCamera={freeCamera} isMobile={isMobile} />
      {freeCamera && (
        <OrbitControls
          target={[1.2, 0.3, 0.2]}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={2.2}
          maxDistance={12}
        />
      )}

      {/* === CINEMATIC LIGHTING SETUP === */}
      {/* Sky-to-grass hemisphere bounce light */}
      <hemisphereLight args={['#6ea8ff', '#22c55e', 0.95]} />

      {/* Primary Moonlight from top-left (matching Moon position) */}
      <directionalLight
        position={[-8, 9, 4]}
        intensity={2.6}
        color="#dceeff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0004}
      />

      {/* Soft warm-neutral front key light on the hamster & wallet */}
      <directionalLight
        position={[3.5, 3.8, 6.5]}
        intensity={1.75}
        color="#fff4e6"
      />

      {/* Cool cyan rim light from behind-left to separate fur silhouette from dark blue sky */}
      <pointLight
        position={[-2.5, 3.2, -3.5]}
        intensity={4.2}
        distance={14}
        color="#60a5fa"
      />

      {/* Subtle green grass bounce light illuminating the hamster's fluffy underside */}
      <pointLight
        position={[hamsterX, hamsterGroundY + 0.15, 2.2]}
        intensity={0.45}
        distance={4.5}
        color="#4ade80"
      />

      {/* Procedural IBL Environment for crisp speculars on eyes & leather wallet */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="circle"
          intensity={3.5}
          color="#dbeafe"
          position={[-6, 6, -4]}
          scale={5}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#fff7ed"
          position={[4, 3, 6]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#22c55e"
          position={[0, -4, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[18, 18, 1]}
        />
      </Environment>

      {/* === 3D WORLD === */}
      <VoxelSky />
      <Moon position={isMobile ? [-2.4, 5.4, -14.5] : [-5.6, 3.7, -14.5]} />
      <VoxelMeadow windStrength={windStrength} />
      <Fireflies count={52} />

      {/* Levitating 3D pixel title + subtitle */}
      <VoxelTitle
        text="$POORHAMI"
        subtitle="AVERAGE MEMECOIN TRADER"
        position={isMobile ? [0, 1.95, 0.1] : [-1.02, 0.42, 0.45]}
        rotation={isMobile ? [0.04, 0, 0] : [0.03, 0.16, 0.015]}
        scale={isMobile ? 0.5 : 0.68}
      />

      {/* Grounded contact shadow directly beneath the hamster */}
      <ContactShadows
        position={[hamsterX, hamsterGroundY + 0.01, hamsterZ]}
        opacity={0.62}
        scale={4.2}
        blur={2.1}
        far={2.4}
        color="#042f12"
      />

      {/* Compressed 3D Hamster GLB */}
      <Suspense fallback={null}>
        <HamsterModel
          onPoke={onPokeHamster}
          positionX={hamsterX}
          positionZ={hamsterZ}
          baseRotY={isMobile ? -0.05 : -0.22}
        />
      </Suspense>

      {/* === POST-PROCESSING === */}
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.92}
          mipmapBlur
          intensity={0.55}
          radius={0.65}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.00055, 0.00055)}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.42} />
      </EffectComposer>
    </>
  )
}
