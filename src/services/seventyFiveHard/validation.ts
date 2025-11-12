/**
 * 75 Hard Validation Layer
 *
 * Centralized validation logic following functional programming principles.
 * All validations return Result types for explicit error handling.
 */

import type {
  ValidationResult,
  ValidationError,
  CreateChallengeCommand,
  CompleteDayCommand,
  SeventyFiveHardRule,
  ChallengeId,
  RuleId,
} from '../../types/seventyFiveHard';
import { CHALLENGE_CONSTANTS } from '../../types/seventyFiveHard';
import { differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';

// ==================== Validation Helpers ====================

const createError = (field: string, message: string, code: string): ValidationError => ({
  field,
  message,
  code,
});

const success = <T>(data: T): ValidationResult<T> => ({ success: true, data });

const failure = (errors: ValidationError[]): ValidationResult<never> => ({
  success: false,
  errors,
});

// ==================== String Validators ====================

export const validateChallengeName = (name: string): ValidationResult<string> => {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();

  if (!trimmed) {
    errors.push(createError('name', 'Challenge name is required', 'NAME_REQUIRED'));
  }

  if (trimmed.length > CHALLENGE_CONSTANTS.MAX_CHALLENGE_NAME_LENGTH) {
    errors.push(
      createError(
        'name',
        `Challenge name must be ${CHALLENGE_CONSTANTS.MAX_CHALLENGE_NAME_LENGTH} characters or less`,
        'NAME_TOO_LONG'
      )
    );
  }

  // Prevent special characters that could break storage
  if (/[<>:"\/\\|?*\x00-\x1f]/.test(trimmed)) {
    errors.push(
      createError('name', 'Challenge name contains invalid characters', 'NAME_INVALID_CHARS')
    );
  }

  return errors.length > 0 ? failure(errors) : success(trimmed);
};

export const validateNotes = (notes: string | undefined): ValidationResult<string | undefined> => {
  if (!notes) return success(undefined);

  const trimmed = notes.trim();

  if (trimmed.length > CHALLENGE_CONSTANTS.MAX_NOTES_LENGTH) {
    return failure([
      createError(
        'notes',
        `Notes must be ${CHALLENGE_CONSTANTS.MAX_NOTES_LENGTH} characters or less`,
        'NOTES_TOO_LONG'
      ),
    ]);
  }

  return success(trimmed);
};

// ==================== Date Validators ====================

export const validateStartDate = (startDate: Date): ValidationResult<Date> => {
  const errors: ValidationError[] = [];
  const today = startOfDay(new Date());
  const start = startOfDay(startDate);

  // Check if date is valid
  if (isNaN(start.getTime())) {
    errors.push(createError('startDate', 'Invalid start date', 'START_DATE_INVALID'));
  }

  // Warn if starting more than 1 year in the past
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (isBefore(start, oneYearAgo)) {
    errors.push(
      createError(
        'startDate',
        'Start date is more than 1 year in the past',
        'START_DATE_TOO_OLD'
      )
    );
  }

  // Warn if starting more than 1 month in the future
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  if (isAfter(start, oneMonthFromNow)) {
    errors.push(
      createError(
        'startDate',
        'Start date is more than 1 month in the future',
        'START_DATE_TOO_FAR'
      )
    );
  }

  return errors.length > 0 ? failure(errors) : success(start);
};

export const validateDayNumber = (
  day: number,
  currentDay?: number
): ValidationResult<number> => {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(day)) {
    errors.push(createError('day', 'Day must be an integer', 'DAY_NOT_INTEGER'));
  }

  if (day < CHALLENGE_CONSTANTS.MIN_DAY) {
    errors.push(
      createError('day', `Day must be at least ${CHALLENGE_CONSTANTS.MIN_DAY}`, 'DAY_TOO_LOW')
    );
  }

  if (day > CHALLENGE_CONSTANTS.MAX_DAY) {
    errors.push(
      createError('day', `Day cannot exceed ${CHALLENGE_CONSTANTS.MAX_DAY}`, 'DAY_TOO_HIGH')
    );
  }

  // Can't log future days
  if (currentDay !== undefined && day > currentDay) {
    errors.push(
      createError(
        'day',
        `Cannot log day ${day} - current day is ${currentDay}`,
        'DAY_IN_FUTURE'
      )
    );
  }

  return errors.length > 0 ? failure(errors) : success(day);
};

export const validateEntryDate = (
  date: Date,
  challengeStartDate: Date,
  currentDay: number
): ValidationResult<Date> => {
  const errors: ValidationError[] = [];
  const entryDate = startOfDay(date);
  const startDate = startOfDay(challengeStartDate);

  if (isNaN(entryDate.getTime())) {
    errors.push(createError('date', 'Invalid entry date', 'DATE_INVALID'));
  }

  if (isBefore(entryDate, startDate)) {
    errors.push(
      createError('date', 'Entry date cannot be before challenge start date', 'DATE_BEFORE_START')
    );
  }

  const daysSinceStart = differenceInDays(entryDate, startDate) + 1;
  if (daysSinceStart > currentDay) {
    errors.push(
      createError('date', `Cannot log entry for future day (day ${daysSinceStart})`, 'DATE_IN_FUTURE')
    );
  }

  return errors.length > 0 ? failure(errors) : success(entryDate);
};

// ==================== Rule Validators ====================

export const validateRule = (
  rule: Omit<SeventyFiveHardRule, 'id'>
): ValidationResult<Omit<SeventyFiveHardRule, 'id'>> => {
  const errors: ValidationError[] = [];

  // Validate title
  const titleResult = validateChallengeName(rule.title);
  if (!titleResult.success) {
    errors.push(...titleResult.errors.map(e => ({ ...e, field: 'rule.title' })));
  }

  // Validate description
  if (!rule.description || rule.description.trim().length === 0) {
    errors.push(createError('rule.description', 'Rule description is required', 'DESCRIPTION_REQUIRED'));
  }

  if (rule.description && rule.description.length > 500) {
    errors.push(createError('rule.description', 'Description must be 500 characters or less', 'DESCRIPTION_TOO_LONG'));
  }

  // Validate daily target for multi-target rules
  if (rule.type === 'multi') {
    if (!Number.isInteger(rule.dailyTarget) || rule.dailyTarget < 2) {
      errors.push(
        createError('rule.dailyTarget', 'Multi-target rule must have dailyTarget >= 2', 'DAILY_TARGET_INVALID')
      );
    }

    if (rule.dailyTarget > CHALLENGE_CONSTANTS.MAX_SEGMENTS_PER_RULE) {
      errors.push(
        createError(
          'rule.dailyTarget',
          `Daily target cannot exceed ${CHALLENGE_CONSTANTS.MAX_SEGMENTS_PER_RULE}`,
          'DAILY_TARGET_TOO_HIGH'
        )
      );
    }

    // Validate segment labels if provided
    if (rule.segmentLabels) {
      if (rule.segmentLabels.length !== rule.dailyTarget) {
        errors.push(
          createError(
            'rule.segmentLabels',
            'Number of segment labels must match daily target',
            'SEGMENT_LABELS_MISMATCH'
          )
        );
      }

      rule.segmentLabels.forEach((label, index) => {
        if (label && label.length > 50) {
          errors.push(
            createError(
              `rule.segmentLabels[${index}]`,
              'Segment label must be 50 characters or less',
              'SEGMENT_LABEL_TOO_LONG'
            )
          );
        }
      });
    }
  }

  return errors.length > 0 ? failure(errors) : success(rule);
};

export const validateRules = (
  rules: Omit<SeventyFiveHardRule, 'id'>[]
): ValidationResult<Omit<SeventyFiveHardRule, 'id'>[]> => {
  const errors: ValidationError[] = [];

  if (rules.length === 0) {
    errors.push(createError('rules', 'At least one rule is required', 'RULES_REQUIRED'));
  }

  if (rules.length > CHALLENGE_CONSTANTS.MAX_RULES) {
    errors.push(
      createError(
        'rules',
        `Cannot have more than ${CHALLENGE_CONSTANTS.MAX_RULES} rules`,
        'TOO_MANY_RULES'
      )
    );
  }

  // Check for duplicate rule titles
  const titles = new Set<string>();
  rules.forEach((rule, index) => {
    const normalizedTitle = rule.title.trim().toLowerCase();
    if (titles.has(normalizedTitle)) {
      errors.push(
        createError(`rules[${index}].title`, `Duplicate rule title: "${rule.title}"`, 'DUPLICATE_RULE_TITLE')
      );
    }
    titles.add(normalizedTitle);
  });

  // Validate each rule
  rules.forEach((rule, index) => {
    const result = validateRule(rule);
    if (!result.success) {
      errors.push(...result.errors.map(e => ({ ...e, field: `rules[${index}].${e.field}` })));
    }
  });

  return errors.length > 0 ? failure(errors) : success(rules);
};

// ==================== Command Validators ====================

export const validateCreateChallengeCommand = (
  command: CreateChallengeCommand
): ValidationResult<CreateChallengeCommand> => {
  const errors: ValidationError[] = [];

  // Validate name
  const nameResult = validateChallengeName(command.name);
  if (!nameResult.success) {
    errors.push(...nameResult.errors);
  }

  // Validate start date
  const startDateResult = validateStartDate(command.startDate);
  if (!startDateResult.success) {
    errors.push(...startDateResult.errors);
  }

  // Validate rules
  const rulesResult = validateRules(command.rules);
  if (!rulesResult.success) {
    errors.push(...rulesResult.errors);
  }

  // Validate notes
  const notesResult = validateNotes(command.notes);
  if (!notesResult.success) {
    errors.push(...notesResult.errors);
  }

  return errors.length > 0 ? failure(errors) : success(command);
};

export const validateCompleteDayCommand = (
  command: CompleteDayCommand,
  challengeStartDate: Date,
  currentDay: number,
  rules: readonly SeventyFiveHardRule[]
): ValidationResult<CompleteDayCommand> => {
  const errors: ValidationError[] = [];

  // Validate date
  const dateResult = validateEntryDate(command.date, challengeStartDate, currentDay);
  if (!dateResult.success) {
    errors.push(...dateResult.errors);
  }

  // Validate rule completions match challenge rules
  const ruleIds = new Set(rules.map(r => r.id));
  const completionIds = new Set(command.ruleCompletions.map(rc => rc.ruleId));

  rules.forEach(rule => {
    if (!completionIds.has(rule.id)) {
      errors.push(
        createError(
          'ruleCompletions',
          `Missing completion for rule: ${rule.title}`,
          'MISSING_RULE_COMPLETION'
        )
      );
    }
  });

  command.ruleCompletions.forEach(completion => {
    if (!ruleIds.has(completion.ruleId)) {
      errors.push(
        createError(
          'ruleCompletions',
          `Unknown rule ID: ${completion.ruleId}`,
          'UNKNOWN_RULE_ID'
        )
      );
    }

    // Validate segments for multi-target rules
    const rule = rules.find(r => r.id === completion.ruleId);
    if (rule && rule.type === 'multi') {
      if (!completion.segments) {
        errors.push(
          createError(
            'ruleCompletions',
            `Rule "${rule.title}" requires segment completions`,
            'MISSING_SEGMENTS'
          )
        );
      } else if (completion.segments.length !== rule.dailyTarget) {
        errors.push(
          createError(
            'ruleCompletions',
            `Rule "${rule.title}" requires ${rule.dailyTarget} segments, got ${completion.segments.length}`,
            'SEGMENT_COUNT_MISMATCH'
          )
        );
      }
    }
  });

  // Validate weight if provided
  if (command.weight !== undefined) {
    if (command.weight <= 0 || command.weight > 1000) {
      errors.push(
        createError('weight', 'Weight must be between 0 and 1000', 'WEIGHT_INVALID')
      );
    }
  }

  // Validate measurements if provided
  if (command.measurements) {
    const measurementFields = ['chest', 'waist', 'hips', 'arms', 'thighs'] as const;
    measurementFields.forEach(field => {
      const value = command.measurements?.[field];
      if (value !== undefined && (value <= 0 || value > 500)) {
        errors.push(
          createError(`measurements.${field}`, `${field} must be between 0 and 500`, 'MEASUREMENT_INVALID')
        );
      }
    });
  }

  // Validate notes
  const notesResult = validateNotes(command.notes);
  if (!notesResult.success) {
    errors.push(...notesResult.errors);
  }

  // Validate photo if provided
  if (command.photo) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (command.photo.size > maxSize) {
      errors.push(
        createError('photo', 'Photo size must be less than 10MB', 'PHOTO_TOO_LARGE')
      );
    }

    if (!command.photo.type.startsWith('image/')) {
      errors.push(
        createError('photo', 'File must be an image', 'PHOTO_INVALID_TYPE')
      );
    }
  }

  return errors.length > 0 ? failure(errors) : success(command);
};

// ==================== Business Rule Validators ====================

/**
 * Validate that a challenge can be paused
 */
export const canPauseChallenge = (
  status: string,
  currentDay: number
): ValidationResult<void> => {
  const errors: ValidationError[] = [];

  if (status !== 'active') {
    errors.push(
      createError('status', 'Only active challenges can be paused', 'CANNOT_PAUSE_INACTIVE')
    );
  }

  if (currentDay >= CHALLENGE_CONSTANTS.MAX_DAY) {
    errors.push(
      createError('currentDay', 'Cannot pause a completed challenge', 'CANNOT_PAUSE_COMPLETED')
    );
  }

  return errors.length > 0 ? failure(errors) : success(undefined);
};

/**
 * Validate that a challenge can be resumed
 */
export const canResumeChallenge = (status: string): ValidationResult<void> => {
  if (status !== 'paused') {
    return failure([
      createError('status', 'Only paused challenges can be resumed', 'CANNOT_RESUME_NON_PAUSED'),
    ]);
  }

  return success(undefined);
};

/**
 * Validate that a day can be logged
 */
export const canLogDay = (
  status: string,
  dayNumber: number,
  currentDay: number
): ValidationResult<void> => {
  const errors: ValidationError[] = [];

  if (status !== 'active') {
    errors.push(
      createError('status', 'Can only log days for active challenges', 'CANNOT_LOG_INACTIVE')
    );
  }

  if (dayNumber > currentDay) {
    errors.push(
      createError('day', `Cannot log future day (current day is ${currentDay})`, 'CANNOT_LOG_FUTURE')
    );
  }

  return errors.length > 0 ? failure(errors) : success(undefined);
};
