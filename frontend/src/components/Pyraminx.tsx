"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

// Existing geometry definitions to PRESERVE SHAPE
const TETRA_POSITIONS = [
  [2, 2, 2], [0, 0, 2], [0, 2, 0], [2, 0, 0],
  [-2, -2, 2], [-2, 2, -2], [2, -2, -2],
  [-2, 0, 0], [0, -2, 0], [0, 0, -2]
];

const OCTA_POSITIONS = [
  [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
];

const TETRA_VEC3 = TETRA_POSITIONS.map(p => new THREE.Vector3(p[0], p[1], p[2]));
const OCTA_VEC3  = OCTA_POSITIONS.map(p => new THREE.Vector3(p[0], p[1], p[2]));

// Easing function for smooth entrance
const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

function PyraminxPiece({ 
  geometry, 
  material, 
  targetPos, 
  index, 
  totalPieces 
}: { 
  geometry: THREE.BufferGeometry; 
  material: THREE.Material; 
  targetPos: THREE.Vector3;
  index: number;
  totalPieces: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  
  // Random starting offsets for the assembly animation
  const startPos = useMemo(() => {
    const dir = targetPos.clone().normalize();
    if (dir.lengthSq() === 0) dir.set(0, 1, 0);
    // Explode outwards randomly
    return targetPos.clone().add(dir.multiplyScalar(4 + Math.random() * 8));
  }, [targetPos]);
  
  const startRot = useMemo(() => {
    return new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
  }, []);

  const delay = (index / totalPieces) * 1.5; // Staggered start

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // 1. Assembly Animation
    const animTime = Math.max(0, time - delay);
    const duration = 2.5; // Assembly duration
    const progress = Math.min(1, animTime / duration);
    const eased = easeOutQuart(progress);

    // Interpolate position and rotation
    meshRef.current.position.lerpVectors(startPos, targetPos, eased);
    
    meshRef.current.rotation.x = THREE.MathUtils.lerp(startRot.x, 0, eased);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(startRot.y, 0, eased);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(startRot.z, 0, eased);

    // 2. Continuous Subtle Breathing / Floating (starts after assembly)
    if (progress === 1) {
      const breathe = Math.sin(time * 1.5 + index) * 0.04;
      // Gently expand and contract from center
      const dir = targetPos.clone().normalize();
      meshRef.current.position.copy(targetPos).add(dir.multiplyScalar(breathe));
    }

    // 3. Edge Glow Sweep
    if (edgeMatRef.current) {
      // Create a sweeping light effect based on time and vertical position
      const sweep = (Math.sin(time * 1.5 - targetPos.y * 0.5) + 1) / 2;
      
      const baseColor = new THREE.Color("#1a1a2e"); // Dark edge
      const highlightColor = new THREE.Color("#E2CBFF").lerp(new THREE.Color("#393BB2"), sweep);
      
      // Combine with assembly opacity
      const targetOpacity = THREE.MathUtils.lerp(0, 0.7, eased);
      
      const intensity = 0.3 + sweep * 0.7;
      edgeMatRef.current.color.copy(baseColor).lerp(highlightColor, intensity);
      edgeMatRef.current.opacity = targetOpacity;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material}>
      <Edges scale={1.002} threshold={15}>
        <lineBasicMaterial ref={edgeMatRef} transparent opacity={0} linewidth={1} />
      </Edges>
    </mesh>
  );
}

function PyraminxCore() {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  const tetraGeometry = useMemo(() => new THREE.TetrahedronGeometry(Math.sqrt(3)), []);
  const octaGeometry = useMemo(() => new THREE.OctahedronGeometry(2), []);
  
  // Premium dark glass/metal material
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#050508",
    metalness: 0.9,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.4,
    transparent: true,
    opacity: 1.0,
  }), []);

  const totalPieces = TETRA_VEC3.length + OCTA_VEC3.length;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Auto rotation base
    const autoRotY = time * 0.12;
    const autoRotX = Math.sin(time * 0.5) * 0.1;
    
    // Parallax mouse interaction target (with easing)
    // Pointer is typically -1 to 1
    const maxTilt = Math.PI / 8; // 22.5 degrees max influence
    targetRotation.current.x = THREE.MathUtils.lerp(targetRotation.current.x, state.pointer.y * maxTilt, delta * 3);
    targetRotation.current.y = THREE.MathUtils.lerp(targetRotation.current.y, state.pointer.x * maxTilt, delta * 3);
    
    // Combine auto rotation and mouse interaction
    groupRef.current.rotation.y = autoRotY + targetRotation.current.y;
    groupRef.current.rotation.x = autoRotX + targetRotation.current.x;
    
    // Gentle overall floating
    groupRef.current.position.y = Math.sin(time * 1.2) * 0.2;
  });

  return (
    <group ref={groupRef} scale={1.0}>
      {TETRA_VEC3.map((vec, idx) => (
        <PyraminxPiece 
          key={`tetra-${idx}`} 
          geometry={tetraGeometry} 
          material={material} 
          targetPos={vec}
          index={idx}
          totalPieces={totalPieces}
        />
      ))}

      {OCTA_VEC3.map((vec, idx) => (
        <PyraminxPiece 
          key={`octa-${idx}`} 
          geometry={octaGeometry} 
          material={material} 
          targetPos={vec}
          index={TETRA_VEC3.length + idx}
          totalPieces={totalPieces}
        />
      ))}
    </group>
  );
}

// Lighting sweep component
function SceneLighting() {
  const pointLightRef = useRef<THREE.PointLight>(null);
  const pointLight2Ref = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointLightRef.current) {
      // Orbiting light for dynamic reflections
      pointLightRef.current.position.x = Math.sin(time * 0.8) * 8;
      pointLightRef.current.position.z = Math.cos(time * 0.8) * 8;
      pointLightRef.current.position.y = Math.sin(time * 1.5) * 4;
    }
    if (pointLight2Ref.current) {
      // Counter-orbiting light
      pointLight2Ref.current.position.x = Math.cos(time * 0.5) * -6;
      pointLight2Ref.current.position.z = Math.sin(time * 0.5) * -6;
      pointLight2Ref.current.position.y = Math.cos(time * 1.1) * 3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#E2CBFF" />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#393BB2" />
      <pointLight ref={pointLightRef} intensity={2.0} color="#10b981" distance={20} decay={2} />
      <pointLight ref={pointLight2Ref} intensity={1.5} color="#E2CBFF" distance={15} decay={2} />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={1.2} color="#ffffff" castShadow />
    </>
  );
}

export default function Pyraminx() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative" style={{ perspective: "1000px" }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 40 }} // Pull camera back slightly for entrance
        dpr={[1, 2]} // Support retina for crisp rendering
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <SceneLighting />
        <PyraminxCore />
      </Canvas>
      {/* Cinematic subtle background glow */}
      <div
        className="absolute inset-0 m-auto w-[60%] h-[60%] blur-[100px] rounded-full -z-10"
        style={{ 
          background: "radial-gradient(circle, rgba(57,59,178,0.15) 0%, rgba(226,203,255,0.05) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}
