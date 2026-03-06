import { Link } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";
import ModelViewer from "../components/ModelViewer";
import characterRegistry from "../data/characterRegistry.json";

const randomChar = characterRegistry[Math.floor(Math.random() * characterRegistry.length)];

export default function NotFound() {
  return (
    <div className="not-found-page">
      <ParticleBackground season="winter" />
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <div className="not-found-mascot">
          <ModelViewer
            modelType={randomChar.modelType}
            modelId={randomChar.modelId}
            modelPath={randomChar.modelPath}
            height={220}
            name={randomChar.name}
          />
        </div>
        <h1 className="not-found-title">You've wandered into the void...</h1>
        <p className="not-found-desc">
          This page doesn't exist in any dimension. Even the anime gods can't find it.
        </p>
        <Link to="/" className="btn btn-primary not-found-btn">
          Take me back to safety
        </Link>
      </div>
    </div>
  );
}
