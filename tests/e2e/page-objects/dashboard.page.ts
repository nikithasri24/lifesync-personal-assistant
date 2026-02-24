/**
 * Dashboard Page Object
 *
 * Encapsulates selectors and actions for the Dashboard page.
 */

import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  // Selectors
  readonly greeting: Locator;
  readonly dateDisplay: Locator;
  readonly summaryCards: Locator;
  readonly addTaskButton: Locator;
  readonly newNoteButton: Locator;
  readonly journalButton: Locator;
  readonly focusButton: Locator;
  readonly todayTasksSection: Locator;
  readonly todayHabitsSection: Locator;
  readonly recentNotesSection: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize selectors
    this.greeting = page.getByText(/good (morning|afternoon|evening)/i);
    this.dateDisplay = page.getByText(/\w+day, \w+ \d+, \d{4}/);
    this.summaryCards = page.locator('[data-testid="summary-card"]');
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.newNoteButton = page.getByRole('button', { name: /new note/i });
    this.journalButton = page.getByRole('button', { name: /journal/i });
    this.focusButton = page.getByRole('button', { name: /focus/i });
    this.todayTasksSection = page.locator('[data-testid="today-tasks"]');
    this.todayHabitsSection = page.locator('[data-testid="today-habits"]');
    this.recentNotesSection = page.locator('[data-testid="recent-notes"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click "Add Task" button
   */
  async clickAddTask() {
    await this.addTaskButton.click();
  }

  /**
   * Click "New Note" button
   */
  async clickNewNote() {
    await this.newNoteButton.click();
  }

  /**
   * Get summary card by type
   */
  getSummaryCard(type: 'tasks' | 'habits' | 'notes' | 'journal'): Locator {
    return this.page.getByTestId(`summary-card-${type}`);
  }

  /**
   * Get task count from summary
   */
  async getTaskCount(): Promise<number> {
    const card = this.getSummaryCard('tasks');
    const text = await card.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Verify all dashboard sections are visible
   */
  async verifyAllSectionsVisible() {
    await expect(this.greeting).toBeVisible();
    await expect(this.dateDisplay).toBeVisible();
    await expect(this.summaryCards.first()).toBeVisible();
    await expect(this.addTaskButton).toBeVisible();
  }

  /**
   * Verify today's tasks section
   */
  async verifyTodayTasks(expectedCount?: number) {
    await expect(this.todayTasksSection).toBeVisible();

    if (expectedCount !== undefined) {
      const tasks = this.todayTasksSection.getByRole('listitem');
      await expect(tasks).toHaveCount(expectedCount);
    }
  }

  /**
   * Verify today's habits section
   */
  async verifyTodayHabits(expectedCount?: number) {
    await expect(this.todayHabitsSection).toBeVisible();

    if (expectedCount !== undefined) {
      const habits = this.todayHabitsSection.getByRole('listitem');
      await expect(habits).toHaveCount(expectedCount);
    }
  }

  /**
   * Complete a habit from dashboard
   */
  async completeHabit(habitName: string) {
    const habit = this.todayHabitsSection.getByText(habitName);
    const completeButton = habit.locator('..').getByRole('button', { name: /\+/ });
    await completeButton.click();
  }

  /**
   * Navigate to "View All" for a section
   */
  async viewAll(section: 'tasks' | 'habits' | 'notes') {
    const viewAllButton = this.page.getByRole('link', {
      name: new RegExp(`view all.*${section}`, 'i'),
    });
    await viewAllButton.click();
  }
}
