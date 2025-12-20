/**
 * Automation Engine
 * Evaluates triggers and executes actions for IFTTT-style automation rules
 */

import { supabase } from '@/lib/supabase';
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
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) {
      logger.error('AutomationEngine', error, { context: 'getActiveRules' });
      return [];
    }

    return (data || []).map(this.mapDbToRule);
  }

  /**
   * Get rules triggered by a specific event
   */
  async getRulesForEvent(userId: string, eventType: AutomationEventType): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .eq('trigger_type', 'event')
      .contains('trigger_config', { event: eventType });

    if (error) {
      logger.error('AutomationEngine', error, { context: 'getRulesForEvent' });
      return [];
    }

    return (data || []).map(this.mapDbToRule);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notification_queue').insert({
      user_id: context.userId,
      type: 'automation',
      priority: 'normal',
      payload: {
        title: params.title as string || 'Automation',
        body: params.body as string || '',
      },
      scheduled_for: new Date().toISOString(),
      status: 'pending',
    });
  }

  private async actionCreateTask(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    await supabase.from('tasks').insert({
      user_id: context.userId,
      title: params.title as string || 'Automated Task',
      description: params.description as string,
      priority: params.priority as string || 'medium',
      status: 'pending',
    });
  }

  private async actionLogHabit(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    const habitId = params.habit_id as string;
    if (!habitId) return;

    await supabase.from('habit_logs').insert({
      habit_id: habitId,
      user_id: context.userId,
      completed_at: new Date().toISOString(),
      value: params.value as number || 1,
    });
  }

  private async actionAddToList(params: Record<string, unknown>, context: AutomationContext): Promise<void> {
    const listId = params.list_id as string;
    const content = params.content as string;
    if (!listId || !content) return;

    await supabase.from('list_items').insert({
      list_id: listId,
      user_id: context.userId,
      content,
      completed: false,
    });
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
    try {
      await supabase.rpc('log_automation_execution', {
        p_rule_id: ruleId,
        p_trigger_reason: 'event_triggered',
        p_actions_executed: actionsExecuted,
        p_success: success,
        p_error_message: errorMessage,
        p_execution_time_ms: executionTimeMs,
      });
    } catch (err) {
      // Fallback: direct insert
      const { data: rule } = await supabase
        .from('automation_rules')
        .select('user_id')
        .eq('id', ruleId)
        .single();

      if (rule) {
        await supabase.from('automation_log').insert({
          rule_id: ruleId,
          user_id: rule.user_id,
          trigger_reason: 'event_triggered',
          actions_executed: actionsExecuted,
          success,
          error_message: errorMessage,
          execution_time_ms: executionTimeMs,
        });
      }
    }
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
    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        user_id: userId,
        name,
        description,
        trigger_type: trigger.type,
        trigger_config: trigger,
        actions,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('AutomationEngine', error, { context: 'createRule' });
      return null;
    }

    return this.mapDbToRule(data);
  }

  /**
   * Update an automation rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Pick<AutomationRule, 'name' | 'description' | 'trigger' | 'actions' | 'enabled'>>
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.actions !== undefined) updateData.actions = updates.actions;
    if (updates.trigger !== undefined) {
      updateData.trigger_type = updates.trigger.type;
      updateData.trigger_config = updates.trigger;
    }

    const { error } = await supabase
      .from('automation_rules')
      .update(updateData)
      .eq('id', ruleId);

    if (error) {
      logger.error('AutomationEngine', error, { context: 'updateRule' });
      return false;
    }

    return true;
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      logger.error('AutomationEngine', error, { context: 'deleteRule' });
      return false;
    }

    return true;
  }
}

export const automationEngine = new AutomationEngine();

