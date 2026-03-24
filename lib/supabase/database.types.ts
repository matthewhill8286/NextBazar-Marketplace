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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          listing_count: number
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          listing_count?: number
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          listing_count?: number
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
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
      conversations: {
        Row: {
          buyer_id: string
          buyer_unread: number
          created_at: string
          id: string
          is_pinned: boolean
          last_message: string | null
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: string | null
          seller_id: string
          seller_unread: number
        }
        Insert: {
          buyer_id: string
          buyer_unread?: number
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_message?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          seller_id: string
          seller_unread?: number
        }
        Update: {
          buyer_id?: string
          buyer_unread?: number
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_message?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          seller_id?: string
          seller_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_shops: {
        Row: {
          accent_color: string | null
          banner_url: string | null
          created_at: string
          custom_domain: string | null
          description: string | null
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          plan_status: string
          shop_name: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tiktok: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string
          shop_name: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tiktok?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string
          shop_name?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tiktok?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_shops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics: {
        Row: {
          date: string
          favorites: number
          id: string
          listing_id: string
          messages: number
          views: number
        }
        Insert: {
          date?: string
          favorites?: number
          id?: string
          listing_id: string
          messages?: number
          views?: number
        }
        Update: {
          date?: string
          favorites?: number
          id?: string
          listing_id?: string
          messages?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          attributes: Json
          category_id: string
          condition: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          description: string | null
          embedding: string | null
          expires_at: string | null
          expiry_warning_sent: boolean
          favorite_count: number
          id: string
          image_count: number
          is_promoted: boolean
          is_urgent: boolean
          location_id: string | null
          message_count: number
          price: number | null
          price_type: string
          primary_image_url: string | null
          promoted_until: string | null
          search_vector: unknown
          slug: string
          status: string
          subcategory_id: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          attributes?: Json
          category_id: string
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          embedding?: string | null
          expires_at?: string | null
          expiry_warning_sent?: boolean
          favorite_count?: number
          id?: string
          image_count?: number
          is_promoted?: boolean
          is_urgent?: boolean
          location_id?: string | null
          message_count?: number
          price?: number | null
          price_type?: string
          primary_image_url?: string | null
          promoted_until?: string | null
          search_vector?: unknown
          slug: string
          status?: string
          subcategory_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          attributes?: Json
          category_id?: string
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          embedding?: string | null
          expires_at?: string | null
          expiry_warning_sent?: boolean
          favorite_count?: number
          id?: string
          image_count?: number
          is_promoted?: boolean
          is_urgent?: boolean
          location_id?: string | null
          message_count?: number
          price?: number | null
          price_type?: string
          primary_image_url?: string | null
          promoted_until?: string | null
          search_vector?: unknown
          slug?: string
          status?: string
          subcategory_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          lat: number | null
          lng: number | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_pinned: boolean
          message_type: string
          offer_price: number | null
          offer_status: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          message_type?: string
          offer_price?: number | null
          offer_status?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          message_type?: string
          offer_price?: number | null
          offer_status?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          listing_id: string | null
          offer_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          listing_id?: string | null
          offer_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          listing_id?: string | null
          offer_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          counter_amount: number | null
          counter_message: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          responded_at: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          counter_amount?: number | null
          counter_message?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          responded_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          counter_amount?: number | null
          counter_message?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          responded_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_at: string
          id: string
          listing_id: string
          new_price: number | null
          old_price: number | null
        }
        Insert: {
          changed_at?: string
          id?: string
          listing_id: string
          new_price?: number | null
          old_price?: number | null
        }
        Update: {
          changed_at?: string
          id?: string
          listing_id?: string
          new_price?: number | null
          old_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          facebook_username: string | null
          id: string
          instagram_username: string | null
          is_dealer: boolean
          location_id: string | null
          location_lat: number | null
          location_lng: number | null
          onboarding_completed: boolean
          phone: string | null
          push_token: string | null
          rating: number
          telegram_username: string | null
          total_reviews: number
          updated_at: string
          username: string | null
          verified: boolean
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_username?: string | null
          id: string
          instagram_username?: string | null
          is_dealer?: boolean
          location_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          onboarding_completed?: boolean
          phone?: string | null
          push_token?: string | null
          rating?: number
          telegram_username?: string | null
          total_reviews?: number
          updated_at?: string
          username?: string | null
          verified?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_username?: string | null
          id?: string
          instagram_username?: string | null
          is_dealer?: boolean
          location_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          onboarding_completed?: boolean
          phone?: string | null
          push_token?: string | null
          rating?: number
          telegram_username?: string | null
          total_reviews?: number
          updated_at?: string
          username?: string | null
          verified?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          listing_id: string | null
          reason: string
          reporter_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reporter_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reporter_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          offer_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          offer_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          offer_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          category_slug: string | null
          created_at: string
          id: string
          last_notified_at: string | null
          location_slug: string | null
          name: string
          price_max: number | null
          price_min: number | null
          query: string | null
          sort_by: string | null
          subcategory_slug: string | null
          user_id: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          id?: string
          last_notified_at?: string | null
          location_slug?: string | null
          name?: string
          price_max?: number | null
          price_min?: number | null
          query?: string | null
          sort_by?: string | null
          subcategory_slug?: string | null
          user_id: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          id?: string
          last_notified_at?: string | null
          location_slug?: string | null
          name?: string
          price_max?: number | null
          price_min?: number | null
          query?: string | null
          sort_by?: string | null
          subcategory_slug?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_review_stats: {
        Row: {
          avg_rating: number | null
          review_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_favorite_count: { Args: { lid: string }; Returns: undefined }
      increment_favorite_count: { Args: { lid: string }; Returns: undefined }
      increment_listing_view: {
        Args: { p_date: string; p_listing_id: string }
        Returns: undefined
      }
      match_listings: {
        Args: {
          filter_category?: string
          filter_location?: string
          filter_price_max?: number
          filter_price_min?: number
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category_icon: string
          category_name: string
          category_slug: string
          condition: string
          created_at: string
          currency: string
          description: string
          id: string
          is_promoted: boolean
          is_urgent: boolean
          location_name: string
          location_slug: string
          price: number
          primary_image_url: string
          similarity: number
          slug: string
          status: string
          title: string
          view_count: number
        }[]
      }
      process_listing_expiry: { Args: never; Returns: undefined }
      process_saved_search_notifications: { Args: never; Returns: undefined }
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
