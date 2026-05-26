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
      cart_events: {
        Row: {
          bundle_label: string | null
          created_at: string
          fbclid: string | null
          id: string
          landing_page: string | null
          price: number | null
          quantity: number
          referrer: string | null
          source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant_id: string
          visitor_id: string | null
        }
        Insert: {
          bundle_label?: string | null
          created_at?: string
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          price?: number | null
          quantity?: number
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id: string
          visitor_id?: string | null
        }
        Update: {
          bundle_label?: string | null
          created_at?: string
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          price?: number | null
          quantity?: number
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      checkout_events: {
        Row: {
          bundle_labels: string[] | null
          created_at: string
          currency: string | null
          discount_code: string | null
          display_latency_ms: number | null
          displayed: boolean
          fbclid: string | null
          id: string
          landing_page: string | null
          referrer: string | null
          source: string | null
          total_items: number
          total_price: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant_ids: string[] | null
          visitor_id: string | null
        }
        Insert: {
          bundle_labels?: string[] | null
          created_at?: string
          currency?: string | null
          discount_code?: string | null
          display_latency_ms?: number | null
          displayed?: boolean
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          source?: string | null
          total_items?: number
          total_price?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_ids?: string[] | null
          visitor_id?: string | null
        }
        Update: {
          bundle_labels?: string[] | null
          created_at?: string
          currency?: string | null
          discount_code?: string | null
          display_latency_ms?: number | null
          displayed?: boolean
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          source?: string | null
          total_items?: number
          total_price?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_ids?: string[] | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      friction_events: {
        Row: {
          created_at: string
          device: string | null
          element: string | null
          id: string
          language: string | null
          market: string | null
          message: string | null
          metadata: Json | null
          page_path: string | null
          severity: string
          type: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          element?: string | null
          id?: string
          language?: string | null
          market?: string | null
          message?: string | null
          metadata?: Json | null
          page_path?: string | null
          severity?: string
          type: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          element?: string | null
          id?: string
          language?: string | null
          market?: string | null
          message?: string | null
          metadata?: Json | null
          page_path?: string | null
          severity?: string
          type?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          currency: string | null
          device: string | null
          fbclid: string | null
          id: string
          landing_page: string | null
          language: string | null
          market: string | null
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          step: string
          step_value: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value: number | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          device?: string | null
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          market?: string | null
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          step: string
          step_value?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          device?: string | null
          fbclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          market?: string | null
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          step?: string
          step_value?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
          visitor_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
