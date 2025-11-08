// app/admin/components/TablesManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaQrcode,
  FaCog,
  FaSpinner,
} from "react-icons/fa";
import { RestaurantTable } from "../types";
import TableForm from "./TableForm";

interface TablesManagementProps {
  onError: (error: string) => void;
}

export default function TablesManagement({ onError }: TablesManagementProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null
  );
  const [tableForm, setTableForm] = useState({
    capacity: "",
    location: "",
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("created_at", { ascending: false }); // Ordenar por fecha de creación

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error("Error loading tables:", error);
      onError("Error cargando las mesas");
    } finally {
      setTablesLoading(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tableData = {
        capacity: parseInt(tableForm.capacity),
        location: tableForm.location,
        status: "available",
      };

      const { data, error } = await supabase
        .from("tables")
        .insert([tableData] as never)
        .select()
        .single<RestaurantTable>();

      if (error) throw error;

      // Ahora actualizamos el número de mesa para que sea igual al ID
      const { error: updateError } = await supabase
        .from("tables")
        .update({ number: data?.id } as never)
        .eq("id", data?.id);

      if (updateError) throw updateError;

      setShowTableForm(false);
      setTableForm({
        capacity: "",
        location: "",
      });
      await loadTables();
    } catch (error) {
      console.error("Error creating table:", error);
      onError("Error creando la mesa");
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    try {
      const tableData = {
        capacity: parseInt(tableForm.capacity),
        location: tableForm.location,
      };

      const { error } = await supabase
        .from("tables")
        .update(tableData as never)
        .eq("id", editingTable.id);

      if (error) throw error;

      setShowTableForm(false);
      setEditingTable(null);
      setTableForm({
        capacity: "",
        location: "",
      });
      await loadTables();
    } catch (error) {
      console.error("Error updating table:", error);
      onError("Error actualizando la mesa");
    }
  };

  const handleEditTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableForm({
      capacity: table.capacity.toString(),
      location: table.location,
    });
    setShowTableForm(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta mesa?")) return;

    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      onError("Error eliminando la mesa");
    }
  };

  const toggleTableStatus = async (table: RestaurantTable) => {
    try {
      const newStatus =
        table.status === "available" ? "maintenance" : "available";
      const { error } = await supabase
        .from("tables")
        .update({ status: newStatus } as never)
        .eq("id", table.id);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error("Error updating table status:", error);
      onError("Error actualizando el estado de la mesa");
    }
  };

  const generateQRCode = (tableNumber: number) => {
    const baseUrl = "https://foodhub-software.vercel.app";
    const url = `${baseUrl}/customer?table=${tableNumber}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      url
    )}`;
    window.open(qrUrl, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "reserved":
        return "Reservada";
      case "maintenance":
        return "Mantenimiento";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
        <div className="flex gap-4">
          <button
            onClick={loadTables}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            <FaSpinner className="text-sm" />
            Actualizar
          </button>
          <button
            onClick={() => {
              setEditingTable(null);
              setTableForm({
                capacity: "",
                location: "",
              });
              setShowTableForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus />
            Nueva Mesa
          </button>
        </div>
      </div>

      {showTableForm && (
        <TableForm
          editingTable={editingTable}
          tableForm={tableForm}
          onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
          onCancel={() => {
            setShowTableForm(false);
            setEditingTable(null);
          }}
          onFormChange={setTableForm}
        />
      )}

      {tablesLoading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando mesas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Todas las Mesas
              </h3>
              <p className="text-sm text-gray-600">
                {tables.length} mesa{tables.length !== 1 ? "s" : ""} en total
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {[...tables]
                .sort((a, b) => (a.number ?? a.id) - (b.number ?? b.id))
                .map((table) => (
                  <div
                    key={table.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          Mesa {table.number || table.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {table.location}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          table.status
                        )}`}
                      >
                        {getStatusText(table.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Capacidad:</strong> {table.capacity} personas
                      </p>
                      {/* <p className="text-sm text-gray-600">
                      <strong>ID:</strong> {table.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Creada:</strong>{" "}
                      {new Date(table.created_at).toLocaleDateString()}
                    </p> */}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          generateQRCode(
                            table.number || parseInt(table.id.toString())
                          )
                        }
                        className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                      >
                        <FaQrcode />
                        QR
                      </button>
                      <button
                        onClick={() => handleEditTable(table)}
                        className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition"
                      >
                        <FaEdit />
                        Editar
                      </button>
                      <button
                        onClick={() => toggleTableStatus(table)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${
                          table.status === "available"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        <FaCog />
                        {table.status === "available" ? "Deshab." : "Habilitar"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
