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
      audit_logs: {
        Row: {
          accion: string
          created_at: string | null
          detalles: Json | null
          entidad: string
          entidad_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          detalles?: Json | null
          entidad: string
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          detalles?: Json | null
          entidad?: string
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
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
      comisiones_referidos: {
        Row: {
          created_at: string
          estado: string | null
          id: string
          lider_id: string | null
          monto_usd: number
          usuario_referido_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: string | null
          id?: string
          lider_id?: string | null
          monto_usd: number
          usuario_referido_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: string | null
          id?: string
          lider_id?: string | null
          monto_usd?: number
          usuario_referido_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comisiones_referidos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "referidos_lideres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comisiones_referidos_usuario_referido_id_fkey"
            columns: ["usuario_referido_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_global: {
        Row: {
          actualizado_por: string | null
          codigo_footer: string | null
          codigo_head: string | null
          color_admin_panel_link: string | null
          color_admin_sidebar_active: string | null
          color_admin_sidebar_return: string | null
          color_bg_primary: string | null
          color_bg_secondary: string | null
          color_bg_tertiary: string | null
          color_border: string | null
          color_border_hover: string | null
          color_card_bg: string | null
          color_card_border: string | null
          color_error: string | null
          color_neutral: string | null
          color_primary: string | null
          color_primary_dark: string | null
          color_primary_light: string | null
          color_sidebar_active: string | null
          color_sidebar_bg: string | null
          color_sidebar_text: string | null
          color_success: string | null
          color_text_inverse: string | null
          color_text_primary: string | null
          color_text_secondary: string | null
          color_text_tertiary: string | null
          color_warning: string | null
          dark_bg_primary: string | null
          dark_bg_secondary: string | null
          dark_bg_tertiary: string | null
          dark_border: string | null
          dark_border_hover: string | null
          dark_card_bg: string | null
          dark_card_border: string | null
          dark_text_primary: string | null
          dark_text_secondary: string | null
          dark_text_tertiary: string | null
          descripcion_empresa: string | null
          email_contacto: string | null
          email_domain: string | null
          favicon_url: string | null
          fecha_actualizacion: string | null
          font_family_accent: string | null
          font_family_mono: string | null
          font_family_primary: string | null
          font_family_secondary: string | null
          font_letter_spacing_h: string | null
          font_letter_spacing_labels: string | null
          font_line_height_base: string | null
          font_line_height_headings: string | null
          font_line_height_mono: string | null
          font_line_height_small: string | null
          font_size_base: string | null
          font_size_h1: string | null
          font_size_h2: string | null
          font_size_h3: string | null
          font_size_h4: string | null
          font_size_small: string | null
          font_size_tiny: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_footer_url: string | null
          logo_principal_url: string | null
          logo_variante_url: string | null
          meta_app_id: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          nombre_empresa: string | null
          og_image_url: string | null
          pais_operacion: string | null
          permitir_indexacion: boolean | null
          permitir_seguimiento: boolean | null
          politica_privacidad_url: string | null
          robots_txt_custom: string | null
          site_url: string | null
          sitio_web: string | null
          telefono: string | null
          terminos_condiciones_url: string | null
          twitter_url: string | null
          youtube_url: string | null
        }
        Insert: {
          actualizado_por?: string | null
          codigo_footer?: string | null
          codigo_head?: string | null
          color_admin_panel_link?: string | null
          color_admin_sidebar_active?: string | null
          color_admin_sidebar_return?: string | null
          color_bg_primary?: string | null
          color_bg_secondary?: string | null
          color_bg_tertiary?: string | null
          color_border?: string | null
          color_border_hover?: string | null
          color_card_bg?: string | null
          color_card_border?: string | null
          color_error?: string | null
          color_neutral?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_primary_light?: string | null
          color_sidebar_active?: string | null
          color_sidebar_bg?: string | null
          color_sidebar_text?: string | null
          color_success?: string | null
          color_text_inverse?: string | null
          color_text_primary?: string | null
          color_text_secondary?: string | null
          color_text_tertiary?: string | null
          color_warning?: string | null
          dark_bg_primary?: string | null
          dark_bg_secondary?: string | null
          dark_bg_tertiary?: string | null
          dark_border?: string | null
          dark_border_hover?: string | null
          dark_card_bg?: string | null
          dark_card_border?: string | null
          dark_text_primary?: string | null
          dark_text_secondary?: string | null
          dark_text_tertiary?: string | null
          descripcion_empresa?: string | null
          email_contacto?: string | null
          email_domain?: string | null
          favicon_url?: string | null
          fecha_actualizacion?: string | null
          font_family_accent?: string | null
          font_family_mono?: string | null
          font_family_primary?: string | null
          font_family_secondary?: string | null
          font_letter_spacing_h?: string | null
          font_letter_spacing_labels?: string | null
          font_line_height_base?: string | null
          font_line_height_headings?: string | null
          font_line_height_mono?: string | null
          font_line_height_small?: string | null
          font_size_base?: string | null
          font_size_h1?: string | null
          font_size_h2?: string | null
          font_size_h3?: string | null
          font_size_h4?: string | null
          font_size_small?: string | null
          font_size_tiny?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_footer_url?: string | null
          logo_principal_url?: string | null
          logo_variante_url?: string | null
          meta_app_id?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          nombre_empresa?: string | null
          og_image_url?: string | null
          pais_operacion?: string | null
          permitir_indexacion?: boolean | null
          permitir_seguimiento?: boolean | null
          politica_privacidad_url?: string | null
          robots_txt_custom?: string | null
          site_url?: string | null
          sitio_web?: string | null
          telefono?: string | null
          terminos_condiciones_url?: string | null
          twitter_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          actualizado_por?: string | null
          codigo_footer?: string | null
          codigo_head?: string | null
          color_admin_panel_link?: string | null
          color_admin_sidebar_active?: string | null
          color_admin_sidebar_return?: string | null
          color_bg_primary?: string | null
          color_bg_secondary?: string | null
          color_bg_tertiary?: string | null
          color_border?: string | null
          color_border_hover?: string | null
          color_card_bg?: string | null
          color_card_border?: string | null
          color_error?: string | null
          color_neutral?: string | null
          color_primary?: string | null
          color_primary_dark?: string | null
          color_primary_light?: string | null
          color_sidebar_active?: string | null
          color_sidebar_bg?: string | null
          color_sidebar_text?: string | null
          color_success?: string | null
          color_text_inverse?: string | null
          color_text_primary?: string | null
          color_text_secondary?: string | null
          color_text_tertiary?: string | null
          color_warning?: string | null
          dark_bg_primary?: string | null
          dark_bg_secondary?: string | null
          dark_bg_tertiary?: string | null
          dark_border?: string | null
          dark_border_hover?: string | null
          dark_card_bg?: string | null
          dark_card_border?: string | null
          dark_text_primary?: string | null
          dark_text_secondary?: string | null
          dark_text_tertiary?: string | null
          descripcion_empresa?: string | null
          email_contacto?: string | null
          email_domain?: string | null
          favicon_url?: string | null
          fecha_actualizacion?: string | null
          font_family_accent?: string | null
          font_family_mono?: string | null
          font_family_primary?: string | null
          font_family_secondary?: string | null
          font_letter_spacing_h?: string | null
          font_letter_spacing_labels?: string | null
          font_line_height_base?: string | null
          font_line_height_headings?: string | null
          font_line_height_mono?: string | null
          font_line_height_small?: string | null
          font_size_base?: string | null
          font_size_h1?: string | null
          font_size_h2?: string | null
          font_size_h3?: string | null
          font_size_h4?: string | null
          font_size_small?: string | null
          font_size_tiny?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_footer_url?: string | null
          logo_principal_url?: string | null
          logo_variante_url?: string | null
          meta_app_id?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          nombre_empresa?: string | null
          og_image_url?: string | null
          pais_operacion?: string | null
          permitir_indexacion?: boolean | null
          permitir_seguimiento?: boolean | null
          politica_privacidad_url?: string | null
          robots_txt_custom?: string | null
          site_url?: string | null
          sitio_web?: string | null
          telefono?: string | null
          terminos_condiciones_url?: string | null
          twitter_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_global_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_global_historial: {
        Row: {
          campo_modificado: string
          fecha_cambio: string | null
          id: string
          usuario_admin: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_modificado: string
          fecha_cambio?: string | null
          id?: string
          usuario_admin: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_modificado?: string
          fecha_cambio?: string | null
          id?: string
          usuario_admin?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_global_historial_usuario_admin_fkey"
            columns: ["usuario_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_anonimas: {
        Row: {
          conversacion: Json | null
          created_at: string | null
          email: string
          id: string
          nombre: string
          pais: string | null
          telefono: string
          updated_at: string | null
        }
        Insert: {
          conversacion?: Json | null
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          pais?: string | null
          telefono: string
          updated_at?: string | null
        }
        Update: {
          conversacion?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          pais?: string | null
          telefono?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_downloads: {
        Row: {
          cantidad_registros: number | null
          descargado_en: string | null
          formato: string | null
          hash_archivo: string | null
          id: string
          ip_address: string | null
          tienda_id: string
          user_id: string
        }
        Insert: {
          cantidad_registros?: number | null
          descargado_en?: string | null
          formato?: string | null
          hash_archivo?: string | null
          id?: string
          ip_address?: string | null
          tienda_id: string
          user_id: string
        }
        Update: {
          cantidad_registros?: number | null
          descargado_en?: string | null
          formato?: string | null
          hash_archivo?: string | null
          id?: string
          ip_address?: string | null
          tienda_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_downloads_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_module_acceptance: {
        Row: {
          aceptado_en: string
          estado: string | null
          id: string
          ip_address: string | null
          revocado_en: string | null
          tienda_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aceptado_en?: string
          estado?: string | null
          id?: string
          ip_address?: string | null
          revocado_en?: string | null
          tienda_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aceptado_en?: string
          estado?: string | null
          id?: string
          ip_address?: string | null
          revocado_en?: string | null
          tienda_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_module_acceptance_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string | null
          credits_consumed: number | null
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          credits_consumed?: number | null
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          credits_consumed?: number | null
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["thread_status"] | null
          tienda_id: string | null
          tipo: Database["public"]["Enums"]["thread_type"]
          total_credits_used: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["thread_status"] | null
          tienda_id?: string | null
          tipo?: Database["public"]["Enums"]["thread_type"]
          total_credits_used?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["thread_status"] | null
          tienda_id?: string | null
          tipo?: Database["public"]["Enums"]["thread_type"]
          total_credits_used?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      costeos: {
        Row: {
          campaign_id_meta: string | null
          cancelacion_pre_envio_porcentaje: number | null
          comision_recaudo_porcentaje: number | null
          costo_flete: number
          costo_producto: number | null
          cpa: number | null
          created_at: string
          devoluciones: number | null
          estado: string | null
          gastos_adicionales: number | null
          id: string
          inputs_json: Json | null
          margen: number | null
          meta_aov: number | null
          meta_asset_url: string | null
          meta_campaign_id: string | null
          meta_campana_id: string | null
          meta_cvr: number | null
          meta_roas: number | null
          meta_spend: number | null
          nombre_producto: string
          precio_final: number | null
          product_id_shopify: string | null
          results_json: Json | null
          roas_objetivo: number | null
          sku: string | null
          tienda_id: string
          updated_at: string
          usuario_id: string
          utilidad_neta: number | null
          viabilidad_color: string | null
          volume_strategy: Json | null
        }
        Insert: {
          campaign_id_meta?: string | null
          cancelacion_pre_envio_porcentaje?: number | null
          comision_recaudo_porcentaje?: number | null
          costo_flete?: number
          costo_producto?: number | null
          cpa?: number | null
          created_at?: string
          devoluciones?: number | null
          estado?: string | null
          gastos_adicionales?: number | null
          id?: string
          inputs_json?: Json | null
          margen?: number | null
          meta_aov?: number | null
          meta_asset_url?: string | null
          meta_campaign_id?: string | null
          meta_campana_id?: string | null
          meta_cvr?: number | null
          meta_roas?: number | null
          meta_spend?: number | null
          nombre_producto: string
          precio_final?: number | null
          product_id_shopify?: string | null
          results_json?: Json | null
          roas_objetivo?: number | null
          sku?: string | null
          tienda_id: string
          updated_at?: string
          usuario_id: string
          utilidad_neta?: number | null
          viabilidad_color?: string | null
          volume_strategy?: Json | null
        }
        Update: {
          campaign_id_meta?: string | null
          cancelacion_pre_envio_porcentaje?: number | null
          comision_recaudo_porcentaje?: number | null
          costo_flete?: number
          costo_producto?: number | null
          cpa?: number | null
          created_at?: string
          devoluciones?: number | null
          estado?: string | null
          gastos_adicionales?: number | null
          id?: string
          inputs_json?: Json | null
          margen?: number | null
          meta_aov?: number | null
          meta_asset_url?: string | null
          meta_campaign_id?: string | null
          meta_campana_id?: string | null
          meta_cvr?: number | null
          meta_roas?: number | null
          meta_spend?: number | null
          nombre_producto?: string
          precio_final?: number | null
          product_id_shopify?: string | null
          results_json?: Json | null
          roas_objetivo?: number | null
          sku?: string | null
          tienda_id?: string
          updated_at?: string
          usuario_id?: string
          utilidad_neta?: number | null
          viabilidad_color?: string | null
          volume_strategy?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "costeos_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costeos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          consultation_type: string | null
          cost_usd: number | null
          created_at: string | null
          credits_amount: number
          id: string
          mercado_pago_transaction_id: string | null
          notes: string | null
          tipo: Database["public"]["Enums"]["credit_transaction_type"]
          usuario_id: string
        }
        Insert: {
          consultation_type?: string | null
          cost_usd?: number | null
          created_at?: string | null
          credits_amount: number
          id?: string
          mercado_pago_transaction_id?: string | null
          notes?: string | null
          tipo: Database["public"]["Enums"]["credit_transaction_type"]
          usuario_id: string
        }
        Update: {
          consultation_type?: string | null
          cost_usd?: number | null
          created_at?: string | null
          credits_amount?: number
          id?: string
          mercado_pago_transaction_id?: string | null
          notes?: string | null
          tipo?: Database["public"]["Enums"]["credit_transaction_type"]
          usuario_id?: string
        }
        Relationships: []
      }
      custom_code_snippets: {
        Row: {
          apply_to: Json | null
          code: string | null
          created_at: string | null
          id: string
          location: string
          name: string
          priority: number | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          apply_to?: Json | null
          code?: string | null
          created_at?: string | null
          id?: string
          location: string
          name: string
          priority?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          apply_to?: Json | null
          code?: string | null
          created_at?: string | null
          id?: string
          location?: string
          name?: string
          priority?: number | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
      drop_assistant_agents: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          prompt_objetivo_flujo: string
          prompt_personalidad: string
          prompt_reglas: string
          scope: Database["public"]["Enums"]["agent_scope"]
          status: Database["public"]["Enums"]["agent_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          prompt_objetivo_flujo: string
          prompt_personalidad: string
          prompt_reglas: string
          scope: Database["public"]["Enums"]["agent_scope"]
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          prompt_objetivo_flujo?: string
          prompt_personalidad?: string
          prompt_reglas?: string
          scope?: Database["public"]["Enums"]["agent_scope"]
          status?: Database["public"]["Enums"]["agent_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_campaign_logs: {
        Row: {
          campaign_id: string
          created_at: string
          email: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          tienda_id: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tienda_id?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tienda_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_logs_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          scheduled_at: string | null
          segment_id: string | null
          sender_name: string | null
          sender_prefix: string | null
          status: string
          subject: string
          template_id: string
          tienda_id: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          scheduled_at?: string | null
          segment_id?: string | null
          sender_name?: string | null
          sender_prefix?: string | null
          status?: string
          subject: string
          template_id: string
          tienda_id?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_id?: string | null
          sender_name?: string | null
          sender_prefix?: string | null
          status?: string
          subject?: string
          template_id?: string
          tienda_id?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "email_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_historial: {
        Row: {
          asunto_enviado: string | null
          contenido_html_enviado: string | null
          estado: string | null
          fecha_envio: string | null
          from_email: string | null
          from_name: string | null
          id: string
          plantilla_id: string | null
          razon_error: string | null
          tipo_envio: string | null
          trigger_id: string | null
          usuario_email: string
          usuario_id: string | null
        }
        Insert: {
          asunto_enviado?: string | null
          contenido_html_enviado?: string | null
          estado?: string | null
          fecha_envio?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          plantilla_id?: string | null
          razon_error?: string | null
          tipo_envio?: string | null
          trigger_id?: string | null
          usuario_email: string
          usuario_id?: string | null
        }
        Update: {
          asunto_enviado?: string | null
          contenido_html_enviado?: string | null
          estado?: string | null
          fecha_envio?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          plantilla_id?: string | null
          razon_error?: string | null
          tipo_envio?: string | null
          trigger_id?: string | null
          usuario_email?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_historial_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_historial_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "email_triggers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_historial_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_plantillas_triggers: {
        Row: {
          activo: boolean | null
          fecha_asociacion: string | null
          id: string
          plantilla_id: string
          trigger_id: string
        }
        Insert: {
          activo?: boolean | null
          fecha_asociacion?: string | null
          id?: string
          plantilla_id: string
          trigger_id: string
        }
        Update: {
          activo?: boolean | null
          fecha_asociacion?: string | null
          id?: string
          plantilla_id?: string
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_plantillas_triggers_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_plantillas_triggers_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "email_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_segments: {
        Row: {
          created_at: string
          description: string | null
          filters: Json
          id: string
          name: string
          tienda_id: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          name: string
          tienda_id?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          name?: string
          tienda_id?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_segments_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_segments_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_content: string | null
          id: string
          is_folder: boolean | null
          mjml_content: string | null
          name: string
          parent_id: string | null
          sender_name: string | null
          sender_prefix: string | null
          slug: string
          status: string | null
          subject: string
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_content?: string | null
          id?: string
          is_folder?: boolean | null
          mjml_content?: string | null
          name: string
          parent_id?: string | null
          sender_name?: string | null
          sender_prefix?: string | null
          slug: string
          status?: string | null
          subject: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          html_content?: string | null
          id?: string
          is_folder?: boolean | null
          mjml_content?: string | null
          name?: string
          parent_id?: string | null
          sender_name?: string | null
          sender_prefix?: string | null
          slug?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_triggers: {
        Row: {
          activo: boolean | null
          categoria: string | null
          codigo_evento: string
          condicion: string | null
          descripcion: string | null
          evento_tipo: string | null
          fecha_creacion: string | null
          id: string
          nombre_trigger: string
          tabla_origen: string | null
          tipo_disparador: string | null
          variables_disponibles: Json | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          codigo_evento: string
          condicion?: string | null
          descripcion?: string | null
          evento_tipo?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_trigger: string
          tabla_origen?: string | null
          tipo_disparador?: string | null
          variables_disponibles?: Json | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          codigo_evento?: string
          condicion?: string | null
          descripcion?: string | null
          evento_tipo?: string | null
          fecha_creacion?: string | null
          id?: string
          nombre_trigger?: string
          tabla_origen?: string | null
          tipo_disparador?: string | null
          variables_disponibles?: Json | null
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
          meta_user_name: string | null
          tienda_id: string | null
          tipo: string
          ultima_sincronizacion: string | null
          usuario_id: string | null
          validated_at: string | null
        }
        Insert: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          meta_user_name?: string | null
          tienda_id?: string | null
          tipo: string
          ultima_sincronizacion?: string | null
          usuario_id?: string | null
          validated_at?: string | null
        }
        Update: {
          config_sync?: Json | null
          created_at?: string
          credenciales_encriptadas?: string | null
          estado?: string
          id?: string
          meta_user_name?: string | null
          tienda_id?: string | null
          tipo?: string
          ultima_sincronizacion?: string | null
          usuario_id?: string | null
          validated_at?: string | null
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
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_event_mappings: {
        Row: {
          category: string | null
          created_at: string | null
          enabled: boolean | null
          event_type: string
          id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          id?: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_event_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_events: {
        Row: {
          created_at: string | null
          email: string
          email_service_id: string | null
          error_message: string | null
          event_type: string
          id: string
          is_test_email: boolean | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_service_id?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          is_test_email?: boolean | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_service_id?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          is_test_email?: boolean | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ad_accounts: {
        Row: {
          account_id: string | null
          business_id: string | null
          business_name: string | null
          currency: string | null
          id: string
          integracion_id: string
          last_synced_at: string | null
          meta_id: string
          name: string | null
          usuario_id: string
        }
        Insert: {
          account_id?: string | null
          business_id?: string | null
          business_name?: string | null
          currency?: string | null
          id?: string
          integracion_id: string
          last_synced_at?: string | null
          meta_id: string
          name?: string | null
          usuario_id: string
        }
        Update: {
          account_id?: string | null
          business_id?: string | null
          business_name?: string | null
          currency?: string | null
          id?: string
          integracion_id?: string
          last_synced_at?: string | null
          meta_id?: string
          name?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_ad_accounts_integracion_id_fkey"
            columns: ["integracion_id"]
            isOneToOne: false
            referencedRelation: "integraciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ad_accounts_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_product_stats: {
        Row: {
          campaign_status: string | null
          compras: number | null
          costeo_id: string | null
          cpa_normalizado: number | null
          cpm: number | null
          currency_original: string | null
          id: string
          importe_gastado_normalizado: number | null
          meta_campaign_id: string
          roas: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_status?: string | null
          compras?: number | null
          costeo_id?: string | null
          cpa_normalizado?: number | null
          cpm?: number | null
          currency_original?: string | null
          id?: string
          importe_gastado_normalizado?: number | null
          meta_campaign_id: string
          roas?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_status?: string | null
          compras?: number | null
          costeo_id?: string | null
          cpa_normalizado?: number | null
          cpm?: number | null
          currency_original?: string | null
          id?: string
          importe_gastado_normalizado?: number | null
          meta_campaign_id?: string
          roas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_product_stats_costeo_id_fkey"
            columns: ["costeo_id"]
            isOneToOne: false
            referencedRelation: "costeos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas: {
        Row: {
          configuracion_json: Json
          costeo_id: string | null
          created_at: string
          ganancia_estimada: number | null
          id: string
          margen_estimado_porcentaje: number | null
          nombre_producto: string
          tienda_id: string
          tipo_estrategia: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          configuracion_json?: Json
          costeo_id?: string | null
          created_at?: string
          ganancia_estimada?: number | null
          id?: string
          margen_estimado_porcentaje?: number | null
          nombre_producto: string
          tienda_id: string
          tipo_estrategia: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          configuracion_json?: Json
          costeo_id?: string | null
          created_at?: string
          ganancia_estimada?: number | null
          id?: string
          margen_estimado_porcentaje?: number | null
          nombre_producto?: string
          tienda_id?: string
          tipo_estrategia?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_costeo_id_fkey"
            columns: ["costeo_id"]
            isOneToOne: false
            referencedRelation: "costeos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completado: boolean | null
          fecha_completado: string | null
          fecha_inicio: string | null
          id: string
          paso_0_plan: boolean | null
          paso_1_tienda: boolean | null
          paso_2_shopify: boolean | null
          paso_3_meta: boolean | null
          paso_4_cuentas_publicitarias: boolean | null
          paso_actual: number | null
          porcentaje_completado: number | null
          tienda_id: string | null
          user_id: string
        }
        Insert: {
          completado?: boolean | null
          fecha_completado?: string | null
          fecha_inicio?: string | null
          id?: string
          paso_0_plan?: boolean | null
          paso_1_tienda?: boolean | null
          paso_2_shopify?: boolean | null
          paso_3_meta?: boolean | null
          paso_4_cuentas_publicitarias?: boolean | null
          paso_actual?: number | null
          porcentaje_completado?: number | null
          tienda_id?: string | null
          user_id: string
        }
        Update: {
          completado?: boolean | null
          fecha_completado?: string | null
          fecha_inicio?: string | null
          id?: string
          paso_0_plan?: boolean | null
          paso_1_tienda?: boolean | null
          paso_2_shopify?: boolean | null
          paso_3_meta?: boolean | null
          paso_4_cuentas_publicitarias?: boolean | null
          paso_actual?: number | null
          porcentaje_completado?: number | null
          tienda_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cantidad_items: number | null
          categorias: string | null
          cliente_ciudad: string | null
          cliente_departamento: string | null
          cliente_direccion: string | null
          cliente_email: string | null
          cliente_nombre: string | null
          cliente_telefono: string | null
          comision_dropi: number | null
          costeo_id: string | null
          costo_devolucion: number | null
          created_at: string | null
          customer_details: Json | null
          estado_logistica: string | null
          estado_pago: string | null
          external_id: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          fecha_dropi: string | null
          fecha_novedad: string | null
          fecha_orden: string | null
          guia_transporte: string | null
          id: string
          notas: string | null
          novedad: string | null
          order_number: string
          origen: string | null
          precio_flete: number | null
          shopify_order_id: string | null
          tienda_id: string
          total_orden: number | null
          total_proveedor: number | null
          transportadora: string | null
          updated_at: string | null
          usuario_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_id: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_compra: number | null
        }
        Insert: {
          cantidad_items?: number | null
          categorias?: string | null
          cliente_ciudad?: string | null
          cliente_departamento?: string | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nombre?: string | null
          cliente_telefono?: string | null
          comision_dropi?: number | null
          costeo_id?: string | null
          costo_devolucion?: number | null
          created_at?: string | null
          customer_details?: Json | null
          estado_logistica?: string | null
          estado_pago?: string | null
          external_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          fecha_dropi?: string | null
          fecha_novedad?: string | null
          fecha_orden?: string | null
          guia_transporte?: string | null
          id?: string
          notas?: string | null
          novedad?: string | null
          order_number: string
          origen?: string | null
          precio_flete?: number | null
          shopify_order_id?: string | null
          tienda_id: string
          total_orden?: number | null
          total_proveedor?: number | null
          transportadora?: string | null
          updated_at?: string | null
          usuario_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_compra?: number | null
        }
        Update: {
          cantidad_items?: number | null
          categorias?: string | null
          cliente_ciudad?: string | null
          cliente_departamento?: string | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nombre?: string | null
          cliente_telefono?: string | null
          comision_dropi?: number | null
          costeo_id?: string | null
          costo_devolucion?: number | null
          created_at?: string | null
          customer_details?: Json | null
          estado_logistica?: string | null
          estado_pago?: string | null
          external_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          fecha_dropi?: string | null
          fecha_novedad?: string | null
          fecha_orden?: string | null
          guia_transporte?: string | null
          id?: string
          notas?: string | null
          novedad?: string | null
          order_number?: string
          origen?: string | null
          precio_flete?: number | null
          shopify_order_id?: string | null
          tienda_id?: string
          total_orden?: number | null
          total_proveedor?: number | null
          transportadora?: string | null
          updated_at?: string | null
          usuario_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_costeo_id_fkey"
            columns: ["costeo_id"]
            isOneToOne: false
            referencedRelation: "costeos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_usuario_id_fkey"
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
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          limits: Json
          name: string
          price_monthly: number
          price_semiannual: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          limits?: Json
          name: string
          price_monthly: number
          price_semiannual?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          limits?: Json
          name?: string
          price_monthly?: number
          price_semiannual?: number | null
          slug?: string
          updated_at?: string | null
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
          porcentaje_comision: number
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
      retiros_referidos: {
        Row: {
          banco_nombre: string
          cuenta_numero: string
          cuenta_tipo: string
          documento_id: string | null
          estado: string
          fecha_pago: string | null
          fecha_solicitud: string | null
          id: string
          moneda_destino: string
          monto_local: number
          monto_usd: number
          nota_admin: string | null
          tasa_cambio: number
          titular_nombre: string | null
          user_id: string
        }
        Insert: {
          banco_nombre: string
          cuenta_numero: string
          cuenta_tipo: string
          documento_id?: string | null
          estado?: string
          fecha_pago?: string | null
          fecha_solicitud?: string | null
          id?: string
          moneda_destino: string
          monto_local: number
          monto_usd: number
          nota_admin?: string | null
          tasa_cambio: number
          titular_nombre?: string | null
          user_id: string
        }
        Update: {
          banco_nombre?: string
          cuenta_numero?: string
          cuenta_tipo?: string
          documento_id?: string | null
          estado?: string
          fecha_pago?: string | null
          fecha_solicitud?: string | null
          id?: string
          moneda_destino?: string
          monto_local?: number
          monto_usd?: number
          nota_admin?: string | null
          tasa_cambio?: number
          titular_nombre?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retiros_referidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_clientes: {
        Row: {
          ciudad: string | null
          cliente_shopify_id: string | null
          created_at: string | null
          departamento: string | null
          email: string | null
          id: string
          nombre: string | null
          numero_compras: number | null
          pais: string | null
          primera_compra_fecha: string | null
          sincronizado_en: string | null
          tags: string[] | null
          telefono: string | null
          tienda_id: string
          total_compras_valor: number | null
          ultima_compra_fecha: string | null
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          cliente_shopify_id?: string | null
          created_at?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          numero_compras?: number | null
          pais?: string | null
          primera_compra_fecha?: string | null
          sincronizado_en?: string | null
          tags?: string[] | null
          telefono?: string | null
          tienda_id: string
          total_compras_valor?: number | null
          ultima_compra_fecha?: string | null
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          cliente_shopify_id?: string | null
          created_at?: string | null
          departamento?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          numero_compras?: number | null
          pais?: string | null
          primera_compra_fecha?: string | null
          sincronizado_en?: string | null
          tags?: string[] | null
          telefono?: string | null
          tienda_id?: string
          total_compras_valor?: number | null
          ultima_compra_fecha?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_clientes_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_referidos_cambios: {
        Row: {
          descripcion: string | null
          fecha_cambio: string
          id: string
          tipo_cambio: string
          usuario_admin: string | null
          valor_anterior: number | null
          valor_nuevo: number | null
        }
        Insert: {
          descripcion?: string | null
          fecha_cambio?: string
          id?: string
          tipo_cambio: string
          usuario_admin?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Update: {
          descripcion?: string | null
          fecha_cambio?: string
          id?: string
          tipo_cambio?: string
          usuario_admin?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sistema_referidos_cambios_usuario_admin_fkey"
            columns: ["usuario_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_referidos_config: {
        Row: {
          actualizado_por: string | null
          comision_nivel_1: number | null
          comision_nivel_2: number | null
          created_at: string
          dias_retencion_comision: number | null
          fecha_actualizacion: string
          id: string
          meses_vigencia_comision: number | null
          monto_minimo_retiro_usd: number | null
          referidos_minimo_lider: number | null
        }
        Insert: {
          actualizado_por?: string | null
          comision_nivel_1?: number | null
          comision_nivel_2?: number | null
          created_at?: string
          dias_retencion_comision?: number | null
          fecha_actualizacion?: string
          id?: string
          meses_vigencia_comision?: number | null
          monto_minimo_retiro_usd?: number | null
          referidos_minimo_lider?: number | null
        }
        Update: {
          actualizado_por?: string | null
          comision_nivel_1?: number | null
          comision_nivel_2?: number | null
          created_at?: string
          dias_retencion_comision?: number | null
          fecha_actualizacion?: string
          id?: string
          meses_vigencia_comision?: number | null
          monto_minimo_retiro_usd?: number | null
          referidos_minimo_lider?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sistema_referidos_config_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_admin_id: string | null
          created_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          thread_id: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          thread_id?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          thread_id?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      tiendas: {
        Row: {
          active: boolean | null
          configuracion: Json | null
          contactos_habilitado_en: string | null
          contactos_modulo_habilitado: boolean | null
          created_at: string
          id: string
          logo_url: string | null
          moneda: string | null
          nombre: string
          pais: string
          shopify_access_token: string | null
          shopify_domain: string | null
          shopify_shop_name: string | null
          usuario_id: string
          webhook_short_id: string | null
        }
        Insert: {
          active?: boolean | null
          configuracion?: Json | null
          contactos_habilitado_en?: string | null
          contactos_modulo_habilitado?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          moneda?: string | null
          nombre: string
          pais: string
          shopify_access_token?: string | null
          shopify_domain?: string | null
          shopify_shop_name?: string | null
          usuario_id: string
          webhook_short_id?: string | null
        }
        Update: {
          active?: boolean | null
          configuracion?: Json | null
          contactos_habilitado_en?: string | null
          contactos_modulo_habilitado?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          moneda?: string | null
          nombre?: string
          pais?: string
          shopify_access_token?: string | null
          shopify_domain?: string | null
          shopify_shop_name?: string | null
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
      tiendas_meta_ads: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_ad_account_id: string
          meta_ad_account_name: string | null
          tienda_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_ad_account_id: string
          meta_ad_account_name?: string | null
          tienda_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_ad_account_id?: string
          meta_ad_account_name?: string | null
          tienda_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiendas_meta_ads_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: number
          total_spent_usd: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          total_spent_usd?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          total_spent_usd?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          "2fa_habilitado": boolean | null
          ai_learning_opt_in: boolean | null
          apellidos: string | null
          avatar_url: string | null
          bank_info: Json | null
          codigo_referido_personal: string | null
          created_at: string
          dias_restantes: number | null
          email: string
          email_verificado: boolean | null
          estado_suscripcion: string | null
          fecha_registro: string | null
          fecha_vencimiento_plan: string | null
          id: string
          nombres: string | null
          pais: string | null
          plan_id: string | null
          plan_periodo: string | null
          plan_precio_pagado: number | null
          preferencias: Json | null
          rol: string | null
          session_token: string | null
          telefono: string | null
          ultima_actividad: string | null
          updated_at: string
          wallet_saldo: number | null
        }
        Insert: {
          "2fa_habilitado"?: boolean | null
          ai_learning_opt_in?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bank_info?: Json | null
          codigo_referido_personal?: string | null
          created_at?: string
          dias_restantes?: number | null
          email: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_registro?: string | null
          fecha_vencimiento_plan?: string | null
          id: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          plan_periodo?: string | null
          plan_precio_pagado?: number | null
          preferencias?: Json | null
          rol?: string | null
          session_token?: string | null
          telefono?: string | null
          ultima_actividad?: string | null
          updated_at?: string
          wallet_saldo?: number | null
        }
        Update: {
          "2fa_habilitado"?: boolean | null
          ai_learning_opt_in?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bank_info?: Json | null
          codigo_referido_personal?: string | null
          created_at?: string
          dias_restantes?: number | null
          email?: string
          email_verificado?: boolean | null
          estado_suscripcion?: string | null
          fecha_registro?: string | null
          fecha_vencimiento_plan?: string | null
          id?: string
          nombres?: string | null
          pais?: string | null
          plan_id?: string | null
          plan_periodo?: string | null
          plan_precio_pagado?: number | null
          preferencias?: Json | null
          rol?: string | null
          session_token?: string | null
          telefono?: string | null
          ultima_actividad?: string | null
          updated_at?: string
          wallet_saldo?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_kpis:
        | {
            Args: {
              p_end_date: string
              p_start_date: string
              p_tienda_id: string
            }
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
        | {
            Args: {
              p_end_date: string
              p_start_date: string
              p_tienda_id: string
              p_timezone?: string
            }
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
      check_and_promote_to_leader: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_advanced_kpis: {
        Args: { p_period_days?: number; p_tienda_id: string }
        Returns: Json
      }
      get_dashboard_pro_data:
        | { Args: { p_dias?: number; p_tienda_id: string }; Returns: Json }
        | {
            Args: { p_dias?: number; p_tienda_id: string; p_timezone?: string }
            Returns: Json
          }
      get_my_level2_user_ids: {
        Args: never
        Returns: {
          usuario_id: string
        }[]
      }
      get_my_lider_id: { Args: never; Returns: string }
      get_referrer_info: {
        Args: { ref_code: string }
        Returns: {
          apellidos: string
          nombres: string
        }[]
      }
      get_simulator_presets: { Args: { p_tienda_id: string }; Returns: Json }
      increment_credits: {
        Args: { amount: number; userid: string }
        Returns: undefined
      }
      increment_referral_clicks: {
        Args: { ref_code: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      record_user_activity: {
        Args: {
          p_accion: string
          p_detalles?: Json
          p_entidad?: string
          p_entidad_id?: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      agent_scope: "landing" | "app_registrado" | "app_suscrito"
      agent_status: "active" | "inactive"
      credit_transaction_type: "purchase" | "usage" | "refund"
      thread_status: "active" | "closed"
      thread_type: "soporte" | "mentoría"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "pending" | "resolved" | "closed"
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
      agent_scope: ["landing", "app_registrado", "app_suscrito"],
      agent_status: ["active", "inactive"],
      credit_transaction_type: ["purchase", "usage", "refund"],
      thread_status: ["active", "closed"],
      thread_type: ["soporte", "mentoría"],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
