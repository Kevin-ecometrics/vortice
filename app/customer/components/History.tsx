"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import {
  FaHistory,
  FaUtensils,
  FaBell,
  FaReceipt,
  FaSpinner,
  FaExclamationTriangle,
  FaSync,
  FaQrcode,
  FaCheck,
  FaClock,
  FaUtensilSpoon,
  FaUser,
  FaUsers,
  FaMoneyBillWave,
  FaCreditCard,
  FaQuestion,
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";

// Definir tipo para cálculos de impuestos
interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  total: number;
}

// Tipo para estado de orden
type OrderStatus = "active" | "sent" | "completed" | "paid";

interface TableUser {
  id: string;
  name: string;
  orderId: string;
}

interface CustomerOrderSummary {
  customerName: string;
  orders: OrderWithItems[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
  latestOrderDate: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table");
  const userId = searchParams.get("user");
  const orderId = searchParams.get("order");

  const {
    currentOrder,
    orderItems,
    currentTableId,
    currentUserId,
    refreshOrder,
    getTableUsers,
    switchUserOrder,
  } = useOrder();

  const [orderHistory, setOrderHistory] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableUsers, setTableUsers] = useState<TableUser[]>([]);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // NUEVOS ESTADOS PARA EL MÉTODO DE PAGO
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  // Refs para prevenir loops infinitos
  const isSubscribedRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // Cargar usuarios de la mesa
  useEffect(() => {
    if (tableId) {
      loadTableUsers(parseInt(tableId));
    }
  }, [tableId]);

  const loadTableUsers = async (tableId: number) => {
    try {
      const users = await getTableUsers(tableId);
      setTableUsers(users);
    } catch (error) {
      console.error("Error loading table users:", error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (tableId && orderId && userId) {
      loadInitialData(parseInt(tableId), orderId, userId);
    } else if (tableId) {
      // Si solo tenemos la mesa, redirigir a select-user
      router.push(`/customer/select-user?table=${tableId}`);
    } else {
      router.push("/customer");
    }
  }, [tableId, orderId, userId, router]);

  const loadInitialData = async (
    tableId: number,
    orderId: string,
    userId: string
  ) => {
    try {
      setLoading(true);

      // También refrescar la orden actual para obtener los últimos items
      if (currentTableId) {
        await refreshOrder(currentTableId);
      }

      await loadHistory(tableId);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar el historial. Redirigiendo...");
      router.push("/customer/select-user?table=" + tableId);
    } finally {
      setLoading(false);
    }
  };

  // Calcular impuestos y totales
  const calculateTaxes = (items: typeof orderItems): TaxCalculation => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total,
    };
  };

  const currentOrderCalculations = calculateTaxes(orderItems);

  // Agrupar órdenes por cliente
  const groupOrdersByCustomer = (): CustomerOrderSummary[] => {
    const customerMap = new Map<string, CustomerOrderSummary>();

    orderHistory.forEach((order) => {
      const customerName = order.customer_name || "Cliente";

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customerName,
          orders: [],
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          itemsCount: 0,
          latestOrderDate: order.created_at,
        });
      }

      const customerSummary = customerMap.get(customerName)!;
      customerSummary.orders.push(order);

      // Calcular subtotal de esta orden
      const orderSubtotal = order.order_items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      customerSummary.subtotal += orderSubtotal;
      customerSummary.itemsCount += order.order_items.length;

      // Actualizar la fecha más reciente
      if (
        new Date(order.created_at) > new Date(customerSummary.latestOrderDate)
      ) {
        customerSummary.latestOrderDate = order.created_at;
      }
    });

    // Calcular impuestos y totales para cada cliente
    const taxRate = 0.08;
    customerMap.forEach((customerSummary) => {
      customerSummary.taxAmount = customerSummary.subtotal * taxRate;
      customerSummary.total =
        customerSummary.subtotal + customerSummary.taxAmount;
    });

    // Ordenar por fecha más reciente
    return Array.from(customerMap.values()).sort(
      (a, b) =>
        new Date(b.latestOrderDate).getTime() -
        new Date(a.latestOrderDate).getTime()
    );
  };

  // Obtener texto del estado de la orden
  const getStatusText = (status: OrderStatus): string => {
    const statusMap = {
      active: "En preparación",
      sent: "Enviada a cocina",
      completed: "Completada",
      paid: "Pagada",
    };
    return statusMap[status] || status;
  };

  // Obtener color del estado
  const getStatusColor = (status: OrderStatus): string => {
    const colorMap = {
      active: "bg-yellow-100 text-yellow-800",
      sent: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      paid: "bg-purple-100 text-purple-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Obtener ícono del estado
  const getStatusIcon = (status: OrderStatus) => {
    const iconMap = {
      active: FaUtensilSpoon,
      sent: FaClock,
      completed: FaCheck,
      paid: FaCheck,
    };
    return iconMap[status] || FaHistory;
  };

  const loadHistory = async (tableId: number) => {
    try {
      setLoading(true);
      setError("");

      const history = await historyService.getCustomerOrderHistory(tableId);
      console.log("📊 Historial cargado:", history.length, "órdenes");

      setOrderHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Error cargando el historial");
    } finally {
      setLoading(false);
    }
  };

  // Cambiar de usuario
  const handleSwitchUser = async (user: TableUser) => {
    try {
      await switchUserOrder(user.orderId, user.id);
      setShowUserSwitch(false);

      // Actualizar URL
      router.push(
        `/customer/history?table=${tableId}&user=${user.id}&order=${user.orderId}`
      );
    } catch (error) {
      console.error("Error switching user:", error);
      alert("Error al cambiar de usuario");
    }
  };

  // Agregar nuevo usuario
  const handleAddNewUser = async () => {
    const userName = prompt("Ingresa el nombre del nuevo comensal:");
    if (!userName?.trim()) return;

    if (!tableId) {
      alert("No se encontró la mesa");
      return;
    }

    try {
      // Crear nueva orden para el nuevo usuario
      const newOrder = await historyService.createOrder(
        parseInt(tableId),
        userName.trim()
      );

      // Actualizar lista de usuarios
      await loadTableUsers(parseInt(tableId));

      // Cambiar al nuevo usuario
      await handleSwitchUser({
        id: newOrder.id,
        name: userName.trim(),
        orderId: newOrder.id,
      });

      alert(`✅ Bienvenido/a, ${userName.trim()}!`);
    } catch (error) {
      console.error("Error adding new user:", error);
      alert("Error al agregar nuevo comensal");
    }
  };

  // NUEVA FUNCIÓN: Manejar solicitud de cuenta con método de pago
  const handleBillRequest = async () => {
    // Resetear selección y mostrar modal de selección
    setSelectedPaymentMethod(null);
    setShowPaymentMethodModal(true);
    setShowPaymentConfirmation(false);
  };

  // NUEVA FUNCIÓN: Confirmar solicitud de cuenta con método de pago
  const confirmBillRequest = async () => {
    if (!selectedPaymentMethod) {
      alert("Por favor selecciona un método de pago");
      return;
    }

    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    setBillLoading(true);
    try {
      await historyService.requestBill(
        parseInt(targetTableId.toString()),
        currentOrder?.id,
        selectedPaymentMethod
      );

      let methodText = "";
      switch (selectedPaymentMethod) {
        case "cash":
          methodText = "en efectivo";
          break;
        case "terminal":
          methodText = "con terminal";
          break;
        default:
          methodText = "";
      }

      alert(
        `✅ Se ha solicitado la cuenta ${methodText}. El mesero te traerá tu factura.`
      );

      // Cerrar modales
      setShowPaymentMethodModal(false);
      setShowPaymentConfirmation(false);
      setSelectedPaymentMethod(null);

      setTimeout(() => {
        router.push(
          `/customer/payment?table=${targetTableId}&user=${userId}&order=${orderId}`
        );
      }, 1000);
    } catch (error) {
      console.error("Error requesting bill:", error);
      alert("❌ Error al solicitar la cuenta");
    } finally {
      setBillLoading(false);
    }
  };

  // NUEVA FUNCIÓN: Manejar selección de método de pago
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentConfirmation(true);
  };

  // NUEVA FUNCIÓN: Cancelar selección
  const handleCancelSelection = () => {
    setSelectedPaymentMethod(null);
    setShowPaymentConfirmation(false);
  };

  // NUEVA FUNCIÓN: Cancelar todo el proceso
  const handleCancelPayment = () => {
    setShowPaymentMethodModal(false);
    setShowPaymentConfirmation(false);
    setSelectedPaymentMethod(null);
  };

  // SUSCRIPCIÓN EN TIEMPO REAL MEJORADA
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId || isSubscribedRef.current) return;

    console.log("🔔 History: Iniciando suscripción para cambios en órdenes");
    isSubscribedRef.current = true;

    // Función debounced para prevenir actualizaciones rápidas
    const debouncedUpdate = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 2000) {
        lastUpdateRef.current = now;
        if (targetTableId) {
          loadHistory(parseInt(targetTableId.toString()));
        }
      }
    };

    // Suscripción para cambios en órdenes
    const orderSubscription = supabase
      .channel(`history-orders-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${targetTableId}`,
        },
        async (payload) => {
          console.log(
            "📦 History: Cambio en orden detectado:",
            payload.eventType
          );
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a órdenes:", status);
      });

    // Suscripción para cambios en items de orden
    const orderItemsSubscription = supabase
      .channel(`history-order-items-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          console.log("📦 History: Cambio en items detectado");
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a items:", status);
      });

    // Suscripción para notificaciones del mesero (mesa liberada)
    const notificationSubscription = supabase
      .channel(`customer-history-table-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_notifications",
          filter: `table_id=eq.${targetTableId}`,
        },
        (payload) => {
          console.log("📨 History: Notificación recibida:", payload.new.type);

          if (payload.new.type === "table_freed") {
            console.log("🚨 History: Mesa liberada - Redirigiendo...");
            alert("✅ La cuenta ha sido cerrada. Gracias por su visita!");
            window.location.href = "/customer";
          }
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a notificaciones:", status);
      });

    return () => {
      console.log("🧹 History: Limpiando suscripciones");
      orderSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [tableId, currentTableId]);

  const handleAssistanceRequest = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    setAssistanceLoading(true);
    try {
      await historyService.requestAssistance(
        parseInt(targetTableId.toString())
      );
      alert("✅ El mesero ha sido notificado. Pronto te atenderá.");
    } catch (error) {
      console.error("Error requesting assistance:", error);
      alert("❌ Error al solicitar asistencia");
    } finally {
      setAssistanceLoading(false);
    }
  };

  const handleRefresh = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    await loadHistory(parseInt(targetTableId.toString()));
    if (currentTableId) {
      await refreshOrder(currentTableId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Mostrar loading mientras se obtiene tableId
  if (tableId === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Redirigiendo al inicio...
          </p>
        </div>
      </div>
    );
  }

  const targetTableId = tableId || currentTableId;
  const customerSummaries = groupOrdersByCustomer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          {/* Título, mesa y selector de usuario */}
          <div className="text-center md:text-left mb-4 md:mb-0 flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Historial de Pedidos
              </h1>
              <p className="text-sm text-gray-500">
                Mesa {targetTableId} •{" "}
                {currentOrder?.customer_name || "Invitado"}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {customerSummaries.length} comensal
                {customerSummaries.length > 1 ? "es" : ""} •{" "}
                {orderHistory.length} orden{orderHistory.length > 1 ? "es" : ""}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              onClick={handleAssistanceRequest}
              disabled={assistanceLoading}
              className="flex-1 md:flex-none bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaBell />
              {assistanceLoading ? "Enviando..." : "Ayuda"}
            </button>

            <button
              onClick={handleBillRequest}
              disabled={billLoading}
              className="flex-1 md:flex-none bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaReceipt />
              {billLoading ? "Solicitando..." : "Cuenta"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Orden Actual del Usuario */}
        {/* {currentOrder && orderItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUtensils />
              Orden Actual de {currentOrder.customer_name}
              <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                En preparación
              </span>
            </h2>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-800 text-white p-6 text-center">
                <h3 className="text-xl font-bold">RESTAURANTE</h3>
                <p className="text-gray-300 text-sm">Mesa {targetTableId}</p>
                <p className="text-gray-300 text-sm">
                  Cliente: {currentOrder.customer_name}
                </p>
                <p className="text-gray-300 text-sm">
                  Orden #: {currentOrder.id.slice(-8)}
                </p>
                <p className="text-gray-300 text-sm">
                  {new Date(currentOrder.created_at).toLocaleString()}
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start py-3 border-b border-gray-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-gray-800">
                              {item.product_name}
                            </span>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-800">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(item.price)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(currentOrderCalculations.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Impuestos (16%):</span>
                    <span>
                      {formatCurrency(currentOrderCalculations.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(currentOrderCalculations.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
                <p>¡Gracias por su preferencia!</p>
                <p>Para solicitar la cuenta, presione el botón Cuenta</p>
              </div>
            </div>
          </div>
        )} */}

        {/* Historial de Órdenes Agrupadas por Cliente */}
        {customerSummaries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHistory />
              Historial de la Mesa
            </h2>

            <div className="space-y-6">
              {customerSummaries.map((customerSummary) => (
                <div
                  key={customerSummary.customerName}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Header del Cliente */}
                  <div className="bg-blue-800 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <FaUser className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {customerSummary.customerName}
                          </h3>
                          <div className="flex items-center gap-3 text-blue-200 text-sm">
                            <span>•</span>
                            <span>
                              {customerSummary.itemsCount} item
                              {customerSummary.itemsCount > 1 ? "s" : ""}
                            </span>
                            <span>•</span>
                            <span>
                              Total: {formatCurrency(customerSummary.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items de todas las órdenes del cliente */}
                  <div className="p-4">
                    {customerSummary.orders.map((order, orderIndex) => (
                      <div key={order.id} className="mb-4 last:mb-0">
                        {/* Info de la orden individual */}
                        <div className="flex justify-between items-center mb-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-700">
                              {/* Orden #{order.id.slice(-8)} */}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                Hora del pedido:{" "}
                                {new Date(order.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Items de esta orden */}
                        <div className="space-y-3">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-start py-2 border-b border-gray-100"
                            >
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      {item.product_name}
                                    </span>
                                    <div className="text-sm text-gray-500 mt-1">
                                      Cantidad: {item.quantity}
                                    </div>
                                    {item.notes && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Nota: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-gray-800">
                                      {formatCurrency(
                                        item.price * item.quantity
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {formatCurrency(item.price)} c/u
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Separador entre órdenes del mismo cliente */}
                        {orderIndex < customerSummary.orders.length - 1 && (
                          <div className="border-t border-gray-200 my-4"></div>
                        )}
                      </div>
                    ))}

                    {/* Resumen del Cliente */}
                    <div className=" border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-300 pt-2">
                        <span>Total de {customerSummary.customerName}:</span>
                        <span>{formatCurrency(customerSummary.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!currentOrder && customerSummaries.length === 0 && (
          <div className="text-center py-12">
            <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay órdenes
            </h3>
            <p className="text-gray-500">
              Aún no has realizado ningún pedido en esta mesa
            </p>
            <button
              onClick={() =>
                router.push(
                  `/customer/menu?table=${targetTableId}&user=${userId}&order=${orderId}`
                )
              }
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
            >
              Hacer mi primer pedido
            </button>
          </div>
        )}
      </main>

      {/* MODAL DE SELECCIÓN DE MÉTODO DE PAGO MEJORADO */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {showPaymentConfirmation ? "Confirmar Pago" : "Método de Pago"}
              </h2>
              <p className="text-gray-600">
                {showPaymentConfirmation
                  ? `¿Confirmar solicitud de cuenta ${
                      selectedPaymentMethod === "cash"
                        ? "en efectivo"
                        : "con terminal"
                    }?`
                  : "Selecciona cómo deseas pagar la cuenta"}
              </p>
            </div>

            {!showPaymentConfirmation ? (
              /* PANTALLA DE SELECCIÓN */
              <div className="p-6 space-y-4">
                {/* Opción Efectivo */}
                <button
                  onClick={() => handlePaymentMethodSelect("cash")}
                  disabled={billLoading}
                  className={`w-full p-4 border-2 rounded-xl transition flex items-center justify-between gap-3 disabled:opacity-50 ${
                    selectedPaymentMethod === "cash"
                      ? "border-green-500 bg-green-50"
                      : "border-green-200 hover:border-green-500 hover:bg-green-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedPaymentMethod === "cash"
                          ? "bg-green-200"
                          : "bg-green-100"
                      }`}
                    >
                      <FaMoneyBillWave className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        Efectivo
                      </div>
                      <div className="text-sm text-gray-500">
                        Pagar con dinero en efectivo
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === "cash"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPaymentMethod === "cash" && (
                      <FaCheck className="text-white text-xs" />
                    )}
                  </div>
                </button>

                {/* Opción Terminal */}
                <button
                  onClick={() => handlePaymentMethodSelect("terminal")}
                  disabled={billLoading}
                  className={`w-full p-4 border-2 rounded-xl transition flex items-center justify-between gap-3 disabled:opacity-50 ${
                    selectedPaymentMethod === "terminal"
                      ? "border-blue-500 bg-blue-50"
                      : "border-blue-200 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedPaymentMethod === "terminal"
                          ? "bg-blue-200"
                          : "bg-blue-100"
                      }`}
                    >
                      <FaCreditCard className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        Terminal
                      </div>
                      <div className="text-sm text-gray-500">
                        Pagar con tarjeta
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === "terminal"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPaymentMethod === "terminal" && (
                      <FaCheck className="text-white text-xs" />
                    )}
                  </div>
                </button>
              </div>
            ) : (
              /* PANTALLA DE CONFIRMACIÓN */
              <div className="p-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedPaymentMethod === "cash"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {selectedPaymentMethod === "cash" ? (
                        <FaMoneyBillWave className="text-green-600 text-xl" />
                      ) : (
                        <FaCreditCard className="text-blue-600 text-xl" />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg text-gray-800">
                        {selectedPaymentMethod === "cash"
                          ? "Efectivo"
                          : "Terminal"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedPaymentMethod === "cash"
                          ? "Pagarás con dinero en efectivo"
                          : "Pagarás con tarjeta bancaria"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelSelection}
                    disabled={billLoading}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={confirmBillRequest}
                    disabled={billLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {billLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCheck />
                    )}
                    {billLoading ? "Enviando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {/* BOTÓN CANCELAR (solo en pantalla de selección) */}
            {!showPaymentConfirmation && (
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={handleCancelPayment}
                  className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition font-medium rounded-xl hover:bg-gray-100"
                  disabled={billLoading}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE USUARIO */}
      {showUserSwitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Cambiar de comensal
                </h2>
                <button
                  onClick={() => setShowUserSwitch(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600">Mesa {targetTableId}</p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {tableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition ${
                      currentUserId === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            currentUserId === user.id
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <FaUser
                            className={
                              currentUserId === user.id
                                ? "text-blue-600"
                                : "text-gray-600"
                            }
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user.orderId === currentOrder?.id
                              ? "Tú"
                              : "Otro comensal"}
                          </p>
                        </div>
                      </div>
                      {currentUserId === user.id && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddNewUser}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition flex items-center justify-center gap-3"
              >
                <FaUser className="text-green-600" />
                <span className="font-semibold text-green-600">
                  Agregar nuevo comensal
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${targetTableId}&user=${userId}&order=${orderId}`
              )
            }
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaUtensils className="text-2xl mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Historial</span>
          </button>
          <button
            onClick={() =>
              router.push(
                `/customer/qr?table=${targetTableId}&user=${userId}&order=${orderId}`
              )
            }
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-medium">Mi QR</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
