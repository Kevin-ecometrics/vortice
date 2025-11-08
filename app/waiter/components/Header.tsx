import { FaSync } from "react-icons/fa";

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function Header({ loading, onRefresh }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Panel del Mesero
            </h1>
            <p className="text-gray-600">Pedidos enviados y cuentas por mesa</p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>
    </header>
  );
}
