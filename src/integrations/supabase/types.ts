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
      analytics_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event: string
          id: string
          path: string | null
          product_id: string | null
          properties: Json
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm: Json
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event: string
          id?: string
          path?: string | null
          product_id?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm?: Json
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event?: string
          id?: string
          path?: string | null
          product_id?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appearance: {
        Row: {
          accent_color: string
          bg_color: string
          border_radius: number
          button_color: string | null
          button_style: string
          button_text_color: string
          created_at: string
          font_family: string
          font_heading: string | null
          footer_bg_color: string | null
          footer_institutional_text: string | null
          footer_show_contact: boolean
          footer_show_payments: boolean
          footer_show_security_badges: boolean
          footer_show_social: boolean
          footer_text: string | null
          footer_text_color: string | null
          header_bg_color: string | null
          header_show_menu: boolean
          header_show_social: boolean
          header_show_whatsapp: boolean
          header_text_color: string | null
          home_card_buy_button_color: string
          home_card_buy_button_enabled: boolean
          home_card_buy_button_label: string
          home_card_whatsapp_button_enabled: boolean
          id: number
          layout_variant: string
          logo_position: string
          payment_methods: Json
          primary_color: string
          product_card_style: string
          secondary_color: string
          security_badges: Json
          selected_palette: string | null
          show_categories_menu: boolean
          show_product_price: boolean
          show_product_reviews: boolean
          show_product_stock: boolean
          show_search: boolean
          show_share_button: boolean
          show_whatsapp_button: boolean
          text_color: string
          updated_at: string
          whatsapp_color: string
        }
        Insert: {
          accent_color?: string
          bg_color?: string
          border_radius?: number
          button_color?: string | null
          button_style?: string
          button_text_color?: string
          created_at?: string
          font_family?: string
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_institutional_text?: string | null
          footer_show_contact?: boolean
          footer_show_payments?: boolean
          footer_show_security_badges?: boolean
          footer_show_social?: boolean
          footer_text?: string | null
          footer_text_color?: string | null
          header_bg_color?: string | null
          header_show_menu?: boolean
          header_show_social?: boolean
          header_show_whatsapp?: boolean
          header_text_color?: string | null
          home_card_buy_button_color?: string
          home_card_buy_button_enabled?: boolean
          home_card_buy_button_label?: string
          home_card_whatsapp_button_enabled?: boolean
          id?: number
          layout_variant?: string
          logo_position?: string
          payment_methods?: Json
          primary_color?: string
          product_card_style?: string
          secondary_color?: string
          security_badges?: Json
          selected_palette?: string | null
          show_categories_menu?: boolean
          show_product_price?: boolean
          show_product_reviews?: boolean
          show_product_stock?: boolean
          show_search?: boolean
          show_share_button?: boolean
          show_whatsapp_button?: boolean
          text_color?: string
          updated_at?: string
          whatsapp_color?: string
        }
        Update: {
          accent_color?: string
          bg_color?: string
          border_radius?: number
          button_color?: string | null
          button_style?: string
          button_text_color?: string
          created_at?: string
          font_family?: string
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_institutional_text?: string | null
          footer_show_contact?: boolean
          footer_show_payments?: boolean
          footer_show_security_badges?: boolean
          footer_show_social?: boolean
          footer_text?: string | null
          footer_text_color?: string | null
          header_bg_color?: string | null
          header_show_menu?: boolean
          header_show_social?: boolean
          header_show_whatsapp?: boolean
          header_text_color?: string | null
          home_card_buy_button_color?: string
          home_card_buy_button_enabled?: boolean
          home_card_buy_button_label?: string
          home_card_whatsapp_button_enabled?: boolean
          id?: number
          layout_variant?: string
          logo_position?: string
          payment_methods?: Json
          primary_color?: string
          product_card_style?: string
          secondary_color?: string
          security_badges?: Json
          selected_palette?: string | null
          show_categories_menu?: boolean
          show_product_price?: boolean
          show_product_reviews?: boolean
          show_product_stock?: boolean
          show_search?: boolean
          show_share_button?: boolean
          show_whatsapp_button?: boolean
          text_color?: string
          updated_at?: string
          whatsapp_color?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auto_messages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          template: string
          trigger: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          template: string
          trigger: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          template?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_mobile_url: string | null
          image_url: string
          is_active: boolean
          link_url: string | null
          position: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_mobile_url?: string | null
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_mobile_url?: string | null
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          link_url: string | null
          name: string
          position: number
          start_date: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          name: string
          position?: number
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          name?: string
          position?: number
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string | null
          qty: number
          unit_price_cents: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id?: string | null
          qty?: number
          unit_price_cents?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string | null
          qty?: number
          unit_price_cents?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          session_id: string | null
          status: Database["public"]["Enums"]["cart_status"]
          totals: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["cart_status"]
          totals?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["cart_status"]
          totals?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_hero_slides: {
        Row: {
          background_color: string | null
          brand_logo_url: string | null
          button_bg_color: string | null
          button_link: string | null
          button_text: string | null
          button_text_color: string | null
          created_at: string
          disclaimer: string | null
          eyebrow: string | null
          highlight_prefix: string | null
          highlight_suffix: string | null
          highlight_value: string | null
          id: string
          image_desktop_url: string | null
          image_mobile_url: string | null
          is_active: boolean
          position: number
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          brand_logo_url?: string | null
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          disclaimer?: string | null
          eyebrow?: string | null
          highlight_prefix?: string | null
          highlight_suffix?: string | null
          highlight_value?: string | null
          id?: string
          image_desktop_url?: string | null
          image_mobile_url?: string | null
          is_active?: boolean
          position?: number
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          brand_logo_url?: string | null
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          disclaimer?: string | null
          eyebrow?: string | null
          highlight_prefix?: string | null
          highlight_suffix?: string | null
          highlight_value?: string | null
          id?: string
          image_desktop_url?: string | null
          image_mobile_url?: string | null
          is_active?: boolean
          position?: number
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_url: string | null
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_url?: string | null
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_url?: string | null
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_settings: {
        Row: {
          created_at: string
          email_contact: string | null
          facebook_url: string | null
          id: number
          instagram_url: string | null
          linkedin_url: string | null
          phone: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          email_contact?: string | null
          facebook_url?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      countdown_settings: {
        Row: {
          bg_color: string
          created_at: string
          ends_at: string | null
          id: number
          is_active: boolean
          text_color: string
          title: string | null
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          ends_at?: string | null
          id?: number
          is_active?: boolean
          text_color?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          ends_at?: string | null
          id?: number
          is_active?: boolean
          text_color?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          min_order_cents: number | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_cents?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_cents?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: Json
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          created_by: string | null
          event: string
          id: string
          order_id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event: string
          id?: string
          order_id: string
          payload?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event?: string
          id?: string
          order_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "order_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name_snapshot: string
          order_id: string
          product_id: string | null
          qty: number
          unit_price_cents: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name_snapshot: string
          order_id: string
          product_id?: string | null
          qty?: number
          unit_price_cents?: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name_snapshot?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          unit_price_cents?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: string | null
          coupon_code: string | null
          created_at: string
          customer_id: string | null
          discount_cents: number
          id: string
          notes: string | null
          number: string
          payment_method: string | null
          shipping_cents: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
          whatsapp_message: string | null
        }
        Insert: {
          channel?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
          notes?: string | null
          number: string
          payment_method?: string | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Update: {
          channel?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
          notes?: string | null
          number?: string
          payment_method?: string | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content_html: string | null
          created_at: string
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content_html?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content_html?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          boleto_enabled: boolean
          card_enabled: boolean
          card_installments_max: number
          card_interest_free_max: number
          cash_on_delivery_enabled: boolean
          created_at: string
          id: number
          pix_discount_percent: number
          pix_enabled: boolean
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          boleto_enabled?: boolean
          card_enabled?: boolean
          card_installments_max?: number
          card_interest_free_max?: number
          cash_on_delivery_enabled?: boolean
          created_at?: string
          id?: number
          pix_discount_percent?: number
          pix_enabled?: boolean
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          boleto_enabled?: boolean
          card_enabled?: boolean
          card_installments_max?: number
          card_interest_free_max?: number
          cash_on_delivery_enabled?: boolean
          created_at?: string
          id?: number
          pix_discount_percent?: number
          pix_enabled?: boolean
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          product_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          product_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          product_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_main: boolean
          position: number
          product_id: string
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_main?: boolean
          position?: number
          product_id: string
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_main?: boolean
          position?: number
          product_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_email: string | null
          author_name: string | null
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          image_url: string | null
          name: string
          price_cents: number | null
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price_cents?: number | null
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price_cents?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          compare_at_price_cents: number | null
          cost_cents: number | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          installment_text: string | null
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_promotion: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_url: string | null
          pix_price_cents: number | null
          position: number
          price_cents: number
          promotion_label: string | null
          rating_avg: number
          rating_count: number
          related_product_ids: string[]
          short_description: string | null
          sku: string | null
          slug: string
          stock: number
          stock_alert: number
          updated_at: string
          weight_grams: number | null
          whatsapp_message: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installment_text?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_promotion?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_url?: string | null
          pix_price_cents?: number | null
          position?: number
          price_cents?: number
          promotion_label?: string | null
          rating_avg?: number
          rating_count?: number
          related_product_ids?: string[]
          short_description?: string | null
          sku?: string | null
          slug: string
          stock?: number
          stock_alert?: number
          updated_at?: string
          weight_grams?: number | null
          whatsapp_message?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installment_text?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_promotion?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_url?: string | null
          pix_price_cents?: number | null
          position?: number
          price_cents?: number
          promotion_label?: string | null
          rating_avg?: number
          rating_count?: number
          related_product_ids?: string[]
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock?: number
          stock_alert?: number
          updated_at?: string
          weight_grams?: number | null
          whatsapp_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_bar: {
        Row: {
          bg_color: string
          created_at: string
          dismissible: boolean
          ends_at: string | null
          icon: string | null
          id: number
          is_active: boolean
          link_label: string | null
          link_url: string | null
          starts_at: string | null
          text: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          dismissible?: boolean
          ends_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          starts_at?: string | null
          text?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          dismissible?: boolean
          ends_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          starts_at?: string | null
          text?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          discount_cents: number | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_cents?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_cents?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
        }
        Relationships: []
      }
      pwa_settings: {
        Row: {
          active: boolean
          admin_logo_url: string | null
          app_name: string
          background_color: string
          company_name: string | null
          created_at: string
          description: string
          icon_url: string | null
          id: number
          install_message: string
          onboarding_enabled: boolean
          short_name: string
          splash_color: string
          support_email: string | null
          support_phone: string | null
          tech_contact: string | null
          theme_color: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          admin_logo_url?: string | null
          app_name?: string
          background_color?: string
          company_name?: string | null
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: number
          install_message?: string
          onboarding_enabled?: boolean
          short_name?: string
          splash_color?: string
          support_email?: string | null
          support_phone?: string | null
          tech_contact?: string | null
          theme_color?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          admin_logo_url?: string | null
          app_name?: string
          background_color?: string
          company_name?: string | null
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: number
          install_message?: string
          onboarding_enabled?: boolean
          short_name?: string
          splash_color?: string
          support_email?: string | null
          support_phone?: string | null
          tech_contact?: string | null
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          position: number
          subtitle: string | null
          title: string | null
          type: Database["public"]["Enums"]["section_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["section_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["section_type"]
          updated_at?: string
        }
        Relationships: []
      }
      seo: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: number
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          og_type: string
          robots: string
          sitemap_enabled: boolean
          structured_data: Json
          twitter_card: string
          twitter_creator: string | null
          twitter_site: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: number
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          og_type?: string
          robots?: string
          sitemap_enabled?: boolean
          structured_data?: Json
          twitter_card?: string
          twitter_creator?: string | null
          twitter_site?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: number
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          og_type?: string
          robots?: string
          sitemap_enabled?: boolean
          structured_data?: Json
          twitter_card?: string
          twitter_creator?: string | null
          twitter_site?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: Json
          cnpj: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          id: number
          legal_name: string | null
          logo_url: string | null
          mode: Database["public"]["Enums"]["store_mode"]
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json
          cnpj?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: number
          legal_name?: string | null
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["store_mode"]
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json
          cnpj?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: number
          legal_name?: string | null
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["store_mode"]
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tracking_settings: {
        Row: {
          clarity_id: string | null
          created_at: string
          custom_body_html: string | null
          custom_head_html: string | null
          ga_id: string | null
          google_ads_id: string | null
          gtm_id: string | null
          hotjar_id: string | null
          id: number
          meta_pixel_id: string | null
          tiktok_pixel_id: string | null
          updated_at: string
        }
        Insert: {
          clarity_id?: string | null
          created_at?: string
          custom_body_html?: string | null
          custom_head_html?: string | null
          ga_id?: string | null
          google_ads_id?: string | null
          gtm_id?: string | null
          hotjar_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          clarity_id?: string | null
          created_at?: string
          custom_body_html?: string | null
          custom_head_html?: string | null
          ga_id?: string | null
          google_ads_id?: string | null
          gtm_id?: string | null
          hotjar_id?: string | null
          id?: number
          meta_pixel_id?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          business_hours: Json
          cart_message_template: string | null
          created_at: string
          default_message: string | null
          display_name: string | null
          floating_button_enabled: boolean
          floating_button_label: string | null
          floating_button_position: string
          id: number
          is_enabled: boolean
          offline_message: string | null
          order_message_template: string | null
          phone_number: string | null
          product_message_template: string | null
          send_order_via_whatsapp: boolean
          updated_at: string
        }
        Insert: {
          business_hours?: Json
          cart_message_template?: string | null
          created_at?: string
          default_message?: string | null
          display_name?: string | null
          floating_button_enabled?: boolean
          floating_button_label?: string | null
          floating_button_position?: string
          id?: number
          is_enabled?: boolean
          offline_message?: string | null
          order_message_template?: string | null
          phone_number?: string | null
          product_message_template?: string | null
          send_order_via_whatsapp?: boolean
          updated_at?: string
        }
        Update: {
          business_hours?: Json
          cart_message_template?: string | null
          created_at?: string
          default_message?: string | null
          display_name?: string | null
          floating_button_enabled?: boolean
          floating_button_label?: string | null
          floating_button_position?: string
          id?: number
          is_enabled?: boolean
          offline_message?: string | null
          order_message_template?: string | null
          phone_number?: string | null
          product_message_template?: string | null
          send_order_via_whatsapp?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_public_cart_item: {
        Args: { p_product_id: string; p_qty?: number; p_session_id: string }
        Returns: Json
      }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      checkout_public_whatsapp_cart: {
        Args: { p_customer?: Json; p_session_id: string }
        Returns: Json
      }
      get_public_cart: { Args: { p_session_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      remove_public_cart_item: {
        Args: { p_item_id: string; p_session_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_public_cart_item: {
        Args: { p_item_id: string; p_qty: number; p_session_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer" | "customer"
      cart_status: "open" | "converted" | "abandoned"
      coupon_discount_type: "percent" | "fixed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "completed"
        | "cancelled"
      promotion_type: "percent" | "fixed"
      review_status: "pending" | "approved" | "rejected"
      section_type:
        | "featured"
        | "category"
        | "banner"
        | "text"
        | "products_grid"
        | "testimonials"
        | "newsletter"
        | "hero"
        | "categories"
        | "benefits"
        | "about"
        | "instagram"
        | "custom"
      store_mode: "catalog" | "showcase" | "checkout"
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
      app_role: ["admin", "editor", "viewer", "customer"],
      cart_status: ["open", "converted", "abandoned"],
      coupon_discount_type: ["percent", "fixed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "completed",
        "cancelled",
      ],
      promotion_type: ["percent", "fixed"],
      review_status: ["pending", "approved", "rejected"],
      section_type: [
        "featured",
        "category",
        "banner",
        "text",
        "products_grid",
        "testimonials",
        "newsletter",
        "hero",
        "categories",
        "benefits",
        "about",
        "instagram",
        "custom",
      ],
      store_mode: ["catalog", "showcase", "checkout"],
    },
  },
} as const
