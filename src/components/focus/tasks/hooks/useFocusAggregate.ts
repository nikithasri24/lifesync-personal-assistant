/**
 * Hook for aggregating focus session data
 */

import { useMemo } from 'react';
import { useFocusSessionsQuery } from '../../../../focus/hooks/useFocusQuery';
import { buildFocusAggregate } from '../utils';

export const useFocusAggregate = () => {
  const { data: storeFocusSessions = [] } = useFocusSessionsQuery();

  const focusAggregate = useMemo(() => {
    return buildFocusAggregate(storeFocusSessions);
  }, [storeFocusSessions]);

  return focusAggregate;
};
