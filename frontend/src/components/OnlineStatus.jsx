import { useState, useEffect } from 'react';

export default function OnlineStatus({ count }) {
  const [online, setOnline] = useState(count || 28);

  useEffect(() => {
    if (typeof count === 'number') {
      setOnline(count);
      return;
    }
    fetch('/api/config')
      .then((r) => {
        if (!r.ok) throw new Error('Config failed');
        return r.json();
      })
      .then((data) => {
        if (data && typeof data.onlineCount === 'number') {
          setOnline(data.onlineCount);
        }
      })
      .catch(() => {});
  }, [count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnline((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + delta);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-light text-white/80">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>{online} online</span>
    </div>
  );
}
