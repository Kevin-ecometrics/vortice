/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface OrderWithItems {
  id: string
  table_id: number
  customer_name: string | null
  status: 'active' | 'sent' | 'completed' | 'cancelled' | 'paid'
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItemWithProduct[]
}

export interface OrderItemWithProduct {
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
  products?: {
    name: string
    image_url: string | null
    preparation_time: number | null
  } | null
}

// Interface para las respuestas de Supabase
interface OrderFromSupabase {
  id: string
  table_id: number
  customer_name: string | null
  status: 'active' | 'sent' | 'completed' | 'cancelled' | 'paid'
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItemWithProduct[]
}

export const historyService = {

  async createOrder(tableId: number, customerName: string): Promise<OrderWithItems> {
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          table_id: tableId,
          customer_name: customerName,
          status: "active",
          total_amount: 0,
        },
      ] as never)
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .single();

    if (error) {
      console.error("Error creating order:", error);
      throw new Error(`Error al crear la orden: ${error.message}`);
    }

    console.log("✅ Nueva orden creada para:", customerName, "en mesa:", tableId);

    return data as OrderWithItems;
  },

  // Obtener historial del cliente actual (orden activa + enviadas + completadas)
  async getCustomerOrderHistory(tableId: number, currentOrderId?: string): Promise<OrderWithItems[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    // ✅ FILTRAR CORREGIDO: Mostrar orden activa actual + enviadas + completadas
    if (currentOrderId) {
      query = query.or(`id.eq.${currentOrderId},status.eq.sent,status.eq.completed,status.eq.paid`)
    } else {
      // Si no hay orderId actual, mostrar enviadas + completadas + pagadas
      query = query.in('status', ['sent', 'completed', 'paid'])
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Error getting customer order history:', error)
      throw error
    }
    
    // Type assertion para los datos de Supabase
    const ordersData = data as OrderFromSupabase[] | null
    console.log('📊 HistoryService: Órdenes encontradas:', ordersData?.length)
    if (ordersData) {
      ordersData.forEach(order => {
        console.log(`   - Orden ${order.id.slice(-8)}: ${order.status} con ${order.order_items.length} items`)
      })
    }
    return ordersData || []
  },

  // Obtener orden específica con sus items
  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('id', orderId)
      .single()
    
    if (error) {
      console.error('Error getting order with items:', error)
      return null
    }
    
    // Type assertion para el dato de Supabase
    const orderData = data as OrderFromSupabase | null
    return orderData
  },

  // Obtener solo la orden activa actual
  async getCurrentActiveOrder(tableId: number): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('table_id', tableId)
      .eq('status', 'active')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No active order found for table:', tableId)
        return null
      }
      console.error('Error getting current active order:', error)
      throw error
    }
    
    const orderData = data as OrderFromSupabase | null
    return orderData
  },

  // Obtener solo historial (sin orden activa)
  async getOrderHistoryOnly(tableId: number): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('table_id', tableId)
      .in('status', ['sent', 'completed', 'paid'])
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error getting order history only:', error)
      throw error
    }
    
    const ordersData = data as OrderFromSupabase[] | null
    return ordersData || []
  },

  // Solicitar asistencia del mesero
  async requestAssistance(tableId: number, message: string = 'Solicito asistencia'): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        type: 'assistance',
        message,
        status: 'pending'
      } as any)
    
    if (error) {
      console.error('Error requesting assistance:', error)
      throw error
    }
    
    console.log('✅ Asistencia solicitada para mesa:', tableId)
  },

  // Solicitar la cuenta CON MÉTODO DE PAGO
  async requestBill(tableId: number, orderId?: string, paymentMethod?: string): Promise<void> {
    let message = 'Solicita la cuenta';
    
    // Personalizar mensaje según método de pago
    if (paymentMethod === 'cash') {
      message = 'Solicita la cuenta - Pago en efectivo';
    } else if (paymentMethod === 'terminal') {
      message = 'Solicita la cuenta - Pago con terminal';
    }
    
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        order_id: orderId || null,
        type: 'bill_request',
        message: message,
        status: 'pending',
        payment_method: paymentMethod || null
      } as any)
    
    if (error) {
      console.error('Error requesting bill:', error)
      throw error
    }
    
    console.log('✅ Cuenta solicitada para mesa:', tableId, 'método:', paymentMethod)
  },

  // Nueva función: Obtener todas las órdenes de la mesa (para debugging)
  async getAllTableOrders(tableId: number): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error getting all table orders:', error)
      throw error
    }
    
    const ordersData = data as OrderFromSupabase[] | null
    console.log('🔍 All orders for table', tableId, ':', ordersData?.map(o => ({
      id: o.id.slice(-8),
      status: o.status,
      items: o.order_items.length,
      createdAt: o.created_at
    })))
    return ordersData || []
  }
}