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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      afa_registrations: {
        Row: {
          created_at: string
          dob: string
          full_name: string
          id: string
          id_number: string
          network: Database["public"]["Enums"]["network_type"]
          phone: string
          region: string | null
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dob: string
          full_name: string
          id?: string
          id_number: string
          network: Database["public"]["Enums"]["network_type"]
          phone: string
          region?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          dob?: string
          full_name?: string
          id?: string
          id_number?: string
          network?: Database["public"]["Enums"]["network_type"]
          phone?: string
          region?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean
          api_key: string
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          active?: boolean
          api_key?: string
          created_at?: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          active?: boolean
          api_key?: string
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      data_orders: {
        Row: {
          created_at: string
          id: string
          network: Database["public"]["Enums"]["network_type"]
          package_id: string | null
          price: number
          provider_error: string | null
          provider_order_id: string | null
          provider_reference: string | null
          provider_status: string | null
          recipient_phone: string
          size_gb: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          network: Database["public"]["Enums"]["network_type"]
          package_id?: string | null
          price: number
          provider_error?: string | null
          provider_order_id?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          recipient_phone: string
          size_gb: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          network?: Database["public"]["Enums"]["network_type"]
          package_id?: string | null
          price?: number
          provider_error?: string | null
          provider_order_id?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          recipient_phone?: string
          size_gb?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "data_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      data_packages: {
        Row: {
          active: boolean
          agent_price: number
          created_at: string
          id: string
          network: Database["public"]["Enums"]["network_type"]
          provider_cost: number | null
          size_gb: number
          swift_package_id: string | null
          updated_at: string
          user_price: number
          validity: string
        }
        Insert: {
          active?: boolean
          agent_price: number
          created_at?: string
          id?: string
          network: Database["public"]["Enums"]["network_type"]
          provider_cost?: number | null
          size_gb: number
          swift_package_id?: string | null
          updated_at?: string
          user_price: number
          validity?: string
        }
        Update: {
          active?: boolean
          agent_price?: number
          created_at?: string
          id?: string
          network?: Database["public"]["Enums"]["network_type"]
          provider_cost?: number | null
          size_gb?: number
          swift_package_id?: string | null
          updated_at?: string
          user_price?: number
          validity?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          created_at: string
          description: string
          id: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_spin_at: string | null
          phone: string | null
          points_balance: number
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_spin_at?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_spin_at?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          meta: Json
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_wheel_spins: {
        Row: {
          claimed: boolean
          created_at: string
          data_gb: number | null
          data_order_id: string | null
          id: string
          network: Database["public"]["Enums"]["network_type"] | null
          points_awarded: number | null
          prize_type: string
          recipient_phone: string | null
          segment: number
          user_id: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          data_gb?: number | null
          data_order_id?: string | null
          id?: string
          network?: Database["public"]["Enums"]["network_type"] | null
          points_awarded?: number | null
          prize_type: string
          recipient_phone?: string | null
          segment: number
          user_id: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          data_gb?: number | null
          data_order_id?: string | null
          id?: string
          network?: Database["public"]["Enums"]["network_type"] | null
          points_awarded?: number | null
          prize_type?: string
          recipient_phone?: string | null
          segment?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_wheel_spins_data_order_id_fkey"
            columns: ["data_order_id"]
            isOneToOne: false
            referencedRelation: "data_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spin_wheel_spins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "platform_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          active: boolean
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          severity: Database["public"]["Enums"]["announcement_severity"]
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          severity?: Database["public"]["Enums"]["announcement_severity"]
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          severity?: Database["public"]["Enums"]["announcement_severity"]
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          maintenance_message: string | null
          maintenance_mode: boolean
          purchases_enabled: boolean
          referrals_enabled: boolean
          spin_wheel_enabled: boolean
          store_activation_enabled: boolean
          store_activation_fee: number
          sub_agent_activation_fee: number
          updated_at: string
        }
        Insert: {
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          purchases_enabled?: boolean
          referrals_enabled?: boolean
          spin_wheel_enabled?: boolean
          store_activation_enabled?: boolean
          store_activation_fee?: number
          sub_agent_activation_fee?: number
          updated_at?: string
        }
        Update: {
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          purchases_enabled?: boolean
          referrals_enabled?: boolean
          spin_wheel_enabled?: boolean
          store_activation_enabled?: boolean
          store_activation_fee?: number
          sub_agent_activation_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      auto_renewal_schedules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          interval_days: number
          last_run_at: string | null
          next_run_at: string
          package_id: string
          recipient_phone: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          interval_days: number
          last_run_at?: string | null
          next_run_at?: string
          package_id: string
          recipient_phone: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          interval_days?: number
          last_run_at?: string | null
          next_run_at?: string
          package_id?: string
          recipient_phone?: string
          user_id?: string
        }
        Relationships: []
      }
      airtime_orders: {
        Row: {
          amount: number
          created_at: string
          id: string
          network: string
          recipient_phone: string
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          network: string
          recipient_phone: string
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          network?: string
          recipient_phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
        }
        Relationships: []
      }
      utility_orders: {
        Row: {
          account_number: string
          amount: number
          created_at: string
          id: string
          meta: Json
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
          utility_type: string
        }
        Insert: {
          account_number: string
          amount: number
          created_at?: string
          id?: string
          meta?: Json
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
          utility_type: string
        }
        Update: {
          account_number?: string
          amount?: number
          created_at?: string
          id?: string
          meta?: Json
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
          utility_type?: string
        }
        Relationships: []
      }
      result_checker_products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          slug?: string
        }
        Relationships: []
      }
      result_checker_orders: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
          voucher_codes: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
          voucher_codes?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string
          voucher_codes?: string[]
        }
        Relationships: []
      }
      bulk_disbursement_jobs: {
        Row: {
          created_at: string
          failed_count: number
          id: string
          package_id: string
          status: string
          success_count: number
          total_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_count?: number
          id?: string
          package_id: string
          status?: string
          success_count?: number
          total_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          failed_count?: number
          id?: string
          package_id?: string
          status?: string
          success_count?: number
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      bulk_disbursement_items: {
        Row: {
          created_at: string
          data_order_id: string | null
          error_message: string | null
          id: string
          job_id: string
          recipient_phone: string
          status: string
        }
        Insert: {
          created_at?: string
          data_order_id?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          recipient_phone: string
          status?: string
        }
        Update: {
          created_at?: string
          data_order_id?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          recipient_phone?: string
          status?: string
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          created_at: string
          id: string
          name: string | null
          network: string | null
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          network?: string | null
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          network?: string | null
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          active: boolean
          audience: string
          created_at: string
          cta_text: string | null
          ends_at: string | null
          id: string
          image_path: string | null
          image_url: string | null
          link_url: string | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          active?: boolean
          audience?: string
          created_at?: string
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean
          audience?: string
          created_at?: string
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_amount: number
          network: Database["public"]["Enums"]["network_type"] | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number
          network?: Database["public"]["Enums"]["network_type"] | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number
          network?: Database["public"]["Enums"]["network_type"] | null
          uses_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_agents: {
        Row: {
          activation_fee_paid: number
          created_at: string
          id: string
          notes: string | null
          parent_store_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_fee_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          parent_store_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_fee_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          parent_store_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          user_id: string
          whatsapp: string
          whatsapp_bot_enabled: boolean
          whatsapp_bot_greeting: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          user_id: string
          whatsapp: string
          whatsapp_bot_enabled?: boolean
          whatsapp_bot_greeting?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
          whatsapp_bot_enabled?: boolean
          whatsapp_bot_greeting?: string | null
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          created_at: string
          customer_phone: string
          id: string
          package_id: string | null
          price: number
          status: Database["public"]["Enums"]["order_status"]
          store_owner_id: string
        }
        Insert: {
          created_at?: string
          customer_phone: string
          id?: string
          package_id?: string | null
          price: number
          status?: Database["public"]["Enums"]["order_status"]
          store_owner_id: string
        }
        Update: {
          created_at?: string
          customer_phone?: string
          id?: string
          package_id?: string | null
          price?: number
          status?: Database["public"]["Enums"]["order_status"]
          store_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "store_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      store_packages: {
        Row: {
          active: boolean
          cost_price: number | null
          created_at: string
          data_package_id: string | null
          id: string
          name: string
          network: Database["public"]["Enums"]["network_type"]
          price: number
          size_gb: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cost_price?: number | null
          created_at?: string
          data_package_id?: string | null
          id?: string
          name: string
          network: Database["public"]["Enums"]["network_type"]
          price: number
          size_gb: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cost_price?: number | null
          created_at?: string
          data_package_id?: string | null
          id?: string
          name?: string
          network?: Database["public"]["Enums"]["network_type"]
          price?: number
          size_gb?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_packages_data_package_id_fkey"
            columns: ["data_package_id"]
            isOneToOne: false
            referencedRelation: "data_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      store_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          momo_network: string
          momo_number: string
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          momo_network: string
          momo_number: string
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          momo_network?: string
          momo_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          meta: Json | null
          status: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          status?: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          status?: Database["public"]["Enums"]["tx_status"]
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_points: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: number
      }
      admin_adjust_wallet: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: number
      }
      admin_log_action: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_meta?: Json
        }
        Returns: string
      }
      admin_update_sub_agent: {
        Args: { p_notes?: string; p_status: string; p_sub_agent_id: string }
        Returns: string
      }
      apply_sub_agent: {
        Args: { p_parent_store_slug: string }
        Returns: string
      }
      bulk_purchase_data: {
        Args: { p_package_id: string; p_phones: string[] }
        Returns: string
      }
      cancel_auto_renewal: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      create_auto_renewal: {
        Args: { p_interval_days: number; p_package_id: string; p_recipient_phone: string }
        Returns: string
      }
      run_auto_renewal: {
        Args: { p_schedule_id: string }
        Returns: string
      }
      purchase_airtime: {
        Args: { p_amount: number; p_network: string; p_recipient_phone: string }
        Returns: string
      }
      purchase_result_checker: {
        Args: { p_product_slug: string; p_quantity?: number }
        Returns: string
      }
      purchase_utility: {
        Args: { p_account_number: string; p_amount: number; p_meta?: Json; p_utility_type: string }
        Returns: string
      }
      get_agent_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_store: {
        Args: { p_name: string; p_whatsapp: string; p_slug: string }
        Returns: string
      }
      ensure_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agent: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      api_purchase_data_package: {
        Args: { p_package_id: string; p_recipient_phone: string; p_user_id: string }
        Returns: string
      }
      apply_referral_on_signup: {
        Args: { p_referral_code: string }
        Returns: boolean
      }
      claim_spin_data_prize: {
        Args: {
          p_network: Database["public"]["Enums"]["network_type"]
          p_recipient_phone: string
          p_spin_id: string
        }
        Returns: string
      }
      get_rewards_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      redeem_points_for_data: {
        Args: {
          p_network: Database["public"]["Enums"]["network_type"]
          p_recipient_phone: string
        }
        Returns: string
      }
      spin_wheel: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_notification_inbox: {
        Args: Record<PropertyKey, never>
        Returns: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          severity: Database["public"]["Enums"]["announcement_severity"]
          title: string
        }[]
      }
      get_network_health_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_sentinel_alerts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      purchase_data_package: {
        Args: {
          p_package_id: string
          p_promo_code?: string
          p_recipient_phone: string
        }
        Returns: string
      }
      track_orders_by_phone: {
        Args: { p_phone: string }
        Returns: {
          contact_phone: string
          created_at: string
          network: string
          order_id: string
          order_type: string
          price: number
          size_gb: number
          status: Database["public"]["Enums"]["order_status"]
          store_name: string
          updated_at: string
        }[]
      }
      wallet_topup: {
        Args: { p_amount: number }
        Returns: number
      }
    }
    Enums: {
      announcement_audience: "all" | "users" | "agents"
      announcement_severity: "info" | "warning" | "urgent"
      app_role: "admin" | "user"
      network_type:
        | "mtn"
        | "airteltigo_ishare"
        | "airteltigo_bigtime"
        | "telecel"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      tx_status: "pending" | "success" | "failed"
      tx_type: "topup" | "purchase" | "refund" | "withdrawal" | "store_credit"
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
      announcement_audience: ["all", "users", "agents"],
      announcement_severity: ["info", "warning", "urgent"],
      app_role: ["admin", "user"],
      network_type: [
        "mtn",
        "airteltigo_ishare",
        "airteltigo_bigtime",
        "telecel",
      ],
      order_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      tx_status: ["pending", "success", "failed"],
      tx_type: ["topup", "purchase", "refund", "withdrawal", "store_credit"],
    },
  },
} as const
