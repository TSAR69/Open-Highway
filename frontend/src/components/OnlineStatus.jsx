import { useState, useEffect } from 'react';

export default function OnlineStatus({ count }) {
  const [online, setOnline] = useState(count);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnline((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + delta);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [count]);

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
