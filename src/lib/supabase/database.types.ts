export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      generations: {
        Row: {
          cost_usd: number | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          outfit_id: string | null;
          prompt_payload: Json | null;
          provider: string | null;
          result_url: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          cost_usd?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          outfit_id?: string | null;
          prompt_payload?: Json | null;
          provider?: string | null;
          result_url?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          cost_usd?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          outfit_id?: string | null;
          prompt_payload?: Json | null;
          provider?: string | null;
          result_url?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generations_outfit_id_fkey";
            columns: ["outfit_id"];
            isOneToOne: false;
            referencedRelation: "outfits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      items: {
        Row: {
          brand: string | null;
          category: string;
          color: string | null;
          color_hex: string | null;
          created_at: string | null;
          id: string;
          image_url: string;
          image_url_processed: string | null;
          last_worn_at: string | null;
          name: string;
          notes: string | null;
          occasion: string[] | null;
          season: string[] | null;
          subcategory: string | null;
          times_worn: number | null;
          user_id: string;
        };
        Insert: {
          brand?: string | null;
          category: string;
          color?: string | null;
          color_hex?: string | null;
          created_at?: string | null;
          id?: string;
          image_url: string;
          image_url_processed?: string | null;
          last_worn_at?: string | null;
          name: string;
          notes?: string | null;
          occasion?: string[] | null;
          season?: string[] | null;
          subcategory?: string | null;
          times_worn?: number | null;
          user_id: string;
        };
        Update: {
          brand?: string | null;
          category?: string;
          color?: string | null;
          color_hex?: string | null;
          created_at?: string | null;
          id?: string;
          image_url?: string;
          image_url_processed?: string | null;
          last_worn_at?: string | null;
          name?: string;
          notes?: string | null;
          occasion?: string[] | null;
          season?: string[] | null;
          subcategory?: string | null;
          times_worn?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      outfits: {
        Row: {
          created_at: string | null;
          generated_image_url: string | null;
          id: string;
          is_favorite: boolean | null;
          item_ids: string[];
          name: string | null;
          notes: string | null;
          planned_for: string | null;
          pose: string | null;
          user_id: string;
          worn_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          generated_image_url?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          item_ids: string[];
          name?: string | null;
          notes?: string | null;
          planned_for?: string | null;
          pose?: string | null;
          user_id: string;
          worn_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          generated_image_url?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          item_ids?: string[];
          name?: string | null;
          notes?: string | null;
          planned_for?: string | null;
          pose?: string | null;
          user_id?: string;
          worn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_reference_paths: string[] | null;
          created_at: string | null;
          display_name: string | null;
          height_cm: number | null;
          id: string;
          measurements: Json | null;
          reference_photo_url: string | null;
          weight_lbs: number | null;
        };
        Insert: {
          avatar_reference_paths?: string[] | null;
          created_at?: string | null;
          display_name?: string | null;
          height_cm?: number | null;
          id: string;
          measurements?: Json | null;
          reference_photo_url?: string | null;
          weight_lbs?: number | null;
        };
        Update: {
          avatar_reference_paths?: string[] | null;
          created_at?: string | null;
          display_name?: string | null;
          height_cm?: number | null;
          id?: string;
          measurements?: Json | null;
          reference_photo_url?: string | null;
          weight_lbs?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
