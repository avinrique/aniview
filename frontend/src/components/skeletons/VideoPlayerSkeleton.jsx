function VideoPlayerSkeleton() {
  return (
    <div className="watch-page">
      <div className="watch-header">
        <div className="skeleton-text" style={{ width: 200, height: 24 }} />
      </div>

      <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, marginBottom: 24 }} />

      <div className="skeleton" style={{ height: 100, borderRadius: 12, marginBottom: 24 }} />

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
        {[120, 130, 120].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 40, borderRadius: 8 }} />
        ))}
      </div>

      <div>
        <div className="skeleton-text" style={{ width: 80, height: 18, marginBottom: 16 }} />
        <div className="episode-selector-grid">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerSkeleton;
