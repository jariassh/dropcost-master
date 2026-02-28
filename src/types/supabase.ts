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
      costeos: {
        Row: {
          campaign_id_meta: string | null
          cancelacion_pre_envio_porcentaje: number | null
          comision_recaudo_porcentaje: number | null
          costo_producto: number
          cpa_promedio: number
          created_at: string
          flete_envio: number
          id: string
          margen_deseado_porcentaje: number | null
          meta_asset_url: string | null
          meta_campana_id: string | null
          nombre_producto: string
          otros_gastos: number | null
          precio_sugerido: number
          product_id_shopify: string | null
          roas_objetivo: number | null
          sku: string | null
          tasa_devolucion_porcentaje: number | null
          tienda_id: string
          updated_at: string
          utilidad_neta: number
          viabilidad_color: string | null
        }
        Insert: {
          campaign_id_meta?: string | null
          cancelacion_pre_envio_porcentaje?: number | null
          comision_recaudo_porcentaje?: number | null
          costo_producto?: number
          cpa_promedio?: number
          created_at?: string
          flete_envio?: number
          id?: string
          margen_deseado_porcentaje?: number | null
          meta_asset_url?: string | null
          meta_campana_id?: string | null
          nombre_producto: string
          otros_gastos?: number | null
          precio_sugerido: number
          product_id_shopify?: string | null
          roas_objetivo?: number | null
          sku?: string | null
          tasa_devolucion_porcentaje?: number | null
          tienda_id: string
          updated_at?: string
          utilidad_neta: number
          viabilidad_color?: string | null
        }
        Update: {
          campaign_id_meta?: string | null
          cancelacion_pre_envio_porcentaje?: number | null
          comision_recaudo_porcentaje?: number | null
          costo_producto?: number
          cpa_promedio?: number
          created_at?: string
          flete_envio?: number
          id?: string
          margen_deseado_porcentaje?: number | null
          meta_asset_url?: string | null
          meta_campana_id?: string | null
          nombre_producto?: string
          otros_gastos?: number | null
          precio_sugerido?: number
          product_id_shopify?: string | null
          roas_objetivo?: number | null
          sku?: string | null
          tasa_devolucion_porcentaje?: number | null
          tienda_id?: string
          updated_at?: string
          utilidad_neta?: number
          viabilidad_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "costeos_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          cpa_promedio: number | null
          fecha: string
          gasto_publicidad: number | null
          id: string
          ingresos_totales: number | null
          last_calculation: string | null
          margen_real: number | null
          roas_real: number | null
          tasa_cancelacion_pre_envio: number | null
          tasa_entrega_neta: number | null
          tienda_id: string
          ventas_count: number | null
        }
        Insert: {
          cpa_promedio?: number | null
          fecha: string
          gasto_publicidad?: number | null
          id?: string
          ingresos_totales?: number | null
          last_calculation?: string | null
          margen_real?: number | null
          roas_real?: number | null
          tasa_cancelacion_pre_envio?: number | null
          tasa_entrega_neta?: number | null
          tienda_id: string
          ventas_count?: number | null
        }
        Update: {
          cpa_promedio?: number | null
          fecha?: string
          gasto_publicidad?: number | null
          id?: string
          ingresos_totales?: number | null
          last_calculation?: string | null
          margen_real?: number | null
          roas_real?: number | null
          tasa_cancelacion_pre_envio?: number | null
          tasa_entrega_neta?: number | null
          tienda_id?: string
          ventas_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_metrics_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      data_meta_ads: {
        Row: {
          clics: number | null
          conversiones: number | null
          cpa_real: number | null
          estado_campana: string | null
          fecha_creacion_campana: string | null
          fecha_sincronizacion: string
          gasto_real: number | null
          id: string
          id_campana_meta: string
          id_cuenta_publicidad: string | null
          impresiones: number | null
          moneda: string | null
          nombre_campana: string | null
          nombre_cuenta: string | null
          presupuesto_diario: number | null
          usuario_id: string
          valor_acciones: number | null
        }
        Insert: {
          clics?: number | null
          conversiones?: number | null
          cpa_real?: number | null
          estado_campana?: string | null
          fecha_creacion_campana?: string | null
          fecha_sincronizacion?: string
          gasto_real?: number | null
          id?: string
          id_campana_meta: string
          id_cuenta_publicidad?: string | null
          impresiones?: number | null
          moneda?: string | null
          nombre_campana?: string | null
          nombre_cuenta?: string | null
          presupuesto_diario?: number | null
          usuario_id: string
          valor_acciones?: number | null
        }
        Update: {
          clics?: number | null
          conversiones?: number | null
          cpa_real?: number | null
          estado_campana?: string | null
          fecha_creacion_campana?: string | null
          fecha_sincronizacion?: string
          gasto_real?: number | null
          id?: string
          id_campana_meta?: string
          id_cuenta_publicidad?: string | null
          impresiones?: number | null
          moneda?: string | null
          nombre_campana?: string | null
          nombre_cuenta?: string | null
          presupuesto_diario?: number | null
          usuario_id?: string
          valor_acciones?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_meta_ads_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_shopify_orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          order_number: string | null
          shopify_created_at: string | null
          shopify_order_id: number
          shopify_updated_at: string | null
          subtotal_price: number | null
          tienda_id: string
          total_price: number | null
          total_tax: number | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          order_number?: string | null
          shopify_created_at?: string | null
          shopify_order_id: number
          shopify_updated_at?: string | null
          subtotal_price?: number | null
          tienda_id: string
          total_price?: number | null
          total_tax?: number | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          order_number?: string | null
          shopify_created_at?: string | null
          shopify_order_id?: number
          shopify_updated_at?: string | null
          subtotal_price?: number | null
          tienda_id?: string
          total_price?: number | null
          total_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_shopify_orders_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content_html: string | null
          content_mjml: string | null
          created_at: string
          id: string
          nombre: string
          slug: string
          subject: string
        }
        Insert: {
          content_html?: string | null
          content_mjml?: string | null
          created_at?: string
          id?: string
          nombre: string
          slug: string
          subject: string
        }
        Update: {
          content_html?: string | null
          content_mjml?: string | null
          created_at?: string
          id?: string
          nombre?: string
          slug?: string
          subject?: string
        }
        Relationships: []
      }
      integraciones: {
        Row: {
          config_sync: Json | null
          created_at: string
          credenciales_encriptadas: string | null
          estado: string
          id: string
          tienda_id: string | null
          tipo: string
          ultima_sincronizacion: string | null
          usuario_id: string | null
        }
        Insert: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          tienda_id?: string | null
          tipo: string
          ultima_sincronizacion?: string | null
          usuario_id?: string | null
        }
        Update: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          tienda_id?: string | null
          tipo?: string
          ultima_sincronizacion?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integraciones_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integraciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          limits: Json
          name: string
          price_monthly: number
          price_semiannual: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          limits?: Json
          name: string
          price_monthly: number
          price_semiannual?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          limits?: Json
          name?: string
          price_monthly?: number
          price_semiannual?: number | null
          slug?: string
        }
        Relationships: []
      }
      referidos_lideres: {
        Row: {
          banco_info: Json | null
          codigo_referido: string
          created_at: string
          email: string
          estado: string
          id: string
          nombre: string
          porcentaje_comision: number
          total_clicks: number | null
          total_comisiones_generadas: number | null
          total_usuarios_referidos: number | null
          user_id: string | null
        }
        Insert: {
          banco_info?: Json | null
          codigo_referido: string
          created_at?: string
          email: string
          estado?: string
          id?: string
          nombre: string
          porcentaje_comision?: number
          total_clicks?: number | null
          total_comisiones_generadas?: number | null
          total_usuarios_referidos?: number | null
          user_id?: string | null
        }
        Update: {
          banco_info?: Json | null
          codigo_referido?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          nombre?: string
          porcentaje_comision?: number
          total_clicks?: number | null
          total_comisiones_generadas?: number | null
          total_usuarios_referidos?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referidos_lideres_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referidos_usuarios: {
        Row: {
          fecha_registro: string
          id: string
          lider_id: string
          usuario_id: string
        }
        Insert: {
          fecha_registro?: string
          id?: string
          lider_id: string
          usuario_id: string
        }
        Update: {
          fecha_registro?: string
          id?: string
          lider_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referidos_usuarios_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "referidos_lideres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tiendas: {
        Row: {
          active: boolean | null
          configuracion: Json | null
          created_at: string
          id: string
          logo_url: string | null
          moneda: string | null
          nombre: string
          pais: string
          shopify_domain: string | null
          usuario_id: string
          webhook_short_id: string | null
        }
        Insert: {
          active?: boolean | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          moneda?: string | null
          nombre: string
          pais: string
          shopify_domain?: string | null
          usuario_id: string
          webhook_short_id?: string | null
        }
        Update: {
          active?: boolean | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          moneda?: string | null
          nombre?: string
          pais?: string
          shopify_domain?: string | null
          usuario_id?: string
          webhook_short_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiendas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          "2fa_habilitado": boolean | null
          apellidos: string | null
          avatar_url: string | null
          bank_info: Json | null
          codigo_referido_personal: string | null
          created_at: string
          dias_restantes: number | null
          email: string
          email_verificado: boolean | null
          estado_suscripcion: string | null
          fecha_vencimiento_plan: string | null
          id: string
          nombres: string | null
          pais: string | null
          plan_id: string | null
          plan_periodo: string | null
          plan_precio_pagado: number | null
          rol: string | null
          session_token: string | null
          telefono: string | null
          updated_at: string
          wallet_saldo: number | null
        }
        Insert: {
          "2fa_habilitado"?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bank_info?: Json | null
          codigo_referido_personal?: string | null
          created_at?: string
          dias_restantes?: number | null
          email: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_vencimiento_plan?: string | null
          id: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          plan_periodo?: string | null
          plan_precio_pagado?: number | null
          rol?: string | null
          session_token?: string | null
          telefono?: string | null
          updated_at?: string
          wallet_saldo?: number | null
        }
        Update: {
          "2fa_habilitado"?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bank_info?: Json | null
          codigo_referido_personal?: string | null
          created_at?: string
          dias_restantes?: number | null
          email?: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_vencimiento_plan?: string | null
          id?: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          plan_periodo?: string | null
          plan_precio_pagado?: number | null
          rol?: string | null
          session_token?: string | null
          telefono?: string | null
          updated_at?: string
          wallet_saldo?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_kpis: {
        Args: { p_end_date: string; p_start_date: string; p_tienda_id: string }
        Returns: {
          cpa_promedio: number
          fecha: string
          gasto_publicidad: number
          ingresos_totales: number
          margen_real: number
          roas_real: number
          ventas_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
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
