function AnimeDetailsSkeleton() {
  return (
    <div className="details-page">
      <div className="details-banner">
        <div className="details-banner-bg skeleton" />
        <div className="details-banner-gradient" />
      </div>

      <div className="details-content container">
        <div className="details-header">
          <div className="details-cover">
            <div className="skeleton" style={{ aspectRatio: "3/4", width: "100%" }} />
          </div>
          <div className="details-info" style={{ flex: 1 }}>
            <div className="skeleton-text" style={{ width: "60%", height: 32, marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {[60, 80, 100].map((w, i) => (
                <div key={i} className="skeleton" style={{ width: w, height: 28, borderRadius: 20 }} />
              ))}
            </div>
            <div className="skeleton-text" style={{ width: "100%", marginBottom: 8 }} />
            <div className="skeleton-text" style={{ width: "100%", marginBottom: 8 }} />
            <div className="skeleton-text" style={{ width: "75%", marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="skeleton-text" style={{ width: 60, height: 10, marginBottom: 4 }} />
                  <div className="skeleton-text" style={{ width: 120, height: 14 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div className="skeleton-text" style={{ width: 120, height: 24, marginBottom: 20 }} />
          <div className="episode-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimeDetailsSkeleton;
