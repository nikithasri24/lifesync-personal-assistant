/**
 * Focus Service
 * 
 * Core service for managing focus sessions, analytics, and integrations.
 * Handles session lifecycle, distraction tracking, and productivity metrics.
 */

import { 
  FocusSession, 
  FocusPreset, 
  FocusAnalytics, 
  FocusSettings,
  FocusEvent,
  FocusEventType,
  DistractionLevel,
  ProductivityMetrics,
  FocusEnvironment,
  FocusDistraction,
  FocusBreak
} from '../../types/focus';

export class FocusService {
  private currentSession: FocusSession | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private breakTimer: NodeJS.Timeout | null = null;
  private distractionMonitor: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, (event: FocusEvent) => void> = new Map();
  private settings: FocusSettings | null = null;

  constructor() {
    this.loadSettings();
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
      userId: await this.getCurrentUserId(),
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
    this.applyFocusEnvironment(session.environment);
    
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
    this.resetFocusEnvironment();
    
    await this.saveSession(session);
    this.emitEvent(completed ? 'session_completed' : 'session_cancelled', { 
      sessionId: session.id,
      productivity: session.productivity 
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
      console.warn('Some environment settings could not be applied:', error);
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
      console.warn('Some environment settings could not be reset:', error);
    }
  }

  // ==================== Distraction Tracking ====================

  private setupDistractionMonitoring(): void {
    // Monitor app switches, notifications, etc.
    this.distractionMonitor = setInterval(() => {
      if (this.currentSession && this.currentSession.status === 'active') {
        this.checkForDistractions();
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

    } catch (error) {
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
      distraction: fullDistraction 
    });
  }

  // ==================== Analytics & Insights ====================

  async getAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<FocusAnalytics> {
    const userId = await this.getCurrentUserId();
    const sessions = await this.getSessionsForPeriod(userId, period);
    
    return {
      userId,
      period,
      totalSessions: sessions.length,
      totalFocusTime: sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      averageSessionLength: sessions.length > 0 ? 
        sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / sessions.length : 0,
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
      energyLevel: session.productivity.energyLevel,
      moodRating: session.productivity.moodRating
    };
  }

  // ==================== Timer Management ====================

  private startSessionTimer(durationMinutes: number): void {
    this.clearTimers();
    
    this.sessionTimer = setTimeout(async () => {
      if (this.currentSession) {
        await this.endSession(true);
      }
    }, durationMinutes * 60000);
  }

  private startBreakTimer(durationMinutes: number): void {
    this.breakTimer = setTimeout(async () => {
      if (this.currentSession && this.currentSession.status === 'break') {
        await this.endBreak();
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

  private emitEvent(type: FocusEventType, data: Record<string, any> = {}): void {
    const event: FocusEvent = {
      type,
      userId: this.getCurrentUserId().toString(),
      timestamp: new Date(),
      data
    };

    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in focus event listener:', error);
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

  private async getCurrentUserId(): Promise<string> {
    // Would integrate with your auth system
    return 'user_current';
  }

  // ==================== Placeholder Integration Methods ====================
  // These would be implemented with actual system integrations

  private async getActiveApplication(): Promise<string | null> {
    // Would use native APIs to detect active application
    return null;
  }

  private async getActiveWebsite(): Promise<string | null> {
    // Would use browser extension or system APIs
    return null;
  }

  private async blockApplications(apps: string[]): Promise<void> {
    // Would use system APIs to block applications
    console.log('Blocking applications:', apps);
  }

  private async unblockApplications(): Promise<void> {
    // Would restore application access
    console.log('Unblocking applications');
  }

  private async blockWebsites(websites: string[]): Promise<void> {
    // Would use browser extension or system-level blocking
    console.log('Blocking websites:', websites);
  }

  private async unblockWebsites(): Promise<void> {
    // Would restore website access
    console.log('Unblocking websites');
  }

  private async configureNotifications(settings: any): Promise<void> {
    // Would configure system notification settings
    console.log('Configuring notifications:', settings);
  }

  private async restoreNotifications(): Promise<void> {
    // Would restore original notification settings
    console.log('Restoring notifications');
  }

  private async playAmbientSound(settings: any): Promise<void> {
    // Would start ambient sound playback
    console.log('Playing ambient sound:', settings);
  }

  private async stopAmbientSound(): Promise<void> {
    // Would stop ambient sound playback
    console.log('Stopping ambient sound');
  }

  private async activateSystemFocusMode(): Promise<void> {
    // Would activate OS-level focus mode
    console.log('Activating system focus mode');
  }

  private async deactivateSystemFocusMode(): Promise<void> {
    // Would deactivate OS-level focus mode
    console.log('Deactivating system focus mode');
  }

  // ==================== Data Persistence ====================
  // These would integrate with your data storage system

  private async saveSession(session: FocusSession): Promise<void> {
    // Would save to database/storage
    localStorage.setItem(`focus_session_${session.id}`, JSON.stringify(session));
  }

  private async loadSettings(): Promise<void> {
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
  }

  private async getSessionsForPeriod(userId: string, period: string): Promise<FocusSession[]> {
    // Would query database for sessions in period
    return [];
  }

  private async getFocusGoals(userId: string): Promise<any[]> {
    // Would load user goals from storage
    return [];
  }

  private async getFocusAchievements(userId: string): Promise<any[]> {
    // Would load user achievements from storage
    return [];
  }

  private calculateTopDistractions(sessions: FocusSession[]): any[] {
    // Would analyze distractions across sessions
    return [];
  }

  private calculateProductiveTimes(sessions: FocusSession[]): any[] {
    // Would analyze productive time patterns
    return [];
  }

  private calculateModeUsage(sessions: FocusSession[]): any {
    // Would calculate time spent in each focus mode
    return {};
  }

  private calculateWeeklyTrend(sessions: FocusSession[]): any[] {
    // Would calculate daily metrics for trend analysis
    return [];
  }

  private async generateInsights(sessions: FocusSession[]): Promise<any[]> {
    // Would generate AI-powered insights
    return [];
  }

  private setupBreakSchedule(schedule: any): void {
    // Would setup automated break scheduling
    console.log('Setting up break schedule:', schedule);
  }

  private setupVisibilityChangeDetection(): void {
    // Detect when user switches away from the app
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentSession?.status === 'active') {
        this.recordDistraction({
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