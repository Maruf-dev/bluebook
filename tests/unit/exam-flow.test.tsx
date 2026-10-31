import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { IPCResponse, TestAttempt, TestContent } from '@shared/types';
import App from '../../src/renderer/app/App';
import { useExamStore } from '../../src/renderer/store/useExamStore';
import sample from '../../src/shared/content/sample-test.json';

const content = sample as unknown as TestContent;

/** In-memory stand-in for the main-process IPC handlers. */
function installFakeApi() {
  const attempts = new Map<string, TestAttempt>();
  const ok = <T,>(data: T): IPCResponse<T> => ({ success: true, data });
  window.examDeskAPI = {
    invoke: async <T,>(channel: string, payload?: unknown): Promise<IPCResponse<T>> => {
      const p = (payload ?? {}) as Record<string, unknown>;
      switch (channel) {
        case 'db:get_test':
          return ok(structuredClone(content)) as IPCResponse<T>;
        case 'db:save_attempt': {
          const a = structuredClone(p['attempt'] as TestAttempt);
          attempts.set(a.id, a);
          return ok({ saved: true }) as IPCResponse<T>;
        }
        case 'db:save_response':
          return ok({ saved: true }) as IPCResponse<T>;
        case 'db:get_attempt': {
          const id = p['attemptId'] as string;
          const a = id === 'latest' ? [...attempts.values()].find((x) => x.status === 'completed') : attempts.get(id);
          return ok(a ? structuredClone(a) : null) as IPCResponse<T>;
        }
        default:
          return ok([]) as IPCResponse<T>;
      }
    },
  };
  return attempts;
}

describe('exam flow', () => {
  beforeEach(() => useExamStore.getState().reset());

  it('starts a test, answers, submits both modules and shows scored results', async () => {
    const attempts = installFakeApi();
    render(
      <MemoryRouter initialEntries={[`/test-setup/${content.metadata.id}`]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /start test/i }));

    // Module 1 (Reading & Writing): answer Q1 correctly
    expect(await screen.findByText(/Reading and Writing — Module 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /social benefits/i }));
    expect(screen.getByRole('radio', { name: /social benefits/i })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getAllByRole('button', { name: /submit module/i })[0]!);
    fireEvent.click(await screen.findByRole('button', { name: /^submit$/i }));

    // Module 2 (Math): go to Q2 and type the numeric answer
    expect(await screen.findByText(/Math — Module 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: '60' } });

    fireEvent.click(screen.getAllByRole('button', { name: /submit module/i })[0]!);
    fireEvent.click(await screen.findByRole('button', { name: /^submit$/i }));

    expect(await screen.findByText('Test Results')).toBeInTheDocument();
    const attempt = [...attempts.values()][0]!;
    expect(attempt.status).toBe('completed');
    expect(attempt.totalScore?.correct).toBe(2);
    expect(attempt.totalScore?.unanswered).toBe(6);
    await waitFor(() => expect(screen.getByText(String(attempt.totalScore!.totalScore))).toBeInTheDocument());
  });

  it('auto-submits the module when its timer runs out', async () => {
    installFakeApi();
    render(
      <MemoryRouter initialEntries={[`/test-setup/${content.metadata.id}`]}>
        <App />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: /start test/i }));
    expect(await screen.findByText(/Reading and Writing — Module 1/)).toBeInTheDocument();

    // Push the current module's deadline into the past.
    const { attempt, currentModuleId, updateModule } = useExamStore.getState();
    updateModule({ ...attempt!.modules[currentModuleId!]!, deadlineAt: Date.now() - 1000 });

    expect(await screen.findByText(/Math — Module 1/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/time ran out/i)).toBeInTheDocument();
    const rw = useExamStore.getState().attempt!.modules['rw-1-m1']!;
    expect(rw.status).toBe('expired');
    expect(rw.scores?.unanswered).toBe(4);
  });
});
