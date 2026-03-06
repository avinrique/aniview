export default function AchievementBadge({ achievement, compact = false }) {
  const { icon, title, description, unlocked, unlockedAt, progress } = achievement;

  return (
    <div className={`achievement-badge${unlocked ? " unlocked" : " locked"}${compact ? " compact" : ""}`}>
      <div className="achievement-icon">{unlocked ? icon : "?"}</div>
      <div className="achievement-info">
        <h4 className="achievement-title">{unlocked ? title : "???"}</h4>
        {!compact && (
          <p className="achievement-desc">
            {unlocked ? description : "Keep watching to unlock this badge"}
          </p>
        )}
        {unlocked && unlockedAt && (
          <span className="achievement-date">
            {new Date(unlockedAt).toLocaleDateString()}
          </span>
        )}
        {!unlocked && progress && (
          <div className="achievement-progress">
            <div className="achievement-progress-bar">
              <div
                className="achievement-progress-fill"
                style={{ width: `${(progress.current / progress.target) * 100}%` }}
              />
            </div>
            <span className="achievement-progress-text">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
