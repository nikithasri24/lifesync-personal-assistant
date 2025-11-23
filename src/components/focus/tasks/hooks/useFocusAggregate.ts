/**
 * Hook for aggregating focus session data
 */

import { useMemo } from 'react';
import type { FocusSession } from '../../../../types';
import { useFocusSessions } from '../../../../hooks/useFocusQuery';
import { buildFocusAggregate } from '../utils';

export type FocusAggregate = Map<string, { duration: number; sessions: string[] }>;

export const useFocusAggregate = (): FocusAggregate => {
  const { data: storeFocusSessions } = useFocusSessions();

  const focusAggregate = useMemo((): FocusAggregate => {
    if (!storeFocusSessions) return new Map();

    // Map FocusSessionData to FocusSession type
    const mappedSessions: FocusSession[] = storeFocusSessions.map(session => ({
      id: session.id ?? '',
      preset: session.preset,
      duration: session.duration,
      actualDuration: session.actual_duration,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      status: session.status ?? 'active',
      taskId: session.task_id,
      todoId: session.task_id, // task_id maps to todoId for compatibility
      notes: session.notes,
    }));

    return buildFocusAggregate(mappedSessions);
  }, [storeFocusSessions]);

  return focusAggregate;
};
