export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tables: {
        Row: {
          id: number
          number: number
          status: 'available' | 'occupied' | 'reserved' | 'cleaning'
          capacity: number
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          number: number
          status?: 'available' | 'occupied' | 'reserved' | 'cleaning'
          capacity: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          number?: number
          status?: 'available' | 'occupied' | 'reserved' | 'cleaning'
          capacity?: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          is_available: boolean
          preparation_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          is_available?: boolean
          preparation_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          is_available?: boolean
          preparation_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: number
          customer_name: string | null
          status: 'active' | 'completed' | 'cancelled' | 'paid'
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: number
          customer_name?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'paid'
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: number
          customer_name?: string | null
          status?: 'active' | 'completed' | 'cancelled' | 'paid'
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: number
          product_name: string
          price: number
          quantity: number
          notes: string | null
          status: 'ordered' | 'preparing' | 'ready' | 'served'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: number
          product_name: string
          price: number
          quantity?: number
          notes?: string | null
          status?: 'ordered' | 'preparing' | 'ready' | 'served'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: number
          product_name?: string
          price?: number
          quantity?: number
          notes?: string | null
          status?: 'ordered' | 'preparing' | 'ready' | 'served'
          created_at?: string
          updated_at?: string
        }
      }
      waiter_notifications: {
        Row: {
          id: string
          table_id: number
          order_id: string | null
          type: 'new_order' | 'refill' | 'assistance' | 'bill_request'
          message: string
          status: 'pending' | 'acknowledged' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          table_id: number
          order_id?: string | null
          type: 'new_order' | 'refill' | 'assistance' | 'bill_request'
          message: string
          status?: 'pending' | 'acknowledged' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          table_id?: number
          order_id?: string | null
          type?: 'new_order' | 'refill' | 'assistance' | 'bill_request'
          message?: string
          status?: 'pending' | 'acknowledged' | 'completed'
          created_at?: string
        }
      }
    }
  }
}