import ModelViewer from "./ModelViewer";

const RARITY_STYLES = {
  common: { border: "2px solid #6b6b80", glow: "none", label: "Common" },
  rare: { border: "2px solid #3b82f6", glow: "0 0 15px rgba(59,130,246,0.4)", label: "Rare" },
  epic: { border: "2px solid #a855f7", glow: "0 0 20px rgba(168,85,247,0.5)", label: "Epic" },
  legendary: { border: "2px solid #f59e0b", glow: "0 0 25px rgba(245,158,11,0.6)", label: "Legendary" },
};

export default function CharacterCard({ character, compact = false, onClick }) {
  if (!character) return null;

  const style = RARITY_STYLES[character.rarity] || RARITY_STYLES.common;

  return (
    <div
      className={`character-card rarity-${character.rarity}${compact ? " compact" : ""}`}
      style={{ border: style.border, boxShadow: style.glow }}
      onClick={onClick}
    >
      <div className="character-card-model">
        <ModelViewer
          modelType={character.modelType}
          modelId={character.modelId}
          modelPath={character.modelPath}
          height={compact ? 120 : 180}
          name={character.name}
        />
      </div>
      <div className="character-card-info">
        <span className={`character-rarity-badge rarity-${character.rarity}`}>
          {style.label}
        </span>
        <h3 className="character-card-name">{character.name}</h3>
        <span className="character-card-anime">{character.anime}</span>
        {!compact && character.quote && (
          <p className="character-card-quote">"{character.quote}"</p>
        )}
      </div>
    </div>
  );
}
