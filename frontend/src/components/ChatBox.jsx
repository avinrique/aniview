import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage, deleteMessage } from "../api/discussionApi";

export default function ChatBox({ animeId, animeTitle, episodeNumber = null }) {
  const { user, isLoggedIn, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bottomRef = useRef();
  const pollRef = useRef();

  const load = async (p = page) => {
    try {
      const data = await getMessages(animeId, { episode: episodeNumber, page: p });
      setMessages(data.messages);
      setTotalPages(data.totalPages);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setPage(1);
    load(1);

    // Poll for new messages every 5s
    pollRef.current = setInterval(() => load(1), 5000);
    return () => clearInterval(pollRef.current);
  }, [animeId, episodeNumber]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { message: newMsg } = await sendMessage(animeId, {
        message: text.trim(),
        animeTitle,
        episodeNumber,
      });
      setMessages((prev) => [...prev, newMsg]);
      setText("");
    } catch {
      // ignore
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    await deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  const timeStr = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const label = episodeNumber != null
    ? `Episode ${episodeNumber} Chat`
    : "Anime Discussion";

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h3>{label}</h3>
        <span className="chatbox-count">{messages.length} messages</span>
      </div>

      <div className="chatbox-messages">
        {loading ? (
          <div className="chatbox-loading"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <p className="chatbox-empty">No messages yet. Start the conversation!</p>
        ) : (
          <>
            {totalPages > 1 && page < totalPages && (
              <button
                className="chatbox-load-more"
                onClick={() => { setPage(page + 1); load(page + 1); }}
              >
                Load older messages
              </button>
            )}
            {messages.map((msg) => {
              const isOwn = user?.id === String(msg.postedBy?._id);
              return (
                <div key={msg._id} className={`chatbox-msg${isOwn ? " own" : ""}`}>
                  <div className="chatbox-msg-header">
                    {msg.postedBy?.avatar ? (
                      <img src={msg.postedBy.avatar} alt="" className="chatbox-avatar" />
                    ) : (
                      <span className="chatbox-avatar-placeholder">
                        {msg.postedBy?.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <span className="chatbox-username">{msg.postedBy?.username}</span>
                    <span className="chatbox-time">{timeStr(msg.createdAt)}</span>
                    {(isOwn || isAdmin) && (
                      <button className="chatbox-delete" onClick={() => handleDelete(msg._id)}>
                        &times;
                      </button>
                    )}
                  </div>
                  <p className="chatbox-text">{msg.message}</p>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {isLoggedIn ? (
        <form className="chatbox-input" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button type="submit" disabled={sending || !text.trim()}>
            {sending ? "..." : "Send"}
          </button>
        </form>
      ) : (
        <p className="chatbox-login">Sign in to join the discussion</p>
      )}
    </div>
  );
}
