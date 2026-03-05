import { Link } from "react-router-dom";

function AnimeCard({ anime }) {
  const href = anime.animeId
    ? `/anime/${anime.animeId}`
    : `/resolve?title=${encodeURIComponent(anime.title)}`;

  return (
    <Link to={href} className="anime-card">
      <div className="anime-card-image">
        {anime.type && <span className="anime-card-type">{anime.type}</span>}
        <img
          src={anime.thumbnail}
          alt={anime.title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="anime-card-overlay">
          <div className="anime-card-play" />
        </div>
      </div>
      <div className="anime-card-info">
        <h3>{anime.title}</h3>
        <div className="anime-card-meta">
          {anime.releaseYear && <span>{anime.releaseYear}</span>}
          {anime.episodes != null && anime.episodes > 0 && (
            <span>{anime.episodes} eps</span>
          )}
          {anime.status === "Currently Airing" && (
            <span style={{ color: "var(--success)" }}>Airing</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default AnimeCard;
