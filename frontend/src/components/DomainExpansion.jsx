import { useState, useEffect } from "react";

export default function DomainExpansion({ trigger, onComplete }) {
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (!trigger) return;
    setPhase("dark");
    const t1 = setTimeout(() => setPhase("expand"), 500);
    const t2 = setTimeout(() => setPhase("text"), 1200);
    const t3 = setTimeout(() => setPhase("flash"), 2800);
    const t4 = setTimeout(() => {
      setPhase("idle");
      onComplete?.();
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [trigger]);

  if (phase === "idle") return null;

  return (
    <div className={`domain-expansion phase-${phase}`}>
      <div className="domain-gradient" />
      {(phase === "text" || phase === "flash") && (
        <div className="domain-text">
          <div className="domain-label">DOMAIN EXPANSION</div>
          <div className="domain-name">Infinite Void</div>
        </div>
      )}
    </div>
  );
}
