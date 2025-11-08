// En tu archivo: /app/lib/supabase/orders.ts

import { supabase } from "@/app/lib/supabase/client";
import { OrderItem } from "./order-items";

export interface Order {
  id: string;
  table_id: number;
  customer_name: string;
  status: "pending" | "sent" | "completed" | "paid";
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export const ordersService = {
  // Método existente - crear orden
  async createOrder(tableId: number, customerName: string): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          table_id: tableId,
          customer_name: customerName,
          status: "pending",
          total_amount: 0,
        },
      ] as never)
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      throw new Error(`Error al crear la orden: ${error.message}`);
    }

    return data;
  },

  // Método existente - obtener orden activa por mesa (para un solo usuario)
  async getActiveOrderByTable(tableId: number): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error getting active order:", error);
      throw error;
    }

    return data;
  },

  // NUEVO MÉTODO: Obtener todas las órdenes activas de una mesa (múltiples usuarios)
  async getActiveOrdersByTable(tableId: number): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting active orders:", error);
      throw new Error(`Error al obtener órdenes: ${error.message}`);
    }

    return data || [];
  },

  // Método existente - obtener orden por ID
  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error getting order:", error);
      throw error;
    }

    return data;
  },

  // Método existente - actualizar estado de orden
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  },

  // Método existente - actualizar total de orden
  async updateOrderTotal(orderId: string, total: number): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({ 
        total_amount: total, 
        updated_at: new Date().toISOString() 
      } as never)
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order total:", error);
      throw new Error(`Error al actualizar total: ${error.message}`);
    }
  },

  // NUEVO MÉTODO: Crear nueva orden para mesa (para nuevos usuarios)
  async createNewOrderForTable(tableId: number, customerName: string): Promise<Order> {
    return this.createOrder(tableId, customerName);
  },

  // NUEVO MÉTODO: Obtener items de una orden específica
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting order items:", error);
      throw new Error(`Error al obtener items: ${error.message}`);
    }

    return data || [];
  },

  // NUEVO MÉTODO: Verificar si existe una orden para un usuario específico
  async getOrderByUser(tableId: number, customerName: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .eq("customer_name", customerName)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error getting order by user:", error);
      throw error;
    }

    return data;
  },

  // NUEVO MÉTODO: Obtener todas las órdenes de una mesa (incluyendo completadas)
  async getAllOrdersByTable(tableId: number): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting all orders:", error);
      throw new Error(`Error al obtener historial: ${error.message}`);
    }

    return data || [];
  },

  // NUEVO MÉTODO: Eliminar orden (si un usuario se va)
  async deleteOrder(orderId: string): Promise<void> {
    // Primero eliminar los items de la orden
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error deleting order items:", itemsError);
      throw new Error(`Error al eliminar items: ${itemsError.message}`);
    }

    // Luego eliminar la orden
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      throw new Error(`Error al eliminar orden: ${error.message}`);
    }
  }
};