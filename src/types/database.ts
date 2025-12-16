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
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string | null
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
      get_user_role: { Args: Record<string, never>; Returns: string }
      is_enrolled_in_class: { Args: { class_uuid: string }; Returns: boolean }
      is_tutor_or_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Course = Tables<'courses'>
export type Class = Tables<'classes'>
export type Lesson = Tables<'lessons'>
export type Material = Tables<'materials'>
export type MaterialCategory = Tables<'material_categories'>
export type Quiz = Tables<'quizzes'>
export type QuizSubmission = Tables<'quiz_submissions'>
export type ClassStudent = Tables<'class_students'>

export type UserRole = 'student' | 'tutor' | 'admin'
