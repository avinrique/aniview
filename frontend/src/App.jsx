import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import AnimeDetails from "./pages/AnimeDetails";
import VideoPlayer from "./pages/VideoPlayer";
import GenreList from "./pages/GenreList";
import Genre from "./pages/Genre";
import Category from "./pages/Category";
import Resolve from "./pages/Resolve";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAdmin, user, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="logo">
            Ani<span className="logo-accent">View</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link${location.pathname === "/" ? " active" : ""}`}>
              Home
            </Link>
            <Link to="/genres" className={`nav-link${location.pathname.startsWith("/genre") ? " active" : ""}`}>
              Genres
            </Link>
            <Link to="/category/popular" className={`nav-link${location.pathname === "/category/popular" ? " active" : ""}`}>
              Popular
            </Link>
            <Link to="/category/top-rated" className={`nav-link${location.pathname === "/category/top-rated" ? " active" : ""}`}>
              Top Rated
            </Link>
          </div>
        </div>

        <div className="navbar-right">
          <form className="navbar-search" onSubmit={handleSearch}>
            <span className="navbar-search-icon">&#x1F50D;</span>
            <input
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={200}
            />
          </form>

          <div className="nav-auth">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="nav-link">Dashboard</Link>
                )}
                <Link to="/profile" className="nav-link nav-user">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="nav-avatar" />
                  ) : (
                    <span className="nav-avatar-placeholder">
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="nav-username">{user?.username}</span>
                </Link>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary nav-login-btn">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/genres" element={<GenreList />} />
          <Route path="/genre/:genre" element={<Genre />} />
          <Route path="/category/:category" element={<Category />} />
          <Route path="/resolve" element={<Resolve />} />
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
          <Route path="/watch/:animeId/:episodeNumber" element={<VideoPlayer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      <footer className="footer">
        AniView &mdash; Stream anime for free
      </footer>
    </div>
  );
}

export default App;
