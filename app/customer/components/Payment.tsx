// app/customer/payment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import axios from "axios";
import {
  FaArrowLeft,
  FaCheck,
  FaReceipt,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaUser,
  FaFilePdf,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaTimes,
} from "react-icons/fa";

interface PaymentSummary {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
}

interface CustomerOrderSummary {
  customerName: string;
  orders: OrderWithItems[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  isLoading: boolean;
}

// Componente Modal para capturar el correo
const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("El correo electrónico es requerido");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setEmailError("");
    onConfirm(email);
  };

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FaFileInvoiceDollar className="text-purple-600 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Solicitar Factura
              </h3>
              <p className="text-sm text-gray-500">
                Ingresa tu correo electrónico
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            <FaTimes className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="tu@correo.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  emailError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-purple-200 focus:border-purple-300"
                }`}
                disabled={isLoading}
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <FaExclamationTriangle className="text-red-500" />
                {emailError}
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700">
              📧 Te enviaremos un correo con los pasos para completar tu
              facturación y los datos fiscales requeridos.
            </p>
          </div>

          {/* Botones del Modal */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FaFileInvoiceDollar />
                  Solicitar Factura
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table");
  const userId = searchParams.get("user");
  const orderId = searchParams.get("order");

  const { currentTableId, notificationState, createBillNotification } =
    useOrder();

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Cargar órdenes pendientes de pago
  useEffect(() => {
    const loadAllOrders = async () => {
      const targetTableId = tableId || currentTableId;
      if (!targetTableId) return;

      try {
        setLoading(true);
        setError("");

        const orders = await historyService.getCustomerOrderHistory(
          parseInt(targetTableId.toString())
        );

        const pendingOrders = orders.filter(
          (order) => order.status === "active" || order.status === "sent"
        );

        setAllOrders(pendingOrders);

        if (pendingOrders.length === 0) {
          setError("No hay órdenes pendientes de pago");
        }
      } catch (error) {
        console.error("Error loading orders for payment:", error);
        setError("Error cargando las órdenes para pago");
      } finally {
        setLoading(false);
      }
    };

    if (tableId !== null || currentTableId) {
      loadAllOrders();
    }
  }, [tableId, currentTableId]);

  // Agrupar órdenes por cliente
  const groupOrdersByCustomer = (): CustomerOrderSummary[] => {
    const customerMap = new Map<string, CustomerOrderSummary>();

    allOrders.forEach((order) => {
      const customerName = order.customer_name || "Cliente";

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customerName,
          orders: [],
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          itemsCount: 0,
        });
      }

      const customerSummary = customerMap.get(customerName)!;
      customerSummary.orders.push(order);

      const orderSubtotal = order.order_items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      customerSummary.subtotal += orderSubtotal;
      customerSummary.itemsCount += order.order_items.length;
    });

    const taxRate = 0.08;
    customerMap.forEach((customerSummary) => {
      customerSummary.taxAmount = customerSummary.subtotal * taxRate;
      customerSummary.total =
        customerSummary.subtotal + customerSummary.taxAmount;
    });

    return Array.from(customerMap.values());
  };

  // Calcular resumen de TODAS las órdenes pendientes
  const calculateTotalPaymentSummary = (): PaymentSummary => {
    let subtotal = 0;

    allOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        subtotal += item.price * item.quantity;
      });
    });

    const taxRate = 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total,
      taxRate,
    };
  };

  const customerSummaries = groupOrdersByCustomer();
  const paymentSummary = calculateTotalPaymentSummary();

  // Countdown para redirección después del pago
  useEffect(() => {
    if (paymentConfirmed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentConfirmed && countdown === 0) {
      router.push("/");
    }
  }, [paymentConfirmed, countdown, router]);

  // Función para generar PDF del ticket
  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true);

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket de Pago - Mesa ${tableId || currentTableId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              background: #1f2937; 
              color: white; 
              padding: 20px; 
              margin-bottom: 20px;
            }
            .restaurant-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .table-info { 
              font-size: 14px; 
              color: #d1d5db;
            }
            .customer-section { 
              margin-bottom: 25px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 15px;
            }
            .customer-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 15px;
            }
            .customer-name { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1f2937;
            }
            .customer-total { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1f2937;
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              padding-bottom: 8px; 
              border-bottom: 1px solid #f3f4f6;
            }
            .item-name { 
              font-weight: 500;
            }
            .item-details { 
              font-size: 12px; 
              color: #6b7280; 
              margin-top: 2px;
            }
            .item-price { 
              text-align: right;
            }
            .order-separator { 
              border-top: 1px solid #e5e7eb; 
              margin: 15px 0;
            }
            .customer-summary { 
              background: #dbeafe; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 15px;
            }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px;
            }
            .final-total { 
              border-top: 2px solid #1f2937; 
              padding-top: 15px; 
              margin-top: 20px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 18px; 
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              color: #6b7280; 
              font-size: 12px;
            }
            .timestamp { 
              font-size: 12px; 
              color: #6b7280; 
              text-align: center; 
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">RESTAURANTE</div>
            <div class="table-info">Mesa ${tableId || currentTableId}</div>
            <div class="table-info">${new Date().toLocaleString("es-MX")}</div>
          </div>

          <div class="timestamp">
            Generado el ${new Date().toLocaleString("es-MX")}
          </div>

          ${customerSummaries
            .map(
              (customerSummary) => `
            <div class="customer-section">
              <div class="customer-header">
                <div class="customer-name">${customerSummary.customerName}</div>
                <div class="customer-total">${formatCurrency(
                  customerSummary.subtotal
                )}</div>
              </div>

              ${customerSummary.orders
                .map(
                  (order) => `
                ${
                  customerSummary.orders.length > 1
                    ? `
                  <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 12px; color: #6b7280;">
                      Orden #${order.id.slice(-8)} - ${getStatusText(
                        order.status
                      )}
                    </div>
                  </div>
                `
                    : ""
                }

                ${order.order_items
                  .map(
                    (item) => `
                  <div class="item-row">
                    <div>
                      <div class="item-name">${item.product_name}</div>
                      <div class="item-details">
                        Cantidad: ${item.quantity} • ${formatCurrency(
                      item.price
                    )} c/u
                        ${item.notes ? `<br>Nota: ${item.notes}` : ""}
                      </div>
                    </div>
                    <div class="item-price">
                      ${formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                `
                  )
                  .join("")}

                ${
                  order !==
                  customerSummary.orders[customerSummary.orders.length - 1]
                    ? `
                  <div class="order-separator"></div>
                `
                    : ""
                }
              `
                )
                .join("")}


          `
            )
            .join("")}

          <div class="final-total">
            <div class="summary-row">
              <span>Subtotal total:</span>
              <span>${formatCurrency(paymentSummary.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Impuestos (8%):</span>
              <span>${formatCurrency(paymentSummary.taxAmount)}</span>
            </div>
            <div class="total-row">
              <span>TOTAL GENERAL:</span>
              <span>${formatCurrency(paymentSummary.total)}</span>
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: bold; margin-bottom: 5px;">¡Gracias por su preferencia!</p>
            <p>Ticket generado para proceso de pago</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Función para abrir el modal de facturación
  const handleOpenInvoiceModal = () => {
    setIsInvoiceModalOpen(true);
  };

  // Función para cerrar el modal de facturación
  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
  };

  // Función para facturar compra y enviar correo usando Axios
  const handleInvoiceRequest = async (email: string) => {
    try {
      setGeneratingInvoice(true);

      const invoiceData = {
        tableId: tableId || currentTableId,
        customerEmail: email,
        customerSummaries: customerSummaries.map((summary) => ({
          customerName: summary.customerName,
          subtotal: summary.subtotal,
          taxAmount: summary.taxAmount,
          total: summary.total,
          itemsCount: summary.itemsCount,
        })),
        paymentSummary: {
          subtotal: paymentSummary.subtotal,
          taxAmount: paymentSummary.taxAmount,
          total: paymentSummary.total,
        },
        orders: allOrders.map((order) => ({
          id: order.id,
          customerName: order.customer_name,
          items: order.order_items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          })),
        })),
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(
        "https://e-commetrics.com/api/invoice",
        invoiceData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        alert(
          "✅ Solicitud de factura enviada correctamente. Recibirá un correo con los pasos para completar la facturación."
        );
        handleCloseInvoiceModal();
      } else {
        throw new Error(
          response.data.message || "Error al procesar la factura"
        );
      }
    } catch (error) {
      console.error("Error solicitando factura:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage =
            error.response.data?.message || "Error del servidor";
          alert(`❌ Error al solicitar la factura: ${errorMessage}`);
        } else if (error.request) {
          alert("❌ Error de conexión. No se pudo contactar al servidor.");
        } else {
          alert("❌ Error en la solicitud de factura.");
        }
      } else {
        alert(
          "❌ Error al solicitar la factura. Por favor, intente nuevamente o contacte al personal."
        );
      }
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Método de confirmación de pago SIMPLIFICADO usando el Context
  const handlePaymentConfirmation = async () => {
    try {
      // Confirmar el pago visualmente (solo redirección)
      setPaymentConfirmed(true);

      console.log("✅ Pago confirmado:", {
        tableId: tableId || currentTableId,
        total: paymentSummary.total,
        customers: customerSummaries.map((c) => c.customerName),
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("❌ Error al confirmar el pago. Intenta nuevamente.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: "En preparación",
      sent: "Enviada a cocina",
      completed: "Completada",
      paid: "Pagada",
    };
    return statusMap[status] || status;
  };

  // Renderizado condicional del botón SIMPLIFICADO usando el Context
  const renderPaymentButton = () => {
    const { checkingNotification, hasPendingBill } = notificationState;

    if (checkingNotification) {
      return (
        <button
          disabled
          className="flex-1 bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <FaSpinner className="text-xl animate-spin" />
          Verificando...
        </button>
      );
    }

    if (hasPendingBill) {
      return (
        <button
          disabled
          className="flex-1 bg-yellow-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <FaClock className="text-xl" />
          Tu ticket está en proceso
        </button>
      );
    }

    return (
      <button
        onClick={handlePaymentConfirmation}
        className="flex-1 bg-green-500 text-white px-8 py-4 rounded-xl hover:bg-green-600 transition font-semibold flex items-center justify-center gap-3"
      >
        <FaCheck className="text-xl" />
        Ya Pagué
      </button>
    );
  };

  // Mostrar loading mientras se obtiene el tableId
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando ticket de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">
            No hay órdenes pendientes de pago en esta mesa.
          </p>
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${tableId}&user=${userId}&order=${orderId}`
              )
            }
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaReceipt className="text-4xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No hay órdenes para pagar
          </h2>
          <p className="text-gray-600 mb-4">
            Todas las órdenes de esta mesa ya han sido pagadas o no hay órdenes
            activas.
          </p>
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${tableId}&user=${userId}&order=${orderId}`
              )
            }
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-4xl text-green-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Pago Confirmado!
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              Comensales:{" "}
              <span className="font-semibold">{customerSummaries.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Órdenes pagadas:{" "}
              <span className="font-semibold">{allOrders.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Total pagado:{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(paymentSummary.total)}
              </span>
            </p>
          </div>

          <p className="text-gray-600 mb-4">
            Gracias por su preferencia. ¡Esperamos verle pronto!
          </p>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <FaClock />
              <span className="font-semibold">
                Redirigiendo en {countdown} segundos...
              </span>
            </div>
            <p className="text-sm text-blue-600">
              Será dirigido automáticamente a la página principal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FaArrowLeft className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Ticket de Pago
                  </h1>
                  <p className="text-sm text-gray-500">
                    Mesa {tableId || currentTableId}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    {customerSummaries.length} comensal
                    {customerSummaries.length > 1 ? "es" : ""} •{" "}
                    {allOrders.length} orden{allOrders.length > 1 ? "es" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentSummary.total)}
                </p>
                <p className="text-sm text-gray-500">Total a pagar</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Resumen de todas las órdenes */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* Header del Ticket */}
            <div className="bg-gray-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold">RESTAURANTE</h3>
              <p className="text-gray-300 text-sm">
                Mesa {tableId || currentTableId}
              </p>
            </div>

            {/* Lista de órdenes agrupadas por cliente */}
            <div className="p-6">
              {customerSummaries.map((customerSummary, customerIndex) => (
                <div
                  key={customerSummary.customerName}
                  className="mb-8 last:mb-0"
                >
                  {/* Header del cliente */}
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {customerSummary.customerName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {customerSummary.itemsCount} item
                            {customerSummary.itemsCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(customerSummary.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(customerSummary.subtotal)} + impuestos
                      </p>
                    </div>
                  </div>

                  {/* Items de todas las órdenes de este cliente */}
                  <div className="space-y-4 mb-4">
                    {customerSummary.orders.map((order, orderIndex) => (
                      <div key={order.id}>
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
                  </div>

                  {/* Separador entre clientes */}
                  {customerIndex < customerSummaries.length - 1 && (
                    <div className="border-t border-gray-300 my-6"></div>
                  )}
                </div>
              ))}

              {/* Resumen FINAL de todos los pagos */}
              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal total:</span>
                  <span>{formatCurrency(paymentSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Impuestos (8%):</span>
                  <span>{formatCurrency(paymentSummary.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-800 border-t border-gray-200 pt-4">
                  <span>TOTAL GENERAL:</span>
                  <span>{formatCurrency(paymentSummary.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer del Ticket */}
            <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 border-t">
              <p className="font-medium mb-2">¡Gracias por su preferencia!</p>
              <p>Presione Ya Pagué cuando haya completado el pago</p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-4">
            {/* Primera fila de botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Botón para Guardar PDF */}
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPdf}
                className="flex-1 bg-blue-500 text-white px-6 py-4 rounded-xl hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <FaSpinner className="text-xl animate-spin" />
                ) : (
                  <FaFilePdf className="text-xl" />
                )}
                {generatingPdf ? "Generando PDF..." : "Guardar Ticket PDF"}
              </button>
              <button
                onClick={handleOpenInvoiceModal}
                disabled={generatingInvoice}
                className="flex-1 max-w-2xl bg-purple-500 text-white px-6 py-4 rounded-xl hover:bg-purple-600 transition font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingInvoice ? (
                  <FaSpinner className="text-xl animate-spin" />
                ) : (
                  <FaFileInvoiceDollar className="text-xl" />
                )}
                {generatingInvoice
                  ? "Procesando Factura..."
                  : "Facturar Compra"}
              </button>
              {/* Botón de Confirmación de Pago desde el Context */}
              {renderPaymentButton()}
            </div>
          </div>

          {/* Mensaje informativo cuando hay notificación */}
          {notificationState.hasPendingBill && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <FaClock className="text-yellow-600" />
                <p className="text-sm font-medium">
                  Hemos recibido tu solicitud de pago. El mesero está en camino
                  con tu ticket.
                </p>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm mt-4 text-center">
            Puede guardar el ticket en PDF o solicitar factura antes de
            confirmar el pago
          </p>
        </main>
      </div>

      {/* Modal para facturación */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        onConfirm={handleInvoiceRequest}
        isLoading={generatingInvoice}
      />
    </>
  );
}
