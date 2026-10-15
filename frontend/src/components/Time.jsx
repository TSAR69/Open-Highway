import { useState, useEffect } from 'react';

export default function Time() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="text-xs sm:text-sm font-medium tracking-widest text-white/90 text-shadow tabular-nums select-none"
      style={{
        fontFamily: 'ui-monospace, "SF Mono", Monaco, Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {time}
    </div>
  );
}
