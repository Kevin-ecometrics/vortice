/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

interface Product {
  id: number
  name: string
  price: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  notes: string | null
  status: 'ordered' | 'preparing' | 'ready' | 'served'
  created_at: string
  updated_at?: string
}

export const orderItemsService = {
  // Agregar item a una orden
  async addItemToOrder(
    orderId: string, 
    product: Product, 
    quantity: number = 1, 
    notes?: string
  ): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity,
        notes: notes || null,
        status: 'ordered'
      } as never)
      .select()
      .single()
    
    if (error) throw error
    return data as OrderItem
  },

  // Obtener items de una orden
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return (data as OrderItem[]) || []
  },

  // ACTUALIZADO: Actualizar cantidad y notas de un item
  async updateItemQuantity(itemId: string, quantity: number, notes?: string): Promise<OrderItem> {
    const updateData: any = { 
      quantity,
      updated_at: new Date().toISOString()
    }

    // Solo actualizar notes si se proporciona (puede ser string vacío para eliminar notas)
    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    const { data, error } = await supabase
      .from('order_items')
      .update(updateData as never)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data as OrderItem
  },

  // Eliminar item de una orden
  async removeItemFromOrder(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Obtener total de una orden
  async getOrderTotal(orderId: string): Promise<number> {
    const { data, error } = await supabase
      .from('order_items')
      .select('price, quantity')
      .eq('order_id', orderId)
    
    if (error) throw error
    
    const itemsData = data as { price: number; quantity: number }[] | null
    const total = itemsData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    
    return total
  },

  // NUEVO: Actualizar solo las notas de un item (método opcional)
  async updateItemNotes(itemId: string, notes: string): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .update({ 
        notes: notes || null,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data as OrderItem
  },

  // NUEVO: Obtener items por mesa (útil para el historial)
  async getItemsByTable(tableId: number): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(table_id)
      `)
      .eq('orders.table_id', tableId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data as OrderItem[]) || []
  },

  // NUEVO: Actualizar estado de un item
  async updateItemStatus(itemId: string, status: OrderItem['status']): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data as OrderItem
  }
}