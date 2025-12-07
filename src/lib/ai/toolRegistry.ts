/**
 * Tool Registry for AI Assistant
 *
 * Manages registration and execution of AI tools (functions that the LLM can call).
 * Each feature should register its own tools with this registry.
 */

import { logger } from '@/services/logger';

/**
 * Tool parameter definition matching Groq's function calling schema
 */
export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

/**
 * Tool definition matching Groq's function calling format
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

/**
 * Tool execution function
 * @param args - Arguments parsed from LLM function call
 * @param userId - Current user ID for data operations
 * @returns Result object to be sent back to LLM
 */
export type ToolExecuteFn = (args: Record<string, unknown>, userId: string) => Promise<ToolResult>;

/**
 * Result from tool execution
 */
export interface ToolResult {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Internal tool representation combining definition and execution
 */
export interface Tool {
  definition: ToolDefinition;
  execute: ToolExecuteFn;
}

/**
 * Tool Registry Class
 *
 * Central registry for all AI tools. Features register their tools here,
 * and the conversation engine retrieves them for LLM function calling.
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register one or more tools
   * @param tools - Array of tools to register
   */
  register(tools: Tool[]): void {
    tools.forEach(tool => {
      const toolName = tool.definition.function.name;

      if (this.tools.has(toolName)) {
        logger.warn('ToolRegistry', `Tool "${toolName}" already registered, overwriting`, {
          toolName
        });
      }

      this.tools.set(toolName, tool);
      logger.debug('ToolRegistry', `Registered tool: ${toolName}`, {
        toolName,
        description: tool.definition.function.description
      });
    });

    logger.info('ToolRegistry', `Registered ${tools.length} tool(s)`, {
      count: tools.length,
      totalTools: this.tools.size
    });
  }

  /**
   * Get a specific tool by name
   * @param name - Tool name
   * @returns Tool or undefined if not found
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool definitions for LLM (Groq format)
   * @returns Array of tool definitions ready for Groq API
   */
  getDefinitions(): ToolDefinition[] {
    return this.getAll().map(tool => tool.definition);
  }

  /**
   * Get tool names for logging/debugging
   * @returns Array of registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a tool by name
   * @param name - Tool name
   * @param args - Arguments from LLM
   * @param userId - Current user ID
   * @returns Tool execution result
   */
  async execute(name: string, args: Record<string, unknown>, userId: string): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      const error = `Tool not found: ${name}`;
      logger.error('ToolRegistry', new Error(error), {
        toolName: name,
        availableTools: this.getToolNames()
      });
      return {
        success: false,
        error
      };
    }

    logger.info('ToolRegistry', `Executing tool: ${name}`, {
      toolName: name,
      userId,
      args
    });

    const startTime = Date.now();

    try {
      const result = await tool.execute(args, userId);
      const duration = Date.now() - startTime;

      logger.info('ToolRegistry', `Tool execution successful: ${name}`, {
        toolName: name,
        userId,
        duration,
        success: result.success ?? true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('ToolRegistry', error as Error, {
        toolName: name,
        userId,
        duration,
        args
      });

      // Return user-friendly error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  /**
   * Check if a tool is registered
   * @param name - Tool name
   * @returns True if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get count of registered tools
   * @returns Number of tools
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Clear all registered tools (useful for testing)
   */
  clear(): void {
    const previousCount = this.tools.size;
    this.tools.clear();
    logger.debug('ToolRegistry', `Cleared all tools`, {
      previousCount
    });
  }

  /**
   * Unregister a specific tool
   * @param name - Tool name to remove
   * @returns True if tool was removed
   */
  unregister(name: string): boolean {
    const existed = this.tools.delete(name);
    if (existed) {
      logger.debug('ToolRegistry', `Unregistered tool: ${name}`, { toolName: name });
    }
    return existed;
  }

  /**
   * Get summary information about registered tools
   * @returns Summary object with tool counts by feature
   */
  getSummary(): { total: number; byFeature: Record<string, number> } {
    const byFeature: Record<string, number> = {};

    this.tools.forEach((_, name) => {
      // Extract feature from tool name (e.g., "create_task" -> "task")
      const parts = name.split('_');
      const feature = parts.length > 1 ? parts[parts.length - 1] : 'other';
      byFeature[feature] = (byFeature[feature] ?? 0) + 1;
    });

    return {
      total: this.tools.size,
      byFeature
    };
  }
}

/**
 * Singleton instance of ToolRegistry
 * Import this in features to register tools and in conversation engine to use tools
 */
export const toolRegistry = new ToolRegistry();
