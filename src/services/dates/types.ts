/**
 * Important Dates Types
 * Type definitions for birthdays, anniversaries, and other important dates
 */

export type DateType = 'birthday' | 'anniversary' | 'memorial' | 'custom';

export interface ImportantDate {
  id: string;
  user_id: string;
  
  // Person/Event details
  person_name: string;
  relationship?: string | null;
  
  // Date info
  date_type: DateType;
  month: number; // 1-12
  day: number; // 1-31
  year?: number | null; // Optional: for age calculation
  
  // Reminders
  reminder_days_before: number[];
  
  // Notes and gift ideas
  notes?: string | null;
  gift_ideas?: string[] | null;
  
  // Celebration planning
  celebration_notes?: string | null;
  last_celebrated_year?: number | null;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UpcomingDate extends ImportantDate {
  days_until: number;
  age?: number | null; // Calculated age if year is provided
  next_occurrence: string; // ISO date string
}

export interface CreateImportantDateInput {
  person_name: string;
  relationship?: string;
  date_type: DateType;
  month: number;
  day: number;
  year?: number;
  reminder_days_before?: number[];
  notes?: string;
  gift_ideas?: string[];
  celebration_notes?: string;
}

export interface UpdateImportantDateInput {
  person_name?: string;
  relationship?: string;
  date_type?: DateType;
  month?: number;
  day?: number;
  year?: number;
  reminder_days_before?: number[];
  notes?: string;
  gift_ideas?: string[];
  celebration_notes?: string;
  last_celebrated_year?: number;
  is_active?: boolean;
}

export interface DatesSummary {
  totalDates: number;
  upcomingThisWeek: UpcomingDate[];
  upcomingThisMonth: UpcomingDate[];
  byType: {
    birthdays: number;
    anniversaries: number;
    memorials: number;
    custom: number;
  };
}

