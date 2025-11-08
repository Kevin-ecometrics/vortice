// app/admin/components/TableForm.tsx
import { RestaurantTable } from "../types";

interface TableFormProps {
  editingTable: RestaurantTable | null;
  tableForm: {
    capacity: string;
    location: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormChange: (form: { capacity: string; location: string }) => void;
}

export default function TableForm({
  editingTable,
  tableForm,
  onSubmit,
  onCancel,
  onFormChange,
}: TableFormProps) {
  const handleChange = (field: string, value: string) => {
    onFormChange({
      ...tableForm,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {editingTable ? "Editar Mesa" : "Nueva Mesa"}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacidad
          </label>
          <input
            type="number"
            min="1"
            max="20"
            required
            value={tableForm.capacity}
            onChange={(e) => handleChange("capacity", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Número de personas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación
          </label>
          <input
            type="text"
            required
            value={tableForm.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Terraza, Interior, Bar"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {editingTable ? "Actualizar Mesa" : "Crear Mesa"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
