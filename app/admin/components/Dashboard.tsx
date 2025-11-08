// app/admin/components/Dashboard.tsx
"use client";
import { useState, useEffect } from "react";
import {
  FaUtensils,
  FaTable,
  FaFilter,
  FaCalendarAlt,
  FaDollarSign,
  FaShoppingCart,
  FaFileExport,
  FaReceipt,
  FaTimes,
  FaMoneyBillWave,
  FaCreditCard,
} from "react-icons/fa";
import {
  DailyStats,
  OrderSummary,
  PopularProduct,
  SalesSummary,
  SalesHistory,
} from "../types";
import { supabase } from "@/app/lib/supabase/client";

interface DashboardProps {
  dailyStats: DailyStats | null;
  todayOrders: OrderSummary[];
  popularProducts: PopularProduct[];
  dataLoading: boolean;
  onDateChange: (date: Date) => void;
  selectedDate: Date;
  salesSummary: SalesSummary | null;
  salesHistory: SalesHistory[];
}

// Interfaz para items de venta basada en tu tabla sales_items
interface SalesItem {
  id: string;
  sale_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

// Interfaz para el ticket
interface TicketData {
  sale: SalesHistory;
  items: SalesItem[];
}

export default function Dashboard({
  dailyStats,
  todayOrders,
  popularProducts,
  dataLoading,
  onDateChange,
  selectedDate,
  salesSummary,
  salesHistory,
}: DashboardProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateInput, setDateInput] = useState(
    selectedDate.toISOString().split("T")[0]
  );
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Actualizar dateInput cuando selectedDate cambie
  useEffect(() => {
    setDateInput(selectedDate.toISOString().split("T")[0]);
  }, [selectedDate]);

  // Cargar items de venta cuando cambie el historial de ventas
  useEffect(() => {
    if (salesHistory.length > 0) {
      loadSalesItems();
    } else {
      setSalesItems([]);
    }
  }, [salesHistory]);

  // Función REAL para obtener items de venta desde Supabase
  const loadSalesItems = async () => {
    setLoadingItems(true);
    try {
      const items = await fetchSalesItemsFromSupabase(
        salesHistory.map((sale) => sale.id)
      );
      setSalesItems(items);
    } catch (error) {
      console.error("Error loading sales items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Función REAL para cargar items desde Supabase
  const fetchSalesItemsFromSupabase = async (
    saleIds: string[]
  ): Promise<SalesItem[]> => {
    if (saleIds.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from("sales_items")
        .select("*")
        .in("sale_id", saleIds)
        .order("product_name");

      if (error) {
        console.error("Error fetching sales items from Supabase:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in fetchSalesItemsFromSupabase:", error);
      return [];
    }
  };

  // Función para cargar los items de una venta específica
  const loadTicketItems = async (sale: SalesHistory) => {
    setLoadingTicket(true);
    try {
      const items = await fetchSalesItemsFromSupabase([sale.id]);
      setSelectedTicket({ sale, items });
      setShowTicketModal(true);
    } catch (error) {
      console.error("Error loading ticket items:", error);
      alert("Error al cargar los detalles del ticket");
    } finally {
      setLoadingTicket(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatLongDate = (date: Date): string => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para obtener el texto del método de pago
  const getPaymentMethodText = (method: "cash" | "terminal" | null): string => {
    switch (method) {
      case "cash":
        return "EFECTIVO";
      case "terminal":
        return "TERMINAL";
      default:
        return "NO ESPECIFICADO";
    }
  };

  // Función para obtener el icono del método de pago
  const getPaymentMethodIcon = (method: "cash" | "terminal" | null) => {
    switch (method) {
      case "cash":
        return <FaMoneyBillWave className="text-green-600" />;
      case "terminal":
        return <FaCreditCard className="text-blue-600" />;
      default:
        return <FaDollarSign className="text-gray-600" />;
    }
  };

  // Función para obtener el color del método de pago
  const getPaymentMethodColor = (
    method: "cash" | "terminal" | null
  ): string => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800 border-green-300";
      case "terminal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateValue = e.target.value;
    setDateInput(newDateValue);
    if (newDateValue) {
      const [year, month, day] = newDateValue.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      onDateChange(newDate);
    }
    setShowDateFilter(false);
  };

  // FUNCIÓN: Agrupar productos para reportes
  const getGroupedProducts = () => {
    const productMap = new Map();

    salesItems.forEach((item) => {
      const key = `${item.product_name}-${item.price}`;
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        productMap.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          subtotal: existing.subtotal + item.subtotal,
        });
      } else {
        productMap.set(key, {
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        });
      }
    });

    return Array.from(productMap.values());
  };

  // FUNCIÓN: Generar Excel de productos vendidos
  const generateProductsExcelReport = () => {
    const products = getGroupedProducts();

    if (products.length === 0) {
      alert("No hay datos de productos vendidos para exportar");
      return;
    }

    // Calcular totales
    const totalQuantity = products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    const totalSales = products.reduce(
      (sum, product) => sum + product.subtotal,
      0
    );

    // Crear CSV con encabezados
    let csvContent = "No.,Producto,Precio Unitario,Cantidad Vendida,Total\n";

    products.forEach((product, index) => {
      csvContent += `"${index + 1}","${product.product_name}","${formatCurrency(
        product.price
      )}","${product.quantity}","${formatCurrency(product.subtotal)}"\n`;
    });

    // Agregar totales al final
    csvContent += `\n"","TOTALES","","${totalQuantity}","${formatCurrency(
      totalSales
    )}"`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `productos-vendidos-${
      selectedDate.toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // FUNCIÓN: Generar PDF del reporte de productos vendidos
  const generateProductsPDFReport = () => {
    const products = getGroupedProducts();

    if (products.length === 0) {
      alert("No hay datos de productos vendidos para generar el reporte");
      return;
    }

    // Calcular totales
    const totalQuantity = products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    const totalSales = products.reduce(
      (sum, product) => sum + product.subtotal,
      0
    );

    // Crear contenido HTML para el PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Productos Vendidos - ${
          selectedDate.toISOString().split("T")[0]
        }</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            font-size: 12px; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 3px double #000; 
            padding-bottom: 15px; 
          }
          .restaurant-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
            color: #1f2937;
          }
          .report-title { 
            font-size: 18px; 
            margin-bottom: 10px; 
            color: #374151;
          }
          .summary-section { 
            margin: 20px 0; 
            padding: 15px; 
            background: #f8fafc; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            margin: 15px 0; 
          }
          .summary-card { 
            padding: 12px; 
            border-radius: 6px; 
            text-align: center;
            border: 1px solid;
          }
          .summary-total { 
            background: #dcfce7; 
            border-color: #bbf7d0; 
          }
          .summary-items { 
            background: #dbeafe; 
            border-color: #bfdbfe; 
          }
          .summary-number { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 5px 0; 
          }
          .products-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .products-table th { 
            background: #374151; 
            color: white; 
            padding: 10px; 
            text-align: left; 
            border: 1px solid #4b5563;
          }
          .products-table td { 
            padding: 8px 10px; 
            border: 1px solid #d1d5db; 
          }
          .products-table tr:nth-child(even) { 
            background: #f9fafb; 
          }
          .totals-section { 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 2px solid #000; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0; 
            padding: 0 10px; 
          }
          .grand-total { 
            font-weight: bold; 
            font-size: 16px; 
            margin-top: 10px; 
            padding-top: 10px; 
            border-top: 1px solid #d1d5db; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #d1d5db; 
            font-size: 10px; 
            color: #6b7280;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">FOODHUB RESTAURANT</div>
          <div class="report-title">REPORTE DE PRODUCTOS VENDIDOS</div>
          <div>Fecha: ${formatLongDate(selectedDate)}</div>
          <div>Generado: ${new Date().toLocaleString("es-MX")}</div>
        </div>
        
        <!-- Resumen General -->
        <div class="summary-section">
          <h3 style="margin: 0 0 15px 0; color: #1f2937;">RESUMEN GENERAL</h3>
          <div class="summary-grid">
            <div class="summary-card summary-total">
              <div>VENTAS TOTALES</div>
              <div class="summary-number">${formatCurrency(totalSales)}</div>
              <div>${products.length} productos diferentes</div>
            </div>
            <div class="summary-card summary-items">
              <div>ITEMS VENDIDOS</div>
              <div class="summary-number">${totalQuantity}</div>
              <div>unidades totales</div>
            </div>
          </div>
        </div>

        <!-- Tabla de Productos Vendidos -->
        <h3 style="margin: 25px 0 15px 0; color: #1f2937;">DETALLE DE PRODUCTOS VENDIDOS</h3>
        <table class="products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th class="text-right">Precio Unitario</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (product, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${product.product_name}</td>
                <td class="text-right">${formatCurrency(product.price)}</td>
                <td class="text-center">${product.quantity}</td>
                <td class="text-right">${formatCurrency(product.subtotal)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <!-- Totales -->
        <div class="totals-section">
          <div class="total-row">
            <span><strong>Total Items Vendidos:</strong></span>
            <span><strong>${totalQuantity} unidades</strong></span>
          </div>
          <div class="total-row grand-total">
            <span><strong>VENTA TOTAL:</strong></span>
            <span><strong>${formatCurrency(totalSales)}</strong></span>
          </div>
        </div>

        <div class="footer">
          <div>*** REPORTE DE PRODUCTOS GENERADO AUTOMÁTICAMENTE ***</div>
          <div>FoodHub Restaurant - Sistema de Gestión</div>
          <div>${window.location.hostname}</div>
        </div>
      </body>
      </html>
    `;

    // Abrir ventana para imprimir
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue el contenido antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // FUNCIÓN: Generar PDF del ticket con cálculos correctos
  const generateTicketPDF = (ticketData: TicketData) => {
    const { sale, items } = ticketData;

    // Calcular subtotales y totales
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.08; // 8% de IVA
    const total = subtotal + tax;

    // Crear contenido HTML para el PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket - Mesa ${sale.table_number}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            max-width: 300px; 
            margin: 0 auto; 
            padding: 10px;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .ticket-info { margin-bottom: 10px; padding: 5px 0; }
          .payment-method { 
            background-color: ${
              sale.payment_method === "cash"
                ? "#d1fae5"
                : sale.payment_method === "terminal"
                ? "#dbeafe"
                : "#f3f4f6"
            }; 
            padding: 5px; 
            text-align: center; 
            margin: 5px 0; 
            border-radius: 4px; 
            font-weight: bold;
            color: ${
              sale.payment_method === "cash"
                ? "#065f46"
                : sale.payment_method === "terminal"
                ? "#1e40af"
                : "#374151"
            };
          }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th { border-bottom: 1px dashed #000; padding: 5px 2px; text-align: left; }
          .items-table td { padding: 4px 2px; border-bottom: 1px dotted #ccc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
          .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .grand-total { font-weight: bold; font-size: 14px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; padding-top: 10px; border-top: 1px dashed #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">FOODHUB RESTAURANT</div>
          <div>*** TICKET DE VENTA ***</div>
        </div>
        
        <div class="ticket-info">
          <div><strong>MESA:</strong> ${sale.table_number}</div>
          <div><strong>CLIENTE:</strong> ${
            sale.customer_name || "INVITADO"
          }</div>
          <div><strong>FECHA:</strong> ${formatDateTime(sale.closed_at)}</div>
          <div><strong>TRANSACCIÓN:</strong> ${sale.id
            .slice(0, 8)
            .toUpperCase()}</div>
        </div>

        <div class="payment-method">
          MÉTODO DE PAGO: ${getPaymentMethodText(sale.payment_method)}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>PRODUCTO</th>
              <th class="text-right">CANT</th>
              <th class="text-right">PRECIO</th>
              <th class="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.product_name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(item.subtotal)}</td>
              </tr>
              ${
                item.notes
                  ? `<tr><td colspan="4" style="font-size: 10px; padding-left: 10px;">→ ${item.notes}</td></tr>`
                  : ""
              }
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>SUBTOTAL:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div class="total-row">
            <span>IVA (8%):</span>
            <span>${formatCurrency(tax)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>*** GRACIAS POR SU VISITA ***</div>
          <div>FoodHub Restaurant</div>
          <div>${window.location.hostname}</div>
        </div>
      </body>
      </html>
    `;

    // Abrir ventana para imprimir
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue el contenido antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando datos...</p>
      </div>
    );
  }

  // Calcular estadísticas combinadas
  const combinedStats = {
    totalRevenue: salesSummary?.totalSales || dailyStats?.totalRevenue || 0,
    totalItems: salesSummary?.totalItems || dailyStats?.totalItemsSold || 0,
    totalOrders: salesSummary?.totalOrders || dailyStats?.totalOrders || 0,
    activeOrders: todayOrders.length,
    activeTables: dailyStats?.activeTables || 0,
  };

  // Calcular estadísticas de métodos de pago
  const paymentMethodStats = {
    cash: salesHistory.filter((sale) => sale.payment_method === "cash").length,
    terminal: salesHistory.filter((sale) => sale.payment_method === "terminal")
      .length,
    unspecified: salesHistory.filter((sale) => !sale.payment_method).length,
  };

  return (
    <>
      {/* Header con controles de fecha */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Reporte del Día
              </h1>
              <p className="text-gray-600">
                {isToday ? "Hoy" : formatLongDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de fecha */}
            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FaFilter />
                Cambiar Fecha
              </button>

              {showDateFilter && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-64">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Seleccionar fecha:
                    </label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={handleDateChange}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de exportación ACTUALIZADOS - AMBOS PARA PRODUCTOS */}
            <div className="flex gap-2">
              <button
                onClick={generateProductsExcelReport}
                disabled={salesItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  salesItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <FaFileExport />
                Excel
              </button>
              <button
                onClick={generateProductsPDFReport}
                disabled={salesItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  salesItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <FaReceipt />
                PDF
              </button>
            </div>
            <button
              onClick={() => onDateChange(selectedDate)}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              <FaTable />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(combinedStats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {salesSummary?.saleCount || 0} ventas procesadas
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Items Vendidos</p>
              <p className="text-2xl font-bold text-gray-800">
                {combinedStats.totalItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                En {combinedStats.totalOrders} órdenes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaUtensils className="text-orange-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Órdenes Activas</p>
              <p className="text-2xl font-bold text-gray-800">
                {combinedStats.activeOrders}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                En {combinedStats.activeTables} mesas
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaTable className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(
                  combinedStats.totalOrders > 0
                    ? combinedStats.totalRevenue / combinedStats.totalOrders
                    : 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Por orden procesada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Métodos de Pago */}
      {salesSummary && salesSummary.saleCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            Métodos de Pago Utilizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaMoneyBillWave className="text-green-600 text-xl" />
                <p className="font-semibold text-green-800">Efectivo</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {paymentMethodStats.cash}
              </p>
              <p className="text-sm text-green-700">
                {salesSummary.saleCount > 0
                  ? Math.round(
                      (paymentMethodStats.cash / salesSummary.saleCount) * 100
                    )
                  : 0}
                %
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCreditCard className="text-blue-600 text-xl" />
                <p className="font-semibold text-blue-800">Terminal</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {paymentMethodStats.terminal}
              </p>
              <p className="text-sm text-blue-700">
                {salesSummary.saleCount > 0
                  ? Math.round(
                      (paymentMethodStats.terminal / salesSummary.saleCount) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de productos vendidos */}
      {salesItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaShoppingCart className="text-green-600" />
              Productos Vendidos ({salesItems.length} items individuales)
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {loadingItems
                ? "Cargando..."
                : `${getGroupedProducts().length} productos diferentes`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Precio
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Cantidad
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {getGroupedProducts()
                  .slice(0, 10)
                  .map((product, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-800">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {formatCurrency(product.subtotal)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {getGroupedProducts().length > 10 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Mostrando 10 de {getGroupedProducts().length} productos. Exporta
                el Excel o PDF para ver todos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalle de Ventas Históricas - ACTUALIZADO CON MÉTODO DE PAGO */}
      {salesSummary && salesSummary.saleCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            Ventas Procesadas (Cobradas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800">Total Cobrado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(salesSummary.totalSales)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Transacciones</p>
              <p className="text-2xl font-bold text-blue-600">
                {salesSummary.saleCount}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="font-semibold text-orange-800">Items Vendidos</p>
              <p className="text-2xl font-bold text-orange-600">
                {salesSummary.totalItems}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-800">
                Órdenes Procesadas
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {salesSummary.totalOrders}
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="font-semibold text-indigo-800">Ticket Promedio</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(salesSummary.averageSale)}
              </p>
            </div>
          </div>

          {/* Lista de ventas históricas - ACTUALIZADA CON MÉTODO DE PAGO */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">
              Detalle de Ventas (Click para ver ticket):
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {salesHistory.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => loadTicketItems(sale)}
                  disabled={loadingTicket}
                  className="w-full text-left flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getPaymentMethodColor(
                        sale.payment_method
                      )}`}
                    >
                      {getPaymentMethodIcon(sale.payment_method)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Mesa {sale.table_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.customer_name || "Invitado"} • {sale.order_count}{" "}
                        órdenes • {sale.item_count} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.closed_at).toLocaleTimeString("es-MX")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL TICKET - ACTUALIZADO CON MÉTODO DE PAGO */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaReceipt className="text-blue-600" />
                  Ticket de Venta
                </h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Mesa:</strong> {selectedTicket.sale.table_number}
                  </p>
                  <p>
                    <strong>Cliente:</strong>{" "}
                    {selectedTicket.sale.customer_name || "Invitado"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatDateTime(selectedTicket.sale.closed_at)}
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    {formatCurrency(selectedTicket.sale.total_amount)}
                  </p>
                </div>
              </div>

              {/* MÉTODO DE PAGO EN EL MODAL */}
              <div
                className={`mt-3 p-3 rounded-lg border ${getPaymentMethodColor(
                  selectedTicket.sale.payment_method
                )}`}
              >
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(selectedTicket.sale.payment_method)}
                  <span className="font-semibold">Método de Pago:</span>
                  <span>
                    {getPaymentMethodText(selectedTicket.sale.payment_method)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Productos:</h3>
              <div className="space-y-3">
                {selectedTicket.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {item.product_name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Nota:</strong> {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cálculos de totales en el modal */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(
                        selectedTicket.items.reduce(
                          (sum, item) => sum + item.subtotal,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (8%):</span>
                    <span>
                      {formatCurrency(
                        selectedTicket.items.reduce(
                          (sum, item) => sum + item.subtotal,
                          0
                        ) * 0.08
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>TOTAL:</span>
                    {formatCurrency(
                      selectedTicket.items.reduce(
                        (sum, item) => sum + item.subtotal,
                        0
                      ) * 1.08
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => generateTicketPDF(selectedTicket)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <FaReceipt />
                  Imprimir PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
