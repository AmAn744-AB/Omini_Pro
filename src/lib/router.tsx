import { useState, useEffect, useCallback } from 'react';

export type Route = 'home' | 'games' | 'draw' | 'plans' | 'profile' | 'about' | 'admin';

const VALID_ROUTES: Route[] = ['home', 'games', 'draw', 'plans', 'profile', 'about', 'admin'];

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '') as Route;
    return VALID_ROUTES.includes(hash) ? hash : 'home';
  });

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '') as Route;
      setRoute(VALID_ROUTES.includes(hash) ? hash : 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    window.location.hash = `/${r}`;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  return [route, navigate];
}
