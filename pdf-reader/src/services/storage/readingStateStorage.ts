import { db } from './db';
import type { ReadingState } from '../../types/document';

export async function saveReadingState(state: ReadingState): Promise<void> {
  await db.readingStates.put({
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

export async function getReadingState(
  documentId: string
): Promise<ReadingState | undefined> {
  return db.readingStates.get(documentId);
}

/**
 * Create a debounced reading state saver.
 * Buffers rapid changes (scroll, zoom) and writes at most once per interval.
 */
export function createReadingStateSaver(intervalMs = 1000) {
  let pending: ReadingState | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    if (pending) {
      await saveReadingState(pending);
      pending = null;
    }
    timerId = null;
  };

  return {
    save(state: ReadingState) {
      pending = state;
      if (!timerId) {
        timerId = setTimeout(flush, intervalMs);
      }
    },
    async flush() {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      await flush();
    },
  };
}
