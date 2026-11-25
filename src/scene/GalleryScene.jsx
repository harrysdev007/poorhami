import React, { Suspense, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import VoxelCanyon, { GallerySky } from './VoxelCanyon.jsx'
import HologramGallery from './HologramGallery.jsx'

function GalleryCameraRig({ freeCamera, isMobile }) {
  const targetLook = useRef(new THREE.Vector3(0, 0.45, -0.6))
  const desiredPos = useRef(new THREE.Vector3(0, 0.72, 5.55))

  useFrame((state) => {
    if (freeCamera) return
    const t = state.clock.elapsedTime
    const px = isMobile ? state.pointer.x * 0.3 : state.pointer.x
    const py = isMobile ? state.pointer.y * 0.2 : state.pointer.y

    if (isMobile) {
      desiredPos.current.set(
        px * 0.3 + Math.sin(t * 0.3) * 0.05,
        0.35 + py * 0.18 + Math.cos(t * 0.4) * 0.04,
        8.65 + Math.sin(t * 0.25) * 0.05
      )
      targetLook.current.set(px * 0.1, 0.28 + py * 0.08, 0.1)
    } else {
      desiredPos.current.set(
        px * 0.65 + Math.sin(t * 0.3) * 0.1,
        0.72 + py * 0.28 + Math.cos(t * 0.4) * 0.05,
        5.55 + Math.sin(t * 0.25) * 0.08
      )
      targetLook.current.set(px * 0.2, 0.45 + py * 0.12, -0.6)
    }

    state.camera.position.lerp(desiredPos.current, 0.05)
    state.camera.lookAt(targetLook.current)
  })

  return null
}

export default function GalleryScene({ freeCamera, onSelectMeme }) {
  const { size } = useThree()
  const isMobile = size.width < 768

  return (
    <>
      <color attach="background" args={['#090433']} />
      <fog attach="fog" args={['#120c52', 13, 38]} />

      <GalleryCameraRig freeCamera={freeCamera} isMobile={isMobile} />
      {freeCamera && (
        <OrbitControls
          target={[0, 0.45, -0.4]}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={2.5}
          maxDistance={11}
        />
      )}

      {/* === CYBER-TWILIGHT LIGHTING === */}
      <hemisphereLight args={['#a5b4fc', '#0e7490', 0.9]} />

      <directionalLight
        position={[7, 9, 5]}
        intensity={1.9}
        color="#c4b5fd"
      />

      <pointLight
        position={[-4, 2.2, 2.5]}
        intensity={3.5}
        distance={14}
        color="#22d3ee"
      />

      <pointLight
        position={[4, 2.2, 2.5]}
        intensity={3.2}
        distance={14}
        color="#e879f9"
      />

      <pointLight
        position={[0, -0.8, 0.5]}
        intensity={2.4}
        distance={9}
        color="#06b6d4"
      />

      {/* === 3D GALLERY WORLD === */}
      <GallerySky />
      <VoxelCanyon />

      <Suspense fallback={null}>
        <HologramGallery onSelectMeme={onSelectMeme} isMobile={isMobile} />
      </Suspense>

      {/* === POST-PROCESSING === */}
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.85}
          mipmapBlur
          intensity={0.62}
          radius={0.68}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.44} />
      </EffectComposer>
    </>
  )
}
