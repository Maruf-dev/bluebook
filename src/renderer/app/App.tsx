import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';
import { applyTheme, useAppStore } from '../store/useAppStore';
import Layout from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { PracticePage } from '../pages/PracticePage';
import { TestSetupPage } from '../pages/TestSetupPage';
import { ExamPage } from '../pages/ExamPage';
import { ResultsPage } from '../pages/ResultsPage';
import { ReviewPage } from '../pages/ReviewPage';
import { SettingsPage } from '../pages/SettingsPage';

export default function App() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Routes>
        {/* The exam runs full-screen, without the app chrome. */}
        <Route path={ROUTES.EXAM} element={<ExamPage />} />
        <Route element={<Layout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.PRACTICE} element={<PracticePage />} />
          <Route path={ROUTES.TEST_SETUP} element={<TestSetupPage />} />
          <Route path={ROUTES.RESULTS} element={<ResultsPage />} />
          <Route path={ROUTES.RESULTS_DETAIL} element={<ResultsPage />} />
          <Route path={ROUTES.REVIEW} element={<ReviewPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>
      </Routes>
    </div>
  );
}
