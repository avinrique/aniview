import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPopular, getTopRated, getRecent } from "../api/animeApi";
import AnimeCard from "../components/AnimeCard";
import AnimeCardSkeleton from "../components/skeletons/AnimeCardSkeleton";
import ErrorMessage from "../components/ErrorMessage";

const CATEGORIES = {
  popular: { title: "Most Popular", subtitle: "Currently airing fan favorites", fetch: getPopular },
  "top-rated": { title: "Top Rated", subtitle: "Highest rated anime of all time", fetch: getTopRated },
  recent: { title: "Recently Added", subtitle: "Latest releases this season", fetch: getRecent },
};

function Category() {
  const { category } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = CATEGORIES[category];

  const fetchData = async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const data = await config.fetch();
      setResults(data);
    } catch {
      setError("Failed to load anime.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [category]);

  if (!config) {
    return (
      <div className="container">
        <p className="empty-text">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="container category-page">
      <div className="category-header">
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {!error && (
        <div className="anime-grid">
          {loading
            ? Array.from({ length: 12 }, (_, i) => <AnimeCardSkeleton key={i} />)
            : results.map((anime, i) => (
                <AnimeCard key={`${anime.title}-${i}`} anime={anime} />
              ))}
        </div>
      )}
    </div>
  );
}

export default Category;
