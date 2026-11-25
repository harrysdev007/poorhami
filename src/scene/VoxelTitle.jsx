import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GLYPHS = {
  $: [
    '..#..',
    '.####',
    '#.#..',
    '.###.',
    '..#.#',
    '####.',
    '..#..',
  ],
  A: [
    '.###.',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  C: [
    '.###.',
    '#...#',
    '#....',
    '#....',
    '#....',
    '#...#',
    '.###.',
  ],
  D: [
    '####.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '####.',
  ],
  E: [
    '#####',
    '#....',
    '#....',
    '####.',
    '#....',
    '#....',
    '#####',
  ],
  G: [
    '.###.',
    '#...#',
    '#....',
    '#.###',
    '#...#',
    '#...#',
    '.###.',
  ],
  H: [
    '#...#',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  I: [
    '.###.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  M: [
    '#...#',
    '##.##',
    '#.#.#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
  ],
  N: [
    '#...#',
    '##..#',
    '#.#.#',
    '#..##',
    '#...#',
    '#...#',
    '#...#',
  ],
  O: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  P: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  R: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  T: [
    '#####',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  V: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
  ],
  ' ': [],
}

const VOXEL_SIZE = 0.068
const VOXEL_STEP = 0.072
const LETTER_GAP = 1.35 // in voxel columns

function VoxelLetter({ char, xOffset, index, boxGeo, isSubtitle = false }) {
  const groupRef = useRef()
  const isDollar = char === '$'

  const blocks = useMemo(() => {
    const pattern = GLYPHS[char] || []
    const rows = pattern.length
    const cols = pattern[0]?.length || 0
    const list = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pattern[r][c] === '#') {
          const x = (c - (cols - 1) / 2) * VOXEL_STEP
          const y = ((rows - 1) / 2 - r) * VOXEL_STEP
          list.push({ x, y })
        }
      }
    }
    return list
  }, [char])

  // Shared materials per letter for crisp 3D extrusion & subtle bloom glow
  const { frontMat, sideMat } = useMemo(() => {
    const front = new THREE.MeshStandardMaterial({
      color: isDollar ? '#86efac' : isSubtitle ? '#bae6fd' : '#f0f9ff',
      emissive: isDollar ? '#22c55e' : isSubtitle ? '#38bdf8' : '#7dd3fc',
      emissiveIntensity: isDollar ? 0.65 : isSubtitle ? 0.48 : 0.42,
      roughness: 0.25,
      metalness: 0.15,
    })

    const back = new THREE.MeshStandardMaterial({
      color: isDollar ? '#064e3b' : '#0b1d5e',
      emissive: isDollar ? '#022c22' : '#050b2e',
      emissiveIntensity: 0.22,
      roughness: 0.4,
      metalness: 0.25,
    })

    return { frontMat: front, sideMat: back }
  }, [isDollar, isSubtitle])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const wave = Math.sin(t * 2.1 - index * (isSubtitle ? 0.32 : 0.52))
    groupRef.current.position.y = wave * (isSubtitle ? 0.05 : 0.075)
    groupRef.current.rotation.x = Math.cos(t * 1.4 - index * 0.4) * 0.055
    groupRef.current.rotation.z = Math.sin(t * 1.6 - index * 0.45) * 0.04
  })

  if (blocks.length === 0) return null

  return (
    <group ref={groupRef} position={[xOffset, 0, 0]}>
      {blocks.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          {/* Front bright glowing pixel block */}
          <mesh
            geometry={boxGeo}
            material={frontMat}
            scale={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE * 0.9]}
            castShadow
          />
          {/* Extruded 3D back depth block */}
          <mesh
            geometry={boxGeo}
            material={sideMat}
            position={[0.008, -0.014, -VOXEL_SIZE * 0.95]}
            scale={[VOXEL_SIZE * 1.04, VOXEL_SIZE * 1.04, VOXEL_SIZE * 1.55]}
          />
        </group>
      ))}
    </group>
  )
}

function buildLine(text, gapMultiplier = 1) {
  const chars = text.toUpperCase().split('')
  const colWidth = 5
  const stride = (colWidth + LETTER_GAP * gapMultiplier) * VOXEL_STEP
  const totalWidth = (chars.length - 1) * stride
  return chars.map((char, index) => ({
    char,
    index,
    xOffset: index * stride - totalWidth / 2,
  }))
}

export default function VoxelTitle({
  text = '$POORHAMI',
  subtitle = 'AVERAGE MEMECOIN TRADER',
  position = [-1.02, 0.42, 0.45],
  rotation = [0.03, 0.16, 0.015],
  scale = 0.68,
}) {
  const rootRef = useRef()
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const mainLetters = useMemo(() => buildLine(text, 1), [text])
  const subLetters = useMemo(
    () => (subtitle ? buildLine(subtitle, 0.85) : []),
    [subtitle]
  )

  useFrame((state) => {
    if (!rootRef.current) return
    const t = state.clock.elapsedTime
    rootRef.current.position.y = position[1] + Math.sin(t * 1.1) * 0.06
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      rotation[1] + state.pointer.x * 0.08,
      0.05
    )
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      rotation[0] - state.pointer.y * 0.05,
      0.05
    )
  })

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      {/* Main title: $POORHAMI */}
      {mainLetters.map((item) => (
        <VoxelLetter
          key={`main-${item.char}-${item.index}`}
          char={item.char}
          xOffset={item.xOffset}
          index={item.index}
          boxGeo={boxGeo}
        />
      ))}

      {/* Matching 3D pixel subtitle underneath */}
      {subLetters.length > 0 && (
        <group position={[0, -0.52, 0.05]} scale={0.39}>
          {subLetters.map((item) => (
            <VoxelLetter
              key={`sub-${item.char}-${item.index}`}
              char={item.char}
              xOffset={item.xOffset}
              index={item.index}
              boxGeo={boxGeo}
              isSubtitle
            />
          ))}
        </group>
      )}
    </group>
  )
}
