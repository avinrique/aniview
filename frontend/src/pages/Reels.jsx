import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getReels, createReel, toggleLike } from "../api/reelApi";

function ReelCard({ reel, userId, onLike, isActive }) {
  const [liked, setLiked] = useState(reel.likes?.includes(userId));
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
  const videoRef = useRef();

  // Auto-pause when not active
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    const res = await onLike(reel._id);
    setLiked(res.liked);
    setLikeCount(res.likes);
  };

  const renderMedia = () => {
    if (reel.type === "upload") {
      return (
        <video
          ref={videoRef}
          src={`http://localhost:3001/uploads/${reel.videoFile}`}
          className="reel-feed-video"
          loop
          playsInline
          muted={!isActive}
          controls={isActive}
          preload="metadata"
          onClick={(e) => {
            if (e.target.paused) e.target.play();
            else e.target.pause();
          }}
        />
      );
    }
    if (reel.type === "youtube") {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${reel.embedUrl}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=${isActive ? 1 : 0}&loop=1&playlist=${reel.embedUrl}`}
          className="reel-feed-video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          title={reel.title}
        />
      );
    }
    if (reel.type === "instagram") {
      return (
        <iframe
          src={`https://www.instagram.com/reel/${reel.embedUrl}/embed/`}
          className="reel-feed-video reel-ig-frame"
          allowFullScreen
          title={reel.title}
        />
      );
    }
  };

  return (
    <div className={`reel-feed-item${isActive ? " active" : ""}`}>
      <div className="reel-feed-media">{renderMedia()}</div>
      <div className="reel-feed-overlay">
        <div className="reel-feed-sidebar">
          <button className={`reel-feed-action${liked ? " liked" : ""}`} onClick={handleLike}>
            <span className="reel-feed-icon">{liked ? "\u2764\uFE0F" : "\u2661"}</span>
            <span className="reel-feed-action-count">{likeCount}</span>
          </button>
        </div>
        <div className="reel-feed-info">
          <div className="reel-feed-author">
            {reel.postedBy?.avatar ? (
              <img src={reel.postedBy.avatar} alt="" className="reel-feed-avatar" />
            ) : (
              <span className="reel-feed-avatar-placeholder">
                {reel.postedBy?.username?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="reel-feed-username">@{reel.postedBy?.username}</span>
          </div>
          <h3 className="reel-feed-title">{reel.title}</h3>
          {reel.description && <p className="reel-feed-desc">{reel.description}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Reels() {
  const { user, isLoggedIn, isAdmin } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("youtube");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formFile, setFormFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const fileRef = useRef();
  const feedRef = useRef();

  useEffect(() => { loadReels(); }, [page]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const data = await getReels(page);
      setReels(data.reels);
      setTotalPages(data.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Track which reel is in view
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index);
            setActiveIndex(idx);
          }
        }
      },
      { root: feed, threshold: 0.6 }
    );
    feed.querySelectorAll(".reel-feed-item").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const handleLike = async (id) => toggleLike(id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg("");
    try {
      const fd = new FormData();
      fd.append("type", formType);
      fd.append("title", formTitle);
      fd.append("description", formDesc);
      if (formType === "upload") {
        if (!formFile) { setFormMsg("Please select a video file"); setSubmitting(false); return; }
        fd.append("video", formFile);
      } else {
        fd.append("embedUrl", formUrl);
      }
      await createReel(fd);
      setFormTitle(""); setFormDesc(""); setFormUrl(""); setFormFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
      if (isAdmin) loadReels();
      else setFormMsg("Reel submitted! It will appear after admin approval.");
    } catch (err) {
      setFormMsg(err.response?.data?.error || "Failed to post reel");
    }
    setSubmitting(false);
  };

  return (
    <div className="reels-page">
      <div className="reels-top-bar">
        <h1>Reels</h1>
        {isLoggedIn && (
          <button className="btn btn-primary reels-post-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Post"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="reels-form-overlay">
          <form className="reel-form" onSubmit={handleSubmit}>
            <h2>Post a Reel</h2>
            <div className="reel-form-types">
              {[
                ["youtube", "YouTube / Shorts"],
                ["instagram", "Instagram Reel"],
                ["upload", "Upload Video"],
              ].map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  className={`quality-btn${formType === t ? " active" : ""}`}
                  onClick={() => setFormType(t)}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text" placeholder="Give it a title" value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="reel-form-input" maxLength={100} required
            />
            <textarea
              placeholder="Description (optional)" value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="reel-form-input reel-form-textarea" maxLength={500}
            />
            {formType !== "upload" ? (
              <input
                type="url"
                placeholder={formType === "youtube" ? "Paste YouTube or Shorts link" : "Paste Instagram Reel link"}
                value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                className="reel-form-input" required
              />
            ) : (
              <div className="reel-form-file-wrap">
                <input type="file" accept="video/*" ref={fileRef}
                  onChange={(e) => setFormFile(e.target.files[0])}
                  className="reel-form-file" required
                />
                <p className="reel-form-hint">Max 50MB, under 2 minutes</p>
              </div>
            )}
            {formMsg && <p className="reel-form-msg">{formMsg}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Posting..." : "Post Reel"}
            </button>
          </form>
        </div>
      )}

      {formMsg && !showForm && (
        <p className="reel-success-msg">{formMsg}</p>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : reels.length === 0 ? (
        <p className="empty-text">No reels yet. Be the first to post!</p>
      ) : (
        <>
          <div className="reel-feed" ref={feedRef}>
            {reels.map((reel, i) => (
              <ReelCard
                key={reel._id}
                reel={reel}
                userId={user?.id}
                onLike={handleLike}
                isActive={i === activeIndex}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="reels-pagination">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span className="reels-page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
