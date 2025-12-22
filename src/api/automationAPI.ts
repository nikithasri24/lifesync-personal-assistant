/**
 * Automation API
 * CRUD operations for automation rules with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import type { AutomationRule, AutomationEventType } from '../services/types';

/**
 * Get all active automation rules for the current user
 */
export async function getActiveAutomationRules(): Promise<AutomationRule[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true);

      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
    { domain: 'AutomationAPI', operation: 'getActiveAutomationRules' }
  );
}

/**
 * Get automation rules for a specific event type
 */
export async function getAutomationRulesForEvent(eventType: AutomationEventType): Promise<AutomationRule[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .eq('trigger_type', 'event')
        .contains('trigger_config', { event: eventType });

      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
    { domain: 'AutomationAPI', operation: 'getAutomationRulesForEvent', data: { eventType } }
  );
}

/**
 * Create a new automation rule
 */
export async function createAutomationRule(
  rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>
): Promise<AutomationRule> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('automation_rules')
        .insert({
          user_id: user.id,
          ...rule,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Automation Rule');
      return data as AutomationRule;
    },
    { domain: 'AutomationAPI', operation: 'createAutomationRule', data: { name: rule.name } }
  );
}

/**
 * Update an automation rule
 */
export async function updateAutomationRule(
  ruleId: string,
  updates: Partial<Omit<AutomationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  return apiCall(
    async () => {
      const { error } = await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;
    },
    { domain: 'AutomationAPI', operation: 'updateAutomationRule', data: { ruleId } }
  );
}

/**
 * Delete an automation rule
 */
export async function deleteAutomationRule(ruleId: string): Promise<void> {
  return apiCall(
    async () => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    { domain: 'AutomationAPI', operation: 'deleteAutomationRule', data: { ruleId } }
  );
}

/**
 * Get automation rule by ID
 */
export async function getAutomationRule(ruleId: string): Promise<AutomationRule | null> {
  return apiCall(
    async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as AutomationRule;
    },
    { domain: 'AutomationAPI', operation: 'getAutomationRule', data: { ruleId } }
  );
}

/**
 * Log automation execution
 */
export async function logAutomationExecution(params: {
  ruleId: string;
  triggerReason: string;
  actionsExecuted: number;
  success: boolean;
  errorMessage?: string;
  executionTimeMs: number;
}): Promise<void> {
  return apiCall(
    async () => {
      try {
        // Try using RPC function first
        await supabase.rpc('log_automation_execution', {
          p_rule_id: params.ruleId,
          p_trigger_reason: params.triggerReason,
          p_actions_executed: params.actionsExecuted,
          p_success: params.success,
          p_error_message: params.errorMessage,
          p_execution_time_ms: params.executionTimeMs,
        });
      } catch (err) {
        // Fallback: direct insert
        const rule = await getAutomationRule(params.ruleId);
        if (rule) {
          await supabase.from('automation_log').insert({
            rule_id: params.ruleId,
            user_id: rule.user_id,
            trigger_reason: params.triggerReason,
            actions_executed: params.actionsExecuted,
            success: params.success,
            error_message: params.errorMessage,
            execution_time_ms: params.executionTimeMs,
          });
        }
      }
    },
    { domain: 'AutomationAPI', operation: 'logAutomationExecution', data: { ruleId: params.ruleId } }
  );
}

