import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCoins, singlePull, multiPull, claimDailyLogin } from "../api/gachaApi";
import GachaAnimation from "../components/GachaAnimation";
import DomainExpansion from "../components/DomainExpansion";
import useDomainExpansion from "../hooks/useDomainExpansion";

const SINGLE_COST = 50;
const MULTI_COST = 200;

export default function GachaPage() {
  const { token, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pulls, setPulls] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState("");
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const { trigger, fireDomainExpansion } = useDomainExpansion();

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate("/login");
  }, [loading, isLoggedIn]);

  useEffect(() => {
    if (token) {
      getCoins(token).then((d) => {
        setBalance(d.balance);
        if (d.lastDailyLogin) {
          setDailyClaimed(new Date(d.lastDailyLogin).toDateString() === new Date().toDateString());
        }
      }).catch(() => {});
    }
  }, [token]);

  const handleSinglePull = async () => {
    if (pulling || balance < SINGLE_COST) return;
    setError("");
    setPulling(true);
    try {
      const data = await singlePull(token);
      setBalance(data.balance);
      setPulls([data.pull]);
      if (data.pull.rarity === "legendary") {
        fireDomainExpansion();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Pull failed");
    }
    setPulling(false);
  };

  const handleMultiPull = async () => {
    if (pulling || balance < MULTI_COST) return;
    setError("");
    setPulling(true);
    try {
      const data = await multiPull(token);
      setBalance(data.balance);
      setPulls(data.pulls);
      if (data.pulls.some((p) => p.rarity === "legendary")) {
        fireDomainExpansion();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Pull failed");
    }
    setPulling(false);
  };

  const handleDailyLogin = async () => {
    try {
      const data = await claimDailyLogin(token);
      setBalance(data.balance);
      setDailyClaimed(true);
    } catch {
      // already claimed
    }
  };

  if (loading) return null;

  return (
    <div className="gacha-page container">
      <DomainExpansion trigger={trigger} />

      <div className="gacha-header">
        <h1 className="gacha-title">Character Gacha</h1>
        <div className="gacha-coin-display">
          <span className="coin-icon">&#x1FA99;</span>
          <span className="coin-amount">{balance}</span>
          <span className="coin-label">AniCoins</span>
        </div>
      </div>

      {!dailyClaimed && (
        <button className="btn btn-ghost daily-login-btn" onClick={handleDailyLogin}>
          Claim Daily Login Bonus (+5 coins)
        </button>
      )}

      {error && <p className="gacha-error">{error}</p>}

      {pulls ? (
        <GachaAnimation
          pulls={pulls}
          onComplete={() => setPulls(null)}
        />
      ) : (
        <div className="gacha-pull-section">
          <div className="gacha-banner">
            <div className="gacha-banner-art">
              <span className="gacha-banner-icon">&#9733;</span>
            </div>
            <h2>Anime Character Collection</h2>
            <p className="gacha-banner-desc">
              Pull random 3D anime characters! Build your collection and show it off.
            </p>
            <div className="gacha-rates">
              <span className="rate-common">Common 50%</span>
              <span className="rate-rare">Rare 30%</span>
              <span className="rate-epic">Epic 15%</span>
              <span className="rate-legendary">Legendary 5%</span>
            </div>
          </div>

          <div className="gacha-buttons">
            <button
              className="btn btn-primary gacha-pull-btn"
              onClick={handleSinglePull}
              disabled={pulling || balance < SINGLE_COST}
            >
              <span>Single Pull</span>
              <span className="pull-cost">{SINGLE_COST} &#x1FA99;</span>
            </button>
            <button
              className="btn btn-primary gacha-pull-btn multi"
              onClick={handleMultiPull}
              disabled={pulling || balance < MULTI_COST}
            >
              <span>5x Multi Pull</span>
              <span className="pull-cost">{MULTI_COST} &#x1FA99;</span>
              <span className="pull-discount">20% off + 1 Rare guaranteed</span>
            </button>
          </div>

          <div className="gacha-earn-info">
            <h3>How to earn AniCoins</h3>
            <ul>
              <li>Watch an episode: +10 coins</li>
              <li>Complete daily quiz: +20-50 coins</li>
              <li>Daily login: +5 coins</li>
              <li>7-day watch streak: +100 bonus</li>
            </ul>
            <div className="gacha-links">
              <Link to="/quiz" className="btn btn-ghost">Daily Quiz</Link>
              <Link to="/collection" className="btn btn-ghost">My Collection</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
