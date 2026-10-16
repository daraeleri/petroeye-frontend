"use client";

// 3D view of the tanker. Client-only and code-split: load it through
// components/truck/twin-3d-lazy.tsx so three.js never ships with other pages.
import { Bounds, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Activity } from "@/lib/types";
import { useThemeColors } from "@/lib/use-theme-colors";

const MODEL_URL = "/assets/3DModels/fuel_tanker_3d_model.glb";

/** Resolve any CSS colour (incl. oklch) to something three.js understands. */
function cssToHex(css: string, fallback: string): string {
  if (typeof document === "undefined" || !css || css === "currentColor") return fallback;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => (v ?? 0).toString(16).padStart(2, "0")).join("")}`;
}

interface TruckModelProps {
  bodyColor: string;
  alertColor: string;
  valveOpen: boolean;
  offline: boolean;
}

function TruckModel({ bodyColor, alertColor, valveOpen, offline }: TruckModelProps) {
  const { scene } = useGLTF(MODEL_URL);

  // One shared monochrome material instead of the model's own.
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.25, transparent: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.material = material;
        mesh.castShadow = true;
      }
    });
    return clone;
  }, [scene, material]);

  useEffect(() => {
    material.color.set(bodyColor);
    material.opacity = offline ? 0.35 : 1;
    material.depthWrite = !offline;
    material.needsUpdate = true;
  }, [material, bodyColor, offline]);

  // Valve open: a slow red pulse on the body.
  const alert = useMemo(() => new THREE.Color(alertColor), [alertColor]);
  useFrame(({ clock }) => {
    if (valveOpen && !offline) {
      material.emissive.copy(alert);
      material.emissiveIntensity = 0.12 + 0.08 * Math.sin(clock.elapsedTime * 2.5);
    } else if (material.emissiveIntensity !== 0) {
      material.emissiveIntensity = 0;
    }
  });

  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={model} />;
}

export interface Twin3DProps {
  activity: Activity;
  valveOpen: boolean;
  className?: string;
}

export default function Twin3D({ activity, valveOpen, className }: Twin3DProps) {
  const colors = useThemeColors();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  // Mid ink (not full black/white) so the lighting can model the shape.
  const body = cssToHex(colors.ink2, "#5a5a5a");
  const shadow = cssToHex(colors.ink, "#000000");
  const alert = cssToHex(colors.critical, "#dc2626");
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [1.15, 0.65, 1.15], fov: 32, near: 0.01, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        aria-label="3D view of the truck"
      >
        <hemisphereLight args={["#ffffff", "#9a9a9a", 1.6]} />
        <directionalLight position={[2, 3, 2]} intensity={2.2} />
        <directionalLight position={[-2, 1.5, -1.5]} intensity={0.9} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={0.95}>
            <TruckModel bodyColor={body} alertColor={alert} valveOpen={valveOpen} offline={activity === "offline"} />
          </Bounds>
          <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={2.4} blur={2.4} far={1} color={shadow} />
        </Suspense>
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableDamping
          autoRotate={!reduceMotion}
          autoRotateSpeed={activity === "moving" ? 1.4 : 0.6}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={0.6}
          maxDistance={3}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
