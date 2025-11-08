import { supabase } from './client'

// Tipos base
type NotificationType =
  | 'new_order'
  | 'refill'
  | 'assistance'
  | 'bill_request'
  | 'order_updated'
  | 'table_freed'

type NotificationStatus = 'pending' | 'acknowledged' | 'completed'
type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
type OrderItemStatus = 'ordered' | 'preparing' | 'ready' | 'served'
type OrderStatus = 'sent' | 'completed'
type PaymentMethod = 'cash' | 'terminal' | null

// Interfaces públicas (para tu lógica)
export interface WaiterNotification {
  id: string
  table_id: number
  order_id: string | null
  type: NotificationType
  message: string
  status: NotificationStatus
  payment_method: PaymentMethod // NUEVO CAMPO
  created_at: string
  updated_at?: string
  tables?: {
    number: number
  }
  orders?: {
    total_amount: number
    customer_name: string | null
  }
}

export interface OrderItem {
  id: string
  product_name: string
  quantity: number
  status: OrderItemStatus
  price: number
  notes?: string
  order_id?: string
}

export interface Order {
  id: string
  total_amount: number
  customer_name: string | null
  created_at: string
  status: OrderStatus
  order_items: OrderItem[]
}

export interface TableWithOrder {
  id: number
  number: number
  status: TableStatus
  capacity: number
  location: string | null
  orders: Order[]
}

// -----------------------------
// Tipos internos que mapean filas de la DB (mínimos necesarios)
// -----------------------------
interface OrderRow {
  id: string
  table_id?: number
  total_amount: number
  customer_name: string | null
  created_at: string
  status: OrderStatus
  order_items?: {
    id: string
    product_name: string
    quantity: number
    price: number
    notes?: string | null
    order_id?: string
  }[]
}

interface TableRow {
  id: number
  number: number
  status: TableStatus
  capacity: number
  location?: string | null
  updated_at?: string
}

interface SalesHistoryRow {
  id: string
  table_id: number
  table_number: number
  customer_name?: string | null
  total_amount: number
  order_count: number
  item_count: number
  payment_method: PaymentMethod // NUEVO CAMPO
  closed_at: string
}

interface SalesItemRow {
  id?: string
  sale_id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
  notes?: string | null
}

interface WaiterNotificationRow {
  id: string
  table_id: number
  order_id: string | null
  type: NotificationType
  message: string
  status: NotificationStatus
  payment_method: PaymentMethod // NUEVO CAMPO
  created_at: string
  updated_at?: string
}

// Helpers tipados -> permitimos cualquier tipo (objeto o array)
function assertUpdate<T>(data: T): T {
  return data
}

function assertInsert<T>(data: T): T {
  return data
}

// Servicio principal
export const waiterService = {
  async getPendingNotifications(): Promise<WaiterNotification[]> {
    const { data, error } = await supabase
      .from('waiter_notifications')
      // Tipamos el SELECT con returns para que TS conozca la forma
      .select(
        `
        *,
        tables ( number ),
        orders ( total_amount, customer_name )
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .returns<WaiterNotification[]>()

    if (error) throw error
    return data || []
  },

  async getTablesWithOrders(): Promise<TableWithOrder[]> {
    const { data, error } = await supabase
      .from('tables')
      .select(
        `
        *,
        orders (
          id,
          total_amount,
          customer_name,
          created_at,
          status,
          order_items (
            id,
            product_name,
            quantity,
            status,
            price,
            notes
          )
        )
      `
      )
      .order('number')
      .returns<
        (
          TableRow & {
            orders?: {
              id: string
              total_amount: number
              customer_name: string | null
              created_at: string
              status: OrderStatus
              order_items?: {
                id: string
                product_name: string
                quantity: number
                status: OrderItemStatus
                price: number
                notes?: string | null
              }[]
            }[]
          }
        )[]
      >()

    if (error) throw error

    const tables = data || []

    // Normalizamos a tu interface TableWithOrder
    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      status: table.status,
      capacity: table.capacity,
      location: table.location ?? null,
      orders:
        (table.orders || [])
          .filter((order) => order.status === 'sent' || order.status === 'completed')
          .map((order) => ({
            id: order.id,
            total_amount: order.total_amount,
            customer_name: order.customer_name,
            created_at: order.created_at,
            status: order.status,
            order_items:
              (order.order_items || []).map((it) => ({
                id: it.id,
                product_name: it.product_name,
                quantity: it.quantity,
                status: it.status,
                price: it.price,
                notes: it.notes ?? undefined,
                order_id: undefined,
              })) || [],
          })) || [],
    }))
  },

  async saveSalesHistory(
    tableId: number, 
    tableNumber: number, 
    paymentMethod: PaymentMethod = null // NUEVO PARÁMETRO
  ): Promise<string> {
    try {
      console.log(`💰 Guardando historial de venta para mesa ${tableNumber}, método: ${paymentMethod}`)

      // Usamos el tipo OrderRow en la consulta (returns es seguro)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_amount,
          customer_name,
          created_at,
          order_items (
            id,
            product_name,
            quantity,
            price,
            notes
          )
        `
        )
        .eq('table_id', tableId)
        .in('status', ['sent', 'completed'])
        .returns<OrderRow[]>()

      if (ordersError) throw ordersError
      if (!orders || orders.length === 0) {
        throw new Error('No hay órdenes para guardar en el historial')
      }

      const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0)

      const orderCount = orders.length

      const itemCount = orders.reduce(
        (sum, order) =>
          sum +
          (order.order_items?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0),
        0
      )

      const customerName = orders[0]?.customer_name ?? null

      // Insertamos el historial CON el método de pago
      const { data: saleData, error: saleError } = await supabase
        .from('sales_history')
        .insert(
          assertInsert({
            table_id: tableId,
            table_number: tableNumber,
            customer_name: customerName,
            total_amount: totalAmount,
            order_count: orderCount,
            item_count: itemCount,
            payment_method: paymentMethod, // NUEVO CAMPO
            closed_at: new Date().toISOString(),
          } as never)
        )
        .select()
        .single()

      if (saleError) throw saleError
      if (!saleData) throw new Error('No se pudo crear el registro de venta')

      // casteamos a SalesHistoryRow para que TS conozca sale.id
      const sale = saleData as SalesHistoryRow

      const salesItems: SalesItemRow[] = orders.flatMap((order) =>
        (order.order_items || []).map((item) => ({
          sale_id: sale.id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          subtotal: (item.price ?? 0) * (item.quantity ?? 0),
          notes: item.notes ?? null,
        }))
      )

      if (salesItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('sales_items')
          // insert expects array or object; assertInsert accepts arrays now
          .insert(assertInsert(salesItems) as never)
        if (itemsError) throw itemsError
      }

      console.log(
        `✅ Historial guardado: $${totalAmount.toFixed(2)}, ${orderCount} órdenes, ${itemCount} items, método: ${paymentMethod}`
      )
      return sale.id
    } catch (err) {
      console.error('Error guardando historial de venta:', err)
      throw err
    }
  },

  async freeTableAndClean(
    tableId: number, 
    tableNumber: number, 
    paymentMethod: PaymentMethod = null // NUEVO PARÁMETRO
  ): Promise<void> {
    try {
      console.log(`🔄 Iniciando proceso completo para mesa ${tableNumber}, método: ${paymentMethod}`)

      await this.saveSalesHistory(tableId, tableNumber, paymentMethod) // PASA EL MÉTODO DE PAGO

      console.log(`🗑️ Eliminando notificaciones para mesa ${tableId}`)
      const { error: notificationsError } = await supabase
        .from('waiter_notifications')
        .delete()
        .eq('table_id', tableId)

      if (notificationsError) throw notificationsError

      // Seleccionamos solo id tipado
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', tableId)
        .returns<{ id: string }[]>()

      if (ordersError) throw ordersError

      const orderIds = orders?.map((order) => order.id) || []

      if (orderIds.length > 0) {
        console.log(`🗑️ Eliminando order_items para ${orderIds.length} órdenes`)
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        console.log(`🗑️ Eliminando órdenes`)
        const { error: ordersDeleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds)

        if (ordersDeleteError) throw ordersDeleteError
      }

      console.log(`🔄 Liberando mesa ${tableId}`)
      // Quité el genérico en .update() para evitar constraint 'never'
      const { error: tableError } = await supabase
        .from('tables')
        .update(
          assertUpdate({
            status: 'available' as TableStatus,
            updated_at: new Date().toISOString(),
          } as never)
        )
        .eq('id', tableId)

      if (tableError) throw tableError

      console.log(`✅ Mesa ${tableNumber} procesada completamente, método: ${paymentMethod}`)
    } catch (err) {
      console.error('❌ Error en proceso completo:', err)
      throw err
    }
  },

  async acknowledgeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(
        assertUpdate({
          status: 'acknowledged' as NotificationStatus,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', notificationId)

    if (error) throw error
  },

  async completeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(
        assertUpdate({
          status: 'completed' as NotificationStatus,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', notificationId)

    if (error) throw error
  },

  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update(
        assertUpdate({
          status,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', itemId)

    if (error) throw error
  },
}