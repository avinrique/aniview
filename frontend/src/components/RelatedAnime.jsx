import { useEffect, useState } from "react";
import { getRelatedAnime } from "../api/animeApi";
import AnimeCard from "./AnimeCard";

const GROUP_LABELS = {
  sequels: "Sequels",
  prequels: "Prequels",
  sideStories: "Side Stories",
  spinOffs: "Spin-Offs",
  others: "Related",
};

function RelatedAnime({ title }) {
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    getRelatedAnime(title)
      .then(setGroups)
      .catch(() => setGroups(null))
      .finally(() => setLoading(false));
  }, [title]);

  if (loading || !groups) return null;

  const nonEmpty = Object.entries(groups).filter(([, items]) => items.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="related-section">
      {nonEmpty.map(([key, items]) => (
        <div key={key} className="related-group">
          <div className="section-header">
            <h2 className="section-title">{GROUP_LABELS[key] || key}</h2>
          </div>
          <div className="anime-scroll-row">
            {items.map((anime) => (
              <AnimeCard key={anime.anilistId || anime.title} anime={anime} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RelatedAnime;
