import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchAnime } from "../api/animeApi";
import { trackSearch } from "../hooks/useAnalytics";
import SearchBar from "../components/SearchBar";
import AnimeCard from "../components/AnimeCard";
import AnimeCardSkeleton from "../components/skeletons/AnimeCardSkeleton";
import ErrorMessage from "../components/ErrorMessage";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    trackSearch(query);
    try {
      const data = await searchAnime(query);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query]);

  return (
    <div className="container search-page">
      <div className="search-page-header">
        <h1>Search Results</h1>
        <p>Showing results for &ldquo;{query}&rdquo;</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchResults} />}

      {!error && (
        <>
          {loading ? (
            <div className="anime-grid">
              {Array.from({ length: 8 }, (_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="empty-text">No results found.</p>
          ) : (
            <div className="anime-grid">
              {results.map((anime) => (
                <AnimeCard key={anime.animeId} anime={anime} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResults;
