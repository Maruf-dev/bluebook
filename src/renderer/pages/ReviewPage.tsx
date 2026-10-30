import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, RefreshCw, Filter, Eye, ChevronRight } from 'lucide-react';
import { ROUTES } from '../../shared/constants';

export function ReviewPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await window.examDeskAPI.invoke('db:get_attempt', { attemptId: attemptId || 'latest' });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">Loading review…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.RESULTS} className="btn-secondary">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Results
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Question Review</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Review your answers, see explanations, and identify topics to practice.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" /> All
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <Eye className="w-4 h-4" /> Incorrect Only
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <ChevronRight className="w-4 h-4" /> Unanswered
        </button>
      </div>

      <div className="exam-card p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="font-semibold">No review data available</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Complete a test to review your questions here.
          </p>
        </div>
      </div>
    </div>
  );
}
