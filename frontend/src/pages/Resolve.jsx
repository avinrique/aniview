import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAnime } from "../api/animeApi";

function Resolve() {
  const [searchParams] = useSearchParams();
  const title = searchParams.get("title") || "";
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!title) return;

    searchAnime(title).then((results) => {
      if (results.length > 0) {
        navigate(`/anime/${results[0].animeId}`, { replace: true });
      } else {
        navigate(`/search?q=${encodeURIComponent(title)}`, { replace: true });
      }
    }).catch(() => {
      setError(true);
    });
  }, [title]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <p className="empty-text">Could not find this anime. Try searching manually.</p>
      </div>
    );
  }

  return (
    <div className="loading">
      <div className="spinner" />
      <p>Finding {title}...</p>
    </div>
  );
}

export default Resolve;
