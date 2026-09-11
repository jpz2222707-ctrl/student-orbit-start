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
      academic_periods: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_demo: boolean
          name: string
          order_index: number
          start_date: string
          status: Database["public"]["Enums"]["period_status"]
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_demo?: boolean
          name: string
          order_index: number
          start_date: string
          status?: Database["public"]["Enums"]["period_status"]
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_demo?: boolean
          name?: string
          order_index?: number
          start_date?: string
          status?: Database["public"]["Enums"]["period_status"]
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          year?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
        }
        Relationships: []
      }
      course_subjects: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_demo: boolean
          subject_id: string
          teacher_id: string | null
          weekly_hours: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          subject_id: string
          teacher_id?: string | null
          weekly_hours?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          subject_id?: string
          teacher_id?: string | null
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year_id: string
          code: string
          created_at: string
          grade_level_id: string
          homeroom_teacher_id: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
        }
        Insert: {
          academic_year_id: string
          code: string
          created_at?: string
          grade_level_id: string
          homeroom_teacher_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
        }
        Update: {
          academic_year_id?: string
          code?: string
          created_at?: string
          grade_level_id?: string
          homeroom_teacher_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_homeroom_teacher_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year_id: string
          course_id: string
          enrolled_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          student_id: string
        }
        Insert: {
          academic_year_id: string
          course_id: string
          enrolled_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          student_id: string
        }
        Update: {
          academic_year_id?: string
          course_id?: string
          enrolled_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          is_published: boolean
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          is_published?: boolean
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          is_published?: boolean
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      grade_items: {
        Row: {
          course_subject_id: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          order_index: number
          period_id: string
          weight: number
        }
        Insert: {
          course_subject_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          order_index?: number
          period_id: string
          weight?: number
        }
        Update: {
          course_subject_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          order_index?: number
          period_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_items_course_subject_id_fkey"
            columns: ["course_subject_id"]
            isOneToOne: false
            referencedRelation: "course_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_items_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          level: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          level: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          level?: number
          name?: string
        }
        Relationships: []
      }
      grade_scores: {
        Row: {
          created_at: string
          grade_item_id: string
          id: string
          recorded_by: string | null
          score: number
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_item_id: string
          id?: string
          recorded_by?: string | null
          score: number
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_item_id?: string
          id?: string
          recorded_by?: string | null
          score?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_scores_grade_item_id_fkey"
            columns: ["grade_item_id"]
            isOneToOne: false
            referencedRelation: "grade_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_students: {
        Row: {
          guardian_id: string
          id: string
          relationship: string | null
          student_id: string
        }
        Insert: {
          guardian_id: string
          id?: string
          relationship?: string | null
          student_id: string
        }
        Update: {
          guardian_id?: string
          id?: string
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_students_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          email: string | null
          first_name: string
          id: string
          is_demo: boolean
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["person_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name: string
          id?: string
          is_demo?: boolean
          last_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      institution_settings: {
        Row: {
          address: string | null
          email: string | null
          history: string | null
          id: string
          logo_url: string | null
          max_grade: number
          min_grade: number
          mission: string | null
          name: string
          passing_grade: number
          phone: string | null
          slogan: string | null
          updated_at: string
          vision: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          history?: string | null
          id?: string
          logo_url?: string | null
          max_grade?: number
          min_grade?: number
          mission?: string | null
          name?: string
          passing_grade?: number
          phone?: string | null
          slogan?: string | null
          updated_at?: string
          vision?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          history?: string | null
          id?: string
          logo_url?: string | null
          max_grade?: number
          min_grade?: number
          mission?: string | null
          name?: string
          passing_grade?: number
          phone?: string | null
          slogan?: string | null
          updated_at?: string
          vision?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          is_demo: boolean
          is_published: boolean
          published_at: string
          summary: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          is_published?: boolean
          published_at?: string
          summary?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_demo?: boolean
          is_published?: boolean
          published_at?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      observations: {
        Row: {
          content: string
          course_subject_id: string | null
          created_at: string
          created_by: string | null
          id: string
          period_id: string
          student_id: string
        }
        Insert: {
          content: string
          course_subject_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_id: string
          student_id: string
        }
        Update: {
          content?: string
          course_subject_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_course_subject_id_fkey"
            columns: ["course_subject_id"]
            isOneToOne: false
            referencedRelation: "course_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          average: number | null
          course_id: string
          generated_at: string
          generated_by: string | null
          id: string
          payload: Json
          period_id: string
          student_id: string
        }
        Insert: {
          average?: number | null
          course_id: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          payload?: Json
          period_id: string
          student_id: string
        }
        Update: {
          average?: number | null
          course_id?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          payload?: Json
          period_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          email: string | null
          first_name: string
          id: string
          is_demo: boolean
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document_number: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name: string
          id?: string
          is_demo?: boolean
          last_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          email: string | null
          first_name: string
          id: string
          is_demo: boolean
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["person_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name: string
          id?: string
          is_demo?: boolean
          last_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          updated_at?: string
          user_id?: string | null
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
        Relationships: []
      }
    }
    Views: {
      subject_period_results: {
        Row: {
          course_subject_id: string | null
          final_score: number | null
          period_id: string | null
          scores_count: number | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_items_course_subject_id_fkey"
            columns: ["course_subject_id"]
            isOneToOne: false
            referencedRelation: "course_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_items_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_student_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_guardian_of: { Args: { _student_id: string }; Returns: boolean }
      period_is_open: { Args: { _period_id: string }; Returns: boolean }
      teaches_course: { Args: { _course_id: string }; Returns: boolean }
      teaches_course_subject: { Args: { _cs_id: string }; Returns: boolean }
      teaches_student: { Args: { _student_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "guardian"
      document_type: "RC" | "TI" | "CC" | "CE" | "PA" | "NUIP"
      period_status: "proximo" | "activo" | "cerrado"
      person_status: "activo" | "inactivo"
      student_status:
        | "preinscrito"
        | "inscrito"
        | "matriculado"
        | "activo"
        | "retirado"
        | "graduado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "teacher", "student", "guardian"],
      document_type: ["RC", "TI", "CC", "CE", "PA", "NUIP"],
      period_status: ["proximo", "activo", "cerrado"],
      person_status: ["activo", "inactivo"],
      student_status: [
        "preinscrito",
        "inscrito",
        "matriculado",
        "activo",
        "retirado",
        "graduado",
      ],
    },
  },
} as const
