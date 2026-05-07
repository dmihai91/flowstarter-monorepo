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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_audit_logs: {
        Row: {
          action: string | null
          agent: string | null
          created_at: string
          encrypted_payload: string
          id: string
          ip: unknown
          pipeline_id: string | null
          route: string | null
          user_agent: string | null
          user_id: string
          username: string | null
          workspace_id: string | null
        }
        Insert: {
          action?: string | null
          agent?: string | null
          created_at?: string
          encrypted_payload: string
          id?: string
          ip?: unknown
          pipeline_id?: string | null
          route?: string | null
          user_agent?: string | null
          user_id: string
          username?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string | null
          agent?: string | null
          created_at?: string
          encrypted_payload?: string
          id?: string
          ip?: unknown
          pipeline_id?: string | null
          route?: string | null
          user_agent?: string | null
          user_id?: string
          username?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_constraint_profiles: {
        Row: {
          allowed_operations: Json
          created_at: string
          id: string
          is_default: boolean
          name: string
          system_prompt: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allowed_operations?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          system_prompt: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allowed_operations?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          system_prompt?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_constraint_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_products: {
        Row: {
          checkout_url: string | null
          created_at: string
          currency: string
          delivery_url: string | null
          fulfillment_type: string | null
          id: string
          inventory_policy: string
          inventory_quantity: number | null
          metadata: Json
          name: string
          price_amount: number | null
          product_type: string
          provider_price_id: string | null
          provider_product_id: string | null
          short_description: string | null
          slug: string | null
          status: string
          updated_at: string
          weight_grams: number | null
          workspace_id: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          currency?: string
          delivery_url?: string | null
          fulfillment_type?: string | null
          id?: string
          inventory_policy?: string
          inventory_quantity?: number | null
          metadata?: Json
          name: string
          price_amount?: number | null
          product_type?: string
          provider_price_id?: string | null
          provider_product_id?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          weight_grams?: number | null
          workspace_id: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          currency?: string
          delivery_url?: string | null
          fulfillment_type?: string | null
          id?: string
          inventory_policy?: string
          inventory_quantity?: number | null
          metadata?: Json
          name?: string
          price_amount?: number | null
          product_type?: string
          provider_price_id?: string | null
          provider_product_id?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          weight_grams?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          read_at: string | null
          responded_at: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          read_at?: string | null
          responded_at?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          read_at?: string | null
          responded_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          artifact_bytes: number | null
          artifact_sha256: string | null
          artifact_url: string | null
          deployed_by: string | null
          finished_at: string | null
          id: string
          metadata: Json
          rolled_back_from_id: string | null
          started_at: string
          status: string
          status_detail: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          artifact_bytes?: number | null
          artifact_sha256?: string | null
          artifact_url?: string | null
          deployed_by?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rolled_back_from_id?: string | null
          started_at?: string
          status?: string
          status_detail?: string | null
          version: number
          workspace_id: string
        }
        Update: {
          artifact_bytes?: number | null
          artifact_sha256?: string | null
          artifact_url?: string | null
          deployed_by?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rolled_back_from_id?: string | null
          started_at?: string
          status?: string
          status_detail?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_rolled_back_from_id_fkey"
            columns: ["rolled_back_from_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_sessions: {
        Row: {
          ended_at: string | null
          ended_reason: string | null
          id: string
          metadata: Json
          request_count: number
          started_at: string
          tokens_in: number
          tokens_out: number
          user_id: string
          user_role: string
          workspace_id: string
        }
        Insert: {
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          metadata?: Json
          request_count?: number
          started_at?: string
          tokens_in?: number
          tokens_out?: number
          user_id: string
          user_role: string
          workspace_id: string
        }
        Update: {
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          metadata?: Json
          request_count?: number
          started_at?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string
          user_role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_servers: {
        Row: {
          caddy_admin_url: string | null
          cloud_init_version: number
          created_at: string
          created_by: string | null
          decommissioned_at: string | null
          deploy_agent_secret_ref: string | null
          deploy_agent_url: string | null
          hetzner_server_id: string | null
          id: string
          ipv4: unknown
          ipv6: unknown
          location: string
          name: string
          notes: string | null
          provider: string
          server_type: string
          site_capacity: number
          sites_count: number
          status: string
          status_detail: string | null
          updated_at: string
        }
        Insert: {
          caddy_admin_url?: string | null
          cloud_init_version?: number
          created_at?: string
          created_by?: string | null
          decommissioned_at?: string | null
          deploy_agent_secret_ref?: string | null
          deploy_agent_url?: string | null
          hetzner_server_id?: string | null
          id?: string
          ipv4?: unknown
          ipv6?: unknown
          location?: string
          name: string
          notes?: string | null
          provider?: string
          server_type?: string
          site_capacity?: number
          sites_count?: number
          status?: string
          status_detail?: string | null
          updated_at?: string
        }
        Update: {
          caddy_admin_url?: string | null
          cloud_init_version?: number
          created_at?: string
          created_by?: string | null
          decommissioned_at?: string | null
          deploy_agent_secret_ref?: string | null
          deploy_agent_url?: string | null
          hetzner_server_id?: string | null
          id?: string
          ipv4?: unknown
          ipv6?: unknown
          location?: string
          name?: string
          notes?: string | null
          provider?: string
          server_type?: string
          site_capacity?: number
          sites_count?: number
          status?: string
          status_detail?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          extra: Json
          id: string
          ip_address: string | null
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          referrer: string | null
          source: string | null
          status: string
          updated_at: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          extra?: Json
          id?: string
          ip_address?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          extra?: Json
          id?: string
          ip_address?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          referrer?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clerk_user_id: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          clerk_user_id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          clerk_user_id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      setup_payment_milestones: {
        Row: {
          amount_minor: number
          approved_at: string | null
          created_at: string
          currency: string
          id: string
          milestone: string
          paid_at: string | null
          position: number
          status: string
          stripe_invoice_id: string | null
          stripe_invoice_url: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_minor: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          milestone: string
          paid_at?: string | null
          position: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_minor?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          milestone?: string
          paid_at?: string | null
          position?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setup_payment_milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_encrypted_secrets: {
        Row: {
          created_at: string
          encrypted_value: string
          id: string
          secret_name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          encrypted_value: string
          id?: string
          secret_name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          encrypted_value?: string
          id?: string
          secret_name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_encrypted_secrets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_hosts: {
        Row: {
          created_at: string
          hostname: string
          is_primary: boolean
          workspace_id: string
        }
        Insert: {
          created_at?: string
          hostname: string
          is_primary?: boolean
          workspace_id: string
        }
        Update: {
          created_at?: string
          hostname?: string
          is_primary?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_hosts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          clerk_user_id: string
          created_at: string
          role: string
          workspace_id: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          role: string
          workspace_id: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          billing_interval: string
          client_business_name: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          cloudflare_record_ids: Json
          cloudflare_zone_id: string | null
          commerce_mode: string
          commerce_notes: string | null
          commerce_product_count: number
          commerce_product_type: string
          commerce_provider: string
          commerce_requirements: Json
          commerce_status: string
          concierge_stage: string
          created_at: string
          deploy_status: string
          deposit_amount: number | null
          deposit_invoice_id: string | null
          deposit_invoice_url: string | null
          deposit_paid_at: string | null
          deposit_status: string
          final_amount: number | null
          final_invoice_id: string | null
          final_invoice_url: string | null
          final_paid_at: string | null
          final_status: string
          founding_locked_until: string | null
          hosting_server_id: string | null
          id: string
          is_founding: boolean
          last_deploy_id: string | null
          last_deployed_at: string | null
          monthly_fee: number | null
          name: string
          outstanding_payment: boolean
          setup_fee: number | null
          setup_go_live_at: string | null
          setup_mockup_approved_at: string | null
          setup_signed_at: string | null
          setup_staging_ready_at: string | null
          site_directory: string | null
          site_kind: string
          slug: string
          ssl_issued_at: string | null
          ssl_status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_next_billing: string | null
          subscription_rollover_remaining: number
          subscription_sessions_used_this_month: number
          subscription_status: string | null
          subscription_trial_ends: string | null
          tier_name: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          client_business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          cloudflare_record_ids?: Json
          cloudflare_zone_id?: string | null
          commerce_mode?: string
          commerce_notes?: string | null
          commerce_product_count?: number
          commerce_product_type?: string
          commerce_provider?: string
          commerce_requirements?: Json
          commerce_status?: string
          concierge_stage?: string
          created_at?: string
          deploy_status?: string
          deposit_amount?: number | null
          deposit_invoice_id?: string | null
          deposit_invoice_url?: string | null
          deposit_paid_at?: string | null
          deposit_status?: string
          final_amount?: number | null
          final_invoice_id?: string | null
          final_invoice_url?: string | null
          final_paid_at?: string | null
          final_status?: string
          founding_locked_until?: string | null
          hosting_server_id?: string | null
          id?: string
          is_founding?: boolean
          last_deploy_id?: string | null
          last_deployed_at?: string | null
          monthly_fee?: number | null
          name: string
          outstanding_payment?: boolean
          setup_fee?: number | null
          setup_go_live_at?: string | null
          setup_mockup_approved_at?: string | null
          setup_signed_at?: string | null
          setup_staging_ready_at?: string | null
          site_directory?: string | null
          site_kind: string
          slug: string
          ssl_issued_at?: string | null
          ssl_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_next_billing?: string | null
          subscription_rollover_remaining?: number
          subscription_sessions_used_this_month?: number
          subscription_status?: string | null
          subscription_trial_ends?: string | null
          tier_name?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          client_business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          cloudflare_record_ids?: Json
          cloudflare_zone_id?: string | null
          commerce_mode?: string
          commerce_notes?: string | null
          commerce_product_count?: number
          commerce_product_type?: string
          commerce_provider?: string
          commerce_requirements?: Json
          commerce_status?: string
          concierge_stage?: string
          created_at?: string
          deploy_status?: string
          deposit_amount?: number | null
          deposit_invoice_id?: string | null
          deposit_invoice_url?: string | null
          deposit_paid_at?: string | null
          deposit_status?: string
          final_amount?: number | null
          final_invoice_id?: string | null
          final_invoice_url?: string | null
          final_paid_at?: string | null
          final_status?: string
          founding_locked_until?: string | null
          hosting_server_id?: string | null
          id?: string
          is_founding?: boolean
          last_deploy_id?: string | null
          last_deployed_at?: string | null
          monthly_fee?: number | null
          name?: string
          outstanding_payment?: boolean
          setup_fee?: number | null
          setup_go_live_at?: string | null
          setup_mockup_approved_at?: string | null
          setup_signed_at?: string | null
          setup_staging_ready_at?: string | null
          site_directory?: string | null
          site_kind?: string
          slug?: string
          ssl_issued_at?: string | null
          ssl_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_next_billing?: string | null
          subscription_rollover_remaining?: number
          subscription_sessions_used_this_month?: number
          subscription_status?: string | null
          subscription_trial_ends?: string | null
          tier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_hosting_server_id_fkey"
            columns: ["hosting_server_id"]
            isOneToOne: false
            referencedRelation: "hosting_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_last_deploy_fk"
            columns: ["last_deploy_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_security_audit_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
