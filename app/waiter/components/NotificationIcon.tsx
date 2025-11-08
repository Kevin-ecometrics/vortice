import {
  FaBell,
  FaUtensils,
  FaReceipt,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

interface NotificationIconProps {
  type: string;
}

export default function NotificationIcon({ type }: NotificationIconProps) {
  switch (type) {
    case "new_order":
      return <FaUtensils className="text-green-500" />;
    case "assistance":
      return <FaBell className="text-yellow-500" />;
    case "bill_request":
      return <FaReceipt className="text-red-500" />;
    case "order_updated":
      return <FaExclamationTriangle className="text-blue-500" />;
    case "table_freed":
      return <FaCheckCircle className="text-purple-500" />;
    default:
      return <FaBell className="text-gray-500" />;
  }
}
