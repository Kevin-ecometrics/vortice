import { WaiterNotification } from "@/app/lib/supabase/waiter";
import { FaEye, FaCheck, FaSpinner } from "react-icons/fa";
import NotificationIcon from "./NotificationIcon";

interface NotificationCardProps {
  notification: WaiterNotification;
  processing: string | null;
  isAttended: boolean;
  onAcknowledge: () => void;
  onComplete: () => void;
}

export default function NotificationCard({
  notification,
  processing,
  isAttended,
  onAcknowledge,
  onComplete,
}: NotificationCardProps) {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_order":
        return "border-l-green-500";
      case "assistance":
        return "border-l-yellow-500";
      case "bill_request":
        return "border-l-red-500";
      case "order_updated":
        return "border-l-blue-500";
      case "table_freed":
        return "border-l-purple-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow border-l-4 ${getNotificationColor(
        notification.type
      )} p-4 ${isAttended ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <NotificationIcon type={notification.type} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">
                Mesa {notification.tables?.number}
              </h3>
              {notification.tables?.number && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {notification.tables.number}
                </span>
              )}
              {isAttended && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Atendida
                </span>
              )}
            </div>
            {notification.orders?.customer_name && (
              <p className="text-gray-600">
                Cliente: {notification.orders.customer_name}
              </p>
            )}
            <p className="text-gray-600 mt-1">{notification.message}</p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(notification.created_at).toLocaleString()}
            </p>
            {notification.orders?.total_amount && (
              <p className="text-sm font-semibold text-green-600 mt-1">
                Total: ${notification.orders.total_amount.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {!isAttended && (
            <button
              onClick={onAcknowledge}
              disabled={processing === notification.id}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {processing === notification.id ? (
                <FaSpinner className="animate-spin mr-1" />
              ) : (
                <FaEye className="mr-1" />
              )}
              Atender
            </button>
          )}

          <button
            onClick={onComplete}
            disabled={processing === notification.id}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 flex items-center"
          >
            {processing === notification.id ? (
              <FaSpinner className="animate-spin mr-1" />
            ) : (
              <FaCheck className="mr-1" />
            )}
            Completar
          </button>
        </div>
      </div>
    </div>
  );
}
