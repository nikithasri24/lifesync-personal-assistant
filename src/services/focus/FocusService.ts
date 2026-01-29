import { logger } from '../../services/logger';
/**
 * Focus Service
 *
 * Core service for managing focus sessions, analytics, and integrations.
 * Handles session lifecycle, distraction tracking, and productivity metrics.
 */

import {
  type FocusSession,
  type FocusPreset,
  type FocusAnalytics,
  type FocusSettings,
  type FocusEvent,
  type FocusEventType,
  type ProductivityMetrics,
  type FocusEnvironment,
  type FocusDistraction,
  type FocusBreak,
  type DistractionSummary,
  type TimeSlot,
  type DailyMetrics,
  type FocusGoal,
  type FocusAchievement,
  type FocusInsight,
  type BreakSchedule,
  type FocusMode
} from '../../types/focus';

export class FocusService {
  private currentSession: FocusSession | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private breakTimer: NodeJS.Timeout | null = null;
  private distractionMonitor: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, (event: FocusEvent) => void> = new Map();
  private settings: FocusSettings | null = null;

  constructor() {
    void this.loadSettings();
    this.setupDistractionMonitoring();
    this.setupVisibilityChangeDetection();
  }

  // ==================== Session Management ====================

  async startSession(preset: FocusPreset, targetTask?: string, targetProject?: string): Promise<FocusSession> {
    if (this.currentSession && this.currentSession.status === 'active') {
      throw new Error('A focus session is already active');
    }

    const session: FocusSession = {
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      mode: preset.mode,
      status: 'active',
      startTime: new Date(),
      plannedDuration: preset.duration,
      targetTask,
      targetProject,
      distractionLevel: preset.distractionLevel,
      breaks: [],
      distractions: [],
      productivity: {
        focusScore: 100,
        distractionCount: 0,
        averageDistraction: 0,
        deepWorkPercentage: 100,
        flowStateAchieved: false,
        taskCompletionRate: 0
      },
      environment: { ...preset.environment },
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentSession = session;
    this.startSessionTimer(preset.duration);
    this.setupBreakSchedule(preset.breakSchedule);
    void this.applyFocusEnvironment(session.environment);

    await this.saveSession(session);
    this.emitEvent('session_started', { sessionId: session.id });

    return session;
  }

  async pauseSession(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      throw new Error('No active session to pause');
    }

    this.currentSession.status = 'paused';
    this.currentSession.updatedAt = new Date();
    
    this.clearTimers();
    await this.saveSession(this.currentSession);
    this.emitEvent('session_paused', { sessionId: this.currentSession.id });
  }

  async resumeSession(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'paused') {
      throw new Error('No paused session to resume');
    }

    this.currentSession.status = 'active';
    this.currentSession.updatedAt = new Date();
    
    // Calculate remaining time
    const elapsed = this.getElapsedTime();
    const remaining = (this.currentSession.plannedDuration * 60000) - elapsed;
    
    if (remaining > 0) {
      this.startSessionTimer(Math.ceil(remaining / 60000));
    }
    
    await this.saveSession(this.currentSession);
    this.emitEvent('session_resumed', { sessionId: this.currentSession.id });
  }

  async endSession(completed: boolean = false): Promise<ProductivityMetrics> {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    const session = this.currentSession;
    session.status = completed ? 'completed' : 'inactive';
    session.endTime = new Date();
    session.actualDuration = Math.floor(this.getElapsedTime() / 60000);
    
    // Calculate final productivity metrics
    session.productivity = this.calculateProductivityMetrics(session);

    this.clearTimers();
    void this.resetFocusEnvironment();

    await this.saveSession(session);
    this.emitEvent(completed ? 'session_completed' : 'session_cancelled', {
      sessionId: session.id,
      focusScore: session.productivity.focusScore,
      distractionCount: session.productivity.distractionCount
    });
    
    this.currentSession = null;
    return session.productivity;
  }

  async takeBreak(duration: number = 5): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session for break');
    }

    const breakItem: FocusBreak = {
      id: this.generateId(),
      sessionId: this.currentSession.id,
      type: 'manual',
      startTime: new Date(),
      duration: duration,
      activity: undefined
    };

    this.currentSession.breaks.push(breakItem);
    this.currentSession.status = 'break';
    
    this.startBreakTimer(duration);
    await this.saveSession(this.currentSession);
    this.emitEvent('break_started', { sessionId: this.currentSession.id, duration });
  }

  async endBreak(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'break') {
      throw new Error('No active break to end');
    }

    const currentBreak = this.currentSession.breaks[this.currentSession.breaks.length - 1];
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = new Date();
    }

    this.currentSession.status = 'active';
    this.clearBreakTimer();
    
    await this.saveSession(this.currentSession);
    this.emitEvent('break_ended', { sessionId: this.currentSession.id });
  }

  // ==================== Environment Management ====================

  async applyFocusEnvironment(environment: FocusEnvironment): Promise<void> {
    try {
      // Apply notification settings
      if (environment.notifications) {
        await this.configureNotifications(environment.notifications);
      }

      // Block apps and websites
      if (environment.blockedApps.length > 0) {
        await this.blockApplications(environment.blockedApps);
      }

      if (environment.blockedWebsites.length > 0) {
        await this.blockWebsites(environment.blockedWebsites);
      }

      // Setup ambient sound
      if (environment.ambientSound) {
        await this.playAmbientSound(environment.ambientSound);
      }

      // Apply system-level focus mode if available
      await this.activateSystemFocusMode();

    } catch (error) {
      logger.warn('FocusService', 'Some environment settings could not be applied', { error: error as Error });
    }
  }

  async resetFocusEnvironment(): Promise<void> {
    try {
      await this.restoreNotifications();
      await this.unblockApplications();
      await this.unblockWebsites();
      await this.stopAmbientSound();
      await this.deactivateSystemFocusMode();
    } catch (error) {
      logger.warn('FocusService', 'Some environment settings could not be reset', { error: error as Error });
    }
  }

  // ==================== Distraction Tracking ====================

  private setupDistractionMonitoring(): void {
    // Monitor app switches, notifications, etc.
    this.distractionMonitor = setInterval(() => {
      if (this.currentSession && this.currentSession.status === 'active') {
        void this.checkForDistractions();
      }
    }, 5000); // Check every 5 seconds
  }

  private async checkForDistractions(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Check for app switches (would need native integration)
      const activeApp = await this.getActiveApplication();
      const allowedApps = this.currentSession.environment.allowedApps;
      
      if (activeApp && !allowedApps.includes(activeApp)) {
        await this.recordDistraction({
          type: 'app_switch',
          source: activeApp,
          duration: 5, // Approximate
          severity: 'medium'
        });
      }

      // Check for website activity (would need browser extension)
      const activeTab = await this.getActiveWebsite();
      const blockedSites = this.currentSession.environment.blockedWebsites;
      
      if (activeTab && blockedSites.some(site => activeTab.includes(site))) {
        await this.recordDistraction({
          type: 'website',
          source: activeTab,
          duration: 5,
          severity: 'high'
        });
      }

    } catch (_error) {
      // Silent fail - distraction monitoring is optional
    }
  }

  private async recordDistraction(distraction: Omit<FocusDistraction, 'id' | 'sessionId' | 'timestamp' | 'handled'>): Promise<void> {
    if (!this.currentSession) return;

    const fullDistraction: FocusDistraction = {
      id: this.generateId(),
      sessionId: this.currentSession.id,
      timestamp: new Date(),
      handled: false,
      ...distraction
    };

    this.currentSession.distractions.push(fullDistraction);
    this.currentSession.productivity.distractionCount++;
    
    // Update focus score based on distraction severity
    const penalty = distraction.severity === 'high' ? 10 : 
                   distraction.severity === 'medium' ? 5 : 2;
    this.currentSession.productivity.focusScore = Math.max(0, 
      this.currentSession.productivity.focusScore - penalty);

    await this.saveSession(this.currentSession);
    this.emitEvent('distraction_detected', {
      sessionId: this.currentSession.id,
      distractionType: fullDistraction.type,
      severity: fullDistraction.severity,
      handled: fullDistraction.handled
    });
  }

  // ==================== Analytics & Insights ====================

  async getAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<FocusAnalytics> {
    const userId = this.getCurrentUserId();
    const sessions = await this.getSessionsForPeriod(userId, period);

    return {
      userId,
      period,
      totalSessions: sessions.length,
      totalFocusTime: sessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0),
      averageSessionLength: sessions.length > 0 ?
        sessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0) / sessions.length : 0,
      completionRate: sessions.length > 0 ?
        (sessions.filter(s => s.status === 'completed').length / sessions.length) * 100 : 0,
      averageProductivityScore: sessions.length > 0 ?
        sessions.reduce((sum, s) => sum + s.productivity.focusScore, 0) / sessions.length : 0,
      topDistractions: this.calculateTopDistractions(sessions),
      productiveTimes: this.calculateProductiveTimes(sessions),
      modeUsage: this.calculateModeUsage(sessions),
      weeklyTrend: this.calculateWeeklyTrend(sessions),
      goals: await this.getFocusGoals(userId),
      achievements: await this.getFocusAchievements(userId),
      insights: await this.generateInsights(sessions)
    };
  }

  private calculateProductivityMetrics(session: FocusSession): ProductivityMetrics {
    const totalTime = this.getElapsedTime();
    const distractionTime = session.distractions.reduce((sum, d) => sum + d.duration, 0) * 1000;
    const focusTime = totalTime - distractionTime;
    
    return {
      focusScore: Math.max(0, Math.min(100,
        100 - (session.distractions.length * 5) - (distractionTime / totalTime * 50)
      )),
      distractionCount: session.distractions.length,
      averageDistraction: session.distractions.length > 0 ?
        session.distractions.reduce((sum, d) => sum + d.duration, 0) / session.distractions.length : 0,
      deepWorkPercentage: (focusTime / totalTime) * 100,
      flowStateAchieved: focusTime > (totalTime * 0.8) && session.distractions.length < 3,
      taskCompletionRate: 0, // Would be set externally based on task completion
      energyLevel: session.productivity.energyLevel
    };
  }

  // ==================== Timer Management ====================

  private startSessionTimer(durationMinutes: number): void {
    this.clearTimers();

    this.sessionTimer = setTimeout(() => {
      if (this.currentSession) {
        void this.endSession(true);
      }
    }, durationMinutes * 60000);
  }

  private startBreakTimer(durationMinutes: number): void {
    this.breakTimer = setTimeout(() => {
      if (this.currentSession && this.currentSession.status === 'break') {
        void this.endBreak();
      }
    }, durationMinutes * 60000);
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private clearBreakTimer(): void {
    if (this.breakTimer) {
      clearTimeout(this.breakTimer);
      this.breakTimer = null;
    }
  }

  // ==================== Event System ====================

  addEventListener(eventType: FocusEventType, callback: (event: FocusEvent) => void): string {
    const id = this.generateId();
    this.eventListeners.set(id, callback);
    return id;
  }

  removeEventListener(id: string): void {
    this.eventListeners.delete(id);
  }

  private emitEvent(type: FocusEventType, data: Record<string, string | number | boolean | Date> = {}): void {
    const event: FocusEvent = {
      type,
      userId: 'user_current',
      timestamp: new Date(),
      data
    };

    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('FocusService', error as Error, { context: 'focus event listener' });
      }
    });
  }

  // ==================== Utility Methods ====================

  getCurrentSession(): FocusSession | null {
    return this.currentSession;
  }

  getTimeRemaining(): number {
    if (!this.currentSession || this.currentSession.status !== 'active') return 0;
    
    const elapsed = this.getElapsedTime();
    const planned = this.currentSession.plannedDuration * 60000;
    return Math.max(0, planned - elapsed);
  }

  getProgress(): number {
    if (!this.currentSession) return 0;
    
    const elapsed = this.getElapsedTime();
    const planned = this.currentSession.plannedDuration * 60000;
    return Math.min(100, (elapsed / planned) * 100);
  }

  private getElapsedTime(): number {
    if (!this.currentSession) return 0;
    return Date.now() - this.currentSession.startTime.getTime();
  }

  private generateId(): string {
    return `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // Would integrate with your auth system
    return 'user_current';
  }

  // ==================== Placeholder Integration Methods ====================
  // These would be implemented with actual system integrations

  private getActiveApplication(): Promise<string | null> {
    // Would use native APIs to detect active application
    return Promise.resolve(null);
  }

  private getActiveWebsite(): Promise<string | null> {
    // Would use browser extension or system APIs
    return Promise.resolve(null);
  }

  private blockApplications(apps: string[]): Promise<void> {
    // Would use system APIs to block applications
    logger.info('FocusService', 'Blocking applications', { apps });
    return Promise.resolve();
  }

  private unblockApplications(): Promise<void> {
    // Would restore application access
    logger.info('FocusService', 'Unblocking applications');
    return Promise.resolve();
  }

  private blockWebsites(websites: string[]): Promise<void> {
    // Would use browser extension or system-level blocking
    logger.info('FocusService', 'Blocking websites', { websites });
    return Promise.resolve();
  }

  private unblockWebsites(): Promise<void> {
    // Would restore website access
    logger.info('FocusService', 'Unblocking websites');
    return Promise.resolve();
  }

  private configureNotifications(settings: FocusEnvironment['notifications']): Promise<void> {
    // Would configure system notification settings
    logger.info('FocusService', 'Configuring notifications:', settings);
    return Promise.resolve();
  }

  private restoreNotifications(): Promise<void> {
    // Would restore original notification settings
    logger.info('FocusService', 'Restoring notifications');
    return Promise.resolve();
  }

  private playAmbientSound(settings: FocusEnvironment['ambientSound']): Promise<void> {
    // Would start ambient sound playback
    logger.info('FocusService', 'Playing ambient sound:', settings);
    return Promise.resolve();
  }

  private stopAmbientSound(): Promise<void> {
    // Would stop ambient sound playback
    logger.info('FocusService', 'Stopping ambient sound');
    return Promise.resolve();
  }

  private activateSystemFocusMode(): Promise<void> {
    // Would activate OS-level focus mode
    logger.info('FocusService', 'Activating system focus mode');
    return Promise.resolve();
  }

  private deactivateSystemFocusMode(): Promise<void> {
    // Would deactivate OS-level focus mode
    logger.info('FocusService', 'Deactivating system focus mode');
    return Promise.resolve();
  }

  // ==================== Data Persistence ====================
  // These would integrate with your data storage system

  private saveSession(session: FocusSession): Promise<void> {
    // Would save to database/storage
    localStorage.setItem(`focus_session_${session.id}`, JSON.stringify(session));
    return Promise.resolve();
  }

  private loadSettings(): Promise<void> {
    // Would load user settings from storage
    const defaultSettings: FocusSettings = {
      userId: 'user_current',
      defaultMode: 'deep-work',
      defaultDuration: 25,
      defaultBreakInterval: 25,
      defaultBreakDuration: 5,
      autoStartBreaks: true,
      strictMode: false,
      soundEnabled: true,
      notificationsEnabled: true,
      analyticsEnabled: true,
      weeklyGoal: 1200, // 20 hours
      dailyGoal: 180, // 3 hours
      preferredTimes: [],
      integrations: {
        calendar: false,
        slack: false,
        teams: false,
        spotify: false,
        notifications: true
      },
      privacy: {
        shareStats: false,
        allowTeamView: false,
        trackApps: true,
        trackWebsites: true
      }
    };

    this.settings = defaultSettings;
    return Promise.resolve();
  }

  private getSessionsForPeriod(_userId: string, _period: string): Promise<FocusSession[]> {
    // Would query database for sessions in period
    return Promise.resolve([]);
  }

  private getFocusGoals(_userId: string): Promise<FocusGoal[]> {
    // Would load user goals from storage
    return Promise.resolve([]);
  }

  private getFocusAchievements(_userId: string): Promise<FocusAchievement[]> {
    // Would load user achievements from storage
    return Promise.resolve([]);
  }

  private calculateTopDistractions(_sessions: FocusSession[]): DistractionSummary[] {
    // Would analyze distractions across sessions
    return [];
  }

  private calculateProductiveTimes(_sessions: FocusSession[]): TimeSlot[] {
    // Would analyze productive time patterns
    return [];
  }

  private calculateModeUsage(_sessions: FocusSession[]): Record<FocusMode, number> {
    // Would calculate time spent in each focus mode
    return {} as Record<FocusMode, number>;
  }

  private calculateWeeklyTrend(_sessions: FocusSession[]): DailyMetrics[] {
    // Would calculate daily metrics for trend analysis
    return [];
  }

  private generateInsights(_sessions: FocusSession[]): Promise<FocusInsight[]> {
    // Would generate AI-powered insights
    return Promise.resolve([]);
  }

  private setupBreakSchedule(schedule: BreakSchedule): void {
    // Would setup automated break scheduling
    logger.info('FocusService', 'Setting up break schedule', { schedule });
  }

  private setupVisibilityChangeDetection(): void {
    // Detect when user switches away from the app
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentSession?.status === 'active') {
        void this.recordDistraction({
          type: 'app_switch',
          source: 'Unknown',
          duration: 1,
          severity: 'low'
        });
      }
    });
  }
}

// Export singleton instance
export const focusService = new FocusService();
