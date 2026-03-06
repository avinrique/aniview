import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyAchievements } from "../api/achievementApi";
import AchievementBadge from "../components/AchievementBadge";

export default function Achievements() {
  const { isLoggedIn, token } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setLoading(false);
      return;
    }
    getMyAchievements(token)
      .then(setAchievements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, token]);

  const earned = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="achievements-page container">
      <div className="achievements-header">
        <h1>Achievements</h1>
        <p>
          {earned.length} of {achievements.length} badges unlocked
        </p>
      </div>

      {!isLoggedIn ? (
        <p className="empty-text">Sign in to track your achievements.</p>
      ) : loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          {earned.length > 0 && (
            <section className="achievements-section">
              <h2 className="section-title">Earned</h2>
              <div className="achievements-grid">
                {earned.map((a) => (
                  <AchievementBadge key={a.badge} achievement={a} />
                ))}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section className="achievements-section">
              <h2 className="section-title">Locked</h2>
              <div className="achievements-grid">
                {locked.map((a) => (
                  <AchievementBadge key={a.badge} achievement={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
