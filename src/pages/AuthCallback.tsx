import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr);

        const urlError = urlParams.get('error') || hashParams.get('error');
        const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');
        if (urlError) {
          console.error('[Vested] Auth callback error:', urlError, errorDesc);
          navigate('/auth', { replace: true });
          return;
        }

        const code = urlParams.get('code') || hashParams.get('code');

        if (code) {
          const { data: exchanged, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error('[Vested] Code exchange failed:', exchangeErr.message);
            navigate('/auth', { replace: true });
            return;
          }
          if (exchanged.session) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          const type = hashParams.get('type');
          const refreshToken = hashParams.get('refresh_token') || '';
          if (type === 'recovery') {
            navigate('/auth/reset-password' + window.location.hash, { replace: true });
            return;
          }
          const { data: setData, error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!setErr && setData.session) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        navigate('/auth', { replace: true });
      } catch (err) {
        console.error('[Vested] Auth callback exception:', err);
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-green flex items-center justify-center glow-green-sm">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Confirming your account...</p>
        </div>
      </div>
    </div>
  );
}
