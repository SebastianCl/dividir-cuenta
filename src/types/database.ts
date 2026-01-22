/**
 * Tipos de la base de datos Supabase
 */

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          short_code: string
          name: string
          created_at: string
          expires_at: string | null
          status: 'active' | 'closed' | 'archived'
          receipt_image_url: string | null
          tip_type: 'fixed' | 'percentage'
          tip_value: number
          tax_type: 'fixed' | 'percentage'
          tax_value: number
        }
        Insert: {
          id?: string
          short_code: string
          name: string
          created_at?: string
          expires_at?: string | null
          status?: 'active' | 'closed' | 'archived'
          receipt_image_url?: string | null
          tip_type?: 'fixed' | 'percentage'
          tip_value?: number
          tax_type?: 'fixed' | 'percentage'
          tax_value?: number
        }
        Update: {
          id?: string
          short_code?: string
          name?: string
          created_at?: string
          expires_at?: string | null
          status?: 'active' | 'closed' | 'archived'
          receipt_image_url?: string | null
          tip_type?: 'fixed' | 'percentage'
          tip_value?: number
          tax_type?: 'fixed' | 'percentage'
          tax_value?: number
        }
      }
      participants: {
        Row: {
          id: string
          session_id: string
          name: string
          color: string
          is_owner: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          color: string
          is_owner?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          color?: string
          is_owner?: boolean
          joined_at?: string
        }
      }
      items: {
        Row: {
          id: string
          session_id: string
          name: string
          quantity: number
          unit_price: number
          total_price: number
          order_index: number
          is_shared: boolean
          ocr_confidence: number | null
          manually_added: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          quantity?: number
          unit_price: number
          total_price?: number
          order_index?: number
          is_shared?: boolean
          ocr_confidence?: number | null
          manually_added?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          order_index?: number
          is_shared?: boolean
          ocr_confidence?: number | null
          manually_added?: boolean
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          item_id: string
          participant_id: string
          share_fraction: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          participant_id: string
          share_fraction?: number
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          participant_id?: string
          share_fraction?: number
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      session_status: 'active' | 'closed' | 'archived'
    }
  }
}

// Tipos de conveniencia
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type Participant = Database['public']['Tables']['participants']['Row']
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
export type Item = Database['public']['Tables']['items']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']

// Tipos extendidos para la UI
export type ItemWithAssignments = Item & {
  assignments: (Assignment & { participant: Participant })[]
}

export type ParticipantWithTotal = Participant & {
  total: number
  items: ItemWithAssignments[]
}
