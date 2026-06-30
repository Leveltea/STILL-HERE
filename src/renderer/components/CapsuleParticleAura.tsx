import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface CapsuleParticleAuraProps {
  active: boolean;
}

export function CapsuleParticleAura({ active }: CapsuleParticleAuraProps) {
  return (
    <div className={`capsule-particle-aura ${active ? "is-active" : ""}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <AuraPoints active={active} />
      </Canvas>
    </div>
  );
}

function AuraPoints({ active }: CapsuleParticleAuraProps) {
  const points = useRef<any>(null);
  const material = useRef<any>(null);
  const basePositions = useMemo(() => createCapsulePositions(28), []);
  const positions = useMemo(() => new Float32Array(basePositions), [basePositions]);
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return nextGeometry;
  }, [positions]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const positionAttribute = geometry.getAttribute("position");
      const targetOpacity = active ? 1 : 0.02;
      const targetScale = active ? 1.12 : 0.9;

    if (material.current) {
      material.current.opacity = THREE.MathUtils.lerp(material.current.opacity, targetOpacity, 0.08);
      material.current.size = THREE.MathUtils.lerp(material.current.size, active ? 0.088 : 0.032, 0.08);
    }

    if (points.current) {
      points.current.scale.x = THREE.MathUtils.lerp(points.current.scale.x, targetScale, 0.07);
      points.current.scale.y = THREE.MathUtils.lerp(points.current.scale.y, active ? 1.12 : 0.9, 0.07);
      points.current.rotation.z = Math.sin(elapsed * 0.7) * 0.018;
    }

    for (let index = 0; index < positionAttribute.count; index += 1) {
      const baseIndex = index * 3;
      const pulse = Math.sin(elapsed * (active ? 2.8 : 0.8) + index * 0.58) * (active ? 0.055 : 0.015);
      const drift = ((elapsed * (active ? 0.34 : 0.08) + index / positionAttribute.count) % 1) - 0.5;
      positionAttribute.setXYZ(
        index,
        basePositions[baseIndex] + drift * (active ? 0.32 : 0.03),
        basePositions[baseIndex + 1] + pulse * 1.35,
        basePositions[baseIndex + 2]
      );
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#2f8c7c"
        depthWrite={false}
        opacity={0.06}
        size={0.04}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

function createCapsulePositions(count: number) {
  const positions: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const t = index / count;
    const angle = t * Math.PI * 2;
    const onSide = Math.abs(Math.cos(angle));
    const x = Math.cos(angle) * (1.55 + onSide * 0.42);
    const y = Math.sin(angle) * 0.48;
    positions.push(x, y, 0);
  }

  return positions;
}
