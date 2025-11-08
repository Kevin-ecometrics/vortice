/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaUser } from "react-icons/fa";
import OrderItem from "./OrderItem";

interface CustomerOrderSummary {
  customerName: string;
  orders: any[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
}

interface CustomerOrderSectionProps {
  customerSummary: CustomerOrderSummary;
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
}

export default function CustomerOrderSection({
  customerSummary,
  processing,
  onUpdateItemStatus,
}: CustomerOrderSectionProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Header del Cliente */}
      <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <FaUser className="text-white text-sm" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">
            {customerSummary.customerName}
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              {customerSummary.orders.length} pedido
              {customerSummary.orders.length > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>
              {customerSummary.itemsCount} producto
              {customerSummary.itemsCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="space-y-2">
        {customerSummary.orders.flatMap((order) =>
          order.order_items.map((item: any) => (
            <OrderItem
              key={item.id}
              item={item}
              processing={processing}
              onUpdateStatus={onUpdateItemStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
