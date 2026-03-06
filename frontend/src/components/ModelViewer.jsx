import { Suspense, lazy, useRef, useMemo, Component } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

const Canvas = lazy(() => import("@react-three/fiber").then((m) => ({ default: m.Canvas })));

class ModelErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

function GLBModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef();

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2 / maxDim;
      clone.scale.setScalar(scale);
      const newBox = new Box3().setFromObject(clone);
      const center = new Vector3();
      newBox.getCenter(center);
      clone.position.sub(center);
    }
    return clone;
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

function GLBViewer({ modelPath, height = 200 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ModelErrorBoundary fallback={<ModelFallback />}>
        <Suspense fallback={<ModelFallback />}>
          <Canvas
            camera={{ position: [0, 0.5, 3.5], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 4, 5]} intensity={1.2} />
            <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#c084fc" />
            <pointLight position={[0, 3, 0]} intensity={0.3} color="#8b5cf6" />
            <GLBModel modelPath={modelPath} />
          </Canvas>
        </Suspense>
      </ModelErrorBoundary>
    </div>
  );
}

function SketchfabEmbed({ modelId, height = 200 }) {
  return (
    <iframe
      title="3D Model"
      src={`https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=0&ui_infos=0&ui_stop=0&ui_watermark=0&ui_color=8b5cf6&transparent=1&camera=0`}
      style={{
        width: "100%",
        height,
        border: "none",
        borderRadius: "var(--radius)",
        background: "transparent",
      }}
      allow="autoplay; fullscreen; xr-spatial-tracking"
      loading="lazy"
    />
  );
}

function ModelFallback({ name }) {
  return (
    <div className="model-fallback">
      <span className="model-fallback-icon">&#9733;</span>
      {name && <span className="model-fallback-name">{name}</span>}
    </div>
  );
}

export default function ModelViewer({ modelType, modelId, modelPath, height = 200, name }) {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return <ModelFallback name={name} />;
  }

  if (modelType === "glb" && modelPath) {
    return <GLBViewer modelPath={modelPath} height={height} />;
  }

  if (modelType === "sketchfab" && modelId) {
    return <SketchfabEmbed modelId={modelId} height={height} />;
  }

  return <ModelFallback name={name} />;
}
