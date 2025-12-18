export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      case_studies: {
        Row: {
          course_id: string
          created_at: string | null
          hints: string | null
          id: string
          model_answer: string
          scenario: string
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          hints?: string | null
          id?: string
          model_answer: string
          scenario: string
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          hints?: string | null
          id?: string
          model_answer?: string
          scenario?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_attempts: {
        Row: {
          ai_feedback: string
          attempt_number: number
          case_study_id: string
          created_at: string | null
          id: string
          is_correct: boolean
          profile_id: string
          student_answer: string
        }
        Insert: {
          ai_feedback: string
          attempt_number?: number
          case_study_id: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          profile_id: string
          student_answer: string
        }
        Update: {
          ai_feedback?: string
          attempt_number?: number
          case_study_id?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          profile_id?: string
          student_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_study_attempts_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_dogs: {
        Row: {
          class_id: string
          created_at: string | null
          dog_id: string
          id: string
          profile_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          dog_id: string
          id?: string
          profile_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          dog_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_dogs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_dogs_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_dogs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          enrolled_at: string | null
          profile_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          profile_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          course_id: string
          created_at: string | null
          edition_name: string
          end_date: string | null
          id: string
          invite_code: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          edition_name: string
          end_date?: string | null
          id?: string
          invite_code?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          edition_name?: string
          end_date?: string | null
          id?: string
          invite_code?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tutors: {
        Row: {
          course_id: string
          created_at: string | null
          tutor_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          tutor_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tutors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tutors_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dogs: {
        Row: {
          age_years: number
          breed: string
          created_at: string | null
          id: string
          name: string
          profile_id: string
          sex: string
          updated_at: string | null
        }
        Insert: {
          age_years: number
          breed: string
          created_at?: string | null
          id?: string
          name: string
          profile_id: string
          sex: string
          updated_at?: string | null
        }
        Update: {
          age_years?: number
          breed?: string
          created_at?: string | null
          id?: string
          name?: string
          profile_id?: string
          sex?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          lesson_id: string
          material_id: string
        }
        Insert: {
          lesson_id: string
          material_id: string
        }
        Update: {
          lesson_id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          lesson_date: string
          location: string | null
          required_prep: string | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lesson_date: string
          location?: string | null
          required_prep?: string | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lesson_date?: string
          location?: string | null
          required_prep?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string | null
          course_id: string
          created_at: string | null
          description: string | null
          file_path: string
          file_type: string | null
          id: string
          link_url: string | null
          material_type: string | null
          title: string
        }
        Insert: {
          category_id?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          link_url?: string | null
          material_type?: string | null
          title: string
        }
        Update: {
          category_id?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          link_url?: string | null
          material_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          change_password_required: boolean | null
          city: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          change_password_required?: boolean | null
          city?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          change_password_required?: boolean | null
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      roles: {
        Row: {
          name: string
          permissions: Json
        }
        Insert: {
          name: string
          permissions?: Json
        }
        Update: {
          name?: string
          permissions?: Json
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          answer: string
          id: string
          profile_id: string
          quiz_id: string
          submitted_at: string | null
          tutor_feedback: string | null
        }
        Insert: {
          answer: string
          id?: string
          profile_id: string
          quiz_id: string
          submitted_at?: string | null
          tutor_feedback?: string | null
        }
        Update: {
          answer?: string
          id?: string
          profile_id?: string
          quiz_id?: string
          submitted_at?: string | null
          tutor_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          model_answer: string | null
          question: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          model_answer?: string | null
          question: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          model_answer?: string | null
          question?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      is_enrolled_in_class: {
        Args: {
          class_uuid: string
        }
        Returns: boolean
      }
      is_tutor_or_admin: {
        Args: Record<string, never>
        Returns: boolean
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export type Profile = Tables<'profiles'>
export type Course = Tables<'courses'>
export type Class = Tables<'classes'>
export type Lesson = Tables<'lessons'>
export type Material = Tables<'materials'>
export type MaterialCategory = Tables<'material_categories'>
export type Quiz = Tables<'quizzes'>
export type QuizSubmission = Tables<'quiz_submissions'>
export type ClassStudent = Tables<'class_students'>
export type CaseStudy = Tables<'case_studies'>
export type CaseStudyAttempt = Tables<'case_study_attempts'>
export type Dog = Tables<'dogs'>
export type ClassDog = Tables<'class_dogs'>
export type Role = Tables<'roles'>

export type UserRole = 'student' | 'tutor' | 'admin'
