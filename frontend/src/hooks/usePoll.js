import { useEffect, useRef } from 'react';

/**
 * Re-run `callback` on an interval to keep stock indicators live.
 *
 * Polling rather than websockets: at this scale a few seconds of lag is
 * invisible to a user, and it costs one hook instead of a socket server on a
 * free host that already sleeps. Skips hidden tabs and fires immediately on
 * refocus, so a backgrounded page doesn't hammer the API but is fresh the
 * instant you look at it.
 */
export function usePoll(callback, intervalMs = 5000) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') saved.current();
    };

    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);
}
