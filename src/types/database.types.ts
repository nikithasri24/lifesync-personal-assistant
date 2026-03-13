export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          rarity: string
          requirement_target: number
          requirement_type: string
          sort_order: number
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          rarity: string
          requirement_target: number
          requirement_type: string
          sort_order?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          rarity?: string
          requirement_target?: number
          requirement_type?: string
          sort_order?: number
          xp_reward?: number
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          avg_session_length: number | null
          category_breakdown: Json | null
          created_at: string | null
          date: string
          energy_avg: number | null
          focus_minutes: number | null
          focus_sessions: number | null
          habit_completion_rate: number | null
          habits_completed: number | null
          habits_due: number | null
          hourly_activity: Json | null
          id: string
          income_total: number | null
          journal_entries: number | null
          mood_avg: number | null
          productivity_score: number | null
          spending_total: number | null
          streaks_at_risk: number | null
          tasks_completed: number | null
          tasks_created: number | null
          tasks_overdue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_session_length?: number | null
          category_breakdown?: Json | null
          created_at?: string | null
          date: string
          energy_avg?: number | null
          focus_minutes?: number | null
          focus_sessions?: number | null
          habit_completion_rate?: number | null
          habits_completed?: number | null
          habits_due?: number | null
          hourly_activity?: Json | null
          id?: string
          income_total?: number | null
          journal_entries?: number | null
          mood_avg?: number | null
          productivity_score?: number | null
          spending_total?: number | null
          streaks_at_risk?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_overdue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_session_length?: number | null
          category_breakdown?: Json | null
          created_at?: string | null
          date?: string
          energy_avg?: number | null
          focus_minutes?: number | null
          focus_sessions?: number | null
          habit_completion_rate?: number | null
          habits_completed?: number | null
          habits_due?: number | null
          hourly_activity?: Json | null
          id?: string
          income_total?: number | null
          journal_entries?: number | null
          mood_avg?: number | null
          productivity_score?: number | null
          spending_total?: number | null
          streaks_at_risk?: number | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_overdue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      automation_log: {
        Row: {
          actions_executed: Json | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          rule_id: string
          success: boolean | null
          trigger_reason: string | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          actions_executed?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          rule_id: string
          success?: boolean | null
          trigger_reason?: string | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          actions_executed?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          rule_id?: string
          success?: boolean | null
          trigger_reason?: string | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          consecutive_failures: number | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_error: string | null
          last_triggered_at: string | null
          max_consecutive_failures: number | null
          name: string
          trigger_config: Json
          trigger_count: number | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          consecutive_failures?: number | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_error?: string | null
          last_triggered_at?: string | null
          max_consecutive_failures?: number | null
          name: string
          trigger_config: Json
          trigger_count?: number | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          consecutive_failures?: number | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_error?: string | null
          last_triggered_at?: string | null
          max_consecutive_failures?: number | null
          name?: string
          trigger_config?: Json
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          amount_paid: number
          bill_id: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          bill_id: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          bill_id?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "recurring_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          category_id: string
          created_at: string | null
          default_amount: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          default_amount: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          default_amount?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          id: string
          limit_amount: number
          month: string
          user_id: string
        }
        Insert: {
          category_id: string
          id?: string
          limit_amount: number
          month: string
          user_id: string
        }
        Update: {
          category_id?: string
          id?: string
          limit_amount?: number
          month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: string[] | null
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string
          end_time: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          project_id: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          start_date: string
          start_time: string | null
          task_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          attendees?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_date: string
          start_time?: string | null
          task_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          attendees?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_date?: string
          start_time?: string | null
          task_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      card_benefits: {
        Row: {
          account_id: string
          active: boolean
          benefit_type: string
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          name: string
          reset_date: string | null
          updated_at: string
          used_amount: number | null
          user_id: string
          value: number | null
        }
        Insert: {
          account_id: string
          active?: boolean
          benefit_type: string
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name: string
          reset_date?: string | null
          updated_at?: string
          used_amount?: number | null
          user_id: string
          value?: number | null
        }
        Update: {
          account_id?: string
          active?: boolean
          benefit_type?: string
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name?: string
          reset_date?: string | null
          updated_at?: string
          used_amount?: number | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      card_category_bonuses: {
        Row: {
          account_id: string
          category: string
          created_at: string
          end_date: string | null
          id: string
          is_rotating: boolean | null
          rewards_rate: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          category: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_rotating?: boolean | null
          rewards_rate: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          category?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_rotating?: boolean | null
          rewards_rate?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      card_offers: {
        Row: {
          account_id: string
          activated: boolean | null
          activated_date: string | null
          created_at: string
          expiration_date: string | null
          id: string
          merchant: string
          offer_amount: number
          offer_type: string
          redeemed: boolean | null
          redeemed_date: string | null
          required_spend: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          activated?: boolean | null
          activated_date?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          merchant: string
          offer_amount: number
          offer_type: string
          redeemed?: boolean | null
          redeemed_date?: string | null
          required_spend?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          activated?: boolean | null
          activated_date?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          merchant?: string
          offer_amount?: number
          offer_type?: string
          redeemed?: boolean | null
          redeemed_date?: string | null
          required_spend?: number | null
          user_id?: string
        }
        Relationships: []
      }
      card_welcome_bonuses: {
        Row: {
          account_id: string
          bonus_amount: number
          completed: boolean | null
          completed_date: string | null
          created_at: string
          current_spend: number | null
          deadline: string
          id: string
          required_spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          bonus_amount: number
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          current_spend?: number | null
          deadline: string
          id?: string
          required_spend: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          bonus_amount?: number
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string
          current_spend?: number | null
          deadline?: string
          id?: string
          required_spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          category_id: string
          confidence: number
          connection_id: string | null
          created_at: string
          description_keywords: string[] | null
          failure_count: number
          id: string
          last_used_at: string | null
          merchant_pattern: string
          priority: number
          rule_type: string
          success_count: number
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          category_id: string
          confidence?: number
          connection_id?: string | null
          created_at?: string
          description_keywords?: string[] | null
          failure_count?: number
          id?: string
          last_used_at?: string | null
          merchant_pattern: string
          priority?: number
          rule_type?: string
          success_count?: number
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          category_id?: string
          confidence?: number
          connection_id?: string | null
          created_at?: string
          description_keywords?: string[] | null
          failure_count?: number
          id?: string
          last_used_at?: string | null
          merchant_pattern?: string
          priority?: number
          rule_type?: string
          success_count?: number
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorization_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      connection_invitations: {
        Row: {
          connection_id: string
          created_at: string
          expires_at: string
          id: string
          message: string | null
          proposed_permissions: Json | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          proposed_permissions?: Json | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          proposed_permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_invitations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_snapshot: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          messages: Json
          session_id: string
          started_at: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json
          session_id?: string
          started_at?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          messages?: Json
          session_id?: string
          started_at?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credit_card_statements: {
        Row: {
          account_id: string
          apr: number | null
          balance: number
          created_at: string
          due_date: string
          id: string
          minimum_payment: number
          paid: boolean
          paid_amount: number | null
          paid_date: string | null
          statement_date: string
          user_id: string
        }
        Insert: {
          account_id: string
          apr?: number | null
          balance: number
          created_at?: string
          due_date: string
          id?: string
          minimum_payment: number
          paid?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          statement_date: string
          user_id: string
        }
        Update: {
          account_id?: string
          apr?: number | null
          balance?: number
          created_at?: string
          due_date?: string
          id?: string
          minimum_payment?: number
          paid?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          statement_date?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_job_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_name: string
          job_type: string | null
          metadata: Json | null
          records_affected: number | null
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_name: string
          job_type?: string | null
          metadata?: Json | null
          records_affected?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_name?: string
          job_type?: string | null
          metadata?: Json | null
          records_affected?: number | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      dream_goals: {
        Row: {
          created_at: string | null
          dream_id: string
          goal_id: string
        }
        Insert: {
          created_at?: string | null
          dream_id: string
          goal_id: string
        }
        Update: {
          created_at?: string | null
          dream_id?: string
          goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dream_goals_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      dreams: {
        Row: {
          achieved_at: string | null
          category: string
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          estimated_timeframe: string | null
          id: string
          inspiration_sources: string[] | null
          is_public: boolean | null
          notes: string | null
          priority: string
          required_resources: string[] | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          vision_board_images: string[] | null
          vision_board_notes: string | null
        }
        Insert: {
          achieved_at?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_timeframe?: string | null
          id?: string
          inspiration_sources?: string[] | null
          is_public?: boolean | null
          notes?: string | null
          priority: string
          required_resources?: string[] | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          vision_board_images?: string[] | null
          vision_board_notes?: string | null
        }
        Update: {
          achieved_at?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_timeframe?: string | null
          id?: string
          inspiration_sources?: string[] | null
          is_public?: boolean | null
          notes?: string | null
          priority?: string
          required_resources?: string[] | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vision_board_images?: string[] | null
          vision_board_notes?: string | null
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          annual_fee: number | null
          annual_fee_due_date: string | null
          apr: number | null
          balance: number
          base_rewards_rate: number | null
          connection_id: string | null
          created_at: string
          credit_limit: number | null
          id: string
          institution_id: string | null
          last_updated_at: string
          liability: boolean | null
          minimum_payment: number | null
          name: string
          payment_due_day: number | null
          rewards_balance: number | null
          rewards_type:
            | Database["public"]["Enums"]["finance_rewards_type"]
            | null
          statement_balance: number | null
          statement_date: string | null
          type: Database["public"]["Enums"]["finance_account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_fee?: number | null
          annual_fee_due_date?: string | null
          apr?: number | null
          balance?: number
          base_rewards_rate?: number | null
          connection_id?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          institution_id?: string | null
          last_updated_at?: string
          liability?: boolean | null
          minimum_payment?: number | null
          name: string
          payment_due_day?: number | null
          rewards_balance?: number | null
          rewards_type?:
            | Database["public"]["Enums"]["finance_rewards_type"]
            | null
          statement_balance?: number | null
          statement_date?: string | null
          type: Database["public"]["Enums"]["finance_account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_fee?: number | null
          annual_fee_due_date?: string | null
          apr?: number | null
          balance?: number
          base_rewards_rate?: number | null
          connection_id?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          institution_id?: string | null
          last_updated_at?: string
          liability?: boolean | null
          minimum_payment?: number | null
          name?: string
          payment_due_day?: number | null
          rewards_balance?: number | null
          rewards_type?:
            | Database["public"]["Enums"]["finance_rewards_type"]
            | null
          statement_balance?: number | null
          statement_date?: string | null
          type?: Database["public"]["Enums"]["finance_account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "finance_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_budget_templates: {
        Row: {
          category_id: string
          connection_id: string | null
          created_at: string
          default_amount: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          connection_id?: string | null
          created_at?: string
          default_amount: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          connection_id?: string | null
          created_at?: string
          default_amount?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budget_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_templates_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_budgets: {
        Row: {
          category_id: string
          connection_id: string | null
          created_at: string
          id: string
          limit_amount: number
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          connection_id?: string | null
          created_at?: string
          id?: string
          limit_amount: number
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          connection_id?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_card_benefits: {
        Row: {
          account_id: string
          active: boolean
          benefit_type: Database["public"]["Enums"]["finance_benefit_type"]
          connection_id: string | null
          created_at: string
          description: string | null
          frequency:
            | Database["public"]["Enums"]["finance_benefit_frequency"]
            | null
          id: string
          name: string
          reset_date: string | null
          updated_at: string
          used_amount: number
          user_id: string
          value: number | null
        }
        Insert: {
          account_id: string
          active?: boolean
          benefit_type: Database["public"]["Enums"]["finance_benefit_type"]
          connection_id?: string | null
          created_at?: string
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["finance_benefit_frequency"]
            | null
          id?: string
          name: string
          reset_date?: string | null
          updated_at?: string
          used_amount?: number
          user_id: string
          value?: number | null
        }
        Update: {
          account_id?: string
          active?: boolean
          benefit_type?: Database["public"]["Enums"]["finance_benefit_type"]
          connection_id?: string | null
          created_at?: string
          description?: string | null
          frequency?:
            | Database["public"]["Enums"]["finance_benefit_frequency"]
            | null
          id?: string
          name?: string
          reset_date?: string | null
          updated_at?: string
          used_amount?: number
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_card_benefits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_benefits_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_benefits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_card_category_bonuses: {
        Row: {
          account_id: string
          category: Database["public"]["Enums"]["finance_spending_category"]
          connection_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_rotating: boolean
          rewards_rate: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          category: Database["public"]["Enums"]["finance_spending_category"]
          connection_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_rotating?: boolean
          rewards_rate: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          category?: Database["public"]["Enums"]["finance_spending_category"]
          connection_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_rotating?: boolean
          rewards_rate?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_card_category_bonuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_category_bonuses_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_category_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_card_offers: {
        Row: {
          account_id: string
          activated: boolean
          activated_date: string | null
          connection_id: string | null
          created_at: string
          expiration_date: string | null
          id: string
          merchant: string
          offer_amount: number
          offer_type: Database["public"]["Enums"]["finance_offer_type"]
          redeemed: boolean
          redeemed_date: string | null
          required_spend: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          activated?: boolean
          activated_date?: string | null
          connection_id?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          merchant: string
          offer_amount: number
          offer_type: Database["public"]["Enums"]["finance_offer_type"]
          redeemed?: boolean
          redeemed_date?: string | null
          required_spend?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          activated?: boolean
          activated_date?: string | null
          connection_id?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          merchant?: string
          offer_amount?: number
          offer_type?: Database["public"]["Enums"]["finance_offer_type"]
          redeemed?: boolean
          redeemed_date?: string | null
          required_spend?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_card_offers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_offers_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_card_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string | null
          connection_id: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          connection_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          connection_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_credit_card_statements: {
        Row: {
          account_id: string
          apr: number | null
          balance: number
          created_at: string
          due_date: string
          id: string
          minimum_payment: number
          paid: boolean
          paid_amount: number | null
          paid_date: string | null
          statement_date: string
          user_id: string
        }
        Insert: {
          account_id: string
          apr?: number | null
          balance: number
          created_at?: string
          due_date: string
          id?: string
          minimum_payment: number
          paid?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          statement_date: string
          user_id: string
        }
        Update: {
          account_id?: string
          apr?: number | null
          balance?: number
          created_at?: string
          due_date?: string
          id?: string
          minimum_payment?: number
          paid?: boolean
          paid_amount?: number | null
          paid_date?: string | null
          statement_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_credit_card_statements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_credit_card_statements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_goal_progress: {
        Row: {
          amount: number
          connection_id: string | null
          created_at: string
          date: string
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          connection_id?: string | null
          created_at?: string
          date: string
          goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          connection_id?: string | null
          created_at?: string
          date?: string
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_goal_progress_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "finance_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_goal_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_goals: {
        Row: {
          connection_id: string | null
          created_at: string
          current_amount: number
          due_date: string
          id: string
          linked_account_id: string | null
          linked_category_id: string | null
          name: string
          starting_amount: number
          status: string | null
          target_amount: number
          track_networth: boolean | null
          type: Database["public"]["Enums"]["finance_goal_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          current_amount?: number
          due_date: string
          id?: string
          linked_account_id?: string | null
          linked_category_id?: string | null
          name: string
          starting_amount?: number
          status?: string | null
          target_amount: number
          track_networth?: boolean | null
          type: Database["public"]["Enums"]["finance_goal_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          current_amount?: number
          due_date?: string
          id?: string
          linked_account_id?: string | null
          linked_category_id?: string | null
          name?: string
          starting_amount?: number
          status?: string | null
          target_amount?: number
          track_networth?: boolean | null
          type?: Database["public"]["Enums"]["finance_goal_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_goals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_goals_linked_category_id_fkey"
            columns: ["linked_category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_institutions: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_institutions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_institutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_loan_payments: {
        Row: {
          amount: number
          balance_after: number
          connection_id: string | null
          created_at: string
          extra_amount: number
          id: string
          interest_amount: number
          loan_id: string
          notes: string | null
          payment_date: string
          principal_amount: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          connection_id?: string | null
          created_at?: string
          extra_amount?: number
          id?: string
          interest_amount: number
          loan_id: string
          notes?: string | null
          payment_date: string
          principal_amount: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          connection_id?: string | null
          created_at?: string
          extra_amount?: number
          id?: string
          interest_amount?: number
          loan_id?: string
          notes?: string | null
          payment_date?: string
          principal_amount?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_loan_payments_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "finance_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "finance_loans_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loan_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_loans: {
        Row: {
          account_id: string | null
          connection_id: string | null
          created_at: string
          current_balance: number
          extra_payment: number
          first_payment_date: string
          id: string
          interest_rate: number
          lender: string | null
          loan_name: string
          loan_number: string | null
          loan_type: Database["public"]["Enums"]["finance_loan_type"]
          monthly_payment: number
          notes: string | null
          principal_amount: number
          start_date: string
          status: Database["public"]["Enums"]["finance_loan_status"]
          target_payoff_date: string
          term_months: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          connection_id?: string | null
          created_at?: string
          current_balance: number
          extra_payment?: number
          first_payment_date: string
          id?: string
          interest_rate: number
          lender?: string | null
          loan_name: string
          loan_number?: string | null
          loan_type: Database["public"]["Enums"]["finance_loan_type"]
          monthly_payment: number
          notes?: string | null
          principal_amount: number
          start_date: string
          status?: Database["public"]["Enums"]["finance_loan_status"]
          target_payoff_date: string
          term_months?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          connection_id?: string | null
          created_at?: string
          current_balance?: number
          extra_payment?: number
          first_payment_date?: string
          id?: string
          interest_rate?: number
          lender?: string | null
          loan_name?: string
          loan_number?: string | null
          loan_type?: Database["public"]["Enums"]["finance_loan_type"]
          monthly_payment?: number
          notes?: string | null
          principal_amount?: number
          start_date?: string
          status?: Database["public"]["Enums"]["finance_loan_status"]
          target_payoff_date?: string
          term_months?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_loans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loans_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_pending_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          recurring_transaction_id: string | null
          reviewed_at: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["finance_pending_status"]
          transaction_id: string | null
          type: Database["public"]["Enums"]["finance_txn_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          recurring_transaction_id?: string | null
          reviewed_at?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["finance_pending_status"]
          transaction_id?: string | null
          type: Database["public"]["Enums"]["finance_txn_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          recurring_transaction_id?: string | null
          reviewed_at?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["finance_pending_status"]
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["finance_txn_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_pending_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_pending_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_pending_transactions_recurring_transaction_id_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_pending_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_pending_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_recurring_transactions: {
        Row: {
          account_id: string | null
          active: boolean
          amount: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          days_before: number
          description: string
          end_date: string | null
          frequency: Database["public"]["Enums"]["finance_recurring_frequency"]
          id: string
          last_generated_date: string | null
          notes: string | null
          require_approval: boolean
          start_date: string
          type: Database["public"]["Enums"]["finance_txn_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          amount: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number
          description: string
          end_date?: string | null
          frequency: Database["public"]["Enums"]["finance_recurring_frequency"]
          id?: string
          last_generated_date?: string | null
          notes?: string | null
          require_approval?: boolean
          start_date: string
          type: Database["public"]["Enums"]["finance_txn_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          amount?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number
          description?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["finance_recurring_frequency"]
          id?: string
          last_generated_date?: string | null
          notes?: string | null
          require_approval?: boolean
          start_date?: string
          type?: Database["public"]["Enums"]["finance_txn_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_retirement_account_metadata: {
        Row: {
          account_id: string
          allocation: Json | null
          annual_contribution_limit: number
          catch_up_limit: number | null
          contribution_year: number
          created_at: string
          current_year_contributions: number
          employer_contributions_ytd: number
          employer_match_limit: number | null
          employer_match_percentage: number | null
          employer_match_type:
            | Database["public"]["Enums"]["finance_employer_match_type"]
            | null
          has_employer_match: boolean
          has_vesting_schedule: boolean
          id: string
          is_family_coverage: boolean | null
          notes: string | null
          tax_treatment: Database["public"]["Enums"]["finance_tax_treatment"]
          unvested_balance: number
          updated_at: string
          user_id: string
          vesting_cliff_years: number | null
          vesting_graded_years: number | null
          vesting_percentage: number
          vesting_schedule_type:
            | Database["public"]["Enums"]["finance_vesting_schedule_type"]
            | null
        }
        Insert: {
          account_id: string
          allocation?: Json | null
          annual_contribution_limit: number
          catch_up_limit?: number | null
          contribution_year: number
          created_at?: string
          current_year_contributions?: number
          employer_contributions_ytd?: number
          employer_match_limit?: number | null
          employer_match_percentage?: number | null
          employer_match_type?:
            | Database["public"]["Enums"]["finance_employer_match_type"]
            | null
          has_employer_match?: boolean
          has_vesting_schedule?: boolean
          id?: string
          is_family_coverage?: boolean | null
          notes?: string | null
          tax_treatment: Database["public"]["Enums"]["finance_tax_treatment"]
          unvested_balance?: number
          updated_at?: string
          user_id: string
          vesting_cliff_years?: number | null
          vesting_graded_years?: number | null
          vesting_percentage?: number
          vesting_schedule_type?:
            | Database["public"]["Enums"]["finance_vesting_schedule_type"]
            | null
        }
        Update: {
          account_id?: string
          allocation?: Json | null
          annual_contribution_limit?: number
          catch_up_limit?: number | null
          contribution_year?: number
          created_at?: string
          current_year_contributions?: number
          employer_contributions_ytd?: number
          employer_match_limit?: number | null
          employer_match_percentage?: number | null
          employer_match_type?:
            | Database["public"]["Enums"]["finance_employer_match_type"]
            | null
          has_employer_match?: boolean
          has_vesting_schedule?: boolean
          id?: string
          is_family_coverage?: boolean | null
          notes?: string | null
          tax_treatment?: Database["public"]["Enums"]["finance_tax_treatment"]
          unvested_balance?: number
          updated_at?: string
          user_id?: string
          vesting_cliff_years?: number | null
          vesting_graded_years?: number | null
          vesting_percentage?: number
          vesting_schedule_type?:
            | Database["public"]["Enums"]["finance_vesting_schedule_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_retirement_account_metadata_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_retirement_account_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_retirement_contributions: {
        Row: {
          amount: number
          contribution_date: string
          contribution_type: Database["public"]["Enums"]["finance_contribution_type"]
          contribution_year: number
          created_at: string
          id: string
          notes: string | null
          retirement_account_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date: string
          contribution_type: Database["public"]["Enums"]["finance_contribution_type"]
          contribution_year: number
          created_at?: string
          id?: string
          notes?: string | null
          retirement_account_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          contribution_type?: Database["public"]["Enums"]["finance_contribution_type"]
          contribution_year?: number
          created_at?: string
          id?: string
          notes?: string | null
          retirement_account_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_retirement_contributions_retirement_account_id_fkey"
            columns: ["retirement_account_id"]
            isOneToOne: false
            referencedRelation: "finance_retirement_account_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_retirement_contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_retirement_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_retirement_performance: {
        Row: {
          allocation_snapshot: Json | null
          balance: number
          created_at: string
          id: string
          rate_of_return: number | null
          retirement_account_id: string
          snapshot_date: string
          total_contributions: number
          total_gains: number
          user_id: string
        }
        Insert: {
          allocation_snapshot?: Json | null
          balance: number
          created_at?: string
          id?: string
          rate_of_return?: number | null
          retirement_account_id: string
          snapshot_date: string
          total_contributions: number
          total_gains: number
          user_id: string
        }
        Update: {
          allocation_snapshot?: Json | null
          balance?: number
          created_at?: string
          id?: string
          rate_of_return?: number | null
          retirement_account_id?: string
          snapshot_date?: string
          total_contributions?: number
          total_gains?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_retirement_performance_retirement_account_id_fkey"
            columns: ["retirement_account_id"]
            isOneToOne: false
            referencedRelation: "finance_retirement_account_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_retirement_performance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_rewards_history: {
        Row: {
          account_id: string
          balance: number
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          points_earned: number
          points_redeemed: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          balance: number
          category?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          balance?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_rewards_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_rewards_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_rewards_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string
          amount: number
          categorization_rule_id: string | null
          category_id: string | null
          confidence_score: number | null
          connection_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          merchant_name: string | null
          notes: string | null
          suggested_category_id: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["finance_txn_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          categorization_rule_id?: string | null
          category_id?: string | null
          confidence_score?: number | null
          connection_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          merchant_name?: string | null
          notes?: string | null
          suggested_category_id?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["finance_txn_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          categorization_rule_id?: string | null
          category_id?: string | null
          confidence_score?: number | null
          connection_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          merchant_name?: string | null
          notes?: string | null
          suggested_category_id?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["finance_txn_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_welcome_bonuses: {
        Row: {
          account_id: string
          bonus_amount: number
          completed: boolean
          completed_date: string | null
          connection_id: string | null
          created_at: string
          current_spend: number
          deadline: string
          id: string
          required_spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          bonus_amount: number
          completed?: boolean
          completed_date?: string | null
          connection_id?: string | null
          created_at?: string
          current_spend?: number
          deadline: string
          id?: string
          required_spend: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          bonus_amount?: number
          completed?: boolean
          completed_date?: string | null
          connection_id?: string | null
          created_at?: string
          current_spend?: number
          deadline?: string
          id?: string
          required_spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_welcome_bonuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_welcome_bonuses_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_welcome_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          budget_amount: number | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          budget_amount?: number | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          budget_amount?: number | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_duration_seconds: number | null
          breaks_taken: number | null
          completed_at: string | null
          created_at: string | null
          distractions: number | null
          duration_minutes: number
          environment_data: Json | null
          id: string
          mood_after: string | null
          mood_before: string | null
          notes: string | null
          productivity_score: number | null
          started_at: string
          status: string | null
          task_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          breaks_taken?: number | null
          completed_at?: string | null
          created_at?: string | null
          distractions?: number | null
          duration_minutes: number
          environment_data?: Json | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          notes?: string | null
          productivity_score?: number | null
          started_at: string
          status?: string | null
          task_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_duration_seconds?: number | null
          breaks_taken?: number | null
          completed_at?: string | null
          created_at?: string | null
          distractions?: number | null
          duration_minutes?: number
          environment_data?: Json | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          notes?: string | null
          productivity_score?: number | null
          started_at?: string
          status?: string | null
          task_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs_g: number | null
          category: string | null
          created_at: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          name: string
          protein_g: number | null
          serving_size: number
          serving_unit: string
          sodium_mg: number | null
          sugar_g: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs_g?: number | null
          category?: string | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          name: string
          protein_g?: number | null
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs_g?: number | null
          category?: string | null
          created_at?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          name?: string
          protein_g?: number | null
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      food_log: {
        Row: {
          ai_analyzed: boolean | null
          ai_confidence: number | null
          calories: number
          carbs_g: number | null
          created_at: string
          custom_food_name: string | null
          fat_g: number | null
          food_item_id: string | null
          id: string
          image_url: string | null
          logged_date: string
          logged_time: string | null
          meal_type: string
          notes: string | null
          planned_meal_id: string | null
          protein_g: number | null
          quantity: number
          user_id: string
        }
        Insert: {
          ai_analyzed?: boolean | null
          ai_confidence?: number | null
          calories?: number
          carbs_g?: number | null
          created_at?: string
          custom_food_name?: string | null
          fat_g?: number | null
          food_item_id?: string | null
          id?: string
          image_url?: string | null
          logged_date?: string
          logged_time?: string | null
          meal_type: string
          notes?: string | null
          planned_meal_id?: string | null
          protein_g?: number | null
          quantity?: number
          user_id: string
        }
        Update: {
          ai_analyzed?: boolean | null
          ai_confidence?: number | null
          calories?: number
          carbs_g?: number | null
          created_at?: string
          custom_food_name?: string | null
          fat_g?: number | null
          food_item_id?: string | null
          id?: string
          image_url?: string | null
          logged_date?: string
          logged_time?: string | null
          meal_type?: string
          notes?: string | null
          planned_meal_id?: string | null
          protein_g?: number | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_log_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_planned_meal_id_fkey"
            columns: ["planned_meal_id"]
            isOneToOne: false
            referencedRelation: "planned_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_checkins: {
        Row: {
          blockers: string | null
          check_in_date: string | null
          created_at: string | null
          goal_id: string
          id: string
          mood: string | null
          next_actions: string | null
          notes: string | null
          progress_update: number | null
          wins: string | null
        }
        Insert: {
          blockers?: string | null
          check_in_date?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          mood?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_update?: number | null
          wins?: string | null
        }
        Update: {
          blockers?: string | null
          check_in_date?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          mood?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_update?: number | null
          wins?: string | null
        }
        Relationships: []
      }
      goal_finances: {
        Row: {
          amount: number
          created_at: string | null
          goal_id: string
          id: string
          notes: string | null
          transaction_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      goal_habits: {
        Row: {
          created_at: string | null
          goal_id: string
          habit_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          habit_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          habit_id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          goal_id: string
          id: string
          is_completed: boolean | null
          order_index: number
          target_date: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          goal_id: string
          id?: string
          is_completed?: boolean | null
          order_index: number
          target_date?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          is_completed?: boolean | null
          order_index?: number
          target_date?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      goal_progress_history: {
        Row: {
          amount: number
          goal_id: string
          id: string
          note: string | null
          recorded_at: string
          user_id: string
        }
        Insert: {
          amount: number
          goal_id: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          goal_id?: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_progress_tracking: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          last_updated: string | null
          notes: string | null
          personal_current_value: number | null
          personal_progress: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          last_updated?: string | null
          notes?: string | null
          personal_current_value?: number | null
          personal_progress?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          last_updated?: string | null
          notes?: string | null
          personal_current_value?: number | null
          personal_progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_tracking_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_streak_history: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          goal_id: string
          id: string
          notes: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          goal_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          goal_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      goal_tasks: {
        Row: {
          created_at: string | null
          goal_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          task_id?: string
        }
        Relationships: []
      }
      goal_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          default_milestones: Json | null
          description: string | null
          difficulty: string | null
          estimated_duration_days: number | null
          id: string
          is_public: boolean | null
          name: string
          resources: string[] | null
          suggested_tags: string[] | null
          tips: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          default_milestones?: Json | null
          description?: string | null
          difficulty?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          resources?: string[] | null
          suggested_tags?: string[] | null
          tips?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          default_milestones?: Json | null
          description?: string | null
          difficulty?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          resources?: string[] | null
          suggested_tags?: string[] | null
          tips?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      grocery_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_amount: string | null
          ingredient_name: string
          ingredient_unit: string | null
          meal_plan_id: string | null
          notes: string | null
          recipe_names: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_amount?: string | null
          ingredient_name: string
          ingredient_unit?: string | null
          meal_plan_id?: string | null
          notes?: string | null
          recipe_names?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_amount?: string | null
          ingredient_name?: string
          ingredient_unit?: string | null
          meal_plan_id?: string | null
          notes?: string | null
          recipe_names?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_ingredients_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_ingredients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      habit_entries: {
        Row: {
          created_at: string | null
          date: string
          habit_id: string | null
          id: string
          mood: string | null
          notes: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          habit_id?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          habit_id?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          best_streak: number | null
          category: string | null
          color: string | null
          created_at: string | null
          current_progress: number | null
          description: string | null
          frequency: string | null
          goal_mode: string | null
          goal_target: number | null
          goal_unit: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak_count: number | null
          target_value: number | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          best_streak?: number | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          frequency?: string | null
          goal_mode?: string | null
          goal_target?: number | null
          goal_unit?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_count?: number | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          best_streak?: number | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          frequency?: string | null
          goal_mode?: string | null
          goal_target?: number | null
          goal_unit?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_count?: number | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      important_dates: {
        Row: {
          celebration_notes: string | null
          created_at: string
          date_type: string
          day: number
          gift_ideas: string[] | null
          id: string
          is_active: boolean | null
          last_celebrated_year: number | null
          month: number
          notes: string | null
          person_name: string
          relationship: string | null
          reminder_days_before: number[] | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          celebration_notes?: string | null
          created_at?: string
          date_type: string
          day: number
          gift_ideas?: string[] | null
          id?: string
          is_active?: boolean | null
          last_celebrated_year?: number | null
          month: number
          notes?: string | null
          person_name: string
          relationship?: string | null
          reminder_days_before?: number[] | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          celebration_notes?: string | null
          created_at?: string
          date_type?: string
          day?: number
          gift_ideas?: string[] | null
          id?: string
          is_active?: boolean | null
          last_celebrated_year?: number | null
          month?: number
          notes?: string | null
          person_name?: string
          relationship?: string | null
          reminder_days_before?: number[] | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "important_dates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          ai_summary: string | null
          content: string
          created_at: string
          id: string
          processed_at: string | null
          processed_to_id: string | null
          processed_to_type: string | null
          source: string
          status: string
          suggested_date: string | null
          suggested_priority: string | null
          suggested_tags: string[] | null
          suggested_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          content: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_to_id?: string | null
          processed_to_type?: string | null
          source?: string
          status?: string
          suggested_date?: string | null
          suggested_priority?: string | null
          suggested_tags?: string[] | null
          suggested_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          content?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_to_id?: string | null
          processed_to_type?: string | null
          source?: string
          status?: string
          suggested_date?: string | null
          suggested_priority?: string | null
          suggested_tags?: string[] | null
          suggested_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      institutions: {
        Row: {
          id: string
          logo_url: string | null
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          name: string
          user_id: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_beneficiaries: {
        Row: {
          address: string | null
          beneficiary_type: string
          created_at: string
          email: string | null
          id: string
          name: string
          percentage: number
          phone: string | null
          policy_id: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          beneficiary_type: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          percentage: number
          phone?: string | null
          policy_id: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          beneficiary_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          percentage?: number
          phone?: string | null
          policy_id?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_beneficiaries_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_beneficiaries_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policy_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          adjuster_email: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          approved_amount: number | null
          approved_date: string | null
          claim_amount: number
          claim_date: string
          claim_number: string | null
          claim_type: string
          closed_date: string | null
          created_at: string
          deductible_paid: number | null
          description: string
          filed_date: string | null
          id: string
          incident_date: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          policy_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          approved_amount?: number | null
          approved_date?: string | null
          claim_amount: number
          claim_date: string
          claim_number?: string | null
          claim_type: string
          closed_date?: string | null
          created_at?: string
          deductible_paid?: number | null
          description: string
          filed_date?: string | null
          id?: string
          incident_date: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          policy_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adjuster_email?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          approved_amount?: number | null
          approved_date?: string | null
          claim_amount?: number
          claim_date?: string
          claim_number?: string | null
          claim_type?: string
          closed_date?: string | null
          created_at?: string
          deductible_paid?: number | null
          description?: string
          filed_date?: string | null
          id?: string
          incident_date?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          policy_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policy_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          auto_renew: boolean | null
          coverage_amount: number | null
          created_at: string
          deductible: number | null
          documents: Json | null
          end_date: string | null
          id: string
          next_payment_date: string | null
          notes: string | null
          policy_name: string
          policy_number: string | null
          premium_amount: number
          premium_frequency: string
          provider: string
          renewal_date: string | null
          renewal_reminder_days: number | null
          start_date: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          auto_renew?: boolean | null
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          documents?: Json | null
          end_date?: string | null
          id?: string
          next_payment_date?: string | null
          notes?: string | null
          policy_name: string
          policy_number?: string | null
          premium_amount: number
          premium_frequency: string
          provider: string
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          start_date: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          auto_renew?: boolean | null
          coverage_amount?: number | null
          created_at?: string
          deductible?: number | null
          documents?: Json | null
          end_date?: string | null
          id?: string
          next_payment_date?: string | null
          notes?: string | null
          policy_name?: string
          policy_number?: string | null
          premium_amount?: number
          premium_frequency?: string
          provider?: string
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_premium_payments: {
        Row: {
          amount: number
          confirmation_number: string | null
          coverage_period_end: string | null
          coverage_period_start: string | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          policy_id: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmation_number?: string | null
          coverage_period_end?: string | null
          coverage_period_start?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          policy_id: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmation_number?: string | null
          coverage_period_end?: string | null
          coverage_period_start?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          policy_id?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_premium_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_premium_payments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policy_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          gratitude: string | null
          id: string
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          weather: Json | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          gratitude?: string | null
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          weather?: Json | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          gratitude?: string | null
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          weather?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      life_dream_goals: {
        Row: {
          created_at: string | null
          dream_id: string
          goal_id: string
        }
        Insert: {
          created_at?: string | null
          dream_id: string
          goal_id: string
        }
        Update: {
          created_at?: string | null
          dream_id?: string
          goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_dream_goals_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "life_dreams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_dream_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_dreams: {
        Row: {
          achieved_at: string | null
          category: string
          connection_id: string | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          estimated_timeframe: string | null
          id: string
          inspiration_sources: string[] | null
          is_public: boolean | null
          notes: string | null
          priority: string
          required_resources: string[] | null
          status: string
          tags: string[] | null
          title: string
          tracking_mode: string | null
          updated_at: string | null
          user_id: string
          vision_board_images: string[] | null
          vision_board_notes: string | null
        }
        Insert: {
          achieved_at?: string | null
          category: string
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_timeframe?: string | null
          id?: string
          inspiration_sources?: string[] | null
          is_public?: boolean | null
          notes?: string | null
          priority: string
          required_resources?: string[] | null
          status?: string
          tags?: string[] | null
          title: string
          tracking_mode?: string | null
          updated_at?: string | null
          user_id: string
          vision_board_images?: string[] | null
          vision_board_notes?: string | null
        }
        Update: {
          achieved_at?: string | null
          category?: string
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_timeframe?: string | null
          id?: string
          inspiration_sources?: string[] | null
          is_public?: boolean | null
          notes?: string | null
          priority?: string
          required_resources?: string[] | null
          status?: string
          tags?: string[] | null
          title?: string
          tracking_mode?: string | null
          updated_at?: string | null
          user_id?: string
          vision_board_images?: string[] | null
          vision_board_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_dreams_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goal_checkins: {
        Row: {
          blockers: string | null
          check_in_date: string | null
          created_at: string | null
          goal_id: string
          id: string
          mood: string | null
          next_actions: string | null
          notes: string | null
          progress_update: number | null
          wins: string | null
        }
        Insert: {
          blockers?: string | null
          check_in_date?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          mood?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_update?: number | null
          wins?: string | null
        }
        Update: {
          blockers?: string | null
          check_in_date?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          mood?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_update?: number | null
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_goal_checkins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goal_habits: {
        Row: {
          created_at: string | null
          goal_id: string
          habit_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          habit_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          habit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_goal_habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goal_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          goal_id: string
          id: string
          is_completed: boolean | null
          order_index: number
          target_date: string | null
          title: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          goal_id: string
          id?: string
          is_completed?: boolean | null
          order_index: number
          target_date?: string | null
          title: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          is_completed?: boolean | null
          order_index?: number
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goal_tasks: {
        Row: {
          created_at: string | null
          goal_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "life_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goal_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          default_milestones: Json | null
          description: string | null
          difficulty: string | null
          estimated_duration_days: number | null
          id: string
          is_public: boolean | null
          name: string
          resources: string[] | null
          suggested_tags: string[] | null
          tips: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          default_milestones?: Json | null
          description?: string | null
          difficulty?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          resources?: string[] | null
          suggested_tags?: string[] | null
          tips?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          default_milestones?: Json | null
          description?: string | null
          difficulty?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          resources?: string[] | null
          suggested_tags?: string[] | null
          tips?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      life_goals: {
        Row: {
          category: string
          completed_date: string | null
          connection_id: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          is_public: boolean | null
          notes: string | null
          priority: string
          progress: number | null
          start_date: string | null
          status: string
          tags: string[] | null
          target_date: string | null
          target_value: number | null
          template_id: string | null
          title: string
          tracking_mode: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_date?: string | null
          connection_id?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          notes?: string | null
          priority: string
          progress?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          target_date?: string | null
          target_value?: number | null
          template_id?: string | null
          title: string
          tracking_mode?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_date?: string | null
          connection_id?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          notes?: string | null
          priority?: string
          progress?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          target_date?: string | null
          target_value?: number | null
          template_id?: string | null
          title?: string
          tracking_mode?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_goals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          note_id: string
          notes: string | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note_id: string
          notes?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note_id?: string
          notes?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          extra_amount: number
          id: string
          interest_amount: number
          loan_id: string
          notes: string | null
          payment_date: string
          principal_amount: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          extra_amount?: number
          id?: string
          interest_amount: number
          loan_id: string
          notes?: string | null
          payment_date: string
          principal_amount: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          extra_amount?: number
          id?: string
          interest_amount?: number
          loan_id?: string
          notes?: string | null
          payment_date?: string
          principal_amount?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          account_id: string | null
          created_at: string
          current_balance: number
          extra_payment: number
          first_payment_date: string
          id: string
          interest_rate: number
          lender: string | null
          loan_name: string
          loan_number: string | null
          loan_type: string
          monthly_payment: number
          notes: string | null
          principal_amount: number
          start_date: string
          status: string
          target_payoff_date: string
          term_months: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          current_balance: number
          extra_payment?: number
          first_payment_date: string
          id?: string
          interest_rate: number
          lender?: string | null
          loan_name: string
          loan_number?: string | null
          loan_type: string
          monthly_payment: number
          notes?: string | null
          principal_amount: number
          start_date: string
          status?: string
          target_payoff_date: string
          term_months?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          current_balance?: number
          extra_payment?: number
          first_payment_date?: string
          id?: string
          interest_rate?: number
          lender?: string | null
          loan_name?: string
          loan_number?: string | null
          loan_type?: string
          monthly_payment?: number
          notes?: string | null
          principal_amount?: number
          start_date?: string
          status?: string
          target_payoff_date?: string
          term_months?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_backlog: {
        Row: {
          connection_id: string
          created_at: string | null
          id: string
          meal_name: string
          original_date: string | null
          original_meal_type: string | null
          people_count: number | null
          reason: string | null
          recipe_id: string | null
          saved_by_user_id: string
          servings: number | null
          updated_at: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          id?: string
          meal_name: string
          original_date?: string | null
          original_meal_type?: string | null
          people_count?: number | null
          reason?: string | null
          recipe_id?: string | null
          saved_by_user_id: string
          servings?: number | null
          updated_at?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          id?: string
          meal_name?: string
          original_date?: string | null
          original_meal_type?: string | null
          people_count?: number | null
          reason?: string | null
          recipe_id?: string | null
          saved_by_user_id?: string
          servings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_backlog_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_backlog_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_backlog_saved_by_user_id_fkey"
            columns: ["saved_by_user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          connection_id: string | null
          created_at: string | null
          id: string
          meal_columns: Json | null
          name: string
          notes: string | null
          shopping_list_generated: boolean | null
          total_estimated_cost: number | null
          updated_at: string | null
          user_id: string | null
          week_start_date: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          meal_columns?: Json | null
          name: string
          notes?: string | null
          shopping_list_generated?: boolean | null
          total_estimated_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          meal_columns?: Json | null
          name?: string
          notes?: string | null
          shopping_list_generated?: boolean | null
          total_estimated_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_tracking: {
        Row: {
          calories_consumed: number | null
          created_at: string
          id: string
          notes: string | null
          planned_meal_id: string
          servings_consumed: number | null
          status: string
          swapped_meal: string | null
          swapped_recipe_id: string | null
          tracked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories_consumed?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_meal_id: string
          servings_consumed?: number | null
          status?: string
          swapped_meal?: string | null
          swapped_recipe_id?: string | null
          tracked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories_consumed?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          planned_meal_id?: string
          servings_consumed?: number | null
          status?: string
          swapped_meal?: string | null
          swapped_recipe_id?: string | null
          tracked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_tracking_planned_meal_id_fkey"
            columns: ["planned_meal_id"]
            isOneToOne: false
            referencedRelation: "planned_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_tracking_swapped_recipe_id_fkey"
            columns: ["swapped_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      merchant_database: {
        Row: {
          aliases: string[] | null
          confidence: number
          created_at: string
          default_category_name: string
          default_subcategory: string | null
          id: string
          logo_url: string | null
          match_count: number
          merchant_name: string
          merchant_type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          aliases?: string[] | null
          confidence?: number
          created_at?: string
          default_category_name: string
          default_subcategory?: string | null
          id?: string
          logo_url?: string | null
          match_count?: number
          merchant_name: string
          merchant_type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          aliases?: string[] | null
          confidence?: number
          created_at?: string
          default_category_name?: string
          default_subcategory?: string | null
          id?: string
          logo_url?: string | null
          match_count?: number
          merchant_name?: string
          merchant_type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      module_permissions: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          module: Database["public"]["Enums"]["shareable_module"]
          permission_level: Database["public"]["Enums"]["module_permission_level"]
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["shareable_module"]
          permission_level?: Database["public"]["Enums"]["module_permission_level"]
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["shareable_module"]
          permission_level?: Database["public"]["Enums"]["module_permission_level"]
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      networth: {
        Row: {
          assets: number
          liabilities: number
          month: string
          user_id: string
        }
        Insert: {
          assets: number
          liabilities: number
          month: string
          user_id: string
        }
        Update: {
          assets?: number
          liabilities?: number
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          note_type: string
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          note_type?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          payload: Json
          priority: string
          retry_count: number | null
          scheduled_for: string
          sent_at: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload: Json
          priority?: string
          retry_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json
          priority?: string
          retry_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          calories_target: number | null
          carbs_target_g: number | null
          created_at: string
          end_date: string | null
          fat_target_g: number | null
          fiber_target_g: number | null
          goal_type: string | null
          id: string
          is_active: boolean | null
          protein_target_g: number | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories_target?: number | null
          carbs_target_g?: number | null
          created_at?: string
          end_date?: string | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          goal_type?: string | null
          id?: string
          is_active?: boolean | null
          protein_target_g?: number | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories_target?: number | null
          carbs_target_g?: number | null
          created_at?: string
          end_date?: string | null
          fat_target_g?: number | null
          fiber_target_g?: number | null
          goal_type?: string | null
          id?: string
          is_active?: boolean | null
          protein_target_g?: number | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          auto_restock: boolean | null
          category: string | null
          created_at: string | null
          expiration_date: string | null
          id: string
          is_low_stock: boolean | null
          last_purchased_at: string | null
          last_used_at: string | null
          location: string | null
          low_stock_threshold: number | null
          name: string
          notes: string | null
          quantity: number | null
          restock_quantity: number | null
          subcategory: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_restock?: boolean | null
          category?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_low_stock?: boolean | null
          last_purchased_at?: string | null
          last_used_at?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name: string
          notes?: string | null
          quantity?: number | null
          restock_quantity?: number | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_restock?: boolean | null
          category?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_low_stock?: boolean | null
          last_purchased_at?: string | null
          last_used_at?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          name?: string
          notes?: string | null
          quantity?: number | null
          restock_quantity?: number | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_email_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          inviter_id: string
          inviter_label: string | null
          message: string | null
          proposed_permissions: Json | null
          relationship: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email: string
          inviter_id: string
          inviter_label?: string | null
          message?: string | null
          proposed_permissions?: Json | null
          relationship?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string
          inviter_id?: string
          inviter_label?: string | null
          message?: string | null
          proposed_permissions?: Json | null
          relationship?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_email_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pending_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          recurring_transaction_id: string | null
          reviewed_at: string | null
          scheduled_date: string
          status: string
          transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          recurring_transaction_id?: string | null
          reviewed_at?: string | null
          scheduled_date: string
          status?: string
          transaction_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          recurring_transaction_id?: string | null
          reviewed_at?: string | null
          scheduled_date?: string
          status?: string
          transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_transactions_recurring_transaction_id_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_transactions_recurring_transaction_id_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions_upcoming"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_care_categories: {
        Row: {
          color: string | null
          created_at: string
          frequency_type: Database["public"]["Enums"]["personal_care_frequency"]
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          frequency_type?: Database["public"]["Enums"]["personal_care_frequency"]
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          frequency_type?: Database["public"]["Enums"]["personal_care_frequency"]
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      personal_care_item_products: {
        Row: {
          created_at: string
          id: string
          item_id: string
          product_id: string
          usage_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          product_id: string
          usage_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          product_id?: string
          usage_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_item_products_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "personal_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_care_item_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "personal_care_products"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_care_items: {
        Row: {
          category_id: string
          created_at: string
          goal_interval_days: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          name: string
          next_due_date: string | null
          notes: string | null
          schedule_interval_days: number | null
          sort_order: number | null
          tracking_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          goal_interval_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          schedule_interval_days?: number | null
          sort_order?: number | null
          tracking_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          goal_interval_days?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          schedule_interval_days?: number | null
          sort_order?: number | null
          tracking_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_care_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_care_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      personal_care_logs: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          item_id: string
          notes: string | null
          products_used: string[] | null
          rating: number | null
          skipped: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          products_used?: string[] | null
          rating?: number | null
          skipped?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          products_used?: string[] | null
          rating?: number | null
          skipped?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "personal_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_care_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      personal_care_products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          currently_using: boolean | null
          expiry_date: string | null
          id: string
          name: string
          notes: string | null
          price: number | null
          product_type: string | null
          purchase_date: string | null
          rating: number | null
          size: string | null
          updated_at: string
          user_id: string
          where_to_buy: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          currently_using?: boolean | null
          expiry_date?: string | null
          id?: string
          name: string
          notes?: string | null
          price?: number | null
          product_type?: string | null
          purchase_date?: string | null
          rating?: number | null
          size?: string | null
          updated_at?: string
          user_id: string
          where_to_buy?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          currently_using?: boolean | null
          expiry_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          price?: number | null
          product_type?: string | null
          purchase_date?: string | null
          rating?: number | null
          size?: string | null
          updated_at?: string
          user_id?: string
          where_to_buy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      personal_care_schedule: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          item_id: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_care_schedule_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "personal_care_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_care_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      planned_meals: {
        Row: {
          actual_food_log_id: string | null
          consumed_at: string | null
          created_at: string | null
          custom_meal: string | null
          date: string
          id: string
          is_postponed: boolean | null
          meal_plan_id: string | null
          meal_type: string
          notes: string | null
          original_date: string | null
          people_count: number | null
          postponed_reason: string | null
          prepared_at: string | null
          recipe_id: string | null
          servings: number | null
          status: string | null
          substituted_with: string | null
          updated_at: string | null
        }
        Insert: {
          actual_food_log_id?: string | null
          consumed_at?: string | null
          created_at?: string | null
          custom_meal?: string | null
          date: string
          id?: string
          is_postponed?: boolean | null
          meal_plan_id?: string | null
          meal_type: string
          notes?: string | null
          original_date?: string | null
          people_count?: number | null
          postponed_reason?: string | null
          prepared_at?: string | null
          recipe_id?: string | null
          servings?: number | null
          status?: string | null
          substituted_with?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_food_log_id?: string | null
          consumed_at?: string | null
          created_at?: string | null
          custom_meal?: string | null
          date?: string
          id?: string
          is_postponed?: boolean | null
          meal_plan_id?: string | null
          meal_type?: string
          notes?: string | null
          original_date?: string | null
          people_count?: number | null
          postponed_reason?: string | null
          prepared_at?: string | null
          recipe_id?: string | null
          servings?: number | null
          status?: string | null
          substituted_with?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planned_meals_actual_food_log_id_fkey"
            columns: ["actual_food_log_id"]
            isOneToOne: false
            referencedRelation: "food_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          average_price: number | null
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          average_price?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          average_price?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_connections: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          notes: string | null
          receiver_id: string
          receiver_label: string | null
          relationship: Database["public"]["Enums"]["connection_relationship"]
          requester_id: string
          requester_label: string | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          receiver_id: string
          receiver_label?: string | null
          relationship?: Database["public"]["Enums"]["connection_relationship"]
          requester_id: string
          requester_label?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          receiver_id?: string
          receiver_label?: string | null
          relationship?: Database["public"]["Enums"]["connection_relationship"]
          requester_id?: string
          requester_label?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed: boolean | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          project_id: string
          target_date: string | null
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          target_date?: string | null
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh: string
          platform: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh: string
          platform?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh?: string
          platform?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          optional: boolean | null
          position: number | null
          quantity: number | null
          recipe_id: string | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          optional?: boolean | null
          position?: number | null
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          optional?: boolean | null
          position?: number | null
          quantity?: number | null
          recipe_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          connection_id: string | null
          cook_time: number | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          dietary_restrictions: string[] | null
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string | null
          is_favorite: boolean | null
          is_public: boolean | null
          name: string
          nutrition_info: Json | null
          prep_time: number | null
          rating: number | null
          servings: number | null
          source_url: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          video_thumbnail: string | null
        }
        Insert: {
          calories_per_serving?: number | null
          connection_id?: string | null
          cook_time?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          name: string
          nutrition_info?: Json | null
          prep_time?: number | null
          rating?: number | null
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          video_thumbnail?: string | null
        }
        Update: {
          calories_per_serving?: number | null
          connection_id?: string | null
          cook_time?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          name?: string
          nutrition_info?: Json | null
          prep_time?: number | null
          rating?: number | null
          servings?: number | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          video_thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          account_number_last4: string | null
          amount: number
          cancellation_url: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          due_day: number | null
          frequency: string
          id: string
          is_active: boolean | null
          is_auto_pay: boolean | null
          is_subscription: boolean | null
          name: string
          payment_method: string | null
          reminder_days_before: number[] | null
          subscription_service: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number_last4?: string | null
          amount: number
          cancellation_url?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          due_day?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          is_auto_pay?: boolean | null
          is_subscription?: boolean | null
          name: string
          payment_method?: string | null
          reminder_days_before?: number[] | null
          subscription_service?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number_last4?: string | null
          amount?: number
          cancellation_url?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          due_day?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_auto_pay?: boolean | null
          is_subscription?: boolean | null
          name?: string
          payment_method?: string | null
          reminder_days_before?: number[] | null
          subscription_service?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          active: boolean
          amount: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          days_before: number
          description: string
          end_date: string | null
          frequency: string
          id: string
          last_generated_date: string | null
          notes: string | null
          require_approval: boolean
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          amount: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          last_generated_date?: string | null
          notes?: string | null
          require_approval?: boolean
          start_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          amount?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          last_generated_date?: string | null
          notes?: string | null
          require_approval?: boolean
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retirement_accounts: {
        Row: {
          account_id: string
          allocation: Json | null
          annual_contribution_limit: number
          catch_up_limit: number | null
          contribution_year: number
          created_at: string
          current_year_contributions: number
          employer_contributions_ytd: number
          employer_match_limit: number | null
          employer_match_percentage: number | null
          employer_match_type: string | null
          has_employer_match: boolean
          has_vesting_schedule: boolean
          id: string
          is_family_coverage: boolean | null
          notes: string | null
          tax_treatment: string
          unvested_balance: number
          updated_at: string
          user_id: string
          vesting_cliff_years: number | null
          vesting_graded_years: number | null
          vesting_percentage: number
          vesting_schedule_type: string | null
        }
        Insert: {
          account_id: string
          allocation?: Json | null
          annual_contribution_limit: number
          catch_up_limit?: number | null
          contribution_year?: number
          created_at?: string
          current_year_contributions?: number
          employer_contributions_ytd?: number
          employer_match_limit?: number | null
          employer_match_percentage?: number | null
          employer_match_type?: string | null
          has_employer_match?: boolean
          has_vesting_schedule?: boolean
          id?: string
          is_family_coverage?: boolean | null
          notes?: string | null
          tax_treatment: string
          unvested_balance?: number
          updated_at?: string
          user_id: string
          vesting_cliff_years?: number | null
          vesting_graded_years?: number | null
          vesting_percentage?: number
          vesting_schedule_type?: string | null
        }
        Update: {
          account_id?: string
          allocation?: Json | null
          annual_contribution_limit?: number
          catch_up_limit?: number | null
          contribution_year?: number
          created_at?: string
          current_year_contributions?: number
          employer_contributions_ytd?: number
          employer_match_limit?: number | null
          employer_match_percentage?: number | null
          employer_match_type?: string | null
          has_employer_match?: boolean
          has_vesting_schedule?: boolean
          id?: string
          is_family_coverage?: boolean | null
          notes?: string | null
          tax_treatment?: string
          unvested_balance?: number
          updated_at?: string
          user_id?: string
          vesting_cliff_years?: number | null
          vesting_graded_years?: number | null
          vesting_percentage?: number
          vesting_schedule_type?: string | null
        }
        Relationships: []
      }
      retirement_contributions: {
        Row: {
          amount: number
          contribution_date: string
          contribution_type: string
          contribution_year: number
          created_at: string
          id: string
          notes: string | null
          retirement_account_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date: string
          contribution_type: string
          contribution_year: number
          created_at?: string
          id?: string
          notes?: string | null
          retirement_account_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          contribution_type?: string
          contribution_year?: number
          created_at?: string
          id?: string
          notes?: string | null
          retirement_account_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retirement_contributions_retirement_account_id_fkey"
            columns: ["retirement_account_id"]
            isOneToOne: false
            referencedRelation: "retirement_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      retirement_performance: {
        Row: {
          allocation_snapshot: Json | null
          balance: number
          created_at: string
          id: string
          rate_of_return: number | null
          retirement_account_id: string
          snapshot_date: string
          total_contributions: number
          total_gains: number
          user_id: string
        }
        Insert: {
          allocation_snapshot?: Json | null
          balance: number
          created_at?: string
          id?: string
          rate_of_return?: number | null
          retirement_account_id: string
          snapshot_date: string
          total_contributions: number
          total_gains: number
          user_id: string
        }
        Update: {
          allocation_snapshot?: Json | null
          balance?: number
          created_at?: string
          id?: string
          rate_of_return?: number | null
          retirement_account_id?: string
          snapshot_date?: string
          total_contributions?: number
          total_gains?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retirement_performance_retirement_account_id_fkey"
            columns: ["retirement_account_id"]
            isOneToOne: false
            referencedRelation: "retirement_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_history: {
        Row: {
          account_id: string
          balance: number
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          points_earned: number
          points_redeemed: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          balance: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          balance?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          color: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          is_recurring: boolean | null
          recurrence_rule: string | null
          start_time: string
          task_id: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_time: string
          task_id?: string | null
          title?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_rule?: string | null
          start_time?: string
          task_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sfh_challenge: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_day: number
          id: string
          start_date: string
          status: string
          tasks: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_day: number
          id?: string
          start_date: string
          status: string
          tasks: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_day?: number
          id?: string
          start_date?: string
          status?: string
          tasks?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sfh_challenge_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sfh_daily_checkins: {
        Row: {
          challenge_id: string
          created_at: string | null
          date: string
          day_number: number
          id: string
          notes: string | null
          photo: string | null
          task_completions: Json
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          date: string
          day_number: number
          id?: string
          notes?: string | null
          photo?: string | null
          task_completions?: Json
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          date?: string
          day_number?: number
          id?: string
          notes?: string | null
          photo?: string | null
          task_completions?: Json
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sfh_daily_checkins_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "sfh_challenge"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          actual_price: number | null
          added_by: string | null
          aisle: string | null
          assigned_store: string | null
          auto_added: boolean | null
          barcode: string | null
          best_stores: string[] | null
          brand: string | null
          category: string | null
          created_at: string
          estimated_price: number | null
          id: string
          image_url: string | null
          is_purchased: boolean | null
          name: string
          notes: string | null
          nutrition_info: Json | null
          position: number | null
          priority: string | null
          purchased_at: string | null
          purchased_by: string | null
          quantity: number | null
          recipe_id: string | null
          recurring: Json | null
          shopping_list_id: string
          store: string | null
          subcategory: string | null
          tags: string[] | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_price?: number | null
          added_by?: string | null
          aisle?: string | null
          assigned_store?: string | null
          auto_added?: boolean | null
          barcode?: string | null
          best_stores?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          is_purchased?: boolean | null
          name: string
          notes?: string | null
          nutrition_info?: Json | null
          position?: number | null
          priority?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: number | null
          recipe_id?: string | null
          recurring?: Json | null
          shopping_list_id: string
          store?: string | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_price?: number | null
          added_by?: string | null
          aisle?: string | null
          assigned_store?: string | null
          auto_added?: boolean | null
          barcode?: string | null
          best_stores?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          is_purchased?: boolean | null
          name?: string
          notes?: string | null
          nutrition_info?: Json | null
          position?: number | null
          priority?: string | null
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: number | null
          recipe_id?: string | null
          recurring?: Json | null
          shopping_list_id?: string
          store?: string | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shopping_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skin_observations: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          location: string | null
          observation_type: string
          other_factors: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_date: string | null
          severity: number | null
          suspected_product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          observation_type: string
          other_factors?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_date?: string | null
          severity?: number | null
          suspected_product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          observation_type?: string
          other_factors?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_date?: string | null
          severity?: number | null
          suspected_product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skin_observations_suspected_product_id_fkey"
            columns: ["suspected_product_id"]
            isOneToOne: false
            referencedRelation: "skincare_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skin_observations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skincare_logs: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          date: string
          id: string
          photo_urls: string[] | null
          products_used: string[] | null
          routine_id: string | null
          routine_type: string
          skin_condition: string | null
          skin_notes: string | null
          skipped_products: string[] | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string
          user_id: string
          weather: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          date: string
          id?: string
          photo_urls?: string[] | null
          products_used?: string[] | null
          routine_id?: string | null
          routine_type: string
          skin_condition?: string | null
          skin_notes?: string | null
          skipped_products?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id: string
          weather?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          photo_urls?: string[] | null
          products_used?: string[] | null
          routine_id?: string | null
          routine_type?: string
          skin_condition?: string | null
          skin_notes?: string | null
          skipped_products?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skincare_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "skincare_routine_summary"
            referencedColumns: ["routine_id"]
          },
          {
            foreignKeyName: "skincare_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "skincare_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skincare_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skincare_products: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          currently_using: boolean | null
          effectiveness: number | null
          expiry_date: string | null
          frequency: string | null
          id: string
          key_ingredients: string[] | null
          name: string
          notes: string | null
          order_in_routine: number | null
          price: number | null
          product_type: string | null
          purchase_date: string | null
          rating: number | null
          repurchase: boolean | null
          size: string | null
          skin_concerns: string[] | null
          started_using_date: string | null
          stopped_using_date: string | null
          updated_at: string
          usage_time: string[]
          user_id: string
          where_to_buy: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          currently_using?: boolean | null
          effectiveness?: number | null
          expiry_date?: string | null
          frequency?: string | null
          id?: string
          key_ingredients?: string[] | null
          name: string
          notes?: string | null
          order_in_routine?: number | null
          price?: number | null
          product_type?: string | null
          purchase_date?: string | null
          rating?: number | null
          repurchase?: boolean | null
          size?: string | null
          skin_concerns?: string[] | null
          started_using_date?: string | null
          stopped_using_date?: string | null
          updated_at?: string
          usage_time: string[]
          user_id: string
          where_to_buy?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          currently_using?: boolean | null
          effectiveness?: number | null
          expiry_date?: string | null
          frequency?: string | null
          id?: string
          key_ingredients?: string[] | null
          name?: string
          notes?: string | null
          order_in_routine?: number | null
          price?: number | null
          product_type?: string | null
          purchase_date?: string | null
          rating?: number | null
          repurchase?: boolean | null
          size?: string | null
          skin_concerns?: string[] | null
          started_using_date?: string | null
          stopped_using_date?: string | null
          updated_at?: string
          usage_time?: string[]
          user_id?: string
          where_to_buy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skincare_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skincare_routines: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          product_ids: string[]
          reminder_enabled: boolean | null
          reminder_time: string | null
          routine_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          product_ids: string[]
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          routine_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          product_ids?: string[]
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          routine_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skincare_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skincare_weekly_routines: {
        Row: {
          am_routine: string | null
          created_at: string
          day_of_week: number
          id: string
          notes: string | null
          pm_routine: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          am_routine?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          notes?: string | null
          pm_routine?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          am_routine?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          notes?: string | null
          pm_routine?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skincare_weekly_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          color: string | null
          created_at: string
          distance: number | null
          favorite: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          color?: string | null
          created_at?: string
          distance?: number | null
          favorite?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          color?: string | null
          created_at?: string
          distance?: number | null
          favorite?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_task_id: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time: number | null
          archived: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          attachments: string[] | null
          category: string
          completed_at: string | null
          created_at: string | null
          deleted: boolean | null
          deleted_at: string | null
          depends_on: string[] | null
          description: string | null
          due_date: string | null
          estimated_time: number | null
          follow_up_tasks: Json | null
          id: string
          is_blocked: boolean | null
          is_errand: boolean | null
          is_waiting_for: string | null
          location_address: string | null
          location_coordinates: Json | null
          location_name: string | null
          notes: string | null
          parent_id: string | null
          parent_recurring_id: string | null
          priority: string
          project_id: string | null
          recurrence_count: number | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          reminder: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          scheduled_time: string | null
          sidebar_section: string | null
          starred: boolean | null
          status: string
          tags: string[] | null
          title: string
          trigger_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_time?: number | null
          archived?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          follow_up_tasks?: Json | null
          id?: string
          is_blocked?: boolean | null
          is_errand?: boolean | null
          is_waiting_for?: string | null
          location_address?: string | null
          location_coordinates?: Json | null
          location_name?: string | null
          notes?: string | null
          parent_id?: string | null
          parent_recurring_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_count?: number | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          reminder?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scheduled_time?: string | null
          sidebar_section?: string | null
          starred?: boolean | null
          status?: string
          tags?: string[] | null
          title: string
          trigger_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          actual_time?: number | null
          archived?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          follow_up_tasks?: Json | null
          id?: string
          is_blocked?: boolean | null
          is_errand?: boolean | null
          is_waiting_for?: string | null
          location_address?: string | null
          location_coordinates?: Json | null
          location_name?: string | null
          notes?: string | null
          parent_id?: string | null
          parent_recurring_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_count?: number | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          reminder?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scheduled_time?: string | null
          sidebar_section?: string | null
          starred?: boolean | null
          status?: string
          tags?: string[] | null
          title?: string
          trigger_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_journal_entries: {
        Row: {
          content: string
          coordinates: Json | null
          country_code: string | null
          created_at: string | null
          date: string
          id: string
          is_private: boolean | null
          location: string | null
          mood: string | null
          photo_urls: string[] | null
          tags: string[] | null
          title: string
          trip_id: string | null
          updated_at: string | null
          user_id: string
          weather: string | null
        }
        Insert: {
          content: string
          coordinates?: Json | null
          country_code?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_private?: boolean | null
          location?: string | null
          mood?: string | null
          photo_urls?: string[] | null
          tags?: string[] | null
          title: string
          trip_id?: string | null
          updated_at?: string | null
          user_id: string
          weather?: string | null
        }
        Update: {
          content?: string
          coordinates?: Json | null
          country_code?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_private?: boolean | null
          location?: string | null
          mood?: string | null
          photo_urls?: string[] | null
          tags?: string[] | null
          title?: string
          trip_id?: string | null
          updated_at?: string | null
          user_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_journal_entries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trip_destinations: {
        Row: {
          arrival_date: string | null
          country_code: string
          country_name: string
          created_at: string | null
          days_staying: number | null
          departure_date: string | null
          id: string
          notes: string | null
          order_index: number
          trip_id: string
        }
        Insert: {
          arrival_date?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          days_staying?: number | null
          departure_date?: string | null
          id?: string
          notes?: string | null
          order_index: number
          trip_id: string
        }
        Update: {
          arrival_date?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          days_staying?: number | null
          departure_date?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_destinations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          country_code: string | null
          created_at: string | null
          currency: string
          date: string
          description: string
          id: string
          location: string | null
          notes: string | null
          paid_by: string | null
          payment_method: string | null
          receipt_photo_url: string | null
          shared_with: string[] | null
          split_amount: number | null
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          country_code?: string | null
          created_at?: string | null
          currency?: string
          date: string
          description: string
          id?: string
          location?: string | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          receipt_photo_url?: string | null
          shared_with?: string[] | null
          split_amount?: number | null
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          country_code?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string
          id?: string
          location?: string | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          receipt_photo_url?: string | null
          shared_with?: string[] | null
          split_amount?: number | null
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trip_itineraries: {
        Row: {
          activities: Json
          created_at: string | null
          date: string
          id: string
          notes: string | null
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities?: Json
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities?: Json
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_itineraries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trip_visa_requirements: {
        Row: {
          access_via: string | null
          created_at: string | null
          days_allowed: number | null
          destination_id: string
          estimated_cost: number | null
          id: string
          notes: string | null
          processing_days: number | null
          trip_id: string
          visa_type: string
        }
        Insert: {
          access_via?: string | null
          created_at?: string | null
          days_allowed?: number | null
          destination_id: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          processing_days?: number | null
          trip_id: string
          visa_type: string
        }
        Update: {
          access_via?: string | null
          created_at?: string | null
          days_allowed?: number | null
          destination_id?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          processing_days?: number | null
          trip_id?: string
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_visa_requirements_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "trip_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_visa_requirements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_amount: number | null
          budget_currency: string
          cities: string[] | null
          countries: string[]
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          highlights: string[] | null
          id: string
          name: string
          photo_urls: string[] | null
          rating: number | null
          start_date: string
          status: string
          total_spent: number | null
          travel_companions: string[] | null
          trip_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string
          cities?: string[] | null
          countries?: string[]
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          name: string
          photo_urls?: string[] | null
          rating?: number | null
          start_date: string
          status?: string
          total_spent?: number | null
          travel_companions?: string[] | null
          trip_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string
          cities?: string[] | null
          countries?: string[]
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          name?: string
          photo_urls?: string[] | null
          rating?: number | null
          start_date?: string
          status?: string
          total_spent?: number | null
          travel_companions?: string[] | null
          trip_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          focus_minutes: number
          focus_sessions: number
          goals_achieved: number
          habits_completed: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          rank_title: string
          tasks_completed: number
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          focus_minutes?: number
          focus_sessions?: number
          goals_achieved?: number
          habits_completed?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          rank_title?: string
          tasks_completed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          focus_minutes?: number
          focus_sessions?: number
          goals_achieved?: number
          habits_completed?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          rank_title?: string
          tasks_completed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_passports: {
        Row: {
          connection_id: string | null
          country_code: string
          country_name: string
          created_at: string | null
          expiry_date: string | null
          id: string
          is_primary: boolean | null
          issue_date: string | null
          passport_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_primary?: boolean | null
          issue_date?: string | null
          passport_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_primary?: boolean | null
          issue_date?: string | null
          passport_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_passports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_passports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_coaching_style: string | null
          ai_communication_style: string | null
          ai_learning_enabled: boolean | null
          ai_proactive_suggestions: boolean | null
          chronotype: string | null
          created_at: string | null
          date_format: string | null
          default_sharing_permissions: Json | null
          email_notifications_enabled: boolean | null
          home_location: Json | null
          id: string
          low_energy_end: string | null
          low_energy_start: string | null
          max_tasks_per_day: number | null
          notification_types: Json | null
          notifications_enabled: boolean | null
          peak_energy_end: string | null
          peak_energy_start: string | null
          preferred_deep_work_end: string | null
          preferred_deep_work_start: string | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_exceptions: Json | null
          quiet_hours_start: string | null
          saved_locations: Json | null
          scheduling_rules: Json | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          week_starts_on: number | null
          work_days: number[] | null
          work_hours_end: string | null
          work_hours_start: string | null
          work_location: Json | null
        }
        Insert: {
          ai_coaching_style?: string | null
          ai_communication_style?: string | null
          ai_learning_enabled?: boolean | null
          ai_proactive_suggestions?: boolean | null
          chronotype?: string | null
          created_at?: string | null
          date_format?: string | null
          default_sharing_permissions?: Json | null
          email_notifications_enabled?: boolean | null
          home_location?: Json | null
          id?: string
          low_energy_end?: string | null
          low_energy_start?: string | null
          max_tasks_per_day?: number | null
          notification_types?: Json | null
          notifications_enabled?: boolean | null
          peak_energy_end?: string | null
          peak_energy_start?: string | null
          preferred_deep_work_end?: string | null
          preferred_deep_work_start?: string | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_exceptions?: Json | null
          quiet_hours_start?: string | null
          saved_locations?: Json | null
          scheduling_rules?: Json | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          week_starts_on?: number | null
          work_days?: number[] | null
          work_hours_end?: string | null
          work_hours_start?: string | null
          work_location?: Json | null
        }
        Update: {
          ai_coaching_style?: string | null
          ai_communication_style?: string | null
          ai_learning_enabled?: boolean | null
          ai_proactive_suggestions?: boolean | null
          chronotype?: string | null
          created_at?: string | null
          date_format?: string | null
          default_sharing_permissions?: Json | null
          email_notifications_enabled?: boolean | null
          home_location?: Json | null
          id?: string
          low_energy_end?: string | null
          low_energy_start?: string | null
          max_tasks_per_day?: number | null
          notification_types?: Json | null
          notifications_enabled?: boolean | null
          peak_energy_end?: string | null
          peak_energy_start?: string | null
          preferred_deep_work_end?: string | null
          preferred_deep_work_start?: string | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_exceptions?: Json | null
          quiet_hours_start?: string | null
          saved_locations?: Json | null
          scheduling_rules?: Json | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          week_starts_on?: number | null
          work_days?: number[] | null
          work_hours_end?: string | null
          work_hours_start?: string | null
          work_location?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_emoji: string | null
          bio: string | null
          created_at: string | null
          current_streak: number | null
          id: string
          level: number | null
          longest_streak: number | null
          preferred_session_length: number | null
          title: string | null
          total_focus_time: number | null
          updated_at: string | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          avatar_emoji?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          preferred_session_length?: number | null
          title?: string | null
          total_focus_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          avatar_emoji?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          preferred_session_length?: number | null
          title?: string | null
          total_focus_time?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string | null
          value: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_visas: {
        Row: {
          connection_id: string | null
          country_code: string
          country_name: string
          created_at: string | null
          expiry_date: string
          id: string
          issue_date: string | null
          max_stay_days: number | null
          multiple_entry: boolean | null
          notes: string | null
          updated_at: string | null
          user_id: string
          visa_type: string | null
        }
        Insert: {
          connection_id?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          expiry_date: string
          id?: string
          issue_date?: string | null
          max_stay_days?: number | null
          multiple_entry?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
          visa_type?: string | null
        }
        Update: {
          connection_id?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string | null
          max_stay_days?: number | null
          multiple_entry?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_visas_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_visas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_format: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_login_at: string | null
          last_name: string | null
          password_hash: string
          theme: string | null
          timezone: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash: string
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash?: string
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      visa_requirements: {
        Row: {
          created_at: string
          days_allowed: number | null
          destination_country: string
          id: string
          passport_country: string
          requirement: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_allowed?: number | null
          destination_country: string
          id?: string
          passport_country: string
          requirement: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_allowed?: number | null
          destination_country?: string
          id?: string
          passport_country?: string
          requirement?: string
          updated_at?: string
        }
        Relationships: []
      }
      visited_locations: {
        Row: {
          city_name: string | null
          connection_id: string | null
          country_code: string
          country_name: string
          created_at: string | null
          favorite_place: boolean | null
          first_visit_date: string | null
          id: string
          island_name: string | null
          last_visit_date: string | null
          location_type: string
          national_park_id: string | null
          national_park_name: string | null
          notes: string | null
          rating: number | null
          region_name: string | null
          state_code: string | null
          state_name: string | null
          status: string
          total_days: number | null
          updated_at: string | null
          user_id: string | null
          visit_count: number | null
          visited_by: Json | null
        }
        Insert: {
          city_name?: string | null
          connection_id?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          favorite_place?: boolean | null
          first_visit_date?: string | null
          id?: string
          island_name?: string | null
          last_visit_date?: string | null
          location_type: string
          national_park_id?: string | null
          national_park_name?: string | null
          notes?: string | null
          rating?: number | null
          region_name?: string | null
          state_code?: string | null
          state_name?: string | null
          status?: string
          total_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_count?: number | null
          visited_by?: Json | null
        }
        Update: {
          city_name?: string | null
          connection_id?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          favorite_place?: boolean | null
          first_visit_date?: string | null
          id?: string
          island_name?: string | null
          last_visit_date?: string | null
          location_type?: string
          national_park_id?: string | null
          national_park_name?: string | null
          notes?: string | null
          rating?: number | null
          region_name?: string | null
          state_code?: string | null
          state_name?: string | null
          status?: string
          total_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_count?: number | null
          visited_by?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "visited_locations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "profile_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visited_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      finance_loans_with_stats: {
        Row: {
          account_id: string | null
          created_at: string | null
          current_balance: number | null
          extra_payment: number | null
          first_payment_date: string | null
          id: string | null
          interest_paid: number | null
          interest_rate: number | null
          lender: string | null
          loan_name: string | null
          loan_number: string | null
          loan_type: Database["public"]["Enums"]["finance_loan_type"] | null
          monthly_payment: number | null
          notes: string | null
          payment_count: number | null
          principal_amount: number | null
          principal_paid: number | null
          projected_payoff_date: string | null
          remaining_payments: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["finance_loan_status"] | null
          target_payoff_date: string | null
          term_months: number | null
          total_paid: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_loans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      insurance_policy_summary: {
        Row: {
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          auto_renew: boolean | null
          beneficiary_count: number | null
          claim_count: number | null
          coverage_amount: number | null
          created_at: string | null
          deductible: number | null
          documents: Json | null
          end_date: string | null
          id: string | null
          last_payment_date: string | null
          next_payment_date: string | null
          notes: string | null
          policy_name: string | null
          policy_number: string | null
          premium_amount: number | null
          premium_frequency: string | null
          provider: string | null
          renewal_date: string | null
          renewal_reminder_days: number | null
          start_date: string | null
          status: string | null
          total_claims_paid: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      loans_with_stats: {
        Row: {
          account_id: string | null
          created_at: string | null
          current_balance: number | null
          extra_payment: number | null
          first_payment_date: string | null
          id: string | null
          interest_paid: number | null
          interest_rate: number | null
          lender: string | null
          loan_name: string | null
          loan_number: string | null
          loan_type: string | null
          monthly_payment: number | null
          notes: string | null
          payment_count: number | null
          principal_amount: number | null
          principal_paid: number | null
          projected_payoff_date: string | null
          remaining_payments: number | null
          start_date: string | null
          status: string | null
          target_payoff_date: string | null
          term_months: number | null
          total_paid: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      recurring_transactions_upcoming: {
        Row: {
          account_id: string | null
          active: boolean | null
          amount: number | null
          auto_create: boolean | null
          category_id: string | null
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          days_before: number | null
          description: string | null
          end_date: string | null
          frequency: string | null
          id: string | null
          last_generated_date: string | null
          next_occurrence_date: string | null
          notes: string | null
          pending_count: number | null
          require_approval: boolean | null
          start_date: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          amount?: number | null
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string | null
          last_generated_date?: string | null
          next_occurrence_date?: never
          notes?: string | null
          pending_count?: never
          require_approval?: boolean | null
          start_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          amount?: number | null
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          days_before?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string | null
          last_generated_date?: string | null
          next_occurrence_date?: never
          notes?: string | null
          pending_count?: never
          require_approval?: boolean | null
          start_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      skincare_routine_summary: {
        Row: {
          categories_used: string[] | null
          is_active: boolean | null
          product_count: number | null
          routine_id: string | null
          routine_name: string | null
          routine_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skincare_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skincare_streaks: {
        Row: {
          best_streak: number | null
          current_streak: number | null
          last_completion_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
      travel_stats: {
        Row: {
          cities_visited: number | null
          completed_trips: number | null
          countries_visited: number | null
          islands_visited: number | null
          journal_entries: number | null
          parks_visited: number | null
          states_visited: number | null
          total_spent: number | null
          total_trips: number | null
          upcoming_trips: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visited_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "skincare_streaks"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      are_all_tasks_complete: {
        Args: { p_task_completions: Json }
        Returns: boolean
      }
      calculate_contribution_room: {
        Args: { p_annual_income: number; p_retirement_account_id: string }
        Returns: {
          employee_room: number
          employer_room: number
          is_over_50: boolean
          total_limit: number
        }[]
      }
      calculate_goal_progress: { Args: { goal_id: string }; Returns: number }
      calculate_next_occurrence: {
        Args: {
          p_day_of_month: number
          p_day_of_week: number
          p_frequency: string
          p_last_date: string
          p_start_date: string
        }
        Returns: string
      }
      calculate_skincare_streak: {
        Args: { p_user_id: string }
        Returns: {
          best_streak: number
          current_streak: number
          last_completion_date: string
        }[]
      }
      calculate_vested_balance: {
        Args: { p_employment_years: number; p_retirement_account_id: string }
        Returns: number
      }
      complete_cron_job: {
        Args: {
          p_job_id: string
          p_metadata?: Json
          p_records_affected?: number
          p_records_processed?: number
        }
        Returns: undefined
      }
      extract_merchant_name: { Args: { description: string }; Returns: string }
      fail_cron_job: {
        Args: {
          p_error_message: string
          p_error_stack?: string
          p_job_id: string
        }
        Returns: undefined
      }
      generate_pending_transactions: {
        Args: { p_user_id?: string }
        Returns: {
          amount: number
          description: string
          recurring_id: string
          scheduled_date: string
        }[]
      }
      get_active_challenge: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          current_day: number
          id: string
          start_date: string
          tasks: Json
        }[]
      }
      get_connections_with_users: {
        Args: never
        Returns: {
          accepted_at: string
          created_at: string
          id: string
          notes: string
          receiver_id: string
          receiver_label: string
          receiver_user: Json
          relationship: Database["public"]["Enums"]["connection_relationship"]
          requester_id: string
          requester_label: string
          requester_user: Json
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }[]
      }
      get_cron_job_stats: {
        Args: { p_days?: number }
        Returns: {
          avg_duration_ms: number
          failed_runs: number
          job_name: string
          last_run: string
          last_status: string
          successful_runs: number
          total_runs: number
        }[]
      }
      get_invitations_with_connections: {
        Args: never
        Returns: {
          connection: Json
          connection_id: string
          created_at: string
          expires_at: string
          id: string
          message: string
          proposed_permissions: Json
        }[]
      }
      get_or_create_user_preferences: {
        Args: { p_user_id: string }
        Returns: {
          ai_coaching_style: string | null
          ai_communication_style: string | null
          ai_learning_enabled: boolean | null
          ai_proactive_suggestions: boolean | null
          chronotype: string | null
          created_at: string | null
          date_format: string | null
          default_sharing_permissions: Json | null
          email_notifications_enabled: boolean | null
          home_location: Json | null
          id: string
          low_energy_end: string | null
          low_energy_start: string | null
          max_tasks_per_day: number | null
          notification_types: Json | null
          notifications_enabled: boolean | null
          peak_energy_end: string | null
          peak_energy_start: string | null
          preferred_deep_work_end: string | null
          preferred_deep_work_start: string | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_exceptions: Json | null
          quiet_hours_start: string | null
          saved_locations: Json | null
          scheduling_rules: Json | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          week_starts_on: number | null
          work_days: number[] | null
          work_hours_end: string | null
          work_hours_start: string | null
          work_location: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "user_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pending_invitations_for_email: {
        Args: { user_email: string }
        Returns: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          inviter_id: string
          inviter_label: string | null
          message: string | null
          proposed_permissions: Json | null
          relationship: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "pending_email_invitations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          payload: Json
          priority: string
          retry_count: number | null
          scheduled_for: string
          sent_at: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recent_conversations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          context_snapshot: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          messages: Json
          session_id: string
          started_at: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_routines_for_day_and_time: {
        Args: { p_day_of_week: number; p_time_slot: string; p_user_id: string }
        Returns: {
          created_at: string
          days_of_week: number[] | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          product_ids: string[]
          reminder_enabled: boolean | null
          reminder_time: string | null
          routine_type: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "skincare_routines"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_skincare_completion_stats: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          am_completions: number
          completed_days: number
          completion_rate: number
          pm_completions: number
          total_days: number
        }[]
      }
      get_today_checkin: {
        Args: { p_challenge_id: string }
        Returns: {
          id: string
          notes: string
          photo: string
          task_completions: Json
          weight: number
        }[]
      }
      get_upcoming_important_dates: {
        Args: { p_days_ahead?: number; p_user_id: string }
        Returns: {
          age: number
          date_type: string
          day: number
          days_until: number
          id: string
          month: number
          person_name: string
          year: number
        }[]
      }
      get_user_connections: {
        Args: { user_uuid: string }
        Returns: {
          accepted_at: string
          connection_id: string
          created_at: string
          label: string
          other_user_id: string
          relationship: Database["public"]["Enums"]["connection_relationship"]
        }[]
      }
      get_weekly_analytics: {
        Args: { p_user_id: string; p_week_start?: string }
        Returns: {
          avg_mood: number
          avg_productivity_score: number
          best_day: string
          total_focus_minutes: number
          total_habits_completed: number
          total_tasks_completed: number
          worst_day: string
        }[]
      }
      has_module_permission: {
        Args: {
          module_name: Database["public"]["Enums"]["shareable_module"]
          owner_uuid: string
          required_level: Database["public"]["Enums"]["module_permission_level"]
          viewer_uuid: string
        }
        Returns: boolean
      }
      initialize_budgets_from_templates: {
        Args: { p_month: string; p_user_id: string }
        Returns: number
      }
      invoke_scheduled_job: {
        Args: { p_job_type: string; p_params?: Json }
        Returns: undefined
      }
      log_automation_execution: {
        Args: {
          p_actions_executed?: Json
          p_error_message?: string
          p_execution_time_ms?: number
          p_rule_id: string
          p_success: boolean
          p_trigger_reason?: string
        }
        Returns: undefined
      }
      lookup_user_by_email: { Args: { user_email: string }; Returns: Json }
      mark_notification_failed: {
        Args: { p_error: string; p_notification_id: string }
        Returns: undefined
      }
      mark_notification_sent: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      queue_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_priority?: string
          p_scheduled_for?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      search_conversations: {
        Args: { p_limit?: number; p_query: string; p_user_id: string }
        Returns: {
          id: string
          message_count: number
          rank: number
          started_at: string
          summary: string
        }[]
      }
      start_cron_job: {
        Args: { p_job_name: string; p_job_type?: string; p_metadata?: Json }
        Returns: string
      }
      sync_goal_from_account: {
        Args: { p_goal_id: string }
        Returns: undefined
      }
      sync_goal_from_networth: {
        Args: { p_goal_id: string; p_month: string }
        Returns: undefined
      }
      upsert_habit_entry: {
        Args: {
          p_date: string
          p_habit_id: string
          p_notes: string
          p_value: number
        }
        Returns: {
          created_at: string | null
          date: string
          habit_id: string | null
          id: string
          mood: string | null
          notes: string | null
          user_id: string | null
          value: number | null
        }
        SetofOptions: {
          from: "*"
          to: "habit_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      connection_relationship:
        | "spouse"
        | "partner"
        | "friend"
        | "family"
        | "roommate"
        | "colleague"
        | "other"
      connection_status: "pending" | "active" | "blocked" | "archived"
      finance_account_type:
        | "checking"
        | "savings"
        | "credit"
        | "brokerage"
        | "loan"
        | "investment"
        | "401k"
        | "403b"
        | "traditional_ira"
        | "roth_ira"
        | "sep_ira"
        | "simple_ira"
        | "hsa"
      finance_benefit_frequency:
        | "annual"
        | "monthly"
        | "quarterly"
        | "once"
        | "per_use"
      finance_benefit_type:
        | "recurring_credit"
        | "travel_credit"
        | "protection"
        | "lounge_access"
        | "other"
      finance_contribution_type:
        | "employee"
        | "employer"
        | "rollover"
        | "catch_up"
      finance_employer_match_type: "percentage" | "fixed" | "tiered"
      finance_goal_type: "savings" | "debt"
      finance_loan_status: "active" | "paid_off" | "deferred" | "defaulted"
      finance_loan_type:
        | "auto"
        | "mortgage"
        | "personal"
        | "student"
        | "business"
        | "other"
      finance_offer_type: "cashback" | "statement_credit" | "bonus_points"
      finance_pending_status: "pending" | "approved" | "skipped" | "edited"
      finance_recurring_frequency:
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      finance_rewards_type: "points" | "miles" | "cashback"
      finance_spending_category:
        | "dining"
        | "travel"
        | "groceries"
        | "gas"
        | "online"
        | "all_other"
      finance_tax_treatment: "pre_tax" | "post_tax" | "tax_exempt"
      finance_txn_type: "debit" | "credit"
      finance_vesting_schedule_type: "immediate" | "cliff" | "graded"
      module_permission_level: "none" | "view" | "collaborate" | "merged"
      personal_care_frequency:
        | "daily"
        | "weekly"
        | "biweekly_monthly"
        | "every_2_8_weeks"
        | "custom"
      shareable_module:
        | "travel"
        | "visa"
        | "trip-planner"
        | "finances"
        | "shopping"
        | "meals"
        | "goals"
        | "habits"
        | "todos"
        | "notes"
        | "projects"
        | "journal"
        | "mood"
        | "period"
        | "seventy-five-hard"
        | "skincare"
        | "finance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_relationship: [
        "spouse",
        "partner",
        "friend",
        "family",
        "roommate",
        "colleague",
        "other",
      ],
      connection_status: ["pending", "active", "blocked", "archived"],
      finance_account_type: [
        "checking",
        "savings",
        "credit",
        "brokerage",
        "loan",
        "investment",
        "401k",
        "403b",
        "traditional_ira",
        "roth_ira",
        "sep_ira",
        "simple_ira",
        "hsa",
      ],
      finance_benefit_frequency: [
        "annual",
        "monthly",
        "quarterly",
        "once",
        "per_use",
      ],
      finance_benefit_type: [
        "recurring_credit",
        "travel_credit",
        "protection",
        "lounge_access",
        "other",
      ],
      finance_contribution_type: [
        "employee",
        "employer",
        "rollover",
        "catch_up",
      ],
      finance_employer_match_type: ["percentage", "fixed", "tiered"],
      finance_goal_type: ["savings", "debt"],
      finance_loan_status: ["active", "paid_off", "deferred", "defaulted"],
      finance_loan_type: [
        "auto",
        "mortgage",
        "personal",
        "student",
        "business",
        "other",
      ],
      finance_offer_type: ["cashback", "statement_credit", "bonus_points"],
      finance_pending_status: ["pending", "approved", "skipped", "edited"],
      finance_recurring_frequency: [
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      finance_rewards_type: ["points", "miles", "cashback"],
      finance_spending_category: [
        "dining",
        "travel",
        "groceries",
        "gas",
        "online",
        "all_other",
      ],
      finance_tax_treatment: ["pre_tax", "post_tax", "tax_exempt"],
      finance_txn_type: ["debit", "credit"],
      finance_vesting_schedule_type: ["immediate", "cliff", "graded"],
      module_permission_level: ["none", "view", "collaborate", "merged"],
      personal_care_frequency: [
        "daily",
        "weekly",
        "biweekly_monthly",
        "every_2_8_weeks",
        "custom",
      ],
      shareable_module: [
        "travel",
        "visa",
        "trip-planner",
        "finances",
        "shopping",
        "meals",
        "goals",
        "habits",
        "todos",
        "notes",
        "projects",
        "journal",
        "mood",
        "period",
        "seventy-five-hard",
        "skincare",
        "finance",
        "calendar",
        "nutrition",
        "together",
      ],
    },
  },
} as const
