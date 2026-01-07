/**
 * Automation Engine
 * Evaluates triggers and executes actions for IFTTT-style automation rules
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getActiveAutomationRules,
  getAutomationRulesForEvent,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  logAutomationExecution
} from '@/api/automationAPI';
import { createTask } from '@/api/tasksAPI';
import { queueNotification } from '@/api/notificationAPI';
import { addListItem } from '@/api/listAPI';
import { createHabitEntry } from '@/api/habitsAPI';
import { logger } from '@/services/logger';
import type { AutomationRule, AutomationAction, AutomationEventType } from '@/types/infrastructure';

export interface AutomationContext {
  userId: string;
  eventType?: AutomationEventType;
  eventData?: Record<string, unknown>;
  timestamp: Date;
}

export interface ExecutionResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  actionsExecuted: string[];
  error?: string;
  executionTimeMs: number;
}

class AutomationEngine {
  /**
   * Get all active rules for a user
   */
  async getActiveRules(userId: string): Promise<AutomationRule[]> {
    // Use API layer instead of direct Supabase
    try {
      const rules = await getActiveAutomationRules();
      return rules; // API already returns AutomationRule[]
    } catch (error) {
      logger.error('AutomationEngine', error instanceof Error ? error : String(error), { context: 'getActiveRules' });
      return [];
    }
  }

  /**
   * Get rules triggered by a specific event
   */
  async getRulesForEvent(userId: string, eventType: AutomationEventType): Promise<AutomationRule[]> {
    // Use API layer instead of direct Supabase
    try {
      const rules = await getAutomationRulesForEvent(eventType);
      return rules; // API already returns AutomationRule[]
    } catch (error) {
      logger.error('AutomationEngine', error instanceof Error ? error : String(error), { context: 'getRulesForEvent' });
      return [];
    }
  }

  /**
   * Trigger rules for an event
   */
  async triggerEvent(
    userId: string,
    eventType: AutomationEventType,
    eventData: Record<string, unknown> = {}
  ): Promise<ExecutionResult[]> {
    const rules = await this.getRulesForEvent(userId, eventType);
    const results: ExecutionResult[] = [];

    for (const rule of rules) {
      const result = await this.executeRule(rule, {
        userId,
        eventType,
        eventData,
        timestamp: new Date(),
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single rule
   */
  async executeRule(rule: AutomationRule, context: AutomationContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const actionsExecuted: string[] = [];
    let error: string | undefined;

    try {
      for (const action of rule.actions) {
        await this.executeAction(action, context);
        actionsExecuted.push(action.type);
      }

      // Log success
      await this.logExecution(rule.id, true, actionsExecuted, null, Date.now() - startTime);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: true,
        actionsExecuted,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      error = (err as Error).message;
      
      // Log failure
      await this.logExecution(rule.id, false, actionsExecuted, error, Date.now() - startTime);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: false,
        actionsExecuted,
        error,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: AutomationAction, context: AutomationContext): Promise<void> {
    logger.info('AutomationEngine', 'Executing action', { type: action.type, userId: context.userId });

    switch (action.type) {
      case 'send_notification':
        await this.actionSendNotification(action.params, context);
        break;
      case 'create_task':
        await this.actionCreateTask(action.params, context);
        break;
      case 'log_habit':
        await this.actionLogHabit(action.params, context);
        break;
      case 'add_to_list':
        await this.actionAddToList(action.params, context);
        break;
      default:
        logger.warn('AutomationEngine', `Unknown action type: ${action.type}`);
    }
  }

  private async actionSendNotification(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    // Use API layer instead of direct Supabase
    await queueNotification({
      type: 'automation',
      priority: 'normal',
      payload: {
        title: params.title as string || 'Automation',
        body: params.body as string || '',
      },
      scheduled_for: new Date().toISOString(),
    });
  }

  private async actionCreateTask(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    // Use API layer instead of direct Supabase
    await createTask({
      title: params.title as string || 'Automated Task',
      description: params.description as string,
      priority: (params.priority as 'low' | 'medium' | 'high') || 'medium',
      status: 'todo',
    });
  }

  private async actionLogHabit(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    const habitId = params.habit_id as string;
    if (!habitId) return;

    // Use API layer instead of direct Supabase
    const today = new Date().toISOString().split('T')[0];
    await createHabitEntry({
      habit_id: habitId,
      date: today,
      value: params.value as number || 1,
    });
  }

  private async actionAddToList(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    const listId = params.list_id as string;
    const content = params.content as string;
    if (!listId || !content) return;

    // Use API layer instead of direct Supabase
    await addListItem(listId, content);
  }

  /**
   * Log execution to automation_log table
   */
  private async logExecution(
    ruleId: string,
    success: boolean,
    actionsExecuted: string[],
    errorMessage: string | null,
    executionTimeMs: number
  ): Promise<void> {
    // Use API layer instead of direct Supabase
    await logAutomationExecution({
      ruleId,
      triggerReason: 'event_triggered',
      actionsExecuted: actionsExecuted.length,
      success,
      errorMessage: errorMessage ?? undefined,
      executionTimeMs,
    });
  }

  /**
   * Map database row to AutomationRule type
   */
  private mapDbToRule(row: Record<string, unknown>): AutomationRule {
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      trigger: {
        type: row.trigger_type as AutomationRule['trigger']['type'],
        ...(row.trigger_config as Record<string, unknown>),
      },
      actions: row.actions as AutomationAction[],
      enabled: row.enabled as boolean,
      last_triggered_at: row.last_triggered_at as string | null,
      trigger_count: row.trigger_count as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  /**
   * Create a new automation rule
   */
  async createRule(
    userId: string,
    name: string,
    trigger: AutomationRule['trigger'],
    actions: AutomationAction[],
    description?: string
  ): Promise<AutomationRule | null> {
    // Use API layer instead of direct Supabase
    try {
      const rule = await createAutomationRule({
        user_id: userId,
        name,
        description,
        trigger,
        actions,
        enabled: true,
        trigger_count: 0,
        last_triggered_at: null,
      });
      return rule; // API already returns AutomationRule
    } catch (error) {
      logger.error('AutomationEngine', error instanceof Error ? error : String(error), { context: 'createRule' });
      return null;
    }
  }

  /**
   * Update an automation rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Pick<AutomationRule, 'name' | 'description' | 'trigger' | 'actions' | 'enabled'>>
  ): Promise<boolean> {
    // Use API layer instead of direct Supabase
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.actions !== undefined) updateData.actions = updates.actions;
    if (updates.trigger !== undefined) {
      updateData.trigger_type = updates.trigger.type;
      updateData.trigger_config = updates.trigger;
    }

    try {
      await updateAutomationRule(ruleId, updateData);
      return true;
    } catch (error) {
      logger.error('AutomationEngine', error instanceof Error ? error : String(error), { context: 'updateRule' });
      return false;
    }
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    // Use API layer instead of direct Supabase
    try {
      await deleteAutomationRule(ruleId);
      return true;
    } catch (error) {
      logger.error('AutomationEngine', error instanceof Error ? error : String(error), { context: 'deleteRule' });
      return false;
    }
  }
}

export const automationEngine = new AutomationEngine();

