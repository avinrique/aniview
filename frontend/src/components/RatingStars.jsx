import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAnimeRating, rateAnime } from "../api/ratingApi";

export default function RatingStars({ animeId, animeTitle }) {
  const { isLoggedIn } = useAuth();
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [hovered, setHovered] = useState(0);

  useEffect(() => {
    if (!animeId) return;
    getAnimeRating(animeId)
      .then((data) => {
        setAverage(data.average);
        setCount(data.count);
        setUserRating(data.userRating);
      })
      .catch(() => {});
  }, [animeId]);

  const handleRate = async (value) => {
    if (!isLoggedIn) return;
    try {
      const data = await rateAnime(animeId, animeTitle, value);
      setAverage(data.average);
      setCount(data.count);
      setUserRating(data.userRating);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rating-component">
      <div className="rating-stars">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            className={`rating-star${
              (hovered || userRating || 0) >= n ? " filled" : ""
            }${!isLoggedIn ? " disabled" : ""}`}
            onMouseEnter={() => isLoggedIn && setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(n)}
            title={`${n}/10`}
          >
            &#9733;
          </button>
        ))}
      </div>
      <div className="rating-info">
        <span className="rating-average">{average > 0 ? average.toFixed(1) : "—"}</span>
        <span className="rating-count">/ 10 ({count} {count === 1 ? "rating" : "ratings"})</span>
        {userRating && <span className="rating-yours">Your rating: {userRating}/10</span>}
      </div>
    </div>
  );
}
