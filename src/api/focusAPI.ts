import { apiClient } from '../services/apiClient';
import type { FocusSessionData } from '../services/types';

// ==================== Focus Sessions ====================

export async function getFocusSessions(): Promise<FocusSessionData[]> {
  return await apiClient.getFocusSessions();
}

export async function createFocusSession(
  session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>
): Promise<FocusSessionData> {
  return await apiClient.createFocusSession(session);
}

export async function updateFocusSession(
  id: string,
  updates: Partial<FocusSessionData>
): Promise<FocusSessionData> {
  return await apiClient.updateFocusSession(id, updates);
}
