
import { useEffect, useCallback } from 'react';

type LogActivityFunction = (activityType: string, metadata?: object) => void;

export const useProctoring = (logActivity: LogActivityFunction) => {
  const handleEvent = useCallback((e: Event, activityType: string) => {
    e.preventDefault();
    logActivity(activityType);
  }, [logActivity]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U') ||
      (e.ctrlKey && e.key.toUpperCase() === 'P')
    ) {
      e.preventDefault();
      logActivity('devtools_attempt', { key: e.key });
    }
  }, [logActivity]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      logActivity('tab_switch');
    }
  }, [logActivity]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => handleEvent(e, 'right_click_attempt');
    const handleCopy = (e: ClipboardEvent) => handleEvent(e, 'copy_attempt');
    const handlePaste = (e: ClipboardEvent) => handleEvent(e, 'paste_attempt');

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleEvent, handleKeyDown, handleVisibilityChange]);
};
