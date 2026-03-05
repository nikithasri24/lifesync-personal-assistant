/**
 * ReminderService Unit Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// --- Mocks ---

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    schedule: vi.fn().mockResolvedValue({}),
    cancel: vi.fn().mockResolvedValue({}),
    getPending: vi.fn().mockResolvedValue({ notifications: [] }),
  },
}));

vi.mock('../../../api/notificationAPI', () => ({
  queueNotification: vi.fn(),
  getUpcomingReminders: vi.fn(),
  getDueReminders: vi.fn(),
  cancelReminder: vi.fn(),
  markReminderSent: vi.fn(),
}));

vi.mock('../../../lib/platform', () => ({
  isNative: vi.fn().mockReturnValue(false),
}));

vi.mock('../../pushNotificationService', () => ({
  pushNotificationService: {
    showLocalNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

import { LocalNotifications } from '@capacitor/local-notifications';
import * as notificationAPI from '../../../api/notificationAPI';
import * as platform from '../../../lib/platform';
import { pushNotificationService } from '../../pushNotificationService';

// Import after mocks are set up
import { reminderService } from '../ReminderService';

// Helper to build a mock NotificationQueueItem
function makeQueueItem(overrides: Partial<{
  id: string;
  type: string;
  status: string;
  payload: object;
  entity_type: string;
  entity_id: string;
}> = {}) {
  return {
    id: 'test-id-1234',
    user_id: 'user-abc',
    type: 'task_due',
    priority: 'normal' as const,
    payload: { title: 'Test', body: 'Test body', icon: '/icon.png', data: {} },
    scheduled_for: new Date(Date.now() - 1000).toISOString(), // 1s ago
    status: 'pending' as const,
    entity_type: 'task',
    entity_id: 'task-xyz',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('ReminderService', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(platform.isNative).mockReturnValue(false);
  });

  afterEach(() => {
    reminderService.stopReminderCheck();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // initialize()
  // ---------------------------------------------------------------------------

  describe('initialize()', () => {
    test('requests permissions on native platform', async () => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      await reminderService.initialize();
      expect(LocalNotifications.requestPermissions).toHaveBeenCalledOnce();
    });

    test('does NOT request permissions on web', async () => {
      vi.mocked(platform.isNative).mockReturnValue(false);
      await reminderService.initialize();
      expect(LocalNotifications.requestPermissions).not.toHaveBeenCalled();
    });

    test('does not throw when permissions are denied', async () => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: 'denied' });
      await expect(reminderService.initialize()).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // scheduleReminder()
  // ---------------------------------------------------------------------------

  describe('scheduleReminder()', () => {
    const baseParams = {
      type: 'task_upcoming' as const,
      title: 'Test Task',
      body: 'Your task is due soon',
      scheduledFor: new Date(Date.now() + 60_000), // 1 minute in the future
      priority: 'normal' as const,
      entityType: 'task' as const,
      entityId: 'task-abc',
    };

    test('web: calls queueNotification and returns id', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'reminder-123' });

      const result = await reminderService.scheduleReminder(baseParams);

      expect(notificationAPI.queueNotification).toHaveBeenCalledOnce();
      expect(result).toBe('reminder-123');
    });

    test('passes correct title, body, and type to queueNotification', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r1' });

      await reminderService.scheduleReminder(baseParams);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.payload).toMatchObject({
        title: 'Test Task',
        body: 'Your task is due soon',
      });
      // task_upcoming maps to task_due
      expect(call.type).toBe('task_due');
    });

    test('maps priority "urgent" to "high"', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r1' });

      await reminderService.scheduleReminder({ ...baseParams, priority: 'urgent' });

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.priority).toBe('high');
    });

    test('native: also calls LocalNotifications.schedule when delay > 0', async () => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r1' });

      await reminderService.scheduleReminder(baseParams);

      expect(LocalNotifications.schedule).toHaveBeenCalledOnce();
      const arg = vi.mocked(LocalNotifications.schedule).mock.calls[0][0];
      expect(arg.notifications[0].title).toBe('Test Task');
    });

    test('native: does NOT call LocalNotifications.schedule when delay <= 0 (past)', async () => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r1' });

      // scheduledFor in the past
      await reminderService.scheduleReminder({
        ...baseParams,
        scheduledFor: new Date(Date.now() - 5000),
      });

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    test('returns null on API failure', async () => {
      vi.mocked(notificationAPI.queueNotification).mockRejectedValue(new Error('API error'));

      const result = await reminderService.scheduleReminder(baseParams);

      expect(result).toBeNull();
    });

    test('includes entityType and entityId in notification data', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r2' });

      await reminderService.scheduleReminder({
        ...baseParams,
        entityType: 'event',
        entityId: 'event-xyz',
      });

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const data = call.payload as { data?: { entityType?: string; entityId?: string } };
      expect(data.data?.entityType).toBe('event');
      expect(data.data?.entityId).toBe('event-xyz');
    });
  });

  // ---------------------------------------------------------------------------
  // mapReminderTypeToDbType() — tested via scheduleReminder
  // ---------------------------------------------------------------------------

  describe('mapReminderTypeToDbType() via scheduleReminder', () => {
    beforeEach(() => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'r' });
    });

    const cases: Array<[string, string]> = [
      ['task_upcoming', 'task_due'],
      ['task_due', 'task_due'],
      ['task_overdue', 'task_overdue'],
      ['event_upcoming', 'calendar_event'],
      ['habit_reminder', 'habit_reminder'],
      ['morning_briefing', 'morning_briefing'],
      ['custom', 'system'],
    ];

    test.each(cases)('maps %s → %s', async (input, expected) => {
      await reminderService.scheduleReminder({
        type: input as Parameters<typeof reminderService.scheduleReminder>[0]['type'],
        title: 'T',
        body: 'B',
        scheduledFor: new Date(Date.now() + 10_000),
      });
      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.type).toBe(expected);
      vi.clearAllMocks();
    });
  });

  // ---------------------------------------------------------------------------
  // cancelReminder()
  // ---------------------------------------------------------------------------

  describe('cancelReminder()', () => {
    test('calls cancelReminder API and returns true', async () => {
      vi.mocked(notificationAPI.cancelReminder).mockResolvedValue(undefined);

      const result = await reminderService.cancelReminder('reminder-1');

      expect(notificationAPI.cancelReminder).toHaveBeenCalledWith('reminder-1');
      expect(result).toBe(true);
    });

    test('native: also calls LocalNotifications.cancel', async () => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(notificationAPI.cancelReminder).mockResolvedValue(undefined);

      await reminderService.cancelReminder('reminder-1');

      expect(LocalNotifications.cancel).toHaveBeenCalledOnce();
    });

    test('web: does NOT call LocalNotifications.cancel', async () => {
      vi.mocked(platform.isNative).mockReturnValue(false);
      vi.mocked(notificationAPI.cancelReminder).mockResolvedValue(undefined);

      await reminderService.cancelReminder('reminder-1');

      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    test('returns false on API failure (does not rethrow)', async () => {
      vi.mocked(notificationAPI.cancelReminder).mockRejectedValue(new Error('Network error'));

      const result = await reminderService.cancelReminder('reminder-1');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // checkAndShowDueReminders()
  // ---------------------------------------------------------------------------

  describe('checkAndShowDueReminders()', () => {
    test('fetches due reminders and shows notifications', async () => {
      const item = makeQueueItem();
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue([item] as any);
      vi.mocked(notificationAPI.markReminderSent).mockResolvedValue(undefined);

      const count = await reminderService.checkAndShowDueReminders();

      expect(pushNotificationService.showLocalNotification).toHaveBeenCalledOnce();
      expect(notificationAPI.markReminderSent).toHaveBeenCalledWith(item.id);
      expect(count).toBe(1);
    });

    test('handles empty list without errors', async () => {
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue([]);

      const count = await reminderService.checkAndShowDueReminders();

      expect(count).toBe(0);
      expect(pushNotificationService.showLocalNotification).not.toHaveBeenCalled();
    });

    test('processes multiple due reminders', async () => {
      const items = [makeQueueItem({ id: 'id-1' }), makeQueueItem({ id: 'id-2' })];
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue(items as any);
      vi.mocked(notificationAPI.markReminderSent).mockResolvedValue(undefined);

      const count = await reminderService.checkAndShowDueReminders();

      expect(pushNotificationService.showLocalNotification).toHaveBeenCalledTimes(2);
      expect(count).toBe(2);
    });

    test('handles API error gracefully (returns 0, does not crash)', async () => {
      vi.mocked(notificationAPI.getDueReminders).mockRejectedValue(new Error('DB error'));

      const count = await reminderService.checkAndShowDueReminders();

      expect(count).toBe(0);
      expect(pushNotificationService.showLocalNotification).not.toHaveBeenCalled();
    });

    test('calls markReminderSent after showing each notification', async () => {
      const item = makeQueueItem({ id: 'mark-test' });
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue([item] as any);
      vi.mocked(notificationAPI.markReminderSent).mockResolvedValue(undefined);

      await reminderService.checkAndShowDueReminders();

      expect(notificationAPI.markReminderSent).toHaveBeenCalledWith('mark-test');
    });
  });

  // ---------------------------------------------------------------------------
  // startReminderCheck() / stopReminderCheck()
  // ---------------------------------------------------------------------------

  describe('startReminderCheck() / stopReminderCheck()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue([]);
    });

    test('calls checkAndShowDueReminders immediately on start', async () => {
      reminderService.startReminderCheck(60_000);

      // flush the immediate async call
      await Promise.resolve();

      expect(notificationAPI.getDueReminders).toHaveBeenCalledOnce();
    });

    test('calls checkAndShowDueReminders again after interval elapses', async () => {
      reminderService.startReminderCheck(5_000);
      await Promise.resolve();

      vi.advanceTimersByTime(5_000);
      await Promise.resolve();

      expect(notificationAPI.getDueReminders).toHaveBeenCalledTimes(2);
    });

    test('stopReminderCheck prevents further interval calls', async () => {
      reminderService.startReminderCheck(5_000);
      await Promise.resolve();
      reminderService.stopReminderCheck();

      vi.advanceTimersByTime(15_000);
      await Promise.resolve();

      // Only the initial immediate call
      expect(notificationAPI.getDueReminders).toHaveBeenCalledOnce();
    });

    test('double start replaces previous interval (no duplicates)', async () => {
      reminderService.startReminderCheck(5_000);
      await Promise.resolve();

      reminderService.startReminderCheck(5_000); // replace
      await Promise.resolve();

      vi.advanceTimersByTime(5_000);
      await Promise.resolve();

      // 2 immediate calls + 1 interval tick
      expect(notificationAPI.getDueReminders).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // scheduleTaskReminder()
  // ---------------------------------------------------------------------------

  describe('scheduleTaskReminder()', () => {
    test('schedules reminder with task_upcoming type', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'tr-1' });

      const future = new Date(Date.now() + 60 * 60_000); // 1 hour from now
      const result = await reminderService.scheduleTaskReminder('task-1', 'Buy groceries', future, 15);

      expect(result).toBe('tr-1');
      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.type).toBe('task_due'); // task_upcoming maps to task_due
    });

    test('calculates scheduledFor as dueDate minus minutesBefore', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'tr-2' });

      const dueDate = new Date(Date.now() + 60 * 60_000); // 60 min from now
      await reminderService.scheduleTaskReminder('task-1', 'My Task', dueDate, 30);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const scheduledFor = new Date(call.scheduled_for as string).getTime();
      const expected = dueDate.getTime() - 30 * 60_000;

      // Allow 100ms tolerance
      expect(Math.abs(scheduledFor - expected)).toBeLessThan(100);
    });

    test('returns null when reminder time would be in the past', async () => {
      // Due date only 5 minutes away, but asking for 15 min reminder → reminder time is past
      const nearFuture = new Date(Date.now() + 5 * 60_000);
      const result = await reminderService.scheduleTaskReminder('task-1', 'Late', nearFuture, 15);

      expect(result).toBeNull();
      expect(notificationAPI.queueNotification).not.toHaveBeenCalled();
    });

    test('uses default 15 minutes before when minutesBefore not specified', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'tr-3' });

      const dueDate = new Date(Date.now() + 60 * 60_000);
      await reminderService.scheduleTaskReminder('task-1', 'Default reminder', dueDate);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const scheduledFor = new Date(call.scheduled_for as string).getTime();
      const expected = dueDate.getTime() - 15 * 60_000;

      expect(Math.abs(scheduledFor - expected)).toBeLessThan(100);
    });

    test('includes task title in notification body', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'tr-4' });

      const future = new Date(Date.now() + 60 * 60_000);
      await reminderService.scheduleTaskReminder('task-1', 'Buy milk', future, 15);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const payload = call.payload as { body?: string };
      expect(payload.body).toContain('Buy milk');
    });
  });

  // ---------------------------------------------------------------------------
  // scheduleEventReminder()
  // ---------------------------------------------------------------------------

  describe('scheduleEventReminder()', () => {
    test('schedules reminder with event_upcoming type (maps to calendar_event)', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'er-1' });

      const future = new Date(Date.now() + 60 * 60_000);
      await reminderService.scheduleEventReminder('event-1', 'Team Meeting', future, 15);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.type).toBe('calendar_event');
    });

    test('calculates scheduledFor correctly (eventTime - minutesBefore)', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'er-2' });

      const eventTime = new Date(Date.now() + 90 * 60_000); // 90 min from now
      await reminderService.scheduleEventReminder('event-1', 'Meeting', eventTime, 20);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const scheduledFor = new Date(call.scheduled_for as string).getTime();
      const expected = eventTime.getTime() - 20 * 60_000;

      expect(Math.abs(scheduledFor - expected)).toBeLessThan(100);
    });

    test('returns null when reminder time would be in the past', async () => {
      const nearFuture = new Date(Date.now() + 5 * 60_000);
      const result = await reminderService.scheduleEventReminder('event-1', 'Event', nearFuture, 15);

      expect(result).toBeNull();
    });

    test('sets priority to high for events', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'er-3' });

      const future = new Date(Date.now() + 60 * 60_000);
      await reminderService.scheduleEventReminder('event-1', 'Meeting', future, 15);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      expect(call.priority).toBe('high');
    });

    test('includes event title in notification body', async () => {
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'er-4' });

      const future = new Date(Date.now() + 60 * 60_000);
      await reminderService.scheduleEventReminder('event-1', 'Dentist Appointment', future, 10);

      const call = vi.mocked(notificationAPI.queueNotification).mock.calls[0][0];
      const payload = call.payload as { body?: string };
      expect(payload.body).toContain('Dentist Appointment');
    });
  });

  // ---------------------------------------------------------------------------
  // getPendingReminders()
  // ---------------------------------------------------------------------------

  describe('getPendingReminders()', () => {
    test('returns upcoming reminders from API', async () => {
      const items = [makeQueueItem({ id: 'pending-1' }), makeQueueItem({ id: 'pending-2' })];
      vi.mocked(notificationAPI.getUpcomingReminders).mockResolvedValue(items as any);

      const result = await reminderService.getPendingReminders();

      expect(result).toHaveLength(2);
    });

    test('returns empty array on API failure', async () => {
      vi.mocked(notificationAPI.getUpcomingReminders).mockRejectedValue(new Error('fail'));

      const result = await reminderService.getPendingReminders();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getDueReminders()
  // ---------------------------------------------------------------------------

  describe('getDueReminders()', () => {
    test('returns due reminders from API', async () => {
      const items = [makeQueueItem()];
      vi.mocked(notificationAPI.getDueReminders).mockResolvedValue(items as any);

      const result = await reminderService.getDueReminders();

      expect(result).toHaveLength(1);
    });

    test('returns empty array on API failure', async () => {
      vi.mocked(notificationAPI.getDueReminders).mockRejectedValue(new Error('fail'));

      const result = await reminderService.getDueReminders();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // markAsSent()
  // ---------------------------------------------------------------------------

  describe('markAsSent()', () => {
    test('calls markReminderSent API and returns true', async () => {
      vi.mocked(notificationAPI.markReminderSent).mockResolvedValue(undefined);

      const result = await reminderService.markAsSent('reminder-1');

      expect(notificationAPI.markReminderSent).toHaveBeenCalledWith('reminder-1');
      expect(result).toBe(true);
    });

    test('returns false on API failure', async () => {
      vi.mocked(notificationAPI.markReminderSent).mockRejectedValue(new Error('fail'));

      const result = await reminderService.markAsSent('reminder-1');

      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // uuidToInt() — tested indirectly via scheduleReminder on native
  // ---------------------------------------------------------------------------

  describe('uuidToInt() via native scheduleReminder', () => {
    beforeEach(() => {
      vi.mocked(platform.isNative).mockReturnValue(true);
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'abc-def-123' });
    });

    test('produces a positive integer id for LocalNotifications', async () => {
      const future = new Date(Date.now() + 60_000);
      await reminderService.scheduleReminder({
        type: 'task_upcoming',
        title: 'T',
        body: 'B',
        scheduledFor: future,
      });

      const scheduled = vi.mocked(LocalNotifications.schedule).mock.calls[0][0];
      expect(scheduled.notifications[0].id).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(scheduled.notifications[0].id)).toBe(true);
    });

    test('produces consistent id for same UUID', async () => {
      const future = new Date(Date.now() + 60_000);
      const params = { type: 'task_upcoming' as const, title: 'T', body: 'B', scheduledFor: future };

      // Both calls mock the same returned id → same UUID → same integer
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'same-uuid-1234' });
      await reminderService.scheduleReminder(params);
      const id1 = vi.mocked(LocalNotifications.schedule).mock.calls[0][0].notifications[0].id;

      vi.clearAllMocks();
      vi.mocked(notificationAPI.queueNotification).mockResolvedValue({ id: 'same-uuid-1234' });
      await reminderService.scheduleReminder(params);
      const id2 = vi.mocked(LocalNotifications.schedule).mock.calls[0][0].notifications[0].id;

      expect(id1).toBe(id2);
    });
  });
});
