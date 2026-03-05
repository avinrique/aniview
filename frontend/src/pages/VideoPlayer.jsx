import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getEpisodeVideo, getAnimeDetails } from "../api/animeApi";
import { useAuth } from "../context/AuthContext";
import { trackEpisodeWatch } from "../hooks/useAnalytics";
import VideoPlayerSkeleton from "../components/skeletons/VideoPlayerSkeleton";
import ErrorMessage from "../components/ErrorMessage";

function VideoPlayer() {
  const { animeId, episodeNumber } = useParams();
  const { addWatchHistory } = useAuth();
  const [videoData, setVideoData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [animeTitle, setAnimeTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const fetchVideo = useCallback(async () => {
    setVideoData(null);
    setSelectedUrl(null);
    setLoading(true);
    setError(null);
    try {
      const [data, details] = await Promise.all([
        getEpisodeVideo(animeId, episodeNumber),
        getAnimeDetails(animeId),
      ]);
      setVideoData(data);
      setEpisodes(details.episodes || []);
      setAnimeTitle(details.title || "");

      const bestUrl = pickBestUrl(data.sub) || pickBestUrl(data.dub);
      if (bestUrl) setSelectedUrl(bestUrl);

      trackEpisodeWatch(animeId, details.title, episodeNumber);
      addWatchHistory(details, episodeNumber);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load episode. Please retry."
      );
    } finally {
      setLoading(false);
    }
  }, [animeId, episodeNumber]);

  useEffect(() => {
    fetchVideo();
    window.scrollTo(0, 0);
  }, [fetchVideo]);

  if (loading) return <VideoPlayerSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={fetchVideo} />;
  if (!videoData) return null;

  const hasSub = videoData.sub && Object.keys(videoData.sub).length > 0;
  const hasDub = videoData.dub && Object.keys(videoData.dub).length > 0;
  const hasAnySources = hasSub || hasDub;

  const currentEp = Number(episodeNumber);
  const prevEp = currentEp > 1 ? currentEp - 1 : null;
  const nextEp = currentEp + 1;

  return (
    <div className="watch-page">
      <div className="watch-header">
        <h2 className="watch-title">
          Episode {episodeNumber}
          {animeTitle && <span>{animeTitle}</span>}
        </h2>
      </div>

      <div className="player-container">
        {selectedUrl ? (
          <iframe
            src={selectedUrl}
            className="video-iframe"
            allowFullScreen
            frameBorder="0"
            title={`Episode ${episodeNumber}`}
          />
        ) : (
          <div className="no-video">
            <p>
              {hasAnySources
                ? "Select a quality below to start watching."
                : "No video sources found for this episode."}
            </p>
            {videoData.watchUrl && (
              <a
                href={videoData.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                Open on source site &#8599;
              </a>
            )}
          </div>
        )}
      </div>

      {hasAnySources && (
        <div className="controls-row">
          {hasSub && (
            <div className="control-group">
              <h3>Sub (Japanese)</h3>
              <div className="quality-buttons">
                {sortedQualities(videoData.sub).map(([res, url]) => (
                  <button
                    key={`sub-${res}`}
                    className={`quality-btn${selectedUrl === url ? " active" : ""}`}
                    onClick={() => setSelectedUrl(url)}
                  >
                    {res}p
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasDub && (
            <div className="control-group">
              <h3>Dub (English)</h3>
              <div className="quality-buttons">
                {sortedQualities(videoData.dub).map(([res, url]) => (
                  <button
                    key={`dub-${res}`}
                    className={`quality-btn${selectedUrl === url ? " active" : ""}`}
                    onClick={() => setSelectedUrl(url)}
                  >
                    {res}p
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="episode-nav">
        {prevEp && (
          <Link to={`/watch/${animeId}/${prevEp}`} className="nav-btn">
            &larr; Ep {prevEp}
          </Link>
        )}
        <Link to={`/anime/${animeId}`} className="nav-btn">
          All Episodes
        </Link>
        <Link to={`/watch/${animeId}/${nextEp}`} className="nav-btn">
          Ep {nextEp} &rarr;
        </Link>
      </div>

      {episodes.length > 0 && (
        <div className="episode-selector">
          <h3>Episodes</h3>
          <div className="episode-selector-grid">
            {episodes.map((ep) => (
              <Link
                key={ep.episodeNumber}
                to={`/watch/${animeId}/${ep.episodeNumber}`}
                className={`episode-selector-item${
                  String(ep.episodeNumber) === String(episodeNumber) ? " current" : ""
                }`}
              >
                {ep.episodeNumber}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function pickBestUrl(qualityMap) {
  if (!qualityMap) return null;
  const resolutions = Object.keys(qualityMap).map(Number).sort((a, b) => b - a);
  return resolutions.length > 0 ? qualityMap[String(resolutions[0])] : null;
}

function sortedQualities(qualityMap) {
  return Object.entries(qualityMap).sort(([a], [b]) => Number(a) - Number(b));
}

export default VideoPlayer;
