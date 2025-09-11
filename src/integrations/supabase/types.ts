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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          discount_percentage: number | null
          id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          discount_percentage?: number | null
          id?: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          discount_percentage?: number | null
          id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          boleto_due_dates: number[] | null
          boleto_installments: number | null
          cep_destino: string | null
          check_due_dates: number[] | null
          check_installments: number | null
          client_id: string
          created_at: string
          created_by: string
          discount_percentage: number | null
          id: string
          installments: number | null
          invoice_percentage: number | null
          local_delivery_info: string | null
          notes: string | null
          payment_method_id: string | null
          payment_type_id: string | null
          shipping_cost: number | null
          shipping_option_id: string | null
          status: Database["public"]["Enums"]["budget_status"]
          stock_warnings: Json | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          boleto_due_dates?: number[] | null
          boleto_installments?: number | null
          cep_destino?: string | null
          check_due_dates?: number[] | null
          check_installments?: number | null
          client_id: string
          created_at?: string
          created_by: string
          discount_percentage?: number | null
          id?: string
          installments?: number | null
          invoice_percentage?: number | null
          local_delivery_info?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          shipping_cost?: number | null
          shipping_option_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          stock_warnings?: Json | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          boleto_due_dates?: number[] | null
          boleto_installments?: number | null
          cep_destino?: string | null
          check_due_dates?: number[] | null
          check_installments?: number | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_percentage?: number | null
          id?: string
          installments?: number | null
          invoice_percentage?: number | null
          local_delivery_info?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          shipping_cost?: number | null
          shipping_option_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          stock_warnings?: Json | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_payment_type_id_fkey"
            columns: ["payment_type_id"]
            isOneToOne: false
            referencedRelation: "payment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_shipping_option_id_fkey"
            columns: ["shipping_option_id"]
            isOneToOne: false
            referencedRelation: "shipping_options"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_layout_templates: {
        Row: {
          category_title_settings: Json
          created_at: string
          description: string | null
          id: string
          layout_settings: Json
          name: string
          page_settings: Json
          updated_at: string
        }
        Insert: {
          category_title_settings?: Json
          created_at?: string
          description?: string | null
          id?: string
          layout_settings?: Json
          name: string
          page_settings?: Json
          updated_at?: string
        }
        Update: {
          category_title_settings?: Json
          created_at?: string
          description?: string | null
          id?: string
          layout_settings?: Json
          name?: string
          page_settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          allow_system_access: boolean | null
          assigned_user_id: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          client_type: string
          cnpj: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          phone: string
          razao_social: string | null
          state: string | null
          street: string | null
          system_password: string | null
          updated_at: string
        }
        Insert: {
          allow_system_access?: boolean | null
          assigned_user_id?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          client_type: string
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          neighborhood?: string | null
          number?: string | null
          phone: string
          razao_social?: string | null
          state?: string | null
          street?: string | null
          system_password?: string | null
          updated_at?: string
        }
        Update: {
          allow_system_access?: boolean | null
          assigned_user_id?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          client_type?: string
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string
          razao_social?: string | null
          state?: string | null
          street?: string | null
          system_password?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_items: {
        Row: {
          conferred_at: string
          conferred_quantity: number
          created_at: string
          id: string
          is_correct: boolean
          sale_id: string
          sale_item_id: string
        }
        Insert: {
          conferred_at?: string
          conferred_quantity: number
          created_at?: string
          id?: string
          is_correct: boolean
          sale_id: string
          sale_item_id: string
        }
        Update: {
          conferred_at?: string
          conferred_quantity?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          sale_id?: string
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          requires_receipt: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          requires_receipt?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          requires_receipt?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payment_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          requires_receipt: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          requires_receipt?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          requires_receipt?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          box: string | null
          category_id: string | null
          color: string | null
          composition: string | null
          created_at: string
          diameter: number | null
          height: number | null
          id: string
          internal_code: string
          length: number | null
          name: string
          observation: string | null
          photo_url: string | null
          price: number
          size: string | null
          stock: number
          stock_unit: string | null
          supplier_id: string | null
          thickness: number | null
          updated_at: string
          weight: number | null
          weight_unit: string | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          box?: string | null
          category_id?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          diameter?: number | null
          height?: number | null
          id?: string
          internal_code: string
          length?: number | null
          name: string
          observation?: string | null
          photo_url?: string | null
          price: number
          size?: string | null
          stock?: number
          stock_unit?: string | null
          supplier_id?: string | null
          thickness?: number | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          box?: string | null
          category_id?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          diameter?: number | null
          height?: number | null
          id?: string
          internal_code?: string
          length?: number | null
          name?: string
          observation?: string | null
          photo_url?: string | null
          price?: number
          size?: string | null
          stock?: number
          stock_unit?: string | null
          supplier_id?: string | null
          thickness?: number | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          address: string
          city: string
          company: string | null
          created_at: string
          document: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string
          state: string
          status: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          company?: string | null
          created_at?: string
          document: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          state: string
          status?: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          company?: string | null
          created_at?: string
          document?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          state?: string
          status?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      sale_attachments: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          original_filename: string
          sale_id: string
          stored_filename: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename: string
          sale_id: string
          stored_filename: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          sale_id?: string
          stored_filename?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_status_logs: {
        Row: {
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["sale_status"]
          previous_status: Database["public"]["Enums"]["sale_status"] | null
          reason: string | null
          sale_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["sale_status"]
          previous_status?: Database["public"]["Enums"]["sale_status"] | null
          reason?: string | null
          sale_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["sale_status"]
          previous_status?: Database["public"]["Enums"]["sale_status"] | null
          reason?: string | null
          sale_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_status_logs_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_volumes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          sale_id: string
          volume_number: number
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          sale_id: string
          volume_number: number
          weight_kg: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          sale_id?: string
          volume_number?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_volumes_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          boleto_due_dates: number[] | null
          boleto_installments: number | null
          budget_id: string | null
          check_due_dates: number[] | null
          check_installments: number | null
          client_id: string
          conference_completed_at: string | null
          conference_user_id: string | null
          converted_from_budget_at: string | null
          created_at: string
          created_by: string
          delivery_completed_at: string | null
          delivery_user_id: string | null
          discount_percentage: number | null
          id: string
          installments: number | null
          invoice_completed_at: string | null
          invoice_number: string | null
          invoice_percentage: number | null
          invoice_user_id: string | null
          local_delivery_info: string | null
          notes: string | null
          payment_method_id: string | null
          payment_type_id: string | null
          responsible_user_id: string | null
          separation_complete: boolean | null
          separation_completed_at: string | null
          separation_percentage: number | null
          separation_user_id: string | null
          shipping_cost: number | null
          shipping_option_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          total_amount: number
          total_volumes: number | null
          total_weight_kg: number | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          boleto_due_dates?: number[] | null
          boleto_installments?: number | null
          budget_id?: string | null
          check_due_dates?: number[] | null
          check_installments?: number | null
          client_id: string
          conference_completed_at?: string | null
          conference_user_id?: string | null
          converted_from_budget_at?: string | null
          created_at?: string
          created_by: string
          delivery_completed_at?: string | null
          delivery_user_id?: string | null
          discount_percentage?: number | null
          id?: string
          installments?: number | null
          invoice_completed_at?: string | null
          invoice_number?: string | null
          invoice_percentage?: number | null
          invoice_user_id?: string | null
          local_delivery_info?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          responsible_user_id?: string | null
          separation_complete?: boolean | null
          separation_completed_at?: string | null
          separation_percentage?: number | null
          separation_user_id?: string | null
          shipping_cost?: number | null
          shipping_option_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          total_amount?: number
          total_volumes?: number | null
          total_weight_kg?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          boleto_due_dates?: number[] | null
          boleto_installments?: number | null
          budget_id?: string | null
          check_due_dates?: number[] | null
          check_installments?: number | null
          client_id?: string
          conference_completed_at?: string | null
          conference_user_id?: string | null
          converted_from_budget_at?: string | null
          created_at?: string
          created_by?: string
          delivery_completed_at?: string | null
          delivery_user_id?: string | null
          discount_percentage?: number | null
          id?: string
          installments?: number | null
          invoice_completed_at?: string | null
          invoice_number?: string | null
          invoice_percentage?: number | null
          invoice_user_id?: string | null
          local_delivery_info?: string | null
          notes?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          responsible_user_id?: string | null
          separation_complete?: boolean | null
          separation_completed_at?: string | null
          separation_percentage?: number | null
          separation_user_id?: string | null
          shipping_cost?: number | null
          shipping_option_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          total_amount?: number
          total_volumes?: number | null
          total_weight_kg?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      separation_items: {
        Row: {
          created_at: string
          id: string
          sale_id: string
          sale_item_id: string
          separated_at: string
          separated_quantity: number
          total_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          sale_id: string
          sale_item_id: string
          separated_at?: string
          separated_quantity?: number
          total_quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          sale_id?: string
          sale_item_id?: string
          separated_at?: string
          separated_quantity?: number
          total_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "separation_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "separation_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_options: {
        Row: {
          active: boolean
          created_at: string
          delivery_visible: boolean | null
          description: string | null
          id: string
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_visible?: boolean | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_visible?: boolean | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reason: string
          reference_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reason: string
          reference_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_configurations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_budget_stock_availability: {
        Args: { budget_id_param: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_client_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      register_stock_movement: {
        Args: {
          p_movement_type: string
          p_new_stock: number
          p_notes?: string
          p_previous_stock: number
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      budget_status:
        | "aguardando_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "convertido"
        | "processando"
      sale_status:
        | "separacao"
        | "conferencia"
        | "nota_fiscal"
        | "aguardando_entrega"
        | "entrega_realizada"
        | "atencao"
      user_role:
        | "admin"
        | "gerente"
        | "vendas"
        | "separacao"
        | "conferencia"
        | "nota_fiscal"
        | "cliente"
        | "entregador"
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
      budget_status: [
        "aguardando_aprovacao",
        "aprovado",
        "rejeitado",
        "convertido",
        "processando",
      ],
      sale_status: [
        "separacao",
        "conferencia",
        "nota_fiscal",
        "aguardando_entrega",
        "entrega_realizada",
        "atencao",
      ],
      user_role: [
        "admin",
        "gerente",
        "vendas",
        "separacao",
        "conferencia",
        "nota_fiscal",
        "cliente",
        "entregador",
      ],
    },
  },
} as const
