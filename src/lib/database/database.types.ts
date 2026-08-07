// Generated from local Supabase schema. Do not edit manually.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      conjugation_examples: {
        Row: {
          created_at: string
          display_order: number
          example_id: string
          id: string
          result_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          example_id: string
          id?: string
          result_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          example_id?: string
          id?: string
          result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_examples_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conjugation_examples_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "conjugation_results"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_form_translations: {
        Row: {
          created_at: string
          form_id: string
          id: string
          import_key: string | null
          locale: string
          name: string
          published_at: string | null
          short_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          import_key?: string | null
          locale: string
          name: string
          published_at?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          import_key?: string | null
          locale?: string
          name?: string
          published_at?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_form_translations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "conjugation_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_forms: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          id: string
          import_key: string | null
          published_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          id?: string
          import_key?: string | null
          published_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          id?: string
          import_key?: string | null
          published_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conjugation_result_step_translations: {
        Row: {
          created_at: string
          description: string
          id: string
          import_key: string | null
          locale: string
          published_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          import_key?: string | null
          locale: string
          published_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          import_key?: string | null
          locale?: string
          published_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_result_step_translations_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "conjugation_result_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_result_steps: {
        Row: {
          after_form: string
          applied_rule_id: string | null
          before_form: string
          created_at: string
          id: string
          import_key: string | null
          operation_code: string | null
          result_id: string
          step_order: number
          updated_at: string
        }
        Insert: {
          after_form: string
          applied_rule_id?: string | null
          before_form: string
          created_at?: string
          id?: string
          import_key?: string | null
          operation_code?: string | null
          result_id: string
          step_order: number
          updated_at?: string
        }
        Update: {
          after_form?: string
          applied_rule_id?: string | null
          before_form?: string
          created_at?: string
          id?: string
          import_key?: string | null
          operation_code?: string | null
          result_id?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_result_steps_applied_rule_id_fkey"
            columns: ["applied_rule_id"]
            isOneToOne: false
            referencedRelation: "conjugation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conjugation_result_steps_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "conjugation_results"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_results: {
        Row: {
          archived_at: string | null
          created_at: string
          entry_id: string
          form_id: string
          id: string
          import_key: string | null
          irregular_type: string | null
          is_irregular: boolean
          is_preferred: boolean
          published_at: string | null
          result: string
          result_normalized: string
          rule_id: string | null
          status: string
          stem_used: string | null
          updated_at: string
          variant_order: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          entry_id: string
          form_id: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          is_irregular?: boolean
          is_preferred?: boolean
          published_at?: string | null
          result: string
          result_normalized: string
          rule_id?: string | null
          status?: string
          stem_used?: string | null
          updated_at?: string
          variant_order?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          entry_id?: string
          form_id?: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          is_irregular?: boolean
          is_preferred?: boolean
          published_at?: string | null
          result?: string
          result_normalized?: string
          rule_id?: string | null
          status?: string
          stem_used?: string | null
          updated_at?: string
          variant_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_results_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conjugation_results_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "conjugation_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conjugation_results_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "conjugation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_rule_translations: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          import_key: string | null
          locale: string
          published_at: string | null
          rule_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          import_key?: string | null
          locale: string
          published_at?: string | null
          rule_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          import_key?: string | null
          locale?: string
          published_at?: string | null
          rule_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conjugation_rule_translations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "conjugation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      conjugation_rules: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          import_key: string | null
          irregular_type: string | null
          is_irregular: boolean
          published_at: string | null
          rule_category: string | null
          rule_code: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          is_irregular?: boolean
          published_at?: string | null
          rule_category?: string | null
          rule_code: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          is_irregular?: boolean
          published_at?: string | null
          rule_category?: string | null
          rule_code?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          citation_note: string | null
          conjugation_result_id: string | null
          conjugation_rule_id: string | null
          created_at: string
          entry_id: string | null
          example_id: string | null
          hanja_character_id: string | null
          hanja_term_id: string | null
          id: string
          idiom_id: string | null
          sense_id: string | null
          sound_change_rule_id: string | null
          source_id: string
        }
        Insert: {
          citation_note?: string | null
          conjugation_result_id?: string | null
          conjugation_rule_id?: string | null
          created_at?: string
          entry_id?: string | null
          example_id?: string | null
          hanja_character_id?: string | null
          hanja_term_id?: string | null
          id?: string
          idiom_id?: string | null
          sense_id?: string | null
          sound_change_rule_id?: string | null
          source_id: string
        }
        Update: {
          citation_note?: string | null
          conjugation_result_id?: string | null
          conjugation_rule_id?: string | null
          created_at?: string
          entry_id?: string | null
          example_id?: string | null
          hanja_character_id?: string | null
          hanja_term_id?: string | null
          id?: string
          idiom_id?: string | null
          sense_id?: string | null
          sound_change_rule_id?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_conjugation_result_id_fkey"
            columns: ["conjugation_result_id"]
            isOneToOne: false
            referencedRelation: "conjugation_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_conjugation_rule_id_fkey"
            columns: ["conjugation_rule_id"]
            isOneToOne: false
            referencedRelation: "conjugation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_hanja_character_id_fkey"
            columns: ["hanja_character_id"]
            isOneToOne: false
            referencedRelation: "hanja_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_hanja_term_id_fkey"
            columns: ["hanja_term_id"]
            isOneToOne: false
            referencedRelation: "hanja_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_sense_id_fkey"
            columns: ["sense_id"]
            isOneToOne: false
            referencedRelation: "senses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_sound_change_rule_id_fkey"
            columns: ["sound_change_rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          archived_at: string | null
          created_at: string
          difficulty_level: string | null
          etymology_type: string | null
          frequency_level: string | null
          headword: string
          headword_normalized: string
          id: string
          import_key: string | null
          irregular_type: string | null
          part_of_speech: string
          pronunciation_hangul: string | null
          pronunciation_romanization: string | null
          published_at: string | null
          romanization: string | null
          romanization_normalized: string | null
          slug: string
          status: string
          stem: string | null
          topik_level: number | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          etymology_type?: string | null
          frequency_level?: string | null
          headword: string
          headword_normalized: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          part_of_speech: string
          pronunciation_hangul?: string | null
          pronunciation_romanization?: string | null
          published_at?: string | null
          romanization?: string | null
          romanization_normalized?: string | null
          slug: string
          status?: string
          stem?: string | null
          topik_level?: number | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          etymology_type?: string | null
          frequency_level?: string | null
          headword?: string
          headword_normalized?: string
          id?: string
          import_key?: string | null
          irregular_type?: string | null
          part_of_speech?: string
          pronunciation_hangul?: string | null
          pronunciation_romanization?: string | null
          published_at?: string | null
          romanization?: string | null
          romanization_normalized?: string | null
          slug?: string
          status?: string
          stem?: string | null
          topik_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      entry_aliases: {
        Row: {
          alias: string
          alias_normalized: string
          alias_type: string
          archived_at: string | null
          created_at: string
          entry_id: string
          id: string
          import_key: string | null
          is_searchable: boolean
          locale: string | null
          published_at: string | null
          script: string
          status: string
          updated_at: string
        }
        Insert: {
          alias: string
          alias_normalized: string
          alias_type: string
          archived_at?: string | null
          created_at?: string
          entry_id: string
          id?: string
          import_key?: string | null
          is_searchable?: boolean
          locale?: string | null
          published_at?: string | null
          script?: string
          status?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_normalized?: string
          alias_type?: string
          archived_at?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          import_key?: string | null
          is_searchable?: boolean
          locale?: string | null
          published_at?: string | null
          script?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_aliases_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_examples: {
        Row: {
          created_at: string
          display_order: number
          entry_id: string
          example_id: string
          id: string
          sense_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          entry_id: string
          example_id: string
          id?: string
          sense_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          entry_id?: string
          example_id?: string
          id?: string
          sense_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_examples_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_examples_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_examples_sense_id_fkey"
            columns: ["sense_id"]
            isOneToOne: false
            referencedRelation: "senses"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_relations: {
        Row: {
          created_at: string
          id: string
          relation_type: string
          source_entry_id: string
          target_entry_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relation_type: string
          source_entry_id: string
          target_entry_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relation_type?: string
          source_entry_id?: string
          target_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_relations_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_relations_target_entry_id_fkey"
            columns: ["target_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_sound_changes: {
        Row: {
          context_note: string | null
          created_at: string
          entry_id: string
          id: string
          relation_type: string
          rule_id: string
        }
        Insert: {
          context_note?: string | null
          created_at?: string
          entry_id: string
          id?: string
          relation_type: string
          rule_id: string
        }
        Update: {
          context_note?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          relation_type?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_sound_changes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_sound_changes_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_translations: {
        Row: {
          created_at: string
          entry_id: string
          etymology_note: string | null
          general_note: string | null
          id: string
          import_key: string | null
          irregular_note: string | null
          locale: string
          published_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          etymology_note?: string | null
          general_note?: string | null
          id?: string
          import_key?: string | null
          irregular_note?: string | null
          locale: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          etymology_note?: string | null
          general_note?: string | null
          id?: string
          import_key?: string | null
          irregular_note?: string | null
          locale?: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_translations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      example_translations: {
        Row: {
          created_at: string
          example_id: string
          id: string
          import_key: string | null
          locale: string
          published_at: string | null
          status: string
          translation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          example_id: string
          id?: string
          import_key?: string | null
          locale: string
          published_at?: string | null
          status?: string
          translation: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          example_id?: string
          id?: string
          import_key?: string | null
          locale?: string
          published_at?: string | null
          status?: string
          translation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "example_translations_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
        ]
      }
      examples: {
        Row: {
          archived_at: string | null
          created_at: string
          difficulty_level: string | null
          id: string
          import_key: string | null
          korean_text: string
          korean_text_normalized: string
          license_note: string | null
          provenance_type: string
          published_at: string | null
          register: string | null
          romanization: string | null
          source_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          import_key?: string | null
          korean_text: string
          korean_text_normalized: string
          license_note?: string | null
          provenance_type?: string
          published_at?: string | null
          register?: string | null
          romanization?: string | null
          source_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          import_key?: string | null
          korean_text?: string
          korean_text_normalized?: string
          license_note?: string | null
          provenance_type?: string
          published_at?: string | null
          register?: string | null
          romanization?: string | null
          source_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          client_context: Json
          conjugation_result_id: string | null
          contact_email: string | null
          created_at: string
          entry_id: string | null
          example_id: string | null
          example_translation_id: string | null
          hanja_character_id: string | null
          hanja_term_id: string | null
          id: string
          idiom_id: string | null
          message: string
          reported_path: string | null
          resolved_at: string | null
          sense_id: string | null
          sense_translation_id: string | null
          sound_change_rule_id: string | null
          status: string
          target_kind: string
          target_snapshot: Json
          target_was_deleted: boolean
          updated_at: string
        }
        Insert: {
          category: string
          client_context?: Json
          conjugation_result_id?: string | null
          contact_email?: string | null
          created_at?: string
          entry_id?: string | null
          example_id?: string | null
          example_translation_id?: string | null
          hanja_character_id?: string | null
          hanja_term_id?: string | null
          id?: string
          idiom_id?: string | null
          message: string
          reported_path?: string | null
          resolved_at?: string | null
          sense_id?: string | null
          sense_translation_id?: string | null
          sound_change_rule_id?: string | null
          status?: string
          target_kind: string
          target_snapshot?: Json
          target_was_deleted?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          client_context?: Json
          conjugation_result_id?: string | null
          contact_email?: string | null
          created_at?: string
          entry_id?: string | null
          example_id?: string | null
          example_translation_id?: string | null
          hanja_character_id?: string | null
          hanja_term_id?: string | null
          id?: string
          idiom_id?: string | null
          message?: string
          reported_path?: string | null
          resolved_at?: string | null
          sense_id?: string | null
          sense_translation_id?: string | null
          sound_change_rule_id?: string | null
          status?: string
          target_kind?: string
          target_snapshot?: Json
          target_was_deleted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_conjugation_result_id_fkey"
            columns: ["conjugation_result_id"]
            isOneToOne: false
            referencedRelation: "conjugation_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_example_translation_id_fkey"
            columns: ["example_translation_id"]
            isOneToOne: false
            referencedRelation: "example_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_hanja_character_id_fkey"
            columns: ["hanja_character_id"]
            isOneToOne: false
            referencedRelation: "hanja_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_hanja_term_id_fkey"
            columns: ["hanja_term_id"]
            isOneToOne: false
            referencedRelation: "hanja_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_sense_id_fkey"
            columns: ["sense_id"]
            isOneToOne: false
            referencedRelation: "senses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_sense_translation_id_fkey"
            columns: ["sense_translation_id"]
            isOneToOne: false
            referencedRelation: "sense_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_sound_change_rule_id_fkey"
            columns: ["sound_change_rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      hanja_character_translations: {
        Row: {
          character_id: string
          created_at: string
          id: string
          import_key: string | null
          locale: string
          meaning: string
          note: string | null
          published_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          import_key?: string | null
          locale: string
          meaning: string
          note?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          import_key?: string | null
          locale?: string
          meaning?: string
          note?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanja_character_translations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "hanja_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      hanja_characters: {
        Row: {
          archived_at: string | null
          character: string
          created_at: string
          id: string
          import_key: string | null
          japanese_shinjitai: string | null
          published_at: string | null
          radical: string | null
          simplified_chinese: string | null
          status: string
          stroke_count: number | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          character: string
          created_at?: string
          id?: string
          import_key?: string | null
          japanese_shinjitai?: string | null
          published_at?: string | null
          radical?: string | null
          simplified_chinese?: string | null
          status?: string
          stroke_count?: number | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          character?: string
          created_at?: string
          id?: string
          import_key?: string | null
          japanese_shinjitai?: string | null
          published_at?: string | null
          radical?: string | null
          simplified_chinese?: string | null
          status?: string
          stroke_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hanja_readings: {
        Row: {
          archived_at: string | null
          character_id: string
          created_at: string
          display_order: number
          id: string
          import_key: string | null
          is_primary: boolean
          published_at: string | null
          reading_hangul: string
          reading_romanization: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          character_id: string
          created_at?: string
          display_order?: number
          id?: string
          import_key?: string | null
          is_primary?: boolean
          published_at?: string | null
          reading_hangul: string
          reading_romanization?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          character_id?: string
          created_at?: string
          display_order?: number
          id?: string
          import_key?: string | null
          is_primary?: boolean
          published_at?: string | null
          reading_hangul?: string
          reading_romanization?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanja_readings_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "hanja_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      hanja_term_character_translations: {
        Row: {
          created_at: string
          id: string
          import_key: string | null
          locale: string
          meaning_in_term: string
          note: string | null
          published_at: string | null
          status: string
          term_character_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_key?: string | null
          locale: string
          meaning_in_term: string
          note?: string | null
          published_at?: string | null
          status?: string
          term_character_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          import_key?: string | null
          locale?: string
          meaning_in_term?: string
          note?: string | null
          published_at?: string | null
          status?: string
          term_character_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanja_term_character_translations_term_character_id_fkey"
            columns: ["term_character_id"]
            isOneToOne: false
            referencedRelation: "hanja_term_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      hanja_term_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          position: number
          reading_id: string | null
          term_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          position: number
          reading_id?: string | null
          term_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          position?: number
          reading_id?: string | null
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanja_term_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "hanja_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanja_term_characters_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "hanja_readings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanja_term_characters_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "hanja_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      hanja_terms: {
        Row: {
          archived_at: string | null
          created_at: string
          entry_id: string
          id: string
          import_key: string | null
          is_primary: boolean
          japanese_shinjitai: string | null
          korean_hanja: string
          published_at: string | null
          simplified_chinese: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          entry_id: string
          id?: string
          import_key?: string | null
          is_primary?: boolean
          japanese_shinjitai?: string | null
          korean_hanja: string
          published_at?: string | null
          simplified_chinese?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          import_key?: string | null
          is_primary?: boolean
          japanese_shinjitai?: string | null
          korean_hanja?: string
          published_at?: string | null
          simplified_chinese?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanja_terms_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      idiom_category_links: {
        Row: {
          category: string
          created_at: string
          id: string
          idiom_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          idiom_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          idiom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idiom_category_links_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
        ]
      }
      idiom_entry_links: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          idiom_id: string
          link_note: string | null
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          idiom_id: string
          link_note?: string | null
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          idiom_id?: string
          link_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idiom_entry_links_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idiom_entry_links_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
        ]
      }
      idiom_examples: {
        Row: {
          created_at: string
          display_order: number
          example_id: string
          id: string
          idiom_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          example_id: string
          id?: string
          idiom_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          example_id?: string
          id?: string
          idiom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idiom_examples_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idiom_examples_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
        ]
      }
      idiom_relations: {
        Row: {
          created_at: string
          id: string
          relation_type: string
          source_idiom_id: string
          target_idiom_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relation_type: string
          source_idiom_id: string
          target_idiom_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relation_type?: string
          source_idiom_id?: string
          target_idiom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idiom_relations_source_idiom_id_fkey"
            columns: ["source_idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idiom_relations_target_idiom_id_fkey"
            columns: ["target_idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
        ]
      }
      idiom_translations: {
        Row: {
          actual_meaning: string
          common_misuse: string | null
          created_at: string
          id: string
          idiom_id: string
          import_key: string | null
          literal_meaning: string | null
          locale: string
          nuance_note: string | null
          published_at: string | null
          status: string
          updated_at: string
          usage_scenario: string | null
        }
        Insert: {
          actual_meaning: string
          common_misuse?: string | null
          created_at?: string
          id?: string
          idiom_id: string
          import_key?: string | null
          literal_meaning?: string | null
          locale: string
          nuance_note?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
          usage_scenario?: string | null
        }
        Update: {
          actual_meaning?: string
          common_misuse?: string | null
          created_at?: string
          id?: string
          idiom_id?: string
          import_key?: string | null
          literal_meaning?: string | null
          locale?: string
          nuance_note?: string | null
          published_at?: string | null
          status?: string
          updated_at?: string
          usage_scenario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idiom_translations_idiom_id_fkey"
            columns: ["idiom_id"]
            isOneToOne: false
            referencedRelation: "idioms"
            referencedColumns: ["id"]
          },
        ]
      }
      idioms: {
        Row: {
          archived_at: string | null
          created_at: string
          expression: string
          expression_normalized: string
          id: string
          import_key: string | null
          published_at: string | null
          register: string
          romanization: string | null
          romanization_normalized: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          expression: string
          expression_normalized: string
          id?: string
          import_key?: string | null
          published_at?: string | null
          register?: string
          romanization?: string | null
          romanization_normalized?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          expression?: string
          expression_normalized?: string
          id?: string
          import_key?: string | null
          published_at?: string | null
          register?: string
          romanization?: string | null
          romanization_normalized?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sense_translations: {
        Row: {
          created_at: string
          definition: string | null
          id: string
          import_key: string | null
          locale: string
          nuance_note: string | null
          published_at: string | null
          sense_id: string
          short_definition: string | null
          status: string
          updated_at: string
          usage_note: string | null
        }
        Insert: {
          created_at?: string
          definition?: string | null
          id?: string
          import_key?: string | null
          locale: string
          nuance_note?: string | null
          published_at?: string | null
          sense_id: string
          short_definition?: string | null
          status?: string
          updated_at?: string
          usage_note?: string | null
        }
        Update: {
          created_at?: string
          definition?: string | null
          id?: string
          import_key?: string | null
          locale?: string
          nuance_note?: string | null
          published_at?: string | null
          sense_id?: string
          short_definition?: string | null
          status?: string
          updated_at?: string
          usage_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sense_translations_sense_id_fkey"
            columns: ["sense_id"]
            isOneToOne: false
            referencedRelation: "senses"
            referencedColumns: ["id"]
          },
        ]
      }
      senses: {
        Row: {
          archived_at: string | null
          created_at: string
          entry_id: string
          id: string
          import_key: string | null
          is_primary: boolean
          published_at: string | null
          register: string | null
          sense_order: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          entry_id: string
          id?: string
          import_key?: string | null
          is_primary?: boolean
          published_at?: string | null
          register?: string | null
          sense_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          import_key?: string | null
          is_primary?: boolean
          published_at?: string | null
          register?: string | null
          sense_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "senses_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_change_examples: {
        Row: {
          created_at: string
          display_order: number
          example_id: string
          id: string
          rule_id: string
          step_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          example_id: string
          id?: string
          rule_id: string
          step_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          example_id?: string
          id?: string
          rule_id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sound_change_examples_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sound_change_examples_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sound_change_examples_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sound_change_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_change_rule_relations: {
        Row: {
          created_at: string
          id: string
          relation_type: string
          source_rule_id: string
          target_rule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relation_type: string
          source_rule_id: string
          target_rule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relation_type?: string
          source_rule_id?: string
          target_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_change_rule_relations_source_rule_id_fkey"
            columns: ["source_rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sound_change_rule_relations_target_rule_id_fkey"
            columns: ["target_rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_change_rules: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          difficulty: number | null
          frequency: number | null
          id: string
          import_key: string | null
          input_pattern: string | null
          output_pattern: string | null
          published_at: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category: string
          created_at?: string
          difficulty?: number | null
          frequency?: number | null
          id?: string
          import_key?: string | null
          input_pattern?: string | null
          output_pattern?: string | null
          published_at?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          difficulty?: number | null
          frequency?: number | null
          id?: string
          import_key?: string | null
          input_pattern?: string | null
          output_pattern?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sound_change_step_translations: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          import_key: string | null
          label: string | null
          locale: string
          published_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          import_key?: string | null
          label?: string | null
          locale: string
          published_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          import_key?: string | null
          label?: string | null
          locale?: string
          published_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_change_step_translations_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sound_change_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_change_steps: {
        Row: {
          after_form: string
          before_form: string
          created_at: string
          environment_pattern: string | null
          id: string
          import_key: string | null
          is_optional: boolean
          rule_id: string
          step_order: number
          updated_at: string
        }
        Insert: {
          after_form: string
          before_form: string
          created_at?: string
          environment_pattern?: string | null
          id?: string
          import_key?: string | null
          is_optional?: boolean
          rule_id: string
          step_order: number
          updated_at?: string
        }
        Update: {
          after_form?: string
          before_form?: string
          created_at?: string
          environment_pattern?: string | null
          id?: string
          import_key?: string | null
          is_optional?: boolean
          rule_id?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_change_steps_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_change_translations: {
        Row: {
          cautions: string | null
          conditions: string | null
          created_at: string
          description: string | null
          exceptions: string | null
          id: string
          import_key: string | null
          locale: string
          name: string
          published_at: string | null
          rule_id: string
          short_summary: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cautions?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          exceptions?: string | null
          id?: string
          import_key?: string | null
          locale: string
          name: string
          published_at?: string | null
          rule_id: string
          short_summary?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cautions?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          exceptions?: string | null
          id?: string
          import_key?: string | null
          locale?: string
          name?: string
          published_at?: string | null
          rule_id?: string
          short_summary?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_change_translations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "sound_change_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          accessed_at: string | null
          author_or_org: string | null
          created_at: string
          id: string
          import_key: string | null
          is_publicly_displayed: boolean
          license: string | null
          notes: string | null
          publication_date: string | null
          publisher: string | null
          source_type: string
          title: string
          updated_at: string
          url: string | null
          verification_status: string
        }
        Insert: {
          accessed_at?: string | null
          author_or_org?: string | null
          created_at?: string
          id?: string
          import_key?: string | null
          is_publicly_displayed?: boolean
          license?: string | null
          notes?: string | null
          publication_date?: string | null
          publisher?: string | null
          source_type: string
          title: string
          updated_at?: string
          url?: string | null
          verification_status?: string
        }
        Update: {
          accessed_at?: string | null
          author_or_org?: string | null
          created_at?: string
          id?: string
          import_key?: string | null
          is_publicly_displayed?: boolean
          license?: string | null
          notes?: string | null
          publication_date?: string | null
          publisher?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url?: string | null
          verification_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      distinct_uuid_pair: { Args: { a: string; b: string }; Returns: string[] }
      feedback_targets_are_consistent: {
        Args: {
          p_conjugation_result_id: string
          p_entry_id: string
          p_example_id: string
          p_example_translation_id: string
          p_hanja_character_id: string
          p_hanja_term_id: string
          p_idiom_id: string
          p_sense_id: string
          p_sense_translation_id: string
          p_sound_change_rule_id: string
          p_target_kind: string
          p_target_was_deleted: boolean
        }
        Returns: boolean
      }
      revalidate_published_conjugation_forms: {
        Args: { p_form_ids: string[] }
        Returns: undefined
      }
      revalidate_published_conjugation_results: {
        Args: { p_result_ids: string[] }
        Returns: undefined
      }
      revalidate_published_conjugation_rules: {
        Args: { p_rule_ids: string[] }
        Returns: undefined
      }
      revalidate_published_hanja_characters: {
        Args: { p_character_ids: string[] }
        Returns: undefined
      }
      revalidate_published_hanja_terms: {
        Args: { p_term_ids: string[] }
        Returns: undefined
      }
      revalidate_published_idioms: {
        Args: { p_idiom_ids: string[] }
        Returns: undefined
      }
      revalidate_published_sound_change_rules: {
        Args: { p_rule_ids: string[] }
        Returns: undefined
      }
      submit_feedback: {
        Args: {
          p_category: string
          p_client_context?: Json
          p_conjugation_result_id?: string
          p_contact_email?: string
          p_entry_id?: string
          p_example_id?: string
          p_example_translation_id?: string
          p_hanja_character_id?: string
          p_hanja_term_id?: string
          p_idiom_id?: string
          p_message: string
          p_reported_path?: string
          p_sense_id?: string
          p_sense_translation_id?: string
          p_sound_change_rule_id?: string
          p_target_kind: string
          p_target_snapshot?: Json
        }
        Returns: string
      }
      validate_conjugation_form_publishable: {
        Args: { p_form_id: string }
        Returns: undefined
      }
      validate_conjugation_result_publishable: {
        Args: { p_result_id: string }
        Returns: undefined
      }
      validate_conjugation_rule_publishable: {
        Args: { p_rule_id: string }
        Returns: undefined
      }
      validate_entry_publishable: {
        Args: { p_entry_id: string }
        Returns: undefined
      }
      validate_example_publishable: {
        Args: { p_example_id: string }
        Returns: undefined
      }
      validate_hanja_character_publishable: {
        Args: { p_character_id: string }
        Returns: undefined
      }
      validate_hanja_term_publishable: {
        Args: { p_term_id: string }
        Returns: undefined
      }
      validate_idiom_publishable: {
        Args: { p_idiom_id: string }
        Returns: undefined
      }
      validate_sound_change_rule_publishable: {
        Args: { p_rule_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

