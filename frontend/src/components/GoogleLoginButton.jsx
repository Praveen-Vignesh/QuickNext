import { useEffect, useRef } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

function loadGsi() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) return resolve(true);
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Google Identity Services button.
 *
 * All this does is obtain an ID token; it never sees a client secret. The token
 * goes to the backend, which verifies Google's signature and the audience
 * before trusting a single claim in it.
 */
export default function GoogleLoginButton({ clientId, onCredential, onError }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;

    loadGsi().then((ok) => {
      if (!ok || cancelled || !ref.current) {
        if (!ok) onError?.('Could not load Google sign-in.');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });

      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'continue_with',
      });
    });

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, onError]);

  if (!clientId) return null;
  return <div ref={ref} className="google-btn" />;
}
