import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AnimeCard from "../components/AnimeCard";

function Profile() {
  const { user, isLoggedIn, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate("/login");
  }, [loading, isLoggedIn]);

  if (loading || !user) return null;

  const recentHistory = [...(user.watchHistory || [])].reverse().slice(0, 20);

  return (
    <div className="profile-page container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{user.username}</h1>
          <p className="profile-email">{user.email}</p>
          <div className="profile-stats">
            <span>{user.favorites?.length || 0} Favorites</span>
            <span>{user.watchHistory?.length || 0} Watched</span>
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Sign Out</button>
        </div>
      </div>

      {user.favorites?.length > 0 && (
        <section className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Favorites</h2>
          </div>
          <div className="anime-scroll-row">
            {user.favorites.map((f) => (
              <AnimeCard
                key={f.animeId}
                anime={{
                  animeId: f.animeId,
                  title: f.animeTitle,
                  thumbnail: f.animeThumbnail,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {recentHistory.length > 0 && (
        <section className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Watch History</h2>
          </div>
          <div className="history-list">
            {recentHistory.map((w, i) => (
              <Link
                key={`${w.animeId}-${w.episodeNumber}-${i}`}
                to={`/watch/${w.animeId}/${w.episodeNumber}`}
                className="history-item"
              >
                <img
                  src={w.animeThumbnail}
                  alt={w.animeTitle}
                  referrerPolicy="no-referrer"
                />
                <div className="history-info">
                  <span className="history-title">{w.animeTitle}</span>
                  <span className="history-ep">Episode {w.episodeNumber}</span>
                  <span className="history-date">
                    {new Date(w.watchedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.favorites?.length === 0 && recentHistory.length === 0 && (
        <div className="empty-text">
          Start watching anime to build your profile!
        </div>
      )}
    </div>
  );
}

export default Profile;
