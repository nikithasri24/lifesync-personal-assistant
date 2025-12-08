/**
 * Task helper functions and utilities
 */
import { isToday, addDays, isPast } from 'date-fns';
import type { Task, Project } from '../types';

/**
 * Get tasks due today
 */
export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.dueDate && isToday(task.dueDate) && task.status !== 'done');
}

/**
 * Get tasks due in the next 7 days
 */
export function getUpcomingTasks(tasks: Task[]): Task[] {
  const sevenDaysFromNow = addDays(new Date(), 7);
  return tasks.filter(task =>
    task.dueDate &&
    task.dueDate <= sevenDaysFromNow &&
    task.status !== 'done'
  );
}

/**
 * Get all inbox tasks
 */
export function getInboxTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.status !== 'done');
}

/**
 * Check if a task is overdue
 */
export function isOverdue(date: Date, status: string): boolean {
  return isPast(date) && status !== 'done';
}

/**
 * Get subtasks for a given parent task
 */
export function getSubtasks(tasks: Task[], parentId: string): Task[] {
  return tasks.filter(task => task.parentId === parentId);
}

/**
 * Get main tasks (tasks without parents)
 */
export function getMainTasks(taskList: Task[]): Task[] {
  return taskList.filter(task => !task.parentId);
}

/**
 * Parse quick add text with natural language support
 * Examples:
 * - "Buy milk #groceries @tomorrow p1"
 * - "Call mom @today p2 ^Personal"
 */
export function parseQuickAdd(text: string, projects: Project[]): {
  title: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  projectId: string | null;
} {
  let title = text;
  const tags: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  let dueDate: Date | null = null;
  let projectId: string | null = null;

  // Extract tags (#tag)
  const tagMatches = text.match(/#(\w+)/g);
  if (tagMatches) {
    tagMatches.forEach(tag => {
      tags.push(tag.slice(1));
      title = title.replace(tag, '').trim();
    });
  }

  // Extract priority (p1, p2, p3, p4)
  const priorityMatch = text.match(/p([1-4])/i);
  if (priorityMatch) {
    const level = priorityMatch[1];
    priority = level === '1' ? 'urgent' : level === '2' ? 'high' : level === '3' ? 'medium' : 'low';
    title = title.replace(priorityMatch[0], '').trim();
  }

  // Extract due date (@today, @tomorrow, @YYYY-MM-DD)
  const dateMatch = text.match(/@(\w+)/);
  if (dateMatch) {
    const dateStr = dateMatch[1].toLowerCase();
    if (dateStr === 'today') {
      dueDate = new Date();
    } else if (dateStr === 'tomorrow') {
      dueDate = addDays(new Date(), 1);
    }
    title = title.replace(dateMatch[0], '').trim();
  }

  // Extract project (^ProjectName)
  const projectMatch = text.match(/\^(\w+)/);
  if (projectMatch) {
    const projectName = projectMatch[1].toLowerCase();
    const project = projects.find(p => p.name.toLowerCase().includes(projectName));
    if (project) {
      projectId = project.id;
    }
    title = title.replace(projectMatch[0], '').trim();
  }

  return {
    title,
    tags,
    priority,
    dueDate,
    projectId
  };
}

/**
 * Format seconds to MM:SS for Pomodoro timer
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
