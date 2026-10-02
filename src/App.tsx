import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { DisplayPage } from '@/pages/DisplayPage';
import { api, UNAUTHORIZED_EVENT } from '@/lib/api';

type Route = { page: 'admin' } | { page: 'display'; sessionId: number };

function parseRoute(hash: string): Route {
  const match = hash.match(/^#\/display\/(\d+)$/);
  return match ? { page: 'display', sessionId: Number(match[1]) } : { page: 'admin' };
}

function App() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>('loading');
  const [passwordSet, setPasswordSet] = useState(true);
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api.me();
      setPasswordSet(me.password_set);
      setAuth(me.authenticated ? 'in' : 'out');
    } catch {
      setAuth('out');
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    const onHash = () => setRoute(parseRoute(window.location.hash));
    const onUnauthorized = () => setAuth('out');
    window.addEventListener('hashchange', onHash);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [refreshAuth]);

  let content;
  if (auth === 'loading') {
    content = (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  } else if (auth === 'out') {
    content = <LoginPage passwordSet={passwordSet} onLogin={() => setAuth('in')} />;
  } else if (route.page === 'display') {
    content = <DisplayPage sessionId={route.sessionId} />;
  } else {
    content = <AdminPage onLogout={() => setAuth('out')} />;
  }

  return (
    <>
      {content}
      <Toaster />
    </>
  );
}

export default App;
