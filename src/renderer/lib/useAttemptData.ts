import { useEffect, useState } from 'react';
import type { TestAttempt, TestContent } from '@shared/types';
import { errorMessage, invoke } from './api';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'empty' }
  | { status: 'ready'; attempt: TestAttempt; content: TestContent };

/** Loads an attempt (or the latest completed one when id is undefined) together with its test content. */
export function useAttemptData(attemptId: string | undefined): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const attempt = await invoke<TestAttempt | null>('db:get_attempt', { attemptId: attemptId ?? 'latest' });
        if (!attempt) {
          if (!cancelled) setState({ status: 'empty' });
          return;
        }
        const content = await invoke<TestContent>('db:get_test', { testId: attempt.testId });
        if (!cancelled) setState({ status: 'ready', attempt, content });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', error: errorMessage(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  return state;
}
