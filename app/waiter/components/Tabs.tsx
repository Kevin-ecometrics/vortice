// app/waiter/components/Tabs.tsx
interface TabsProps {
  activeTab: "notifications" | "tables" | "products";
  onTabChange: (tab: "notifications" | "tables" | "products") => void;
  notificationsCount: number;
  occupiedTablesCount: number;
}

export default function Tabs({
  activeTab,
  onTabChange,
  notificationsCount,
  occupiedTablesCount,
}: TabsProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          <button
            onClick={() => onTabChange("notifications")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Notificaciones
            {notificationsCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange("tables")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "tables"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Mesas
            {occupiedTablesCount > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {occupiedTablesCount}
              </span>
            )}
          </button>

          {/* NUEVA PESTAÑA */}
          <button
            onClick={() => onTabChange("products")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "products"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Productos
          </button>
        </div>
      </div>
    </div>
  );
}
