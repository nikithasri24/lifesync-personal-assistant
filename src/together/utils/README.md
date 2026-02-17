# Together Utilities - Validation & Sanitization

This directory contains utility functions for the Together feature, focusing on input validation and XSS prevention.

---

## 📁 Files

- **`validation.ts`** - Input validation, XSS sanitization, and file upload validation

---

## 🔒 Security Functions

### XSS Sanitization

#### `sanitizeMessageBody(content: string): string`

Sanitizes HTML content to prevent XSS attacks while preserving safe formatting.

**Allowed Tags:** `p`, `br`, `strong`, `em`, `u`, `h1-h6`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `a`

**Allowed Attributes:** `href`, `title`, `target` (only on `<a>` tags)

**Usage:**
```typescript
import { sanitizeMessageBody } from '@/together/utils/validation';

const userInput = '<script>alert("xss")</script><p>Hello!</p>';
const safe = sanitizeMessageBody(userInput);
// Result: '<p>Hello!</p>'
```

**Use Cases:**
- Partner message bodies
- Challenge descriptions
- Milestone notes
- Any user-generated HTML content

---

## 📤 File Upload Validation

### Image Files

#### `validateImageFile(file: File): FileValidationResult`

Validates image file uploads.

**Constraints:**
- **Max Size:** 5 MB
- **Allowed Types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`
- **Sanitized Filename:** Removes unsafe characters

**Usage:**
```typescript
import { validateImageFile } from '@/together/utils/validation';

const validation = validateImageFile(imageFile);

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}

// Use validation.sanitizedName for upload
const uploadName = validation.sanitizedName;
```

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}
```

---

### Video Files

#### `validateVideoFile(file: File): FileValidationResult`

Validates video file uploads.

**Constraints:**
- **Max Size:** 50 MB
- **Allowed Types:** `video/mp4`, `video/webm`, `video/quicktime`, `video/x-m4v`
- **Sanitized Filename:** Removes unsafe characters

**Usage:**
```typescript
import { validateVideoFile } from '@/together/utils/validation';

const validation = validateVideoFile(videoFile);

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}
```

---

### Audio Files

#### `validateAudioFile(file: File): FileValidationResult`

Validates audio file uploads.

**Constraints:**
- **Max Size:** 10 MB
- **Allowed Types:** `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/webm`, `audio/ogg`
- **Sanitized Filename:** Removes unsafe characters

**Usage:**
```typescript
import { validateAudioFile } from '@/together/utils/validation';

const validation = validateAudioFile(audioFile);

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}
```

---

## ✅ Form Validation

### Partner Message Form

#### `validatePartnerMessageForm(data: Partial<CreatePartnerMessageRequest>): ValidationResult`

Validates partner message form data.

**Validations:**
- ✅ Title required and <= 100 characters
- ✅ Message body required and <= 10,000 characters
- ✅ Valid reveal trigger
- ✅ Reveal date required if trigger is `specific_date`
- ✅ Reveal date must be in the future

**Usage:**
```typescript
import { validatePartnerMessageForm } from '@/together/utils/validation';

const validation = validatePartnerMessageForm({
  title,
  message_body: messageBody,
  reveal_trigger: revealTrigger,
  reveal_date: revealDate,
});

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}

// Safe to proceed with form submission
```

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

---

### Milestone Form

#### `validateMilestoneForm(data: Partial<CreateMilestoneRequest>): ValidationResult`

Validates milestone form data.

**Validations:**
- ✅ Title required and <= 100 characters
- ✅ Valid milestone type
- ✅ Valid date format (YYYY-MM-DD)
- ✅ Valid for_whom value

**Usage:**
```typescript
import { validateMilestoneForm } from '@/together/utils/validation';

const validation = validateMilestoneForm({
  title,
  milestone_type: milestoneType,
  milestone_date: dateString,
  for_whom: forWhom,
});

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}
```

---

### Challenge Form

#### `validateChallengeForm(data: Partial<CreateAchievementRewardRequest>): ValidationResult`

Validates challenge form data.

**Validations:**
- ✅ Title required and <= 100 characters
- ✅ Description <= 500 characters
- ✅ Target value > 0
- ✅ Valid reward type
- ✅ Expiration date in the future (if provided)

**Usage:**
```typescript
import { validateChallengeForm } from '@/together/utils/validation';

const validation = validateChallengeForm({
  title,
  description,
  target_value: targetValue,
  reward_type: rewardType,
  expiration_date: expirationDate,
});

if (!validation.valid) {
  toast(validation.error, 'error');
  return;
}
```

---

## 🛡️ URL Validation

#### `validateURL(url: string): boolean`

Validates URLs to prevent `javascript:` protocol attacks.

**Allowed Protocols:** `http:`, `https:`

**Usage:**
```typescript
import { validateURL } from '@/together/utils/validation';

const userURL = 'javascript:alert("xss")';

if (!validateURL(userURL)) {
  toast('Invalid URL', 'error');
  return;
}
```

---

## 📋 Complete Example: Message Composition

```typescript
import {
  validatePartnerMessageForm,
  sanitizeMessageBody,
  validateImageFile,
} from '@/together/utils/validation';

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // 1. Validate form data
  const validation = validatePartnerMessageForm({
    title,
    message_body: messageBody,
    reveal_trigger: revealTrigger,
    reveal_date: revealDate,
  });

  if (!validation.valid) {
    toast(validation.error, 'error');
    return;
  }

  // 2. Sanitize message body
  const sanitizedBody = sanitizeMessageBody(messageBody);

  // 3. Validate image uploads (if any)
  if (imageFile) {
    const imageValidation = validateImageFile(imageFile);
    if (!imageValidation.valid) {
      toast(imageValidation.error, 'error');
      return;
    }
  }

  // 4. Submit to API
  createMessage({
    title: title.trim(),
    message_body: sanitizedBody,
    reveal_trigger: revealTrigger,
    reveal_date: revealDate,
    // ... other fields
  });
};
```

---

## 🔍 Testing

All validation functions are designed to be unit-testable:

```typescript
import { validatePartnerMessageForm } from './validation';

describe('validatePartnerMessageForm', () => {
  it('should require title', () => {
    const result = validatePartnerMessageForm({
      title: '',
      message_body: 'Hello',
      reveal_trigger: 'manual',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Title is required');
  });

  it('should validate future dates', () => {
    const pastDate = '2020-01-01T00:00:00';
    const result = validatePartnerMessageForm({
      title: 'Test',
      message_body: 'Hello',
      reveal_trigger: 'specific_date',
      reveal_date: pastDate,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be in the future');
  });
});
```

---

## 📚 Dependencies

- **`isomorphic-dompurify`** - XSS sanitization library
  - Install: `npm install isomorphic-dompurify`
  - Used by: `sanitizeMessageBody()`

---

## 🎯 Best Practices

1. **Always validate before sanitize**: Check data structure first, then clean it
2. **Use validation at form boundaries**: Component level, not in hooks
3. **Sanitize on input AND output**: Defense in depth
4. **Log validation failures**: Help debug user issues
5. **Provide clear error messages**: User-friendly, actionable feedback

---

## 🔗 Related

- **Type Guards**: `/src/together/types/guards.ts` - Runtime type validation
- **Error Handling**: `/src/lib/errors.ts` - Custom error classes
- **Toast Notifications**: `/src/hooks/useToast.ts` - User feedback
