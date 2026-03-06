import { Suspense, useRef, useState, useEffect, lazy } from "react";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

// Lazy load the heavy 3D deps
const Canvas = lazy(() => import("@react-three/fiber").then((m) => ({ default: m.Canvas })));

function MascotScene({ expression = "happy" }) {
  const groupRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Blink loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Breathing + eye follow
  const breathSpeed = 1.5;
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf;
    const animate = () => {
      setTime((t) => t + 0.016);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const breathY = Math.sin(time * breathSpeed) * 0.03;
  const eyeLookX = mouse.x * 0.08;
  const eyeLookY = mouse.y * 0.05;

  const mouthOpen = expression === "confused" ? 0.12 : expression === "happy" ? 0.06 : 0.03;
  const eyeScaleY = blink ? 0.1 : 1;

  // Colors
  const skinColor = "#ffe0cc";
  const hairColor = "#4a3070";
  const eyeColor = "#6366f1";
  const blushColor = "#ff9eaa";

  return (
    <group ref={groupRef} position={[0, breathY - 0.3, 0]}>
      {/* Body */}
      <mesh position={[0, -0.7, 0]}>
        <capsuleGeometry args={[0.35, 0.5, 8, 16]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Hair top */}
      <mesh position={[0, 0.55, -0.05]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Hair bangs */}
      <mesh position={[0, 0.35, 0.35]}>
        <boxGeometry args={[0.85, 0.25, 0.2]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Left eye */}
      <group position={[-0.18 + eyeLookX, 0.2 + eyeLookY, 0.48]} scale={[1, eyeScaleY, 1]} ref={eyeLeftRef}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Eye shine */}
        <mesh position={[0.025, 0.025, 0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Right eye */}
      <group position={[0.18 + eyeLookX, 0.2 + eyeLookY, 0.48]} scale={[1, eyeScaleY, 1]} ref={eyeRightRef}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.025, 0.025, 0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Blush */}
      <mesh position={[-0.3, 0.08, 0.42]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={blushColor} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.3, 0.08, 0.42]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={blushColor} transparent opacity={0.5} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 0.02, 0.5]} scale={[1, expression === "confused" ? 1.5 : 1, 1]}>
        <sphereGeometry args={[mouthOpen, 12, 12]} />
        <meshStandardMaterial color={expression === "confused" ? "#333" : "#e88"} />
      </mesh>

      {/* Confused swirl (for 404) */}
      {expression === "confused" && (
        <mesh position={[0.4, 0.7, 0]} rotation={[0, 0, time * 2]}>
          <torusGeometry args={[0.12, 0.03, 8, 32]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function Mascot3D({ expression = "happy", height = 280 }) {
  const [clicked, setClicked] = useState(false);
  const currentExpression = clicked ? "happy" : expression;

  useEffect(() => {
    if (clicked) {
      const t = setTimeout(() => setClicked(false), 1500);
      return () => clearTimeout(t);
    }
  }, [clicked]);

  return (
    <div
      className="mascot-viewer"
      style={{ width: "100%", height, cursor: "pointer" }}
      onClick={() => setClicked(true)}
    >
      <Suspense fallback={<MascotFallback />}>
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 45 }}
          frameloop="always"
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} intensity={1} />
          <pointLight position={[-2, 1, 3]} intensity={0.4} color="#c084fc" />
          <MascotScene expression={currentExpression} />
        </Canvas>
      </Suspense>
    </div>
  );
}

function MascotFallback() {
  return (
    <div className="mascot-fallback">
      <span className="mascot-fallback-emoji">🧙‍♂️</span>
    </div>
  );
}

export default function MascotViewer({ expression = "happy", height = 280 }) {
  if (isMobile) {
    return <MascotFallback />;
  }
  return <Mascot3D expression={expression} height={height} />;
}
