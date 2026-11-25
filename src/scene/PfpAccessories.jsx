import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 3D Voxel Hats, Glasses, and Orbiting Auras mounted directly to the
 * normalized hamster body (height = 2.25, feet at y = 0).
 */

function VoxelCrown() {
  const gold = '#fde047'
  const darkGold = '#eab308'
  return (
    <group position={[0, 1.99, 0.08]} rotation={[0.08, 0, 0]} scale={0.76}>
      {/* Crown base ring */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.72, 0.16, 0.56]} />
        <meshStandardMaterial
          color={gold}
          emissive="#ca8a04"
          emissiveIntensity={0.5}
          metalness={0.45}
          roughness={0.22}
        />
      </mesh>
      {/* 3 front spikes + 2 side spikes */}
      {[-0.28, 0, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.2]}>
          <boxGeometry args={[0.14, i === 1 ? 0.28 : 0.22, 0.14]} />
          <meshStandardMaterial
            color={gold}
            emissive="#ca8a04"
            emissiveIntensity={0.55}
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>
      ))}
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={`b-${i}`} position={[x, 0.16, -0.2]}>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          <meshStandardMaterial
            color={darkGold}
            emissive="#a16207"
            emissiveIntensity={0.4}
            metalness={0.45}
            roughness={0.25}
          />
        </mesh>
      ))}
      {/* Glowing emerald & ruby gems */}
      <mesh position={[0, 0.02, 0.3]}>
        <boxGeometry args={[0.12, 0.1, 0.05]} />
        <meshBasicMaterial color="#4ade80" toneMapped={false} />
      </mesh>
      <mesh position={[-0.24, 0.02, 0.3]}>
        <boxGeometry args={[0.09, 0.09, 0.05]} />
        <meshBasicMaterial color="#f43f5e" toneMapped={false} />
      </mesh>
      <mesh position={[0.24, 0.02, 0.3]}>
        <boxGeometry args={[0.09, 0.09, 0.05]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
    </group>
  )
}

function McDCap() {
  return (
    <group position={[0, 1.98, 0.12]} rotation={[-0.08, 0, 0]} scale={0.86}>
      {/* Cap dome */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.84, 0.26, 0.78]} />
        <meshStandardMaterial color="#dc2626" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.24, -0.02]}>
        <boxGeometry args={[0.64, 0.12, 0.62]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.65} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, -0.02, 0.52]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.82, 0.07, 0.44]} />
        <meshStandardMaterial color="#991b1b" roughness={0.55} />
      </mesh>
      {/* Golden pixel 'M' logo */}
      <mesh position={[-0.12, 0.1, 0.41]}>
        <boxGeometry args={[0.06, 0.16, 0.04]} />
        <meshBasicMaterial color="#facc15" toneMapped={false} />
      </mesh>
      <mesh position={[0.12, 0.1, 0.41]}>
        <boxGeometry args={[0.06, 0.16, 0.04]} />
        <meshBasicMaterial color="#facc15" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.14, 0.41]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshBasicMaterial color="#facc15" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.08, 0.41]}>
        <boxGeometry args={[0.06, 0.1, 0.04]} />
        <meshBasicMaterial color="#facc15" toneMapped={false} />
      </mesh>
    </group>
  )
}

function WizardHat() {
  return (
    <group position={[0, 1.98, 0.04]} rotation={[-0.1, 0, -0.06]} scale={0.82}>
      {/* Wide brim */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.18, 0.08, 1.12]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.65} />
      </mesh>
      {/* Stepped voxel cone */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.74, 0.24, 0.72]} />
        <meshStandardMaterial color="#5b21b6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.38, -0.04]}>
        <boxGeometry args={[0.5, 0.24, 0.48]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.55} />
      </mesh>
      <mesh position={[0.04, 0.58, -0.1]}>
        <boxGeometry args={[0.28, 0.22, 0.28]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.5} />
      </mesh>
      {/* Gold band + star */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.78, 0.07, 0.76]} />
        <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0.38]}>
        <boxGeometry args={[0.12, 0.12, 0.04]} />
        <meshBasicMaterial color="#fde047" toneMapped={false} />
      </mesh>
    </group>
  )
}

function AngelHalo() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 2.38 + Math.sin(state.clock.elapsedTime * 2.5) * 0.05
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.4) * 0.06
    }
  })
  return (
    <mesh ref={ref} position={[0, 2.38, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.42, 0.055, 12, 32]} />
      <meshBasicMaterial color="#fde047" toneMapped={false} />
    </mesh>
  )
}

function PixelShades() {
  return (
    <group position={[0, 1.68, 0.62]} scale={0.96}>
      {/* Main black pixel frame */}
      <mesh position={[-0.22, 0, 0]}>
        <boxGeometry args={[0.32, 0.14, 0.06]} />
        <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0.22, 0, 0]}>
        <boxGeometry args={[0.32, 0.14, 0.06]} />
        <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Nose bridge */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.16, 0.06, 0.06]} />
        <meshStandardMaterial color="#09090b" roughness={0.2} />
      </mesh>
      {/* Iconic white pixel reflection glare */}
      <mesh position={[-0.27, 0.02, 0.035]}>
        <boxGeometry args={[0.07, 0.05, 0.02]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[-0.19, -0.02, 0.035]}>
        <boxGeometry args={[0.05, 0.04, 0.02]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.17, 0.02, 0.035]}>
        <boxGeometry args={[0.07, 0.05, 0.02]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.25, -0.02, 0.035]}>
        <boxGeometry args={[0.05, 0.04, 0.02]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function LaserEyes() {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const pulse = 0.92 + Math.sin(state.clock.elapsedTime * 14) * 0.14
    ref.current.scale.set(1, pulse, 1)
  })
  return (
    <group ref={ref} position={[0, 1.74, 0.6]}>
      {[-0.2, 0.2].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* Glowing core */}
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial color="#ff2a55" toneMapped={false} />
          </mesh>
          {/* Horizontal flare */}
          <mesh>
            <boxGeometry args={[0.55, 0.045, 0.045]} />
            <meshBasicMaterial color="#ff6b8b" toneMapped={false} />
          </mesh>
          {/* Forward laser beam */}
          <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.06, 1.9, 12]} />
            <meshBasicMaterial
              color="#ff1e42"
              transparent
              opacity={0.78}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function CyberVisor() {
  return (
    <group position={[0, 1.74, 0.62]}>
      <mesh>
        <boxGeometry args={[0.84, 0.17, 0.07]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.88, 0.035, 0.09]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.88, 0.035, 0.09]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function OrbitingAura({ type }) {
  const groupRef = useRef()
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.75
    }
  })

  if (type === 'none') return null

  const items = [0, 1, 2, 3, 4, 5]
  return (
    <group ref={groupRef} position={[0, 1.25, -0.35]}>
      {items.map((i) => {
        const angle = (i / items.length) * Math.PI * 2
        const r = 1.48
        const x = Math.cos(angle) * r
        const z = -Math.abs(Math.sin(angle)) * 0.9 - 0.15
        const y = Math.sin(angle * 2) * 0.35

        if (type === 'coins') {
          return (
            <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, angle]}>
              <cylinderGeometry args={[0.14, 0.14, 0.04, 16]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#ca8a04"
                emissiveIntensity={0.6}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          )
        }

        if (type === 'candles') {
          return (
            <group key={i} position={[x, y, z]}>
              <mesh>
                <boxGeometry args={[0.1, 0.34, 0.1]} />
                <meshBasicMaterial color="#ef4444" toneMapped={false} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.025, 0.54, 0.025]} />
                <meshBasicMaterial color="#fca5a5" toneMapped={false} />
              </mesh>
            </group>
          )
        }

        // 'sparkles'
        return (
          <mesh key={i} position={[x, y, z]} rotation={[0.4, angle, 0.4]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? '#67e8f9' : '#e879f9'}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export default function PfpAccessories({ hat, glasses, aura }) {
  return (
    <group>
      {hat === 'crown' && <VoxelCrown />}
      {hat === 'mcd' && <McDCap />}
      {hat === 'wizard' && <WizardHat />}
      {hat === 'halo' && <AngelHalo />}

      {glasses === 'shades' && <PixelShades />}
      {glasses === 'lasers' && <LaserEyes />}
      {glasses === 'visor' && <CyberVisor />}

      <OrbitingAura type={aura} />
    </group>
  )
}
