import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCollection } from "../api/gachaApi";
import CharacterCard from "../components/CharacterCard";
import characterRegistry from "../data/characterRegistry.json";

export default function Collection() {
  const { token, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [collection, setCollection] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loadingCollection, setLoadingCollection] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate("/login");
  }, [loading, isLoggedIn]);

  useEffect(() => {
    if (!token) return;
    getCollection(token)
      .then((data) => {
        setCollection(data.collection);
        setLoadingCollection(false);
      })
      .catch(() => setLoadingCollection(false));
  }, [token]);

  // Build owned character map (count duplicates)
  const ownedMap = {};
  collection.forEach((item) => {
    ownedMap[item.characterId] = (ownedMap[item.characterId] || 0) + 1;
  });

  const ownedCharacters = characterRegistry
    .filter((c) => ownedMap[c.id])
    .map((c) => ({ ...c, count: ownedMap[c.id] }));

  const filtered = filter === "all"
    ? ownedCharacters
    : ownedCharacters.filter((c) => c.rarity === filter);

  const uniqueCount = ownedCharacters.length;
  const totalCount = characterRegistry.length;

  if (loading || loadingCollection) return null;

  return (
    <div className="collection-page container">
      <div className="collection-header">
        <h1>My Collection</h1>
        <span className="collection-count">{uniqueCount} / {totalCount} Characters</span>
      </div>

      <div className="collection-filters">
        {["all", "legendary", "epic", "rare", "common"].map((r) => (
          <button
            key={r}
            className={`filter-btn${filter === r ? " active" : ""} ${r !== "all" ? `rarity-${r}` : ""}`}
            onClick={() => setFilter(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="collection-grid">
          {filtered.map((char) => (
            <div key={char.id} className="collection-item">
              <CharacterCard character={char} />
              {char.count > 1 && (
                <span className="collection-dupe-badge">x{char.count}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-text">
          {filter === "all"
            ? "No characters yet! Visit the Gacha page to start pulling."
            : `No ${filter} characters found.`}
        </div>
      )}

      {/* Show uncollected characters grayed out */}
      {filter === "all" && (
        <>
          <h2 className="section-title" style={{ marginTop: "2rem" }}>Uncollected</h2>
          <div className="collection-grid uncollected">
            {characterRegistry
              .filter((c) => !ownedMap[c.id])
              .map((char) => (
                <div key={char.id} className="collection-item locked">
                  <div className="character-card locked-card">
                    <div className="character-card-model">
                      <div className="model-fallback">
                        <span className="model-fallback-icon">?</span>
                      </div>
                    </div>
                    <div className="character-card-info">
                      <span className={`character-rarity-badge rarity-${char.rarity}`}>
                        {char.rarity}
                      </span>
                      <h3 className="character-card-name">???</h3>
                      <span className="character-card-anime">{char.anime}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
