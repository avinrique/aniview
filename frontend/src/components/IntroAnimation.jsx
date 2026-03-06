import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

const INTRO_KEY = "aniview_intro_seen";

// Preload the model immediately when this module loads
useGLTF.preload("/models/gojo-satoru.glb");

function IntroModel({ onReady }) {
  const { scene } = useGLTF("/models/gojo-satoru.glb");
  const groupRef = useRef();

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 3.5 / maxDim;
      clone.scale.setScalar(scale);
      const newBox = new Box3().setFromObject(clone);
      const center = new Vector3();
      newBox.getCenter(center);
      clone.position.sub(center);
    }
    return clone;
  }, [scene]);

  useEffect(() => {
    onReady?.();
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

// Thin speed lines radiating from center
function generateLines() {
  const lines = [];
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * 360 + (Math.random() - 0.5) * 3;
    const width = Math.random() < 0.1 ? 2 : 0.5 + Math.random() * 1;
    const length = 60 + Math.random() * 40;
    const delay = Math.random() * 0.2;
    const r = Math.random();
    let color;
    if (r < 0.5) {
      color = "rgba(255,255,255,0.15)";
    } else if (r < 0.8) {
      color = "rgba(139,92,246,0.25)";
    } else {
      color = "rgba(192,132,252,0.2)";
    }
    lines.push({ angle, width, length, delay, color, id: i });
  }
  return lines;
}

const LINES = generateLines();

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState("idle");
  const [show, setShow] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    const seen = sessionStorage.getItem(INTRO_KEY);
    if (seen) {
      onComplete?.();
      return;
    }
    setShow(true);
    setPhase("dark");
  }, []);

  // Start animation sequence once model is ready
  useEffect(() => {
    if (!modelReady || !show) return;

    timersRef.current = [
      setTimeout(() => setPhase("lines"), 200),
      setTimeout(() => setPhase("model"), 1000),
      setTimeout(() => setPhase("title"), 2200),
      setTimeout(() => setPhase("fade"), 3800),
      setTimeout(() => {
        sessionStorage.setItem(INTRO_KEY, "1");
        setShow(false);
        onComplete?.();
      }, 4600),
    ];

    return () => timersRef.current.forEach(clearTimeout);
  }, [modelReady, show]);

  // Fallback: if model takes too long (>5s), skip intro
  useEffect(() => {
    if (!show) return;
    const fallback = setTimeout(() => {
      if (!modelReady) {
        sessionStorage.setItem(INTRO_KEY, "1");
        setShow(false);
        onComplete?.();
      }
    }, 5000);
    return () => clearTimeout(fallback);
  }, [show]);

  const skip = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    sessionStorage.setItem(INTRO_KEY, "1");
    setShow(false);
    onComplete?.();
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className={`intro-de phase-${phase}`} onClick={skip}>
      {/* Speed lines from center */}
      <div className="intro-de-lines">
        {LINES.map((line) => (
          <div
            key={line.id}
            className="intro-de-line"
            style={{
              transform: `rotate(${line.angle}deg)`,
              "--lw": `${line.width}px`,
              "--ll": `${line.length}vh`,
              "--ld": `${line.delay}s`,
              backgroundColor: line.color,
            }}
          />
        ))}
      </div>

      {/* Subtle purple glow behind model */}
      <div className="intro-de-glow" />

      {/* 3D Model - always rendered so it can load */}
      <div className="intro-de-model">
        <Canvas
          camera={{ position: [0, 0.3, 3.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[0, 5, 5]} intensity={2.5} color="#ffffff" />
          <directionalLight position={[-3, 2, -3]} intensity={0.8} color="#8b5cf6" />
          <pointLight position={[0, 2, 3]} intensity={1.5} color="#c084fc" distance={8} />
          <Suspense fallback={null}>
            <IntroModel onReady={() => setModelReady(true)} />
          </Suspense>
        </Canvas>
      </div>

      {/* Title */}
      <div className="intro-de-text">
        <div className="intro-de-label">DOMAIN EXPANSION</div>
        <h1 className="intro-de-title">
          Ani<span className="intro-de-accent">View</span>
        </h1>
      </div>

      <div className="intro-de-skip">Click to skip</div>
    </div>
  );
}
