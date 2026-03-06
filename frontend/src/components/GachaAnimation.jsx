import { useState, useEffect } from "react";
import CharacterCard from "./CharacterCard";
import characterRegistry from "../data/characterRegistry.json";

const RARITY_COLORS = {
  common: "#6b6b80",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

export default function GachaAnimation({ pulls, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("enter"); // enter, glow, reveal, done
  const [showAll, setShowAll] = useState(false);

  const currentPull = pulls[currentIndex];
  const character = characterRegistry.find((c) => c.id === currentPull?.characterId);

  useEffect(() => {
    if (!currentPull) return;
    setPhase("enter");
    const t1 = setTimeout(() => setPhase("glow"), 600);
    const t2 = setTimeout(() => setPhase("reveal"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [currentIndex]);

  if (!pulls || pulls.length === 0) return null;

  const isLegendary = currentPull?.rarity === "legendary";
  const glowColor = RARITY_COLORS[currentPull?.rarity] || RARITY_COLORS.common;

  const handleNext = () => {
    if (currentIndex < pulls.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowAll(true);
    }
  };

  if (showAll) {
    return (
      <div className="gacha-results">
        <h2 className="gacha-results-title">Your Pulls</h2>
        <div className="gacha-results-grid">
          {pulls.map((pull, i) => {
            const char = characterRegistry.find((c) => c.id === pull.characterId);
            return char ? (
              <CharacterCard key={`${pull.characterId}-${i}`} character={char} compact />
            ) : null;
          })}
        </div>
        <button className="btn btn-primary" onClick={onComplete}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className={`gacha-animation ${isLegendary && phase === "reveal" ? "legendary-reveal" : ""}`}>
      <div className={`gacha-card-wrapper phase-${phase}`}>
        <div
          className="gacha-card-back"
          style={{
            boxShadow: phase === "glow" || phase === "reveal"
              ? `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`
              : "none",
          }}
        >
          {phase !== "reveal" ? (
            <div className="gacha-card-mystery">
              <span className="gacha-question-mark">?</span>
              <span className="gacha-card-label">AniView Gacha</span>
            </div>
          ) : (
            <div className="gacha-card-revealed">
              {character && <CharacterCard character={character} />}
            </div>
          )}
        </div>
      </div>

      {phase === "reveal" && (
        <button className="btn btn-primary gacha-next-btn" onClick={handleNext}>
          {currentIndex < pulls.length - 1 ? "Next" : "View All"}
        </button>
      )}

      <div className="gacha-progress">
        {currentIndex + 1} / {pulls.length}
      </div>
    </div>
  );
}
