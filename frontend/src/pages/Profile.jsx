import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AnimeCard from "../components/AnimeCard";
import AchievementBadge from "../components/AchievementBadge";
import { getMyAchievements } from "../api/achievementApi";
import { getCollection, getCoins } from "../api/gachaApi";
import CharacterCard from "../components/CharacterCard";
import characterRegistry from "../data/characterRegistry.json";

function Profile() {
  const { user, isLoggedIn, logout, loading, token } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [featuredChar, setFeaturedChar] = useState(null);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate("/login");
  }, [loading, isLoggedIn]);

  useEffect(() => {
    if (token) {
      getMyAchievements(token).then(setAchievements).catch(() => {});
      getCollection(token).then((data) => {
        const owned = new Set(data.collection.map((c) => c.characterId));
        setCollectionCount(owned.size);
        // Find the rarest owned character as featured
        const rarityOrder = ["legendary", "epic", "rare", "common"];
        for (const rarity of rarityOrder) {
          const found = characterRegistry.find((c) => owned.has(c.id) && c.rarity === rarity);
          if (found) { setFeaturedChar(found); break; }
        }
      }).catch(() => {});
      getCoins(token).then((d) => setCoinBalance(d.balance)).catch(() => {});
    }
  }, [token]);

  if (loading || !user) return null;

  const recentHistory = [...(user.watchHistory || [])].reverse().slice(0, 20);
  const progressMap = {};
  (user.watchProgress || []).forEach((wp) => {
    const key = `${wp.animeId}-${wp.episodeNumber}`;
    progressMap[key] = wp.progress;
  });

  const uniqueAnime = new Set((user.watchHistory || []).map((w) => w.animeId));
  const totalEpisodes = (user.watchHistory || []).length;

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
            <span>{uniqueAnime.size} Anime</span>
            <span>{totalEpisodes} Episodes</span>
            <Link to="/achievements" style={{ color: "var(--accent)" }}>
              {achievements.filter((a) => a.unlocked).length} Badges
            </Link>
            <Link to="/collection" style={{ color: "var(--accent)" }}>
              {collectionCount} Characters
            </Link>
            <span className="profile-coins">
              <span className="coin-icon">&#x1FA99;</span> {coinBalance}
            </span>
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Sign Out</button>
        </div>
      </div>

      {featuredChar && (
        <section className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Featured Character</h2>
            <Link to="/collection" className="section-link">View Collection &rarr;</Link>
          </div>
          <div className="profile-featured-char">
            <CharacterCard character={featuredChar} />
          </div>
        </section>
      )}

      {achievements.filter((a) => a.unlocked).length > 0 && (
        <section className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Achievements</h2>
            <Link to="/achievements" className="section-link">See All &rarr;</Link>
          </div>
          <div className="achievements-grid compact">
            {achievements.filter((a) => a.unlocked).slice(0, 6).map((a) => (
              <AchievementBadge key={a.badge} achievement={a} compact />
            ))}
          </div>
        </section>
      )}

      {user.favorites?.length > 0 && (
        <section className="profile-section">
          <div className="section-header">
            <h2 className="section-title">Favorites</h2>
          </div>
          <div className="favorites-grid">
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
            {recentHistory.map((w, i) => {
              const progress = progressMap[`${w.animeId}-${w.episodeNumber}`];
              return (
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
                  {progress > 0 && (
                    <div className="history-progress-bar">
                      <div
                        className="history-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  <div className="history-info">
                    <span className="history-title">{w.animeTitle}</span>
                    <span className="history-ep">
                      Episode {w.episodeNumber}
                      {progress > 0 && <span className="history-percent"> ({progress}%)</span>}
                    </span>
                    <span className="history-date">
                      {new Date(w.watchedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
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
