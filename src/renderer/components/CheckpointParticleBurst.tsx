import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface CheckpointParticleBurstProps {
  active: boolean;
}

export function CheckpointParticleBurst({ active }: CheckpointParticleBurstProps) {
  if (!active) return null;

  return (
    <div className="checkpoint-particle-burst" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 48 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <BurstCloud />
        <BurstRing radius={1.24} speed={0.72} color="#2f8c7c" />
        <BurstRing radius={1.84} speed={-0.54} color="#6f8fdd" />
      </Canvas>
    </div>
  );
}

function BurstCloud() {
  const points = useRef<any>(null);
  const material = useRef<any>(null);
  const seeds = useMemo(() => createBurstSeeds(180), []);
  const positions = useMemo(() => new Float32Array(seeds.length * 3), [seeds.length]);
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return nextGeometry;
  }, [positions]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const positionAttribute = geometry.getAttribute("position");

    if (material.current) {
      material.current.opacity = THREE.MathUtils.lerp(material.current.opacity, 0.92, 0.06);
      material.current.size = 0.052 + Math.sin(elapsed * 4.4) * 0.007;
    }

    if (points.current) {
      points.current.rotation.z = elapsed * 0.19;
      points.current.rotation.x = Math.sin(elapsed * 0.55) * 0.12;
    }

    seeds.forEach((seed, index) => {
      const curl = elapsed * seed.speed + seed.phase;
      const breathe = 1 + Math.sin(elapsed * 2.3 + seed.phase) * 0.12;
      const radius = seed.radius * breathe + Math.sin(elapsed * 3.1 + seed.phase) * 0.08;
      const spiral = seed.angle + curl + Math.sin(elapsed * 1.6 + seed.phase) * 0.18;
      const x = Math.cos(spiral) * radius * seed.stretch;
      const y = Math.sin(spiral) * radius * 0.72 + Math.cos(curl * 0.7) * 0.16;
      const z = Math.sin(curl + seed.phase) * 0.38;
      positionAttribute.setXYZ(index, x, y, z);
    });

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#4ea391"
        depthWrite={false}
        opacity={0}
        size={0.045}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

function BurstRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const mesh = useRef<any>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (!mesh.current) return;
    mesh.current.rotation.z = elapsed * speed;
    mesh.current.scale.x = 1 + Math.sin(elapsed * 2.1) * 0.06;
    mesh.current.scale.y = 0.56 + Math.cos(elapsed * 1.7) * 0.04;
  });

  return (
    <mesh ref={mesh}>
      <torusGeometry args={[radius, 0.012, 8, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.34} />
    </mesh>
  );
}

function createBurstSeeds(count: number) {
  return Array.from({ length: count }, (_item, index) => {
    const t = index / count;
    const ring = index % 7;
    return {
      angle: t * Math.PI * 2 * 5.2,
      radius: 0.28 + ring * 0.19 + Math.sin(index * 2.17) * 0.05,
      phase: index * 0.63,
      speed: 0.44 + (index % 9) * 0.035,
      stretch: 1.12 + Math.sin(index * 1.73) * 0.18
    };
  });
}
