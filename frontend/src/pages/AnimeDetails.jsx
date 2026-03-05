import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnimeDetails } from "../api/animeApi";
import { useAuth } from "../context/AuthContext";
import { trackAnimeView } from "../hooks/useAnalytics";
import EpisodeList from "../components/EpisodeList";
import RelatedAnime from "../components/RelatedAnime";
import AnimeDetailsSkeleton from "../components/skeletons/AnimeDetailsSkeleton";
import ErrorMessage from "../components/ErrorMessage";

function AnimeDetails() {
  const { animeId } = useParams();
  const { isLoggedIn, isFavorite, addFavorite, removeFavorite } = useAuth();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnimeDetails(animeId);
      setAnime(data);
      trackAnimeView(animeId, data.title);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load anime details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    window.scrollTo(0, 0);
  }, [animeId]);

  if (loading) return <AnimeDetailsSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDetails} />;
  if (!anime) return null;

  return (
    <div className="details-page">
      {/* Banner */}
      <div className="details-banner">
        <div
          className="details-banner-bg"
          style={{ backgroundImage: `url(${anime.cover})` }}
        />
        <div className="details-banner-gradient" />
      </div>

      {/* Content */}
      <div className="details-content container">
        <div className="details-header">
          {anime.cover && (
            <div className="details-cover">
              <img
                src={anime.cover}
                alt={anime.title}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="details-info">
            <h1>{anime.title}</h1>

            {isLoggedIn && (
              <button
                className={`btn favorite-btn${isFavorite(animeId) ? " favorited" : ""}`}
                onClick={() =>
                  isFavorite(animeId)
                    ? removeFavorite(animeId)
                    : addFavorite({ animeId, title: anime.title, thumbnail: anime.cover })
                }
              >
                {isFavorite(animeId) ? "★ Favorited" : "☆ Add to Favorites"}
              </button>
            )}

            <div className="details-meta-row">
              {anime.info?.Type && <span className="details-tag">{anime.info.Type}</span>}
              {anime.info?.Status && (
                <span className={`details-tag${anime.info.Status?.includes("Airing") ? " accent" : ""}`}>
                  {anime.info.Status}
                </span>
              )}
              {anime.info?.Aired && <span className="details-tag">{anime.info.Aired}</span>}
              {anime.episodes && (
                <span className="details-tag">{anime.episodes.length} Episodes</span>
              )}
            </div>

            {anime.synopsis && (
              <div className="synopsis-wrapper">
                <p className={`synopsis${synopsisExpanded ? "" : " collapsed"}`}>
                  {anime.synopsis}
                </p>
                <button
                  className="synopsis-toggle"
                  onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                >
                  {synopsisExpanded ? "Show less" : "Read more"}
                </button>
              </div>
            )}

            {anime.info && (
              <div className="info-grid">
                {Object.entries(anime.info)
                  .filter(([key]) => !["Japanese", "External Links"].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="info-item">
                      <div className="info-item-label">{key}</div>
                      <div className="info-item-value">{value}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <EpisodeList animeId={animeId} episodes={anime.episodes} />
        <RelatedAnime title={anime.title} />
      </div>
    </div>
  );
}

export default AnimeDetails;
