export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      check_in_events: {
        Row: {
          actor_reference: string | null;
          actor_type: string;
          booking_id: string;
          created_at: string;
          delta: number;
          id: string;
          venue_id: string;
        };
        Insert: {
          actor_reference?: string | null;
          actor_type: string;
          booking_id: string;
          created_at?: string;
          delta: number;
          id?: string;
          venue_id: string;
        };
        Update: {
          actor_reference?: string | null;
          actor_type?: string;
          booking_id?: string;
          created_at?: string;
          delta?: number;
          id?: string;
          venue_id?: string;
        };
      };
      display_playlists: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          name: string;
          slug: string;
          surface: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          surface: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          surface?: string;
          updated_at?: string;
          venue_id?: string;
        };
      };
      display_views: {
        Row: {
          config: Json;
          content: string;
          created_at: string;
          id: string;
          name: string | null;
          slug: string | null;
          surface: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          config?: Json;
          content: string;
          created_at?: string;
          id?: string;
          name?: string | null;
          slug?: string | null;
          surface: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          config?: Json;
          content?: string;
          created_at?: string;
          id?: string;
          name?: string | null;
          slug?: string | null;
          surface?: string;
          updated_at?: string;
          venue_id?: string;
        };
      };
      event_bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"];
          cancelled_at: string | null;
          checked_in_count: number;
          confirmed_at: string | null;
          created_at: string;
          currency: string;
          event_id: string;
          refunded_amount_cents: number;
          id: string;
          party_size: number;
          payment_status: Database["public"]["Enums"]["payment_status"];
          purchaser_email: string | null;
          purchaser_name: string;
          purchaser_phone: string | null;
          stripe_charge_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          total_price_cents: number;
          unit_price_cents: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"];
          cancelled_at?: string | null;
          checked_in_count?: number;
          confirmed_at?: string | null;
          created_at?: string;
          currency?: string;
          event_id: string;
          refunded_amount_cents?: number;
          id?: string;
          party_size: number;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          purchaser_email?: string | null;
          purchaser_name: string;
          purchaser_phone?: string | null;
          stripe_charge_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_price_cents?: number;
          unit_price_cents?: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"];
          cancelled_at?: string | null;
          checked_in_count?: number;
          confirmed_at?: string | null;
          created_at?: string;
          currency?: string;
          event_id?: string;
          refunded_amount_cents?: number;
          id?: string;
          party_size?: number;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          purchaser_email?: string | null;
          purchaser_name?: string;
          purchaser_phone?: string | null;
          stripe_charge_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_price_cents?: number;
          unit_price_cents?: number;
          updated_at?: string;
          venue_id?: string;
        };
      };
      event_check_in_sessions: {
        Row: {
          created_at: string;
          created_by_user_id: string | null;
          event_id: string;
          expires_at: string | null;
          id: string;
          pin: string | null;
          session_name: string;
          token: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id?: string | null;
          event_id: string;
          expires_at?: string | null;
          id?: string;
          pin?: string | null;
          session_name: string;
          token?: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string | null;
          event_id?: string;
          expires_at?: string | null;
          id?: string;
          pin?: string | null;
          session_name?: string;
          token?: string;
          updated_at?: string;
          venue_id?: string;
        };
      };
      events: {
        Row: {
          capacity: number | null;
          created_at: string;
          currency: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          image_url: string | null;
          price_cents: number | null;
          published: boolean;
          slug: string;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          price_cents?: number | null;
          published?: boolean;
          slug: string;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          price_cents?: number | null;
          published?: boolean;
          slug?: string;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          venue_id?: string;
        };
      };
      followers: {
        Row: {
          active: boolean;
          channel_preferences: Json;
          consented_at: string;
          created_at: string;
          email: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          active?: boolean;
          channel_preferences?: Json;
          consented_at?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          active?: boolean;
          channel_preferences?: Json;
          consented_at?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      item_external_links: {
        Row: {
          availability_snapshot: boolean | null;
          created_at: string;
          external_id: string;
          id: string;
          item_id: string;
          price_snapshot_cents: number | null;
          price_snapshot_currency: string | null;
          provider: string;
          synced_at: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          availability_snapshot?: boolean | null;
          created_at?: string;
          external_id: string;
          id?: string;
          item_id: string;
          price_snapshot_cents?: number | null;
          price_snapshot_currency?: string | null;
          provider: string;
          synced_at?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          availability_snapshot?: boolean | null;
          created_at?: string;
          external_id?: string;
          id?: string;
          item_id?: string;
          price_snapshot_cents?: number | null;
          price_snapshot_currency?: string | null;
          provider?: string;
          synced_at?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      items: {
        Row: {
          abv: number | null;
          active: boolean;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          image_url: string | null;
          name: string;
          price_source: Database["public"]["Enums"]["price_source"];
          style_or_category: string | null;
          type: Database["public"]["Enums"]["item_type"];
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          abv?: number | null;
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          name: string;
          price_source?: Database["public"]["Enums"]["price_source"];
          style_or_category?: string | null;
          type: Database["public"]["Enums"]["item_type"];
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          abv?: number | null;
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          price_source?: Database["public"]["Enums"]["price_source"];
          style_or_category?: string | null;
          type?: Database["public"]["Enums"]["item_type"];
          updated_at?: string;
          venue_id?: string;
        };
      };
      membership_plans: {
        Row: {
          active: boolean;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          name: string;
          price_cents: number;
          slug: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          active?: boolean;
          billing_interval: Database["public"]["Enums"]["billing_interval"];
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name: string;
          price_cents: number;
          slug: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          active?: boolean;
          billing_interval?: Database["public"]["Enums"]["billing_interval"];
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name?: string;
          price_cents?: number;
          slug?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      memberships: {
        Row: {
          billing_interval: Database["public"]["Enums"]["billing_interval"] | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          currency: string;
          current_period_end: string | null;
          ended_at: string | null;
          id: string;
          member_email: string | null;
          member_name: string;
          member_phone: string | null;
          membership_plan_id: string;
          plan_name_snapshot: string | null;
          price_cents: number | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"] | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string | null;
          ended_at?: string | null;
          id?: string;
          member_email?: string | null;
          member_name: string;
          member_phone?: string | null;
          membership_plan_id: string;
          plan_name_snapshot?: string | null;
          price_cents?: number | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"] | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string | null;
          ended_at?: string | null;
          id?: string;
          member_email?: string | null;
          member_name?: string;
          member_phone?: string | null;
          membership_plan_id?: string;
          plan_name_snapshot?: string | null;
          price_cents?: number | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      notification_logs: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          context_id: string | null;
          context_type: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          provider: string;
          provider_message_id: string | null;
          recipient: string;
          sent_at: string | null;
          status: string;
          subject: string | null;
          template_key: string;
          venue_id: string;
        };
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"];
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          provider: string;
          provider_message_id?: string | null;
          recipient: string;
          sent_at?: string | null;
          status: string;
          subject?: string | null;
          template_key: string;
          venue_id: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          provider?: string;
          provider_message_id?: string | null;
          recipient?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          template_key?: string;
          venue_id?: string;
        };
      };
      platform_admins: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
        };
      };
      provider_webhook_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          payload: Json;
          processed_at: string | null;
          provider: string;
          provider_event_id: string;
          venue_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          provider: string;
          provider_event_id: string;
          venue_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          provider_event_id?: string;
          venue_id?: string | null;
        };
      };
      square_connections: {
        Row: {
          access_token_encrypted: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          merchant_id: string | null;
          refresh_token_encrypted: string | null;
          status: string;
          synced_at: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          merchant_id?: string | null;
          refresh_token_encrypted?: string | null;
          status?: string;
          synced_at?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          merchant_id?: string | null;
          refresh_token_encrypted?: string | null;
          status?: string;
          synced_at?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      stripe_connections: {
        Row: {
          access_token_encrypted: string | null;
          charges_enabled: boolean;
          created_at: string;
          details_submitted: boolean;
          id: string;
          last_error: string | null;
          last_synced_at: string | null;
          refresh_token_encrypted: string | null;
          status: string;
          stripe_account_id: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          charges_enabled?: boolean;
          created_at?: string;
          details_submitted?: boolean;
          id?: string;
          last_error?: string | null;
          last_synced_at?: string | null;
          refresh_token_encrypted?: string | null;
          status?: string;
          stripe_account_id?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          charges_enabled?: boolean;
          created_at?: string;
          details_submitted?: boolean;
          id?: string;
          last_error?: string | null;
          last_synced_at?: string | null;
          refresh_token_encrypted?: string | null;
          status?: string;
          stripe_account_id?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
      };
      user_profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
      };
      venue_users: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["venue_role"];
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["venue_role"];
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["venue_role"];
          user_id?: string;
          venue_id?: string;
        };
      };
      venues: {
        Row: {
          accent_color: string;
          created_at: string;
          id: string;
          logo_url: string | null;
          membership_label: string;
          menu_label: string;
          name: string;
          slug: string;
          tagline: string | null;
          updated_at: string;
          venue_type: Database["public"]["Enums"]["venue_type"];
        };
        Insert: {
          accent_color?: string;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          membership_label?: string;
          menu_label?: string;
          name: string;
          slug: string;
          tagline?: string | null;
          updated_at?: string;
          venue_type: Database["public"]["Enums"]["venue_type"];
        };
        Update: {
          accent_color?: string;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          membership_label?: string;
          menu_label?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          updated_at?: string;
          venue_type?: Database["public"]["Enums"]["venue_type"];
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      user_has_venue_access: {
        Args: {
          target_venue_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      billing_interval: "month" | "quarter" | "year";
      booking_status: "pending" | "confirmed" | "cancelled";
      item_type: "pour" | "food" | "merch" | "event";
      notification_channel: "email" | "sms";
      payment_status: "unpaid" | "paid" | "refunded";
      price_source: "unpriced" | "manual" | "square";
      venue_role: "owner" | "admin" | "staff";
      venue_type: "brewery" | "cidery" | "meadery" | "distillery" | "taproom";
    };
    CompositeTypes: Record<string, never>;
  };
};
