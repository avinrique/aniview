import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import useSeason from "./hooks/useSeason";
import PageTransition from "./components/PageTransition";
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
import Reels from "./pages/Reels";
import Discussions from "./pages/Discussions";
import NotFound from "./pages/NotFound";
import Achievements from "./pages/Achievements";
import GachaPage from "./pages/GachaPage";
import Collection from "./pages/Collection";
import DailyQuiz from "./pages/DailyQuiz";
import DomainExpansion from "./components/DomainExpansion";
import useDomainExpansion from "./hooks/useDomainExpansion";
import useWatchStreak from "./hooks/useWatchStreak";
import IntroAnimation from "./components/IntroAnimation";

function App() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  useSeason();
  const { trigger: domainTrigger } = useDomainExpansion();
  const { balance } = useWatchStreak();
  const [introComplete, setIntroComplete] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="app">
      {!introComplete && <IntroAnimation onComplete={() => setIntroComplete(true)} />}
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
            <Link to="/reels" className={`nav-link${location.pathname === "/reels" ? " active" : ""}`}>
              Reels
            </Link>
            <Link to="/discussions" className={`nav-link${location.pathname.startsWith("/discussions") ? " active" : ""}`}>
              Discussions
            </Link>
            <Link to="/gacha" className={`nav-link${location.pathname === "/gacha" ? " active" : ""}`}>
              Gacha
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
                <Link to="/gacha" className="nav-coins" title="AniCoins">
                  <span className="coin-icon">&#x1FA99;</span>
                  <span>{balance}</span>
                </Link>
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
        <Routes location={location}>
          <Route path="/" element={<PageTransition key="/"><Home /></PageTransition>} />
          <Route path="/search" element={<PageTransition key="/search"><SearchResults /></PageTransition>} />
          <Route path="/genres" element={<PageTransition key="/genres"><GenreList /></PageTransition>} />
          <Route path="/genre/:genre" element={<PageTransition key={location.pathname}><Genre /></PageTransition>} />
          <Route path="/category/:category" element={<PageTransition key={location.pathname}><Category /></PageTransition>} />
          <Route path="/resolve" element={<PageTransition key="/resolve"><Resolve /></PageTransition>} />
          <Route path="/anime/*" element={<PageTransition key={location.pathname}><AnimeDetails /></PageTransition>} />
          <Route path="/watch/*" element={<PageTransition key={location.pathname}><VideoPlayer /></PageTransition>} />
          <Route path="/login" element={<PageTransition key="/login"><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition key="/register"><Register /></PageTransition>} />
          <Route path="/profile" element={<PageTransition key="/profile"><Profile /></PageTransition>} />
          <Route path="/reels" element={<PageTransition key="/reels"><Reels /></PageTransition>} />
          <Route path="/discussions" element={<PageTransition key="/discussions"><Discussions /></PageTransition>} />
          <Route path="/achievements" element={<PageTransition key="/achievements"><Achievements /></PageTransition>} />
          <Route path="/gacha" element={<PageTransition key="/gacha"><GachaPage /></PageTransition>} />
          <Route path="/collection" element={<PageTransition key="/collection"><Collection /></PageTransition>} />
          <Route path="/quiz" element={<PageTransition key="/quiz"><DailyQuiz /></PageTransition>} />
          <Route path="/admin" element={<PageTransition key="/admin"><AdminDashboard /></PageTransition>} />
          <Route path="*" element={<PageTransition key="404"><NotFound /></PageTransition>} />
        </Routes>
      </main>

      <DomainExpansion trigger={domainTrigger} />

      <footer className="footer">
        AniView &mdash; Stream anime for free
      </footer>
    </div>
  );
}

export default App;
