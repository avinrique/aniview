import { useEffect, useMemo } from "react";

function getSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export default function useSeason() {
  const season = useMemo(() => getSeason(), []);

  useEffect(() => {
    document.documentElement.setAttribute("data-season", season);
    return () => document.documentElement.removeAttribute("data-season");
  }, [season]);

  return season;
}
