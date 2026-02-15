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
      acortador_enlaces: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          slug: string
          titulo: string | null
          url_original: string
          usuario_id: string | null
          visitas_totales: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          slug: string
          titulo?: string | null
          url_original: string
          usuario_id?: string | null
          visitas_totales?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          slug?: string
          titulo?: string | null
          url_original?: string
          usuario_id?: string | null
          visitas_totales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acortador_enlaces_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_trafico: {
        Row: {
          dispositivo: string | null
          eventos_conversion: Json | null
          fecha_evento: string
          id: string
          link_id: string | null
          pais_visita: string | null
          referentes: string | null
          tienda_id: string | null
        }
        Insert: {
          dispositivo?: string | null
          eventos_conversion?: Json | null
          fecha_evento?: string
          id?: string
          link_id?: string | null
          pais_visita?: string | null
          referentes?: string | null
          tienda_id?: string | null
        }
        Update: {
          dispositivo?: string | null
          eventos_conversion?: Json | null
          fecha_evento?: string
          id?: string
          link_id?: string | null
          pais_visita?: string | null
          referentes?: string | null
          tienda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_trafico_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "acortador_enlaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_trafico_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          accion: string
          created_at: string
          detalles: Json | null
          id: string
          ip_address: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          detalles?: Json | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          detalles?: Json | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      costeos: {
        Row: {
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
          roas_objetivo: number | null
          sku: string | null
          tasa_devolucion_porcentaje: number | null
          tienda_id: string
          updated_at: string
          utilidad_neta: number
          viabilidad_color: string | null
        }
        Insert: {
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
          roas_objetivo?: number | null
          sku?: string | null
          tasa_devolucion_porcentaje?: number | null
          tienda_id: string
          updated_at?: string
          utilidad_neta: number
          viabilidad_color?: string | null
        }
        Update: {
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
      integraciones: {
        Row: {
          config_sync: Json | null
          created_at: string
          credenciales_encriptadas: string | null
          estado: string
          id: string
          tienda_id: string
          tipo: string
          ultima_sincronizacion: string | null
        }
        Insert: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          tienda_id: string
          tipo: string
          ultima_sincronizacion?: string | null
        }
        Update: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          tienda_id?: string
          tipo?: string
          ultima_sincronizacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integraciones_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
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
          total_comisiones_generadas: number | null
          total_usuarios_referidos: number | null
          total_clicks: number | null
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
          porcentaje_comision: number
          total_comisiones_generadas?: number | null
          total_usuarios_referidos?: number | null
          total_clicks?: number | null
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
          total_comisiones_generadas?: number | null
          total_usuarios_referidos?: number | null
          total_clicks?: number | null
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
          usuario_id: string
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
          usuario_id: string
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
          usuario_id?: string
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
          codigo_referido_personal: string | null
          created_at: string
          email: string
          email_verificado: boolean | null
          estado_suscripcion: string | null
          fecha_registro: string
          id: string
          nombres: string | null
          pais: string | null
          plan_id: string | null
          rol: string | null
          telefono: string | null
          ultima_actividad: string | null
          updated_at: string
          wallet_saldo: number | null
        }
        Insert: {
          "2fa_habilitado"?: boolean | null
          apellidos?: string | null
          codigo_referido_personal?: string | null
          created_at?: string
          email: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_registro?: string
          id: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          rol?: string | null
          telefono?: string | null
          ultima_actividad?: string | null
          updated_at?: string
          wallet_saldo?: number | null
        }
        Update: {
          "2fa_habilitado"?: boolean | null
          apellidos?: string | null
          codigo_referido_personal?: string | null
          created_at?: string
          email?: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_registro?: string
          id?: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          rol?: string | null
          telefono?: string | null
          ultima_actividad?: string | null
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
      get_referrer_info: {
        Args: {
          ref_code: string
        }
        Returns: {
          nombres: string
          apellidos: string
        }[]
      }
      increment_referral_clicks: {
        Args: {
          ref_code: string
        }
        Returns: undefined
      }
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
