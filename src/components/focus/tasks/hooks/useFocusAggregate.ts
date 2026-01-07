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
      preset: session.type ?? 'pomodoro',
      duration: session.duration_minutes ?? 0,
      actualDuration: session.actual_duration_seconds ? session.actual_duration_seconds / 60 : undefined,
      startTime: new Date(session.started_at),
      endTime: session.completed_at ? new Date(session.completed_at) : undefined,
      status: session.status as FocusSession['status'],
      taskId: session.task_id ?? undefined,
      todoId: session.task_id ?? undefined, // task_id maps to todoId for compatibility
      notes: session.notes ?? undefined,
    }));

    return buildFocusAggregate(mappedSessions);
  }, [storeFocusSessions]);

  return focusAggregate;
};
