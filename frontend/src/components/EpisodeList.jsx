import { Link } from "react-router-dom";

function EpisodeList({ animeId, episodes }) {
  if (!episodes || episodes.length === 0) {
    return <p className="empty-text">No episodes available yet.</p>;
  }

  return (
    <div className="episode-section">
      <div className="episode-section-header">
        <h2>Episodes</h2>
        <span className="episode-count">{episodes.length} episodes</span>
      </div>
      <div className="episode-grid">
        {episodes.map((ep) => (
          <Link
            key={ep.episodeNumber}
            to={`/watch/${animeId}/${ep.episodeNumber}`}
            className="episode-item"
          >
            <div className="episode-thumb">
              {ep.snapshot ? (
                <img
                  src={ep.snapshot}
                  alt={`Episode ${ep.episodeNumber}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="episode-thumb-placeholder" />
              )}
              <div className="episode-play-icon" />
            </div>
            <div className="episode-info">
              <span className="episode-number-label">Episode {ep.episodeNumber}</span>
              <span className="episode-title-text">{ep.title || `Episode ${ep.episodeNumber}`}</span>
              {ep.duration && (
                <span className="episode-duration-text">{ep.duration}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EpisodeList;
