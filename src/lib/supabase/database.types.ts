/**
 * Tipuri generate manual din supabase/migrations/*.sql.
 * Regenerează cu Supabase CLI odată ce proiectul e linkat:
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          cui: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cui?: string | null;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cui?: string | null;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          org_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          plate: string;
          vin: string;
          model: string | null;
          owner_id: string | null;
          org_id: string | null;
          is_truck: boolean;
          is_premium: boolean;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plate: string;
          vin: string;
          model?: string | null;
          owner_id?: string | null;
          org_id?: string | null;
          is_truck?: boolean;
          is_premium?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plate?: string;
          vin?: string;
          model?: string | null;
          owner_id?: string | null;
          org_id?: string | null;
          is_truck?: boolean;
          is_premium?: boolean;
          deleted_at?: string | null;
          created_at?: string;
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
          org_id: string;
          name: string;
          phone: string;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          phone: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
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
          owner_id: string | null;
          org_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          org_id?: string | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          org_id?: string | null;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications_log: {
        Row: {
          id: string;
          user_id: string | null;
          org_id: string | null;
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
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          org_id?: string | null;
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
        };
        Update: {
          id?: string;
          user_id?: string | null;
          org_id?: string | null;
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
