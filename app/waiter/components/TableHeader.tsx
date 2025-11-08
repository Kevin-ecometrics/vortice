/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import {
  FaDollarSign,
  FaSpinner,
  FaBell,
  FaMoneyBillWave,
  FaCreditCard,
} from "react-icons/fa";

interface TableHeaderProps {
  table: TableWithOrder;
  tableTotal: number;
  processing: string | null;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  notifications: WaiterNotification[];
}

export default function TableHeader({
  table,
  tableTotal,
  processing,
  onCobrarMesa,
  notifications = [],
}: TableHeaderProps) {
  const calculateTotalItems = (table: TableWithOrder) => {
    return table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      0
    );
  };

  const calculateItemsByStatus = (table: TableWithOrder) => {
    const pending = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter(
          (item: any) =>
            item.status === "ordered" || item.status === "preparing"
        ).length,
      0
    );

    const ready = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "ready").length,
      0
    );

    const served = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "served")
          .length,
      0
    );

    return { pending, ready, served };
  };

  // Obtener notificaciones de "Solicita la cuenta" para esta mesa
  const billRequestNotifications = notifications.filter(
    (notification: any) =>
      notification.table_id === table.id && notification.type === "bill_request"
  );

  // Obtener la notificación más reciente de cuenta
  const latestBillRequest =
    billRequestNotifications.length > 0
      ? billRequestNotifications[billRequestNotifications.length - 1]
      : null;

  // Determinar el texto y estilo según el método de pago
  const getPaymentMethodInfo = (paymentMethod: string | null) => {
    if (paymentMethod === "cash") {
      return {
        text: "Pago en Efectivo",
        icon: FaMoneyBillWave,
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      };
    } else {
      // terminal o cualquier otro valor
      return {
        text: "Pago con Terminal",
        icon: FaCreditCard,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-300",
      };
    }
  };

  const totalItems = calculateTotalItems(table);
  const statusCounts = calculateItemsByStatus(table);

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg flex items-center gap-2">
          Mesa {table.number}
        </h3>

        <div className="flex flex-wrap gap-1 mt-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              table.status === "occupied"
                ? "bg-green-100 text-green-800"
                : table.status === "reserved"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {table.status === "occupied"
              ? "🟢 Ocupada"
              : table.status === "reserved"
              ? "🟡 Reservada"
              : "⚪ Disponible"}
          </span>

          {/* NOTIFICACIÓN DE CUENTA CON MÉTODO DE PAGO */}
          {latestBillRequest && (
            <span
              className={`text-xs px-2 py-1 rounded border ${
                getPaymentMethodInfo(latestBillRequest.payment_method).bgColor
              } ${
                getPaymentMethodInfo(latestBillRequest.payment_method).textColor
              } ${
                getPaymentMethodInfo(latestBillRequest.payment_method)
                  .borderColor
              } flex items-center gap-1 animate-pulse`}
            >
              {(() => {
                const IconComponent = getPaymentMethodInfo(
                  latestBillRequest.payment_method
                ).icon;
                return <IconComponent className="text-xs" />;
              })()}
              {getPaymentMethodInfo(latestBillRequest.payment_method).text}
            </span>
          )}

          {totalItems > 0 && (
            <>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                🍽️ {statusCounts.served} servidos
              </span>
            </>
          )}
        </div>

        {/* INFORMACIÓN ADICIONAL DEL MÉTODO DE PAGO */}
        {latestBillRequest && (
          <div className="mt-2 text-xs text-gray-600">
            {latestBillRequest.payment_method === "cash" ? (
              <p>
                💡 El cliente pagará en efectivo - Prepárate para dar cambio
              </p>
            ) : (
              <p>💡 El cliente pagará con tarjeta - Lleva la terminal</p>
            )}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-1">
          {table.location} • {table.capacity} personas
        </p>
      </div>

      {table.status === "occupied" && table.orders.length > 0 && (
        <button
          onClick={() => onCobrarMesa(table.id, table.number)}
          disabled={processing === `cobrar-${table.id}`}
          className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50 whitespace-nowrap ml-2 flex items-center gap-1"
        >
          {processing === `cobrar-${table.id}` ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <>
              <FaDollarSign />
              Cobrar
            </>
          )}
        </button>
      )}
    </div>
  );
}
