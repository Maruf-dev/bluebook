import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppWindow, Menu, X, Home, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { ROUTES } from '../../shared/constants';
import { useAppStore } from '../store/useAppStore';
import Layout from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { PracticePage } from '../pages/PracticePage';
import { TestSetupPage } from '../pages/TestSetupPage';
import { ExamPage } from '../pages/ExamPage';
import { ResultsPage } from '../pages/ResultsPage';
import { ReviewPage } from '../pages/ReviewPage';
import { SettingsPage } from '../pages/SettingsPage';

export default function App() {
  const { theme, setTheme } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isTyping && e.key !== 'Escape') return;
      if (e.key === 'Escape') {
        navigate(ROUTES.HOME);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.PRACTICE} element={<PracticePage />} />
          <Route path={ROUTES.TEST_SETUP} element={<TestSetupPage />} />
          <Route path={ROUTES.EXAM} element={<ExamPage />} />
          <Route path={ROUTES.RESULTS} element={<ResultsPage />} />
          <Route path={ROUTES.REVIEW} element={<ReviewPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Routes>
      </Layout>
    </div>
  );
}
