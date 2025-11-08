import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import TableCard from "./TableCard";

interface TablesTabProps {
  tables: TableWithOrder[];
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
}

export default function TablesTab({
  tables,
  processing,
  onUpdateItemStatus,
  onCobrarMesa,
  calculateTableTotal,
  notifications,
}: TablesTabProps) {
  const totalGeneral = tables.reduce(
    (sum, table) => sum + calculateTableTotal(table),
    0
  );
  const occupiedTablesCount = tables.filter(
    (t) => t.status === "occupied"
  ).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Cuentas por Mesa
        </h2>
        <div className="text-sm text-gray-600">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
            {occupiedTablesCount} mesas ocupadas
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            <FaDollarSign className="inline mr-1" />
            Total general: ${totalGeneral.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            processing={processing}
            onUpdateItemStatus={onUpdateItemStatus}
            onCobrarMesa={onCobrarMesa}
            calculateTableTotal={calculateTableTotal}
            notifications={notifications}
          />
        ))}
      </div>
    </div>
  );
}

// Import necesario para el ícono
import { FaDollarSign } from "react-icons/fa";
