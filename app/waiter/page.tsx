/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import {
  waiterService,
  WaiterNotification,
  TableWithOrder,
} from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NotificationsTab from "./components/NotificationsTab";
import TablesTab from "./components/TablesTab";
import ProductsManagement from "./components/ProductsManagement";
import LoadingScreen from "./components/LoadingScreen";

export default function WaiterDashboard() {
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "tables" | "products"
  >("notifications");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [attendedNotifications, setAttendedNotifications] = useState<
    Set<string>
  >(new Set());

  // Referencia para guardar la posición del scroll
  const scrollPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    const interval = setInterval(() => {
      if (isUpdatingRef.current) return; // Evitar múltiples actualizaciones simultáneas

      isUpdatingRef.current = true;
      // Guardar posición actual del scroll antes de actualizar
      scrollPositionRef.current =
        window.scrollY || document.documentElement.scrollTop;

      console.log(
        "🔄 Auto-actualizando, posición guardada:",
        scrollPositionRef.current
      );

      loadData().finally(() => {
        // Pequeño delay para asegurar que el DOM se haya actualizado
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          console.log("📍 Scroll restaurado a:", scrollPositionRef.current);
          isUpdatingRef.current = false;
        }, 100);
      });
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      // Actualizar estados solo si los datos realmente cambiaron
      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(notifsData) ? prev : notifsData
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(tablesData) ? prev : tablesData
      );
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const notificationsSub = supabase
      .channel("waiter-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
        },
        () => {
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        }
      )
      .subscribe();

    const ordersSub = supabase
      .channel("waiter-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        }
      )
      .subscribe();

    const orderItemsSub = supabase
      .channel("waiter-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        }
      )
      .subscribe();

    const tablesSub = supabase
      .channel("waiter-tables")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        }
      )
      .subscribe();

    return () => {
      notificationsSub.unsubscribe();
      ordersSub.unsubscribe();
      orderItemsSub.unsubscribe();
      tablesSub.unsubscribe();
    };
  };

  // ... (el resto de las funciones se mantienen igual)

  const handleAcknowledgeNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      setAttendedNotifications((prev) => new Set(prev).add(notificationId));
    } catch (error) {
      console.error("Error acknowledging notification:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await waiterService.completeNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setAttendedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (error) {
      console.error("Error completing notification:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      // Actualizar solo el item específico en lugar de recargar todo
      await waiterService.updateItemStatus(itemId, newStatus as never);

      // En lugar de loadData(), actualizar solo el estado local
      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map(
            (order) =>
              ({
                ...order,
                order_items: order.order_items.map((item) =>
                  item.id === itemId ? { ...item, status: newStatus } : item
                ),
              } as never)
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      // Si hay error, entonces sí recargar todo
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    // Buscar notificación de cuenta para esta mesa
    const billNotification = notifications.find(
      (notification) =>
        notification.table_id === tableId &&
        notification.type === "bill_request"
    );

    // Obtener el método de pago de la notificación (si existe)
    const paymentMethod = billNotification?.payment_method || null;

    let paymentMethodText = "";
    if (paymentMethod === "cash") {
      paymentMethodText = "💰 Pago en EFECTIVO";
    } else if (paymentMethod === "terminal") {
      paymentMethodText = "💳 Pago con TERMINAL";
    } else {
      paymentMethodText = "❓ Método de pago no especificado";
    }

    if (
      !confirm(
        `¿Estás seguro de que quieres COBRAR la Mesa ${tableNumber}?\n\n${paymentMethodText}\n💰 Total: $${tableTotal.toFixed(
          2
        )}\n\n📊 Se guardará el historial de venta y se liberará la mesa.`
      )
    ) {
      return;
    }

    setProcessing(`cobrar-${tableId}`);
    try {
      console.log(
        `💵 Iniciando cobro para mesa ${tableNumber}, método: ${paymentMethod}`
      );

      // PASA EL MÉTODO DE PAGO A LA FUNCIÓN
      await waiterService.freeTableAndClean(
        tableId,
        tableNumber,
        paymentMethod
      );

      let successMessage = `✅ Mesa ${tableNumber} cobrada exitosamente!\n\n`;
      if (paymentMethod === "cash") {
        successMessage += `💰 Pago en EFECTIVO\n`;
      } else if (paymentMethod === "terminal") {
        successMessage += `💳 Pago con TERMINAL\n`;
      }
      successMessage += `💵 Total: $${tableTotal.toFixed(
        2
      )}\n📈 Historial guardado correctamente`;

      alert(successMessage);

      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      alert(`❌ Error al cobrar la mesa ${tableNumber}:\n${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleGoToTables = () => {
    setActiveTab("tables");
  };

  const handleError = (error: string) => {
    alert(error);
  };

  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => total + order.total_amount, 0);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header loading={loading} onRefresh={loadData} />

      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationsCount={notifications.length}
        occupiedTablesCount={
          tables.filter((t) => t.status === "occupied").length
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            processing={processing}
            attendedNotifications={attendedNotifications}
            onAcknowledgeNotification={handleAcknowledgeNotification}
            onCompleteNotification={handleCompleteNotification}
            onGoToTables={handleGoToTables}
          />
        )}

        {activeTab === "tables" && (
          <TablesTab
            tables={tables}
            processing={processing}
            onUpdateItemStatus={handleUpdateItemStatus}
            onCobrarMesa={handleCobrarMesa}
            calculateTableTotal={calculateTableTotal}
            notifications={notifications}
          />
        )}

        {activeTab === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>
    </div>
  );
}
