'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export default function GoogleOneTap() {
  const { user, loading } = useAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Only run on client-side, when user is not logged in and auth finished loading
    if (loading || user || typeof window === 'undefined') return;

    // Skip on local network IP addresses in development to avoid GSI origin warning
    const hostname = window.location.hostname;
    const isLocalIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isLocalIp) {
      return;
    }

    // Load Google Identity Services script if not already loaded
    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!scriptLoaded || user || loading || typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isLocalIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isLocalIp) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    try {
      const handleCredentialResponse = async (response: any) => {
        try {
          const credential = GoogleAuthProvider.credential(response.credential);
          await signInWithCredential(auth, credential);
        } catch (err) {
          console.warn('Google One Tap Sign-In Error:', err);
        }
      };

      // Initialize Google Identity Services One Tap
      // @ts-ignore
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        itp_support: true,
      });

      // Prompt One Tap dialog
      // @ts-ignore
      window.google?.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // Logged silently
        } else if (notification.isSkippedMoment()) {
          // Logged silently
        }
      });
    } catch (error) {
      // Ignored in dev
    }
  }, [scriptLoaded, user, loading]);

  return null;
}
