/**
 * Notes AI Tools
 *
 * AI tools for notes management (create, search, update, delete, get by tag)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createNote, getNotes, updateNote, deleteNote } from '@/api/notesAPI';
import { logger } from '@/services/logger';
import type { Note } from '@/types';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_note',
    description: 'Create a new note. Requires content (string). Optional: title (string), tags (array of strings), category (string).',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Note content - required'
        },
        title: {
          type: 'string',
          description: 'Note title - optional'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags (e.g., ["work", "important"]) - optional'
        },
        category: {
          type: 'string',
          description: 'Category like "personal", "work", "ideas" - optional'
        }
      },
      required: ['content']
    }
  }
};

const searchNotesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_notes',
    description: 'Search and filter notes. Returns notes matching search criteria. Optional: searchQuery (string to search in title/content), tags (array of strings), category (string).',
    parameters: {
      type: 'object',
      properties: {
        searchQuery: {
          type: 'string',
          description: 'Search query to match in title or content - optional'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags - optional'
        },
        category: {
          type: 'string',
          description: 'Filter by category - optional'
        }
      }
    }
  }
};

const updateNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_note',
    description: 'Update an existing note. Requires note_id (string). Optional: title, content, tags (array), category.',
    parameters: {
      type: 'object',
      properties: {
        note_id: {
          type: 'string',
          description: 'ID of the note to update - required'
        },
        title: {
          type: 'string',
          description: 'Updated title - optional'
        },
        content: {
          type: 'string',
          description: 'Updated content - optional'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated tags - optional'
        },
        category: {
          type: 'string',
          description: 'Updated category - optional'
        }
      },
      required: ['note_id']
    }
  }
};

const deleteNoteDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'delete_note',
    description: 'Delete a note. Requires note_id (string).',
    parameters: {
      type: 'object',
      properties: {
        note_id: {
          type: 'string',
          description: 'ID of the note to delete - required'
        }
      },
      required: ['note_id']
    }
  }
};

const getNotesByTagDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_notes_by_tag',
    description: 'Get all notes that have specific tags. Requires tags (array of strings). Returns notes containing any of the specified tags.',
    parameters: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags to filter by - required'
        }
      },
      required: ['tags']
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format note for response
 */
function formatNote(note: Note) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags,
    category: note.category,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString()
  };
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Create a new note
 */
async function executeCreateNote(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const content = args.content as string;
    const title = args.title as string | undefined;
    const tags = args.tags as string[] | undefined;
    const category = args.category as string | undefined;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Note content is required'
      };
    }

    logger.info('NoteTools', 'Creating note', {
      hasTitle: !!title,
      tagsCount: tags?.length ?? 0,
      category
    });

    const note = await createNote({
      content: content.trim(),
      title: title?.trim(),
      tags: tags ?? [],
      category
    });

    logger.info('NoteTools', 'Note created successfully', {
      noteId: note.id
    });

    return {
      success: true,
      note_id: note.id,
      message: `Note created successfully${title ? `: "${title}"` : ''}`,
      note: formatNote(note)
    };
  } catch (error) {
    logger.error('NoteTools', error as Error, {
      operation: 'create_note',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note'
    };
  }
}

/**
 * Search notes
 */
async function executeSearchNotes(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const searchQuery = args.searchQuery as string | undefined;
    const tags = args.tags as string[] | undefined;
    const category = args.category as string | undefined;

    logger.info('NoteTools', 'Searching notes', {
      hasSearchQuery: !!searchQuery,
      tagsCount: tags?.length ?? 0,
      category
    });

    const notes = await getNotes({
      searchQuery,
      tags,
      category
    });

    logger.info('NoteTools', 'Notes retrieved', {
      count: notes.length
    });

    return {
      success: true,
      notes: notes.map(formatNote),
      count: notes.length,
      message: `Found ${notes.length} note${notes.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('NoteTools', error as Error, {
      operation: 'search_notes',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search notes'
    };
  }
}

/**
 * Update a note
 */
async function executeUpdateNote(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const noteId = args.note_id as string;
    const title = args.title as string | undefined;
    const content = args.content as string | undefined;
    const tags = args.tags as string[] | undefined;
    const category = args.category as string | undefined;

    // Validate required fields
    if (!noteId || noteId.trim().length === 0) {
      return {
        success: false,
        error: 'Note ID is required'
      };
    }

    logger.info('NoteTools', 'Updating note', {
      noteId,
      hasTitle: title !== undefined,
      hasContent: content !== undefined,
      hasTags: tags !== undefined,
      hasCategory: category !== undefined
    });

    // Build updates object
    const updates: {
      title?: string;
      content?: string;
      tags?: string[];
      category?: string;
    } = {};

    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (tags !== undefined) updates.tags = tags;
    if (category !== undefined) updates.category = category;

    const note = await updateNote(noteId, updates);

    logger.info('NoteTools', 'Note updated successfully', {
      noteId: note.id
    });

    return {
      success: true,
      message: 'Note updated successfully',
      note: formatNote(note)
    };
  } catch (error) {
    logger.error('NoteTools', error as Error, {
      operation: 'update_note',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note'
    };
  }
}

/**
 * Delete a note
 */
async function executeDeleteNote(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const noteId = args.note_id as string;

    // Validate required fields
    if (!noteId || noteId.trim().length === 0) {
      return {
        success: false,
        error: 'Note ID is required'
      };
    }

    logger.info('NoteTools', 'Deleting note', {
      noteId
    });

    await deleteNote(noteId);

    logger.info('NoteTools', 'Note deleted successfully', {
      noteId
    });

    return {
      success: true,
      message: 'Note deleted successfully'
    };
  } catch (error) {
    logger.error('NoteTools', error as Error, {
      operation: 'delete_note',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note'
    };
  }
}

/**
 * Get notes by tag
 */
async function executeGetNotesByTag(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const tags = args.tags as string[];

    // Validate required fields
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return {
        success: false,
        error: 'At least one tag is required'
      };
    }

    logger.info('NoteTools', 'Getting notes by tags', {
      tags
    });

    const notes = await getNotes({ tags });

    logger.info('NoteTools', 'Notes retrieved by tags', {
      count: notes.length,
      tags
    });

    return {
      success: true,
      notes: notes.map(formatNote),
      count: notes.length,
      tags,
      message: `Found ${notes.length} note${notes.length !== 1 ? 's' : ''} with tags: ${tags.join(', ')}`
    };
  } catch (error) {
    logger.error('NoteTools', error as Error, {
      operation: 'get_notes_by_tag',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes by tag'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const notesTools: Tool[] = [
  {
    definition: createNoteDefinition,
    execute: executeCreateNote
  },
  {
    definition: searchNotesDefinition,
    execute: executeSearchNotes
  },
  {
    definition: updateNoteDefinition,
    execute: executeUpdateNote
  },
  {
    definition: deleteNoteDefinition,
    execute: executeDeleteNote
  },
  {
    definition: getNotesByTagDefinition,
    execute: executeGetNotesByTag
  }
];
