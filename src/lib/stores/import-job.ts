import { writable, get } from 'svelte/store';

export interface ImportJobState {
  jobId: string | null;
  total: number;
  processedCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

const STORAGE_KEY = 'active-import-job';
const POLL_INTERVAL_MS = 2000;

const defaultState: ImportJobState = {
  jobId: null,
  total: 0,
  processedCount: 0,
  importedCount: 0,
  skippedCount: 0,
  failedCount: 0,
  status: 'idle',
  error: null
};

function loadFromStorage(): ImportJobState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.status === 'processing' && parsed.jobId) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function saveToStorage(state: ImportJobState) {
  if (typeof window === 'undefined') return;
  try {
    if (state.status === 'processing' && state.jobId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export const importJobStore = writable<ImportJobState>(defaultState);

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let onCompleteCallback: ((state: ImportJobState) => void) | null = null;
let onErrorCallback: ((state: ImportJobState) => void) | null = null;

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

async function processBatch(jobId: string) {
  try {
    const response = await fetch('/api/import-words-csv/process-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    const newState: ImportJobState = {
      jobId,
      total: get(importJobStore).total,
      processedCount: (get(importJobStore).total) - result.remaining,
      importedCount: result.imported_so_far,
      skippedCount: result.skipped_so_far,
      failedCount: result.failed_so_far,
      status: result.status === 'completed' ? 'completed' : 'processing',
      error: null
    };

    importJobStore.set(newState);
    saveToStorage(newState);

    if (result.status === 'completed' || result.remaining === 0) {
      stopPolling();
      const finalState = { ...newState, status: 'completed' as const };
      importJobStore.set(finalState);
      saveToStorage(finalState);
      onCompleteCallback?.(finalState);
    } else {
      pollTimer = setTimeout(() => processBatch(jobId), POLL_INTERVAL_MS);
    }
  } catch (err) {
    console.error('Error processing batch:', err);
    const currentState = get(importJobStore);
    const errorState: ImportJobState = {
      ...currentState,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
    importJobStore.set(errorState);
    saveToStorage(errorState);
    stopPolling();
    onErrorCallback?.(errorState);
  }
}

export function startImportJob(jobId: string, total: number) {
  stopPolling();

  const state: ImportJobState = {
    jobId,
    total,
    processedCount: 0,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    status: 'processing',
    error: null
  };

  importJobStore.set(state);
  saveToStorage(state);

  pollTimer = setTimeout(() => processBatch(jobId), 100);
}

/**
 * Resume polling for an in-progress job (e.g. after page reload).
 * Fetches current status from the server first, then starts polling if still processing.
 */
export async function resumeImportJobIfNeeded() {
  const stored = loadFromStorage();
  if (!stored.jobId || stored.status !== 'processing') return;

  importJobStore.set(stored);

  try {
    const response = await fetch(`/api/import-words-csv/status/${stored.jobId}`);
    if (!response.ok) {
      localStorage.removeItem(STORAGE_KEY);
      importJobStore.set(defaultState);
      return;
    }

    const job = await response.json();

    if (job.status === 'completed') {
      const finalState: ImportJobState = {
        jobId: stored.jobId,
        total: job.total_items,
        processedCount: job.processed_count,
        importedCount: job.imported_count,
        skippedCount: job.skipped_count,
        failedCount: job.failed_count,
        status: 'completed',
        error: null
      };
      importJobStore.set(finalState);
      saveToStorage(finalState);
      onCompleteCallback?.(finalState);
      return;
    }

    // Still processing -- update state and resume polling
    const resumeState: ImportJobState = {
      jobId: stored.jobId,
      total: job.total_items,
      processedCount: job.processed_count,
      importedCount: job.imported_count,
      skippedCount: job.skipped_count,
      failedCount: job.failed_count,
      status: 'processing',
      error: null
    };
    importJobStore.set(resumeState);
    saveToStorage(resumeState);

    pollTimer = setTimeout(() => processBatch(stored.jobId!), 100);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    importJobStore.set(defaultState);
  }
}

export function onImportComplete(callback: (state: ImportJobState) => void) {
  onCompleteCallback = callback;
}

export function onImportError(callback: (state: ImportJobState) => void) {
  onErrorCallback = callback;
}

export function resetImportJob() {
  stopPolling();
  importJobStore.set(defaultState);
  saveToStorage(defaultState);
  onCompleteCallback = null;
  onErrorCallback = null;
}
