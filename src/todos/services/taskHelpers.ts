/**
 * Task helper functions and utilities
 */
import { isToday, addDays, isPast } from 'date-fns';
import type { Task, Project } from '../types';

/**
 * Get tasks due today
 */
export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => {
    const targetDate = task.scheduledStart ?? task.dueDate;
    return targetDate ? isToday(targetDate) && task.status !== 'done' : false;
  });
}

/**
 * Get tasks due in the next 7 days
 */
export function getUpcomingTasks(tasks: Task[]): Task[] {
  const sevenDaysFromNow = addDays(new Date(), 7);
  return tasks.filter(task => {
    const targetDate = task.scheduledStart ?? task.dueDate;
    return targetDate ? targetDate <= sevenDaysFromNow && task.status !== 'done' : false;
  });
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
 * - "Dentist appointment at 3:30pm"
 * - "Meeting @ 10"
 */
export function parseQuickAdd(text: string, projects: Project[]): {
  title: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  dueTime: string | null;
  projectId: string | null;
} {
  let title = text;
  const tags: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  let dueDate: Date | null = null;
  let dueTime: string | null = null;
  let projectId: string | null = null;

  // Extract time patterns: "at 5:30pm", "@ 6", "at 3", etc.
  const timePatterns = [
    // "at 5:30pm", "at 5:30 pm", "at 5:30"
    /\bat\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    // "at 6pm", "at 6 pm", "at 6"
    /\bat\s+(\d{1,2})\s*(am|pm)?/i,
    // "@ 5:30pm", "@ 5:30", "@ 5:30 pm"
    /@\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    // "@ 6pm", "@ 6 pm", "@ 6"
    /@\s*(\d{1,2})\s*(am|pm)?/i,
  ];

  for (const pattern of timePatterns) {
    const timeMatch = text.match(pattern);
    if (timeMatch) {
      let hours: number;
      let minutes = 0;
      let period: string | undefined;

      if (timeMatch[2] && !isNaN(parseInt(timeMatch[2]))) {
        // Has minutes (e.g., "5:30")
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        period = timeMatch[3]?.toLowerCase();
      } else {
        // Just hour (e.g., "6pm" or "6")
        hours = parseInt(timeMatch[1]);
        period = timeMatch[2]?.toLowerCase();
      }

      // Convert to 24-hour format
      if (period === 'pm' && hours < 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      } else if (!period) {
        // No AM/PM specified - use smart defaults
        // 1-7 likely PM (afternoon/evening)
        // 8-11 could be AM or PM, default to PM if >= 5, else AM
        // 12 is noon
        if (hours >= 1 && hours <= 7) {
          hours += 12; // Assume PM for 1-7
        } else if (hours >= 8 && hours <= 11) {
          // Keep as-is (AM) for 8-11
        }
      }

      // Format time as HH:MM for input[type="time"]
      dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Set due date to today if not already set
      if (!dueDate) {
        dueDate = new Date();
      }

      // Remove time from title
      title = title.replace(timeMatch[0], '').trim();
      break; // Only match first time pattern
    }
  }

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
    dueTime,
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
