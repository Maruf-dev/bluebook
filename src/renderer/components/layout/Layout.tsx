import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Esc returns home from any regular page (the exam screen is outside this layout).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || pathname === ROUTES.HOME) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      navigate(ROUTES.HOME);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
