import { useEffect, useState, useRef } from 'react';

export default function Timer({ remaining, running, onTimeout }) {
  const [time, setTime] = useState(remaining);
  const timerRef = useRef(null);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    setTime(remaining);
    hasTimedOut.current = false;
  }, [remaining]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasTimedOut.current) {
            hasTimedOut.current = true;
            setTimeout(() => onTimeout?.(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [running, onTimeout]);

  const isUrgent = time <= 10;
  const isCritical = time <= 5;

  return (
    <div className={`
      flex items-center gap-2 font-mono text-2xl font-bold tabular-nums
      ${isCritical ? 'text-red-500 animate-pulse' : isUrgent ? 'text-amber-400' : 'text-white'}
    `}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{time}</span>
    </div>
  );
}
