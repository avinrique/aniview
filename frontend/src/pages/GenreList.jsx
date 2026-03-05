import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGenres } from "../api/animeApi";

const GENRE_ICONS = {
  Action: "&#9876;",
  Adventure: "&#9978;",
  Comedy: "&#128514;",
  Drama: "&#127917;",
  Fantasy: "&#128302;",
  Horror: "&#128123;",
  Mystery: "&#128270;",
  Romance: "&#10084;",
  "Sci-Fi": "&#128640;",
  "Slice of Life": "&#127774;",
  Sports: "&#9917;",
  Supernatural: "&#128171;",
  Thriller: "&#128163;",
  Mecha: "&#129302;",
  Music: "&#127925;",
  Psychological: "&#129504;",
  "Mahou Shoujo": "&#10024;",
  Ecchi: "&#128293;",
};

function GenreList() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGenres()
      .then(setGenres)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container genre-list-page">
      <div className="genre-list-header">
        <h1>Browse by Genre</h1>
        <p>Discover anime by your favorite genres</p>
      </div>

      {loading ? (
        <div className="genre-grid">
          {Array.from({ length: 18 }, (_, i) => (
            <div key={i} className="skeleton genre-card-skeleton" />
          ))}
        </div>
      ) : (
        <div className="genre-grid">
          {genres.map((genre) => (
            <Link
              key={genre}
              to={`/genre/${encodeURIComponent(genre)}`}
              className="genre-card"
            >
              <span
                className="genre-card-icon"
                dangerouslySetInnerHTML={{
                  __html: GENRE_ICONS[genre] || "&#127916;",
                }}
              />
              <span className="genre-card-name">{genre}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default GenreList;
