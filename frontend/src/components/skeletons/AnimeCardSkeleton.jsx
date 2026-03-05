function AnimeCardSkeleton() {
  return (
    <div className="anime-card">
      <div className="anime-card-image skeleton" style={{ aspectRatio: "3/4" }} />
      <div className="anime-card-info">
        <div className="skeleton-text" style={{ width: "85%", marginBottom: 6 }} />
        <div className="skeleton-text" style={{ width: "55%" }} />
      </div>
    </div>
  );
}

export default AnimeCardSkeleton;
