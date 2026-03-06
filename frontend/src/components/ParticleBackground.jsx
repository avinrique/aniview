import { useCallback, useMemo } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const seasonConfigs = {
  spring: {
    color: "#ffb7c5",
    shape: "circle",
    opacity: { min: 0.3, max: 0.7 },
    size: { min: 3, max: 8 },
    move: { direction: "bottom-right", speed: { min: 1, max: 3 } },
    wobble: { enable: true, distance: 20, speed: 10 },
    tilt: { enable: true, value: { min: 0, max: 360 }, animation: { enable: true, speed: 12 } },
    roll: { enable: true, speed: { min: 5, max: 15 } },
  },
  summer: {
    color: "#fbbf24",
    shape: "circle",
    opacity: { min: 0.2, max: 0.8 },
    size: { min: 1, max: 3 },
    move: { direction: "none", speed: { min: 0.3, max: 1 } },
    wobble: { enable: true, distance: 30, speed: 5 },
    tilt: { enable: false },
    roll: { enable: false },
  },
  autumn: {
    color: ["#f97316", "#dc2626", "#d97706"],
    shape: "circle",
    opacity: { min: 0.3, max: 0.7 },
    size: { min: 3, max: 7 },
    move: { direction: "bottom-right", speed: { min: 1, max: 4 } },
    wobble: { enable: true, distance: 30, speed: 15 },
    tilt: { enable: true, value: { min: 0, max: 360 }, animation: { enable: true, speed: 20 } },
    roll: { enable: true, speed: { min: 5, max: 20 } },
  },
  winter: {
    color: "#e2e8f0",
    shape: "circle",
    opacity: { min: 0.3, max: 0.8 },
    size: { min: 1, max: 4 },
    move: { direction: "bottom", speed: { min: 0.5, max: 2 } },
    wobble: { enable: true, distance: 15, speed: 8 },
    tilt: { enable: false },
    roll: { enable: false },
  },
};

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

export default function ParticleBackground({ season = "spring" }) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const config = seasonConfigs[season] || seasonConfigs.spring;
  const count = isMobile ? 80 : 150;

  const options = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: count, density: { enable: true, area: 800 } },
      color: { value: config.color },
      shape: { type: config.shape },
      opacity: {
        value: config.opacity,
        animation: { enable: true, speed: 0.5, sync: false },
      },
      size: {
        value: config.size,
        animation: { enable: true, speed: 1, sync: false },
      },
      move: {
        enable: true,
        direction: config.move.direction,
        speed: config.move.speed,
        outModes: { default: "out" },
        straight: false,
      },
      wobble: config.wobble,
      tilt: config.tilt,
      roll: config.roll,
    },
    detectRetina: true,
  }), [season]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}>
      <Particles
        id="seasonal-particles"
        init={particlesInit}
        options={options}
      />
    </div>
  );
}
