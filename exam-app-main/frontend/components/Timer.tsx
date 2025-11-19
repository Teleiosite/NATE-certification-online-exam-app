
import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialMinutes: number;
  onTimeExpired: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialMinutes, onTimeExpired }) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeExpired();
      return;
    }

    const timerId = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [seconds, onTimeExpired]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const isWarning = seconds < 300; // 5 minutes

  return (
    <div className={`flex items-center space-x-2 font-mono text-lg font-bold px-3 py-1 rounded-md ${isWarning ? 'text-red-400 bg-red-900/50' : 'text-sky-300 bg-sky-900/50'}`}>
       {isWarning && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      <span>
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default Timer;
