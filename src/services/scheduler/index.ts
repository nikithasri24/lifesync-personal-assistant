/**
 * Scheduler Domain Service
 * 
 * Central scheduling orchestration that unifies:
 * - ScheduleEngine: Main orchestrator for all scheduling operations
 * - TimeSlotAllocator: Unified free slot calculation
 * - ConflictResolver: Conflict detection and resolution
 * - DayPlanGenerator: AI-assisted day planning
 */

export { ScheduleEngine, scheduleEngine } from './ScheduleEngine';
export type { 
  ScheduleEvent, 
  ScheduleConflict, 
  DayPlan 
} from './ScheduleEngine';

