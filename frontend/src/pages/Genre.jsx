import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getByGenre } from "../api/animeApi";
import AnimeCard from "../components/AnimeCard";
import AnimeCardSkeleton from "../components/skeletons/AnimeCardSkeleton";
import ErrorMessage from "../components/ErrorMessage";

function Genre() {
  const { genre } = useParams();
  const [results, setResults] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGenre = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getByGenre(genre, p);
      if (p === 1) {
        setResults(data.results);
      } else {
        setResults((prev) => [...prev, ...data.results]);
      }
      setPageInfo(data.pageInfo);
      setPage(p);
    } catch (err) {
      setError("Failed to load anime for this genre.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setResults([]);
    setPage(1);
    fetchGenre(1);
    window.scrollTo(0, 0);
  }, [genre]);

  return (
    <div className="container genre-page">
      <div className="genre-page-header">
        <Link to="/genres" className="genre-back">&larr; All Genres</Link>
        <h1>{genre}</h1>
        {pageInfo && (
          <p className="genre-count">{pageInfo.total} anime found</p>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={() => fetchGenre(page)} />}

      {!error && (
        <>
          <div className="anime-grid">
            {results.map((anime, i) => (
              <AnimeCard key={`${anime.title}-${i}`} anime={anime} />
            ))}
            {loading &&
              Array.from({ length: 12 }, (_, i) => (
                <AnimeCardSkeleton key={`sk-${i}`} />
              ))}
          </div>

          {pageInfo?.hasNextPage && !loading && (
            <div className="load-more">
              <button
                className="btn btn-ghost"
                onClick={() => fetchGenre(page + 1)}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Genre;
