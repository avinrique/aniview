import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getEpisodeVideo, getAnimeDetails } from "../api/animeApi";
import { useAuth } from "../context/AuthContext";
import { trackEpisodeWatch } from "../hooks/useAnalytics";
import { saveProgress } from "../hooks/useContinueWatching";
import VideoPlayerSkeleton from "../components/skeletons/VideoPlayerSkeleton";
import ErrorMessage from "../components/ErrorMessage";
import ChatBox from "../components/ChatBox";

function VideoPlayer() {
  const splat = useParams()["*"] || "";
  const lastSlash = splat.lastIndexOf("/");
  const animeId = splat.substring(0, lastSlash);
  const episodeNumber = splat.substring(lastSlash + 1);
  const { addWatchHistory, updateWatchProgress, user } = useAuth();
  const progressRef = useRef(0);
  const startTimeRef = useRef(null);
  const animeMetaRef = useRef(null);
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
      animeMetaRef.current = {
        title: details.title,
        thumbnail: details.thumbnail || details.cover,
      };

      const bestUrl = pickBestUrl(data.sub) || pickBestUrl(data.dub);
      if (bestUrl) setSelectedUrl(bestUrl);

      // Save initial continue watching entry (0% progress)
      saveProgress({
        animeId,
        episodeNumber,
        animeTitle: details.title,
        thumbnail: details.thumbnail || details.cover,
        progress: 0,
      });

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

  // Track watch progress with a periodic timer (every 30s)
  useEffect(() => {
    if (!selectedUrl) return;
    startTimeRef.current = Date.now();
    progressRef.current = 0;

    const saveBoth = (progress) => {
      const meta = animeMetaRef.current;
      if (meta) {
        saveProgress({
          animeId,
          episodeNumber,
          animeTitle: meta.title,
          thumbnail: meta.thumbnail,
          progress,
        });
      }
      if (user) {
        updateWatchProgress(animeId, Number(episodeNumber), progress);
      }
    };

    const interval = setInterval(() => {
      // Estimate progress based on time watched (assume ~24min episode)
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const estimatedProgress = Math.min(100, Math.round((elapsed / (24 * 60)) * 100));
      if (estimatedProgress > progressRef.current) {
        progressRef.current = estimatedProgress;
        saveBoth(estimatedProgress);
      }
    }, 30000);

    return () => {
      // Save final progress on unmount
      if (progressRef.current > 0) {
        saveBoth(progressRef.current);
      }
      clearInterval(interval);
    };
  }, [selectedUrl, user, animeId, episodeNumber]);

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

      {animeTitle && (
        <ChatBox animeId={animeId} animeTitle={animeTitle} episodeNumber={Number(episodeNumber)} />
      )}

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
