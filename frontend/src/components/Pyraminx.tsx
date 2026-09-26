"use client";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

// Unnormalized axes for determining slices via integer dot products
const AXES_UNNORM = [
  new THREE.Vector3(1, 1, 1),
  new THREE.Vector3(-1, -1, 1),
  new THREE.Vector3(-1, 1, -1),
  new THREE.Vector3(1, -1, -1),
];

// Normalized axes for actual Quaternion rotations
const AXES = AXES_UNNORM.map(v => v.clone().normalize());

const TETRA_POSITIONS = [
  [2, 2, 2], [0, 0, 2], [0, 2, 0], [2, 0, 0],
  [-2, -2, 2], [-2, 2, -2], [2, -2, -2],
  [-2, 0, 0], [0, -2, 0], [0, 0, -2]
];

const OCTA_POSITIONS = [
  [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
];

// Pre-compute Vector3 positions once at module level (avoids per-render allocations)
const TETRA_VEC3 = TETRA_POSITIONS.map(p => new THREE.Vector3(p[0], p[1], p[2]));
const OCTA_VEC3  = OCTA_POSITIONS.map(p => new THREE.Vector3(p[0], p[1], p[2]));

// Scratch Quaternion reused each frame to avoid GC pressure
const _q = new THREE.Quaternion();

function PyraminxPiece({ geometry, material }: { geometry: THREE.BufferGeometry, material: THREE.Material }) {
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const colorState = useRef({
    baseColor: new THREE.Color("#10b981"),
    targetColor: new THREE.Color("#10b981"),
    isPulsing: false,
    timer: 0,
  });

  useFrame((state, delta) => {
    colorState.current.timer -= delta;
    if (colorState.current.timer <= 0) {
      if (!colorState.current.isPulsing) {
        colorState.current.isPulsing = true;
        // The gradient colors from the "Get started" button
        const colors = ["#E2CBFF", "#E2CBFF", "#393BB2", "#393BB2", "#10b981"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        colorState.current.targetColor.set(color);
        colorState.current.timer = 1.0 + Math.random() * 3.0; // hold for 1 - 4s
      } else {
        colorState.current.isPulsing = false;
        colorState.current.targetColor.copy(colorState.current.baseColor);
        colorState.current.timer = 1.0 + Math.random() * 3.0; // wait 1 - 4s
      }
    }

    if (edgeMatRef.current) {
      edgeMatRef.current.color.lerp(colorState.current.targetColor, delta * 3.0);
    }
  });

  return (
    <mesh geometry={geometry} material={material}>
      <Edges scale={1.01} threshold={1}>
        <lineBasicMaterial ref={edgeMatRef} color="#10b981" transparent opacity={1.0} linewidth={2} />
      </Edges>
    </mesh>
  );
}

function PyraminxCore() {
  const groupRef = useRef<THREE.Group>(null);

  // We'll store all 14 piece meshes in a ref array so we can rotate them individually
  const piecesRef = useRef<(THREE.Group | null)[]>([]);

  const animState = useRef({
    isAnimating: false,
    axisIdx: 0,
    axis: new THREE.Vector3(),
    piecesToMove: [] as number[],
    targetAngle: 0,
    currentAngle: 0,
    speed: 0,
    pauseTimer: 1.0,
  });

  useFrame((state, delta) => {
    // Slowly rotate the entire Pyraminx to show it off
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
      groupRef.current.rotation.x += delta * 0.22;
    }

    if (!animState.current.isAnimating) {
      animState.current.pauseTimer -= delta;

      if (animState.current.pauseTimer <= 0) {
        // Start a new move
        const axisIdx = Math.floor(Math.random() * 4);

        // Depth threshold determines how many layers spin.
        // 4 = Tip only. 0 = Tip + Middle (standard move).
        const depthThreshold = Math.random() < 0.5 ? 4 : 0;

        // Randomly pick clockwise or counter-clockwise
        const direction = Math.random() < 0.5 ? 1 : -1;

        const piecesToMove: number[] = [];
        const unnormAxis = AXES_UNNORM[axisIdx];

        piecesRef.current.forEach((piece, idx) => {
          if (!piece) return;
          // The local position inside the group is unchanged by the group's rotation.
          const pos = piece.position.clone();
          const dot = Math.round(pos.dot(unnormAxis));

          if (dot > depthThreshold) {
            piecesToMove.push(idx);
          }
        });

        if (piecesToMove.length > 0) {
          animState.current.isAnimating = true;
          animState.current.axisIdx = axisIdx;
          animState.current.axis.copy(AXES[axisIdx]);
          animState.current.piecesToMove = piecesToMove;
          animState.current.targetAngle = ((Math.PI * 2) / 3) * direction; // +/- 120 degrees
          animState.current.currentAngle = 0;
          animState.current.speed = 8.0; // very fast snap
        } else {
          // Fallback
          animState.current.pauseTimer = 0.5;
        }
      }
    } else {
      // Animate the slice
      const step = animState.current.speed * delta;
      const direction = Math.sign(animState.current.targetAngle);
      animState.current.currentAngle += step * direction;

      let finished = false;
      let actualStep = step * direction;

      if (
        (direction === 1 && animState.current.currentAngle >= animState.current.targetAngle) ||
        (direction === -1 && animState.current.currentAngle <= animState.current.targetAngle)
      ) {
        // Snap to exact target to prevent floating point drift over many moves
        const overshoot = animState.current.currentAngle - animState.current.targetAngle;
        actualStep -= overshoot;
        finished = true;
      }

      _q.setFromAxisAngle(animState.current.axis, actualStep);

      animState.current.piecesToMove.forEach(idx => {
        const piece = piecesRef.current[idx];
        if (!piece) return;
        piece.position.applyQuaternion(_q);
        piece.quaternion.premultiply(_q);
      });

      if (finished) {
        animState.current.isAnimating = false;
        animState.current.pauseTimer = 0.4 + Math.random() * 0.5; // Wait 0.4 - 0.9s before next move
      }
    }
  });

  const tetraGeometry = useMemo(() => new THREE.TetrahedronGeometry(Math.sqrt(3)), []);
  const octaGeometry = useMemo(() => new THREE.OctahedronGeometry(2), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0a0a0a",
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9
  }), []);

  return (
    <group ref={groupRef} scale={1.0}>
      {TETRA_VEC3.map((vec, idx) => (
        <group
          key={`tetra-${idx}`}
          position={vec}
          ref={(el) => { piecesRef.current[idx] = el; }}
        >
          <PyraminxPiece geometry={tetraGeometry} material={material} />
        </group>
      ))}

      {OCTA_VEC3.map((vec, idx) => (
        <group
          key={`octa-${idx}`}
          position={vec}
          ref={(el) => { piecesRef.current[TETRA_POSITIONS.length + idx] = el; }}
        >
          <PyraminxPiece geometry={octaGeometry} material={material} />
        </group>
      ))}
    </group>
  );
}

export default function Pyraminx() {
  return (
    <div
      className="w-full h-full relative"
      style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.2)) drop-shadow(0 0 16px rgba(226,203,255,0.08))" }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#10b981" />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#E2CBFF" />
        <PyraminxCore />
      </Canvas>
      {/* Ambient glow behind canvas */}
      <div
        className="absolute inset-0 m-auto w-40 h-40 blur-[70px] rounded-full -z-10 animate-pulse"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(57,59,178,0.2) 50%, rgba(226,203,255,0.1) 100%)" }}
      />
    </div>
  );
}
