import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnimeCard from "../components/AnimeCard";
import AnimeCardSkeleton from "../components/skeletons/AnimeCardSkeleton";
import { getFeaturedAnime, getGenres, getPopular, getTopRated } from "../api/animeApi";
import ParticleBackground from "../components/ParticleBackground";
import useSeason from "../hooks/useSeason";
import { getContinueWatching, removeContinueWatching } from "../hooks/useContinueWatching";
import ModelViewer from "../components/ModelViewer";
import useWatchStreak from "../hooks/useWatchStreak";
import { useAuth } from "../context/AuthContext";

function Home() {
  const [featured, setFeatured] = useState([]);
  const [genres, setGenres] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [continueList, setContinueList] = useState([]);
  const season = useSeason();
  const { isLoggedIn } = useAuth();
  const { streak } = useWatchStreak();

  useEffect(() => {
    setContinueList(getContinueWatching());
  }, []);

  const dismissContinue = (animeId) => {
    removeContinueWatching(animeId);
    setContinueList((prev) => prev.filter((i) => i.animeId !== animeId));
  };

  useEffect(() => {
    Promise.all([
      getFeaturedAnime().catch(() => []),
      getGenres().catch(() => []),
      getPopular().catch(() => []),
      getTopRated().catch(() => []),
    ]).then(([feat, gen, pop, top]) => {
      setFeatured(feat);
      setGenres(gen);
      setPopular(pop);
      setTopRated(top);
      setLoading(false);
    });
  }, []);

  const spotlight = featured.length > 0 ? featured[0] : null;

  return (
    <div className="home-page">
      <ParticleBackground season={season} />
      {/* Hero Spotlight */}
      {spotlight ? (
        <div className="hero-spotlight">
          <div
            className="hero-bg"
            style={{ backgroundImage: `url(${spotlight.thumbnail})` }}
          />
          <div className="hero-gradient" />
          <div className="hero-content">
            <span className="hero-badge">
              {spotlight.status === "Currently Airing" ? "Now Airing" : "Featured"}
            </span>
            <h1 className="hero-title">{spotlight.title}</h1>
            <div className="hero-meta">
              {spotlight.type && <span>{spotlight.type}</span>}
              {spotlight.type && spotlight.releaseYear && <span className="hero-meta-dot" />}
              {spotlight.releaseYear && <span>{spotlight.releaseYear}</span>}
              {spotlight.episodes > 0 && (
                <>
                  <span className="hero-meta-dot" />
                  <span>{spotlight.episodes} Episodes</span>
                </>
              )}
              {spotlight.genres?.length > 0 && (
                <>
                  <span className="hero-meta-dot" />
                  <span>{spotlight.genres.slice(0, 3).join(", ")}</span>
                </>
              )}
            </div>
            <div className="hero-actions">
              <Link to={`/anime/${spotlight.animeId}`} className="btn btn-primary">
                &#9654; Watch Now
              </Link>
              <Link to={`/anime/${spotlight.animeId}`} className="btn btn-ghost">
                Details
              </Link>
            </div>
          </div>
          <div className="hero-mascot">
            <ModelViewer
              modelType="glb"
              modelPath="/models/gojo-satoru.glb"
              height={260}
              name="Gojo"
            />
          </div>
        </div>
      ) : loading ? (
        <div className="hero-spotlight">
          <div className="hero-bg skeleton" />
        </div>
      ) : null}

      <div className="container">
        {/* Watch Streak Badge */}
        {isLoggedIn && streak > 0 && (
          <div className="streak-badge">
            <span className="streak-fire">&#128293;</span>
            <span className="streak-count">{streak} day{streak !== 1 ? "s" : ""}</span>
            <span className="streak-label">watch streak</span>
          </div>
        )}

        {/* Continue Watching */}
        {continueList.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Continue Watching</h2>
            </div>
            <div className="continue-watching-row">
              {continueList.map((item) => (
                <div key={item.animeId} className="cw-card">
                  <button
                    className="cw-dismiss"
                    onClick={() => dismissContinue(item.animeId)}
                    title="Remove"
                  >
                    &times;
                  </button>
                  <Link to={`/watch/${item.animeId}/${item.episodeNumber}`}>
                    <div className="cw-thumbnail">
                      <img src={item.thumbnail} alt={item.animeTitle} />
                      <div className="cw-play-overlay">
                        <span className="cw-play-icon">&#9654;</span>
                      </div>
                      <div className="cw-progress-bar">
                        <div
                          className="cw-progress-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="cw-info">
                      <h4 className="cw-title">{item.animeTitle}</h4>
                      <span className="cw-episode">Episode {item.episodeNumber}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Genre Chips */}
        {genres.length > 0 && (
          <div className="genre-chips-section">
            <div className="section-header">
              <h2 className="section-title">Browse Genres</h2>
              <Link to="/genres" className="section-link">See All &rarr;</Link>
            </div>
            <div className="genre-chips">
              {genres.map((g) => (
                <Link
                  key={g}
                  to={`/genre/${encodeURIComponent(g)}`}
                  className="genre-chip"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Now */}
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
        </div>
        {loading ? (
          <div className="anime-grid">
            {Array.from({ length: 12 }, (_, i) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="anime-grid">
            {featured.map((anime) => (
              <AnimeCard key={anime.animeId || anime.title} anime={anime} />
            ))}
          </div>
        ) : (
          <p className="empty-text">Could not load featured anime.</p>
        )}

        {/* Most Popular */}
        {popular.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Most Popular</h2>
              <Link to="/category/popular" className="section-link">See All &rarr;</Link>
            </div>
            <div className="anime-scroll-row">
              {popular.slice(0, 10).map((anime, i) => (
                <AnimeCard key={`pop-${anime.title}-${i}`} anime={anime} />
              ))}
            </div>
          </>
        )}

        {/* Top Rated */}
        {topRated.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Top Rated</h2>
              <Link to="/category/top-rated" className="section-link">See All &rarr;</Link>
            </div>
            <div className="anime-scroll-row">
              {topRated.slice(0, 10).map((anime, i) => (
                <AnimeCard key={`top-${anime.title}-${i}`} anime={anime} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
