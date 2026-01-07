import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolRegistry } from '../toolRegistry';
import type { Tool, ToolDefinition, ToolResult } from '../toolRegistry';

describe('ToolRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    toolRegistry.clear();
  });

  describe('register', () => {
    it('should register a single tool', () => {
      const testTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'A test tool',
            parameters: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'Test parameter' }
              },
              required: ['param1']
            }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([testTool]);

      expect(toolRegistry.count()).toBe(1);
      expect(toolRegistry.has('test_tool')).toBe(true);
      expect(toolRegistry.get('test_tool')).toBeDefined();
    });

    it('should register multiple tools', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_one',
            description: 'First tool',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_two',
            description: 'Second tool',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1, tool2]);

      expect(toolRegistry.count()).toBe(2);
      expect(toolRegistry.has('tool_one')).toBe(true);
      expect(toolRegistry.has('tool_two')).toBe(true);
    });

    it('should overwrite tool with same name', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'duplicate_tool',
            description: 'First version',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true, version: 1 })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'duplicate_tool',
            description: 'Second version',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true, version: 2 })
      };

      toolRegistry.register([tool1]);
      toolRegistry.register([tool2]);

      expect(toolRegistry.count()).toBe(1);
      const tool = toolRegistry.get('duplicate_tool');
      expect(tool?.definition.function.description).toBe('Second version');
    });
  });

  describe('get', () => {
    it('should return tool by name', () => {
      const testTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'Test',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([testTool]);

      const retrieved = toolRegistry.get('test_tool');
      expect(retrieved).toBeDefined();
      expect(retrieved?.definition.function.name).toBe('test_tool');
    });

    it('should return undefined for unknown tool', () => {
      const retrieved = toolRegistry.get('unknown_tool');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no tools registered', () => {
      const tools = toolRegistry.getAll();
      expect(tools).toEqual([]);
    });

    it('should return all registered tools', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_one',
            description: 'First',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_two',
            description: 'Second',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1, tool2]);

      const tools = toolRegistry.getAll();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.definition.function.name)).toContain('tool_one');
      expect(tools.map(t => t.definition.function.name)).toContain('tool_two');
    });
  });

  describe('getDefinitions', () => {
    it('should return tool definitions in Groq format', () => {
      const testTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'Test tool',
            parameters: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'Test param' }
              },
              required: ['param1']
            }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([testTool]);

      const definitions = toolRegistry.getDefinitions();
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual(testTool.definition);
      expect(definitions[0].type).toBe('function');
      expect(definitions[0].function.name).toBe('test_tool');
    });
  });

  describe('getToolNames', () => {
    it('should return array of tool names', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'create_task',
            description: 'Create task',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'get_tasks',
            description: 'Get tasks',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1, tool2]);

      const names = toolRegistry.getToolNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('create_task');
      expect(names).toContain('get_tasks');
    });
  });

  describe('execute', () => {
    it('should execute tool and return result', async () => {
      const testTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'Test',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async (args, userId) => ({
          success: true,
          message: 'Executed successfully',
          userId,
          receivedArgs: args
        })
      };

      toolRegistry.register([testTool]);

      const result = await toolRegistry.execute('test_tool', { param1: 'value1' }, 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Executed successfully');
      expect(result.userId).toBe('user-123');
      expect(result.receivedArgs).toEqual({ param1: 'value1' });
    });

    it('should return error for unknown tool', async () => {
      const result = await toolRegistry.execute('unknown_tool', {}, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    it('should handle tool execution errors gracefully', async () => {
      const errorTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'error_tool',
            description: 'Tool that throws',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => {
          throw new Error('Tool execution failed');
        }
      };

      toolRegistry.register([errorTool]);

      const result = await toolRegistry.execute('error_tool', {}, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool execution failed');
    });

    it('should handle non-Error exceptions', async () => {
      const errorTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'error_tool',
            description: 'Tool that throws non-Error',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => {
          throw 'String error'; // eslint-disable-line @typescript-eslint/only-throw-error
        }
      };

      toolRegistry.register([errorTool]);

      const result = await toolRegistry.execute('error_tool', {}, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool execution failed');
    });
  });

  describe('has', () => {
    it('should return true for registered tool', () => {
      const testTool: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'Test',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([testTool]);

      expect(toolRegistry.has('test_tool')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      expect(toolRegistry.has('unknown_tool')).toBe(false);
    });
  });

  describe('count', () => {
    it('should return 0 when no tools registered', () => {
      expect(toolRegistry.count()).toBe(0);
    });

    it('should return correct count', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_one',
            description: 'First',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_two',
            description: 'Second',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1]);
      expect(toolRegistry.count()).toBe(1);

      toolRegistry.register([tool2]);
      expect(toolRegistry.count()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all tools', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_one',
            description: 'First',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1]);
      expect(toolRegistry.count()).toBe(1);

      toolRegistry.clear();
      expect(toolRegistry.count()).toBe(0);
      expect(toolRegistry.has('tool_one')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove specific tool', () => {
      const tool1: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_one',
            description: 'First',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        definition: {
          type: 'function',
          function: {
            name: 'tool_two',
            description: 'Second',
            parameters: { type: 'object', properties: {} }
          }
        },
        execute: async () => ({ success: true })
      };

      toolRegistry.register([tool1, tool2]);
      expect(toolRegistry.count()).toBe(2);

      const removed = toolRegistry.unregister('tool_one');
      expect(removed).toBe(true);
      expect(toolRegistry.count()).toBe(1);
      expect(toolRegistry.has('tool_one')).toBe(false);
      expect(toolRegistry.has('tool_two')).toBe(true);
    });

    it('should return false when removing non-existent tool', () => {
      const removed = toolRegistry.unregister('unknown_tool');
      expect(removed).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return summary with zero tools', () => {
      const summary = toolRegistry.getSummary();
      expect(summary.total).toBe(0);
      expect(summary.byFeature).toEqual({});
    });

    it('should return summary grouped by feature', () => {
      const tools: Tool[] = [
        {
          definition: {
            type: 'function',
            function: {
              name: 'create_task',
              description: 'Create task',
              parameters: { type: 'object', properties: {} }
            }
          },
          execute: async () => ({ success: true })
        },
        {
          definition: {
            type: 'function',
            function: {
              name: 'get_task',
              description: 'Get task',
              parameters: { type: 'object', properties: {} }
            }
          },
          execute: async () => ({ success: true })
        },
        {
          definition: {
            type: 'function',
            function: {
              name: 'add_transaction',
              description: 'Add transaction',
              parameters: { type: 'object', properties: {} }
            }
          },
          execute: async () => ({ success: true })
        }
      ];

      toolRegistry.register(tools);

      const summary = toolRegistry.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.byFeature.task).toBe(2);
      expect(summary.byFeature.transaction).toBe(1);
    });
  });
});
