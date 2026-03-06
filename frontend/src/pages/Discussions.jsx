import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getActiveChats } from "../api/discussionApi";

export default function Discussions() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveChats()
      .then((data) => setChats(data.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="container discussions-page">
      <div className="discussions-header">
        <div>
          <h1>Discussions</h1>
          <p>See what people are talking about</p>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : chats.length === 0 ? (
        <p className="empty-text">No discussions yet. Go to any anime page and start chatting!</p>
      ) : (
        <div className="discussions-list">
          {chats.map((chat) => (
            <Link
              key={chat._id}
              to={`/anime/${chat._id}`}
              className="discussion-card"
            >
              <div className="discussion-card-top">
                <h3 className="discussion-card-title">{chat.animeTitle}</h3>
                <span className="discussion-time">{timeAgo(chat.lastAt)}</span>
              </div>
              <p className="discussion-card-preview">{chat.lastMessage}</p>
              <span className="discussion-reply-count">{chat.count} messages</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
