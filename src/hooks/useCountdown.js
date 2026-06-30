import { useState, useEffect } from "react";

export default function useCountdown(targetDate) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 60000) % 60);
  const hours = Math.floor((diff / 3600000) % 24);
  const days = Math.floor(diff / 86400000);

  return { days, hours, minutes, seconds, totalSeconds: Math.floor(diff / 1000), isExpired: diff <= 0 };
}
