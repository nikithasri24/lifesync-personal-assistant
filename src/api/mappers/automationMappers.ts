/**
 * Type mappers for automation rules
 * Converts between database Json types and application types
 */

import type { Database } from '@/types/database.types';
import type { AutomationRule, AutomationTrigger, AutomationAction } from '@/types/infrastructure';

type AutomationRuleRow = Database['public']['Tables']['automation_rules']['Row'];
type AutomationRuleInsert = Database['public']['Tables']['automation_rules']['Insert'];

/**
 * Converts database row to application AutomationRule type
 */
export function mapRowToAutomationRule(row: AutomationRuleRow): AutomationRule {
  // Parse trigger from trigger_type and trigger_config
  const trigger: AutomationTrigger = {
    type: row.trigger_type as AutomationTrigger['type'],
    ...(typeof row.trigger_config === 'object' && row.trigger_config !== null
      ? (row.trigger_config as Record<string, unknown>)
      : {}),
  };

  // Parse actions array
  const actions: AutomationAction[] = Array.isArray(row.actions)
    ? (row.actions as unknown as AutomationAction[])
    : [];

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    trigger,
    actions,
    enabled: row.enabled ?? false,
    last_triggered_at: row.last_triggered_at ?? null,
    trigger_count: row.trigger_count ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Converts application AutomationRule to database insert format
 */
export function mapAutomationRuleToInsert(
  rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>
): Omit<AutomationRuleInsert, 'user_id'> {
  // Extract trigger_type and trigger_config
  const { type: trigger_type, ...trigger_config } = rule.trigger;

  return {
    name: rule.name,
    description: rule.description,
    trigger_type,
    trigger_config: trigger_config as unknown as Database['public']['Tables']['automation_rules']['Insert']['trigger_config'],
    actions: rule.actions as unknown as Database['public']['Tables']['automation_rules']['Insert']['actions'],
    enabled: rule.enabled,
    last_triggered_at: rule.last_triggered_at,
    trigger_count: rule.trigger_count,
  };
}

/**
 * Converts partial AutomationRule update to database update format
 */
export function mapAutomationRuleToUpdate(
  updates: Partial<Omit<AutomationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Database['public']['Tables']['automation_rules']['Update'] {
  const dbUpdate: Database['public']['Tables']['automation_rules']['Update'] = {};

  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.enabled !== undefined) dbUpdate.enabled = updates.enabled;
  if (updates.last_triggered_at !== undefined) dbUpdate.last_triggered_at = updates.last_triggered_at;
  if (updates.trigger_count !== undefined) dbUpdate.trigger_count = updates.trigger_count;

  if (updates.trigger !== undefined) {
    const { type: trigger_type, ...trigger_config } = updates.trigger;
    dbUpdate.trigger_type = trigger_type;
    dbUpdate.trigger_config = trigger_config as Database['public']['Tables']['automation_rules']['Update']['trigger_config'];
  }

  if (updates.actions !== undefined) {
    dbUpdate.actions = updates.actions as unknown as Database['public']['Tables']['automation_rules']['Update']['actions'];
  }

  return dbUpdate;
}
