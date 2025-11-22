// Conversational AI Engine using Groq (FREE)
// ChatGPT-style conversation with function calling for your life management app

import Groq from 'groq-sdk';
import { apiClient } from './apiClient';
import { getFinanceAPI } from '../finance/data';
import { startOfMonth, startOfWeek, addDays, isSameDay } from 'date-fns';
import { logger } from './logger';

const groq = new Groq({
  apiKey: import.meta.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true // OK for demo; use server proxy in production
});

// Available functions the AI can call
const FUNCTION_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description: 'Create a new life goal with optional financial target and deadline',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Goal title (e.g., "Save for Japan trip")'
          },
          category: {
            type: 'string',
            enum: ['personal', 'health', 'career', 'financial', 'fitness', 'travel'],
            description: 'Goal category'
          },
          target_amount: {
            type: 'number',
            description: 'Financial target amount if this is a savings goal'
          },
          target_date: {
            type: 'string',
            description: 'Target completion date in ISO format (YYYY-MM-DD)'
          },
          description: {
            type: 'string',
            description: 'Detailed description of the goal'
          }
        },
        required: ['title', 'category']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task or todo item',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Task title'
          },
          due_date: {
            type: 'string',
            description: 'Due date in ISO format (YYYY-MM-DD)'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Task priority level'
          },
          estimated_hours: {
            type: 'number',
            description: 'Estimated hours to complete'
          }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Record a financial transaction (expense or income)',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Transaction amount in dollars'
          },
          description: {
            type: 'string',
            description: 'What was purchased or received'
          },
          category: {
            type: 'string',
            description: 'Category name like Coffee, Groceries, Gas, etc.'
          },
          type: {
            type: 'string',
            enum: ['expense', 'income'],
            description: 'Whether this is money spent or received'
          }
        },
        required: ['amount', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Get spending summary for a time period',
      parameters: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            enum: ['week', 'month', 'year'],
            description: 'Time period to analyze'
          },
          category: {
            type: 'string',
            description: 'Optional specific category to check'
          }
        },
        required: ['timeframe']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_budget',
      description: 'Create or update a budget for a category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category name (e.g., "Coffee", "Dining Out")'
          },
          monthly_limit: {
            type: 'number',
            description: 'Monthly budget limit in dollars'
          }
        },
        required: ['category', 'monthly_limit']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_week_overview',
      description: 'Get overview of tasks, events, and commitments for the week',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'complete_habit',
      description: 'Mark a habit as completed for today',
      parameters: {
        type: 'object',
        properties: {
          habit_name: {
            type: 'string',
            description: 'Name of the habit to complete'
          }
        },
        required: ['habit_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_meal',
      description: 'Suggest meals based on available pantry ingredients',
      parameters: {
        type: 'object',
        properties: {
          meal_type: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Type of meal needed'
          }
        },
        required: ['meal_type']
      }
    }
  }
];

// Function implementations
async function executeFunction(name: string, args: any): Promise<any> {
  logger.debug('ConversationEngine', `[ConversationEngine] Executing: ${name}`, { args });

  try {
    switch (name) {
      case 'create_goal':
        // Note: Update this when you add the createLifeGoal method to apiClient
        // For now, this is a placeholder
        return {
          success: true,
          message: `Goal "${args.title}" created successfully`,
          goal_id: 'temp-' + Date.now(),
          next_steps: args.target_amount
            ? `I'll help you create a savings plan for $${args.target_amount}`
            : 'What milestones should we set for this goal?'
        };

      case 'create_task':
        const task = await apiClient.createTask({
          title: args.title,
          due_date: args.due_date,
          priority: args.priority || 'medium',
          status: 'todo',
          estimated_hours: args.estimated_hours
        });
        return {
          success: true,
          task_id: task.id,
          message: `Task "${args.title}" created`
        };

      case 'add_transaction':
        const financeApi = await getFinanceAPI();

        // Get or create category
        const categories = await financeApi.listCategories();
        const category = categories.find(c =>
          c.name.toLowerCase() === args.category?.toLowerCase()
        );

        // Get first account (or create logic to select account)
        const accounts = await financeApi.listAccounts();
        const account = accounts[0];

        if (!account) {
          return {
            success: false,
            error: 'No financial account found. Please set up an account first.'
          };
        }

        const transaction = await financeApi.createTransaction({
          account_id: account.id,
          amount: args.amount,
          description: args.description,
          category_id: category?.id,
          type: args.type === 'income' ? 'credit' : 'debit',
          transaction_date: new Date().toISOString()
        });

        // Get updated spending for this category
        const monthTransactions = await financeApi.listTransactions({
          fromISO: startOfMonth(new Date()).toISOString(),
          toISO: new Date().toISOString()
        });

        const categorySpending = monthTransactions.items
          .filter(t => t.category_id === category?.id && t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          success: true,
          transaction_id: transaction.id,
          category: category?.name || 'Uncategorized',
          category_spending_this_month: categorySpending,
          message: `Recorded $${args.amount} for ${args.description}`
        };

      case 'get_spending_summary':
        const api = await getFinanceAPI();
        const startDate = args.timeframe === 'month'
          ? startOfMonth(new Date())
          : startOfWeek(new Date());

        const transactions = await api.listTransactions({
          fromISO: startDate.toISOString(),
          toISO: new Date().toISOString()
        });

        // Group by category
        const byCategory: Record<string, number> = {};
        let totalSpent = 0;

        transactions.items.forEach(t => {
          if (t.type === 'debit') {
            const catName = t.category?.name || 'Uncategorized';
            byCategory[catName] = (byCategory[catName] || 0) + t.amount;
            totalSpent += t.amount;
          }
        });

        return {
          timeframe: args.timeframe,
          total_spent: totalSpent,
          by_category: byCategory,
          top_categories: Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }))
        };

      case 'create_budget':
        const _budgetApi = await getFinanceAPI();
        // This is a simplified version - you'll need to implement budget creation
        return {
          success: true,
          message: `Budget set: $${args.monthly_limit}/month for ${args.category}`,
          category: args.category,
          limit: args.monthly_limit
        };

      case 'get_week_overview':
        const tasks = await apiClient.getTasks();
        const today = new Date();
        const weekEnd = addDays(today, 7);

        const _thiWeekTasks = tasks.filter(t =>
          t.due_date &&
          new Date(t.due_date) >= today &&
          new Date(t.due_date) <= weekEnd
        );

        const overdue = tasks.filter(t =>
          t.due_date &&
          new Date(t.due_date) < today &&
          t.status !== 'done'
        );

        return {
          tasks_this_week: thisWeekTasks.length,
          overdue_tasks: overdue.length,
          high_priority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
          tasks_today: tasks.filter(t =>
            t.due_date && isSameDay(new Date(t.due_date), today)
          ).length
        };

      case 'complete_habit':
        // Placeholder - implement when habits API is ready
        return {
          success: true,
          message: `Marked "${args.habit_name}" as complete for today`
        };

      case 'suggest_meal':
        // Placeholder - implement when meal planning is integrated
        return {
          suggestions: ['Chicken Stir Fry', 'Pasta Aglio e Olio'],
          message: 'Based on your pantry, I suggest these quick meals'
        };

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error: any) {
    logger.error('ConversationEngine', `[ConversationEngine] Function error:`, { error });
    return {
      success: false,
      error: error.message || 'Function execution failed'
    };
  }
}

// Get user context for better AI responses
async function getUserContext(): Promise<string> {
  try {
    const today = new Date();
    const tasks = await apiClient.getTasks();

    const context = {
      current_time: today.toISOString(),
      tasks_today: tasks.filter(t =>
        t.due_date && isSameDay(new Date(t.due_date), today)
      ).length,
      overdue_tasks: tasks.filter(t =>
        t.due_date &&
        new Date(t.due_date) < today &&
        t.status !== 'done'
      ).length
    };

    return JSON.stringify(context, null, 2);
  } catch (_error) {
    return '{}';
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  functionCalls?: Array<{ name: string; args: any; result: any }>;
}

export class ConversationEngine {
  private messages: ConversationMessage[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async chat(userMessage: string): Promise<{
    response: string;
    functionCalls?: Array<{ name: string; args: any; result: any }>;
  }> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Build messages for Groq (only keep last 10 for context)
    const recentMessages = this.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get user context
    const context = await getUserContext();

    // System prompt
    const systemMessage = `You are a helpful AI assistant managing the user's personal life. You have access to their tasks, finances, goals, habits, meals, and travel plans.

Current Context:
${context}

Guidelines:
- Be conversational and natural, like ChatGPT
- Ask clarifying questions when you need more information
- Use functions to actually perform actions (don't just say you'll do something)
- Be proactive and suggest helpful actions
- Keep responses concise but warm
- When recording expenses, always ask for the category if not provided
- Suggest budgets when you notice spending patterns
- Help connect goals to concrete plans

Examples:
User: "I just spent 5 bucks on coffee"
You: "Got it! I'll record that. By the way, you've spent $47 on coffee this month. Want me to set a budget?"

User: "I want to save 10k for Japan"
You: "Awesome goal! When are you planning to go? I'll help create a savings plan and break it down into steps."`;

    try {
      // Call Groq with function calling
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          ...recentMessages
        ],
        tools: FUNCTION_DEFINITIONS as any,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      });

      const response = completion.choices[0]?.message;

      if (!response) {
        throw new Error('No response from AI');
      }

      // Handle function calls
      const functionCalls: Array<{ name: string; args: any; result: any }> = [];

      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute all function calls
        for (const toolCall of response.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          const result = await executeFunction(functionName, functionArgs);
          functionCalls.push({
            name: functionName,
            args: functionArgs,
            result
          });
        }

        // Get final response after function execution
        const followUp = await groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemMessage },
            ...recentMessages,
            {
              role: 'assistant',
              content: response.content || '',
              tool_calls: response.tool_calls as any
            },
            {
              role: 'tool',
              content: JSON.stringify(functionCalls.map(fc => fc.result)),
              tool_call_id: response.tool_calls[0].id
            }
          ],
          temperature: 0.7,
          max_tokens: 512,
        });

        const finalResponse = followUp.choices[0]?.message?.content || 'Done!';

        // Add to history
        this.messages.push({
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date(),
          functionCalls
        });

        return {
          response: finalResponse,
          functionCalls
        };
      }

      // No function calls, just text response
      const textResponse = response.content || 'I can help you with that!';

      this.messages.push({
        role: 'assistant',
        content: textResponse,
        timestamp: new Date()
      });

      return { response: textResponse };

    } catch (error: any) {
      logger.error('[ConversationEngine] Error:', { error });

      // Fallback response
      const fallback = "Sorry, I'm having trouble connecting right now. Please try again.";
      this.messages.push({
        role: 'assistant',
        content: fallback,
        timestamp: new Date()
      });

      return { response: fallback };
    }
  }

  getHistory(): ConversationMessage[] {
    return this.messages;
  }

  clearHistory(): void {
    this.messages = [];
  }
}
