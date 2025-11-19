
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onDismiss }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 animate-pulse z-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="font-semibold">{message}</span>
    </div>
  );
};

export default Toast;
