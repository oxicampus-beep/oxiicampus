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
          size_gb: number
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
          size_gb: number
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
          size_gb?: number
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
          phone: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          store_activation_enabled: boolean
          store_activation_fee: number
          updated_at: string
        }
        Insert: {
          id?: number
          store_activation_enabled?: boolean
          store_activation_fee?: number
          updated_at?: string
        }
        Update: {
          id?: number
          store_activation_enabled?: boolean
          store_activation_fee?: number
          updated_at?: string
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
      purchase_data_package: {
        Args: { p_package_id: string; p_recipient_phone: string }
        Returns: string
      }
      wallet_topup: {
        Args: { p_amount: number }
        Returns: number
      }
    }
    Enums: {
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
