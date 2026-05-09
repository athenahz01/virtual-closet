"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Html,
  OrbitControls,
  useAnimations,
  useGLTF
} from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";

import { cn } from "@/lib/utils";

type AvatarViewerProps = {
  modelUrl: string | null;
  compact?: boolean;
  className?: string;
};

export function AvatarViewer({
  modelUrl,
  compact = false,
  className
}: AvatarViewerProps) {
  if (!modelUrl) {
    return <AvatarFallback compact={compact} className={className} />;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle_at_50%_18%,#FDFBF7_0%,#EFE8DA_48%,#E8D5C4_100%)] shadow-soft",
        compact ? "h-36 w-36" : "h-[460px] w-full md:h-[620px]",
        className
      )}
    >
      <Canvas
        className="h-full w-full"
        camera={{
          position: compact ? [0, 1.35, 2.65] : [0, 1.45, 3.35],
          fov: compact ? 34 : 30
        }}
        dpr={[1, 1.8]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.86} />
        <directionalLight intensity={1.6} position={[3.2, 4.5, 3.8]} />
        <directionalLight intensity={0.42} position={[-3, 2.4, -2.2]} />
        <Suspense
          fallback={
            <Html center className="pointer-events-none select-none">
              <span className="rounded-full border border-border bg-cream px-3 py-1 text-xs text-muted-foreground shadow-soft">
                Loading avatar
              </span>
            </Html>
          }
        >
          <AvatarModel compact={compact} url={modelUrl} />
        </Suspense>
        <ContactShadows
          opacity={compact ? 0.18 : 0.24}
          position={[0, compact ? -0.92 : -1.05, 0]}
          scale={compact ? 3 : 5}
          blur={compact ? 1.8 : 2.6}
          far={compact ? 2.4 : 3.5}
        />
        <OrbitControls
          autoRotate
          autoRotateSpeed={compact ? 0.8 : 0.55}
          enablePan={false}
          enableZoom={!compact}
          maxDistance={4.8}
          minDistance={2.2}
          target={[0, compact ? 0.85 : 0.9, 0]}
        />
      </Canvas>
    </div>
  );
}

function AvatarModel({ compact, url }: { compact: boolean; url: string }) {
  const group = useRef<Group>(null);
  const { animations, scene } = useGLTF(url);
  const avatarScene = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = Object.values(actions)[0];

    if (!action) {
      return;
    }

    action.reset().fadeIn(0.3).play();

    return () => {
      action.fadeOut(0.2);
    };
  }, [actions]);

  useFrame(({ clock }) => {
    if (!group.current) {
      return;
    }

    group.current.position.y =
      (compact ? -0.84 : -1.02) + Math.sin(clock.elapsedTime * 1.15) * 0.012;
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.045;
  });

  return (
    <group ref={group} scale={compact ? 1.36 : 1.58}>
      <Center top>
        <primitive object={avatarScene} />
      </Center>
    </group>
  );
}

function AvatarFallback({
  compact,
  className
}: {
  compact: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-parchment/75 text-center shadow-soft",
        compact ? "h-36 w-36 p-4" : "h-[460px] w-full p-8 md:h-[620px]",
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative rounded-full border border-border bg-cream shadow-soft",
          compact ? "h-16 w-16" : "h-28 w-28"
        )}
      >
        <span
          className={cn(
            "absolute left-1/2 top-[24%] -translate-x-1/2 rounded-full bg-terracotta-soft",
            compact ? "h-5 w-5" : "h-9 w-9"
          )}
        />
        <span
          className={cn(
            "absolute left-1/2 top-[54%] -translate-x-1/2 rounded-full bg-terracotta-soft",
            compact ? "h-8 w-10" : "h-14 w-16"
          )}
        />
      </div>
      {!compact ? (
        <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
          Create an avatar to bring the studio figure into this space.
        </p>
      ) : null}
    </div>
  );
}
