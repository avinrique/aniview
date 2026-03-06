import { useState, useEffect, useCallback } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export default function useDomainExpansion() {
  const [trigger, setTrigger] = useState(0);
  const [sequence, setSequence] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      setSequence((prev) => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.length === KONAMI.length && next.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase())) {
          setTrigger((t) => t + 1);
          return [];
        }
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fireDomainExpansion = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  return { trigger, fireDomainExpansion };
}
