/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaChartBar,
  FaTable,
  FaBox,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import {
  AdminSection,
  DailyStats,
  OrderSummary,
  PopularProduct,
  SalesHistory,
  SalesSummary,
} from "./types";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import TablesManagement from "./components/TablesManagement";
import ProductsManagement from "./components/ProductsManagement";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

  // Datos del dashboard
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [todayOrders, setTodayOrders] = useState<OrderSummary[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // NUEVOS ESTADOS PARA VENTAS
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);

  // Estado para fecha seleccionada
  const [selectedDate, setSelectedDate] = useState(new Date());

  // NUEVA FUNCIÓN: Cargar datos de ventas históricas
  const loadSalesData = async (date: Date = selectedDate) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();

      // Cargar historial de ventas
      const { data: sales, error: salesError } = await supabase
        .from("sales_history")
        .select("*")
        .gte("closed_at", startOfDayISO)
        .lte("closed_at", endOfDayISO)
        .order("closed_at", { ascending: false });

      if (salesError) throw salesError;

      setSalesHistory(sales || []);

      // Calcular resumen de ventas
      const salesData = sales || [];
      const totalSales = salesData.reduce(
        (sum: number, sale: any) => sum + sale.total_amount,
        0
      );
      const totalItems = salesData.reduce(
        (sum: number, sale: any) => sum + sale.item_count,
        0
      );
      const totalOrders = salesData.reduce(
        (sum: number, sale: any) => sum + sale.order_count,
        0
      );

      setSalesSummary({
        totalSales,
        totalItems,
        totalOrders,
        saleCount: salesData.length,
        averageSale: salesData.length > 0 ? totalSales / salesData.length : 0,
      });
    } catch (error) {
      console.error("Error loading sales data:", error);
      setError("Error cargando los datos de ventas");
    }
  };

  // Función para manejar cambio de fecha
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    loadDailyData(date);
    loadSalesData(date);
  };

  // Actualiza loadDailyData para aceptar fecha
  const loadDailyData = async (date: Date = selectedDate) => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadDailyStats(date),
        loadTodayOrders(date),
        loadPopularProducts(date),
      ]);
    } catch (error) {
      console.error("Error loading daily data:", error);
      setError("Error cargando los datos del día");
    } finally {
      setDataLoading(false);
    }
  };

  // Actualiza las funciones de carga para aceptar fecha
  const loadDailyStats = async (date: Date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();

      // Cargar datos de orders (para comparar con sales_history)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, order_items(quantity, price)")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO);

      if (ordersError) throw ordersError;

      const ordersData = (orders || []) as any[];
      const totalOrders = ordersData.length;

      const totalRevenue = ordersData.reduce((sum: number, order: any) => {
        return sum + (order.total_amount || 0);
      }, 0);

      const totalItemsSold = ordersData.reduce((sum: number, order: any) => {
        const items = order.order_items || [];
        return (
          sum +
          items.reduce((itemSum: number, item: any) => {
            return itemSum + (item.quantity || 0);
          }, 0)
        );
      }, 0);

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const { data: activeTables, error: tablesError } = await supabase
        .from("orders")
        .select("table_id")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO)
        .neq("status", "completed");

      if (tablesError) throw tablesError;

      const activeTablesData = (activeTables || []) as any[];
      const uniqueTables = new Set(
        activeTablesData.map((order: any) => order.table_id)
      );

      setDailyStats({
        totalOrders,
        totalRevenue,
        totalItemsSold,
        activeTables: uniqueTables.size,
        averageOrderValue,
      });
    } catch (error) {
      console.error("Error in loadDailyStats:", error);
      throw error;
    }
  };

  const loadTodayOrders = async (date: Date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();

      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, table_id, total_amount, created_at, status, order_items(id)"
        )
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersData = (orders || []) as any[];
      const ordersWithCount: OrderSummary[] = ordersData.map((order: any) => ({
        id: order.id,
        table_id: order.table_id,
        total_amount: order.total_amount,
        created_at: order.created_at,
        status: order.status,
        items_count: order.order_items?.length || 0,
      }));

      setTodayOrders(ordersWithCount);
    } catch (error) {
      console.error("Error in loadTodayOrders:", error);
      throw error;
    }
  };

  const loadPopularProducts = async (date: Date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const startOfDayISO = startOfDay.toISOString();
      const endOfDayISO = endOfDay.toISOString();

      // Primero intentar desde sales_items (datos históricos)
      const { data: salesItems, error: salesError } = await supabase
        .from("sales_items")
        .select("product_name, quantity, price")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO);

      if (!salesError && salesItems && salesItems.length > 0) {
        const productMap = new Map<
          string,
          { total_quantity: number; total_revenue: number }
        >();

        salesItems.forEach((item: any) => {
          const existing = productMap.get(item.product_name) || {
            total_quantity: 0,
            total_revenue: 0,
          };
          productMap.set(item.product_name, {
            total_quantity: existing.total_quantity + (item.quantity || 0),
            total_revenue:
              existing.total_revenue + (item.price || 0) * (item.quantity || 0),
          });
        });

        const popular: PopularProduct[] = Array.from(productMap.entries())
          .map(([product_name, stats]) => ({
            product_name,
            total_quantity: stats.total_quantity,
            total_revenue: stats.total_revenue,
          }))
          .sort((a, b) => b.total_quantity - a.total_quantity)
          .slice(0, 10);

        setPopularProducts(popular);
        return;
      }

      // Fallback a order_items si no hay datos en sales_items
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select("product_name, quantity, price, created_at")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO);

      if (error) throw error;

      const orderItemsData = (orderItems || []) as any[];
      const productMap = new Map<
        string,
        { total_quantity: number; total_revenue: number }
      >();

      orderItemsData.forEach((item: any) => {
        const existing = productMap.get(item.product_name) || {
          total_quantity: 0,
          total_revenue: 0,
        };
        productMap.set(item.product_name, {
          total_quantity: existing.total_quantity + (item.quantity || 0),
          total_revenue:
            existing.total_revenue + (item.price || 0) * (item.quantity || 0),
        });
      });

      const popular: PopularProduct[] = Array.from(productMap.entries())
        .map(([product_name, stats]) => ({
          product_name,
          total_quantity: stats.total_quantity,
          total_revenue: stats.total_revenue,
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      setPopularProducts(popular);
    } catch (error) {
      console.error("Error in loadPopularProducts:", error);
      throw error;
    }
  };

  // Cargar datos cuando cambie la sección o la fecha seleccionada
  useEffect(() => {
    if (isAuthenticated && activeSection === "dashboard") {
      loadDailyData(selectedDate);
      loadSalesData(selectedDate);
    }
  }, [isAuthenticated, activeSection, selectedDate]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setDailyStats(null);
    setTodayOrders([]);
    setPopularProducts([]);
    setSalesHistory([]);
    setSalesSummary(null);
    setActiveSection("dashboard");
    setError("");
    // Resetear a fecha actual al hacer logout
    setSelectedDate(new Date());
  };

  const handleWaiter = () => {
    window.location.href = "/waiter";
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Dashboard Administrativo
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleWaiter}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                <FaUser />
                Waiter
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                <FaSignOutAlt />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación entre secciones */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              {
                id: "dashboard" as AdminSection,
                name: "Dashboard",
                icon: FaChartBar,
              },
              {
                id: "tables" as AdminSection,
                name: "Gestión de Mesas",
                icon: FaTable,
              },
              {
                id: "products" as AdminSection,
                name: "Gestión de Productos",
                icon: FaBox,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === item.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <item.icon />
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {activeSection === "dashboard" && (
          <Dashboard
            dailyStats={dailyStats}
            todayOrders={todayOrders}
            popularProducts={popularProducts}
            dataLoading={dataLoading}
            onDateChange={handleDateChange}
            selectedDate={selectedDate}
            salesSummary={salesSummary}
            salesHistory={salesHistory}
          />
        )}

        {activeSection === "tables" && (
          <TablesManagement onError={handleError} />
        )}

        {activeSection === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>
    </div>
  );
}
