/**
 * Tipuri generate manual din supabase/migrations/*.sql.
 * Regenerează cu Supabase CLI odată ce proiectul e linkat:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string; email_notifications: boolean };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          email_notifications?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          email_notifications?: boolean;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          kind: "personal" | "fleet";
          name: string;
          owner_id: string;
          cui: string | null;
          subscription_status: "trialing" | "active" | "expired";
          trial_ends_at: string;
          created_at: string;
        };
        // subscription_status si trial_ends_at au INSERT revocat pentru
        // authenticated/anon (vezi migrarea 20260917100000) — valorile vin din
        // default-urile DB, deci nu se trimit de la client.
        Insert: {
          id?: string;
          kind: "personal" | "fleet";
          name: string;
          owner_id: string;
          cui?: string | null;
          created_at?: string;
        };
        // Doar campurile pe care clientul chiar le poate modifica.
        Update: {
          name?: string;
          cui?: string | null;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          space_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          space_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          space_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          space_id: string;
          plate: string;
          plate_normalized: string;
          vin: string;
          model: string | null;
          is_truck: boolean;
          paid_until: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        // plate_normalized e completata de trigger; paid_until are UPDATE
        // revocat pentru client si se scrie doar server-side, din fluxul de
        // plata (vezi migrarea 20260917100000).
        Insert: {
          id?: string;
          space_id: string;
          plate: string;
          vin: string;
          model?: string | null;
          is_truck?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          plate?: string;
          vin?: string;
          model?: string | null;
          is_truck?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      vehicle_docs: {
        Row: {
          id: string;
          vehicle_id: string;
          type: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          type: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          type?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          phone: string;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          name: string;
          phone: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          name?: string;
          phone?: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      driver_certs: {
        Row: {
          id: string;
          driver_id: string;
          type: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          type: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          type?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      alert_types: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications_log: {
        Row: {
          id: string;
          user_id: string | null;
          space_id: string;
          vehicle_id: string | null;
          driver_id: string | null;
          vehicle_doc_id: string | null;
          driver_cert_id: string | null;
          doc_type: string;
          days_before: number | null;
          expires_at: string | null;
          channel: "in_app" | "email" | "sms" | "push";
          sent_at: string;
          read_at: string | null;
          email_sent_at: string | null;
          push_sent_at: string | null;
          push_clicked_at: string | null;
          push_dismissed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          space_id: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          vehicle_doc_id?: string | null;
          driver_cert_id?: string | null;
          doc_type: string;
          days_before?: number | null;
          expires_at?: string | null;
          channel: "in_app" | "email" | "sms" | "push";
          sent_at?: string;
          read_at?: string | null;
          email_sent_at?: string | null;
          push_sent_at?: string | null;
          push_clicked_at?: string | null;
          push_dismissed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          space_id?: string;
          vehicle_id?: string | null;
          driver_id?: string | null;
          vehicle_doc_id?: string | null;
          driver_cert_id?: string | null;
          doc_type?: string;
          days_before?: number | null;
          expires_at?: string | null;
          channel?: "in_app" | "email" | "sms" | "push";
          sent_at?: string;
          read_at?: string | null;
          email_sent_at?: string | null;
          push_sent_at?: string | null;
          push_clicked_at?: string | null;
          push_dismissed_at?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          plate_number: string;
          email: string | null;
          status: "pending" | "completed";
          result_itp: "valid" | "expirat" | "nu_gasit" | null;
          result_rca: "valid" | "expirat" | "nu_gasit" | null;
          result_rovinieta: "valid" | "expirat" | "nu_gasit" | null;
          result_itp_expires: string | null;
          result_rca_expires: string | null;
          result_rovinieta_expires: string | null;
          created_at: string;
          completed_at: string | null;
          token: string;
          user_id: string | null;
          admin_notified_at: string | null;
          vehicle_id: string | null;
        };
        Insert: {
          id?: string;
          plate_number: string;
          email?: string | null;
          status?: "pending" | "completed";
          result_itp?: "valid" | "expirat" | "nu_gasit" | null;
          result_rca?: "valid" | "expirat" | "nu_gasit" | null;
          result_rovinieta?: "valid" | "expirat" | "nu_gasit" | null;
          result_itp_expires?: string | null;
          result_rca_expires?: string | null;
          result_rovinieta_expires?: string | null;
          created_at?: string;
          completed_at?: string | null;
          token?: string;
          user_id?: string | null;
          admin_notified_at?: string | null;
          vehicle_id?: string | null;
        };
        Update: {
          id?: string;
          plate_number?: string;
          email?: string | null;
          status?: "pending" | "completed";
          result_itp?: "valid" | "expirat" | "nu_gasit" | null;
          result_rca?: "valid" | "expirat" | "nu_gasit" | null;
          result_rovinieta?: "valid" | "expirat" | "nu_gasit" | null;
          result_itp_expires?: string | null;
          result_rca_expires?: string | null;
          result_rovinieta_expires?: string | null;
          created_at?: string;
          completed_at?: string | null;
          token?: string;
          user_id?: string | null;
          admin_notified_at?: string | null;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "verification_completed";
          verification_request_id: string | null;
          title: string;
          body: string;
          href: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "verification_completed";
          verification_request_id?: string | null;
          title: string;
          body: string;
          href: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "verification_completed";
          verification_request_id?: string | null;
          title?: string;
          body?: string;
          href?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      attach_verification_email: {
        Args: { p_token: string; p_email: string };
        Returns: null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
