import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useZenMode() {
  const uiVisible = useUIStore((s) => s.uiVisible);
  const setUIVisible = useUIStore((s) => s.setUIVisible);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      if (!uiVisible) setUIVisible(true);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        setUIVisible(false);
      }, 2000); // Hide after 2 seconds of inactivity
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Re-show if mouse moves or if cursor is near edges
      const thresh = 40;
      const nearEdge = e.clientX < thresh || e.clientX > window.innerWidth - thresh || 
                       e.clientY < thresh || e.clientY > window.innerHeight - thresh;

      if (nearEdge) {
        setUIVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        handleActivity();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timeout
    timeoutRef.current = setTimeout(() => {
      setUIVisible(false);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [uiVisible, setUIVisible]);

  return uiVisible;
}
