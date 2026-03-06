import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getCoins } from "../api/gachaApi";

export default function useWatchStreak() {
  const { token, isLoggedIn } = useAuth();
  const [streak, setStreak] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    getCoins(token)
      .then((data) => {
        setStreak(data.watchStreak || 0);
        setBalance(data.balance || 0);
      })
      .catch(() => {});
  }, [token, isLoggedIn]);

  return { streak, balance, setBalance, setStreak };
}
