"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import {
  FaSpinner,
  FaCheck,
  FaQrcode,
  FaExclamationTriangle,
  FaUser,
} from "react-icons/fa";

export default function CustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [nameError, setNameError] = useState("");

  // Obtener número de mesa desde parámetros de URL
  const tableFromParams = searchParams.get("table");

  // Cargar mesas y verificar parámetros
  useEffect(() => {
    loadAllTables();
    checkURLParams();
  }, []);

  const loadAllTables = async () => {
    setLoadingTables(true);
    try {
      const tablesData = await tablesService.getTablesByBranch();
      setTables(tablesData);
    } catch (err) {
      setError("Error cargando mesas");
      console.error(err);
    } finally {
      setLoadingTables(false);
    }
  };

  const checkURLParams = () => {
    const redirected = searchParams.get("redirected");

    if (tableFromParams) {
      const tableNumber = parseInt(tableFromParams);
      if (!isNaN(tableNumber)) {
        setSelectedTable(tableNumber);
      }
    }

    if (redirected) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      setTimeout(() => {
        alert("👋 ¡Gracias por su visita! Esperamos verlo pronto.");
      }, 500);
    }
  };

  const validateForm = () => {
    if (!selectedTable) {
      setError("No se ha especificado una mesa");
      return false;
    }

    const table = tables.find((t) => t.number === selectedTable);
    if (!table) {
      setError("Mesa no encontrada");
      return false;
    }

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setNameError("El nombre es obligatorio");
      return false;
    }

    if (trimmedName.length < 2) {
      setNameError("El nombre debe tener al menos 2 caracteres");
      return false;
    }

    setError("");
    setNameError("");
    return true;
  };

  const handleRegisterAndRedirect = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const table = tables.find((t) => t.number === selectedTable);
      if (!table) {
        setError("Mesa no encontrada");
        return;
      }

      // 1. Crear orden para el cliente
      const order = await ordersService.createOrder(
        table.id,
        customerName.trim()
      );

      // 2. Si la mesa está disponible, actualizar estado a "occupied"
      if (table.status === "available") {
        await tablesService.updateTableStatus(table.id, "occupied");
      }

      // 3. Notificar al mesero sobre nuevo cliente
      await notificationsService.createNotification(
        table.id,
        "new_order",
        `Nuevo cliente en Mesa ${table.number} - ${customerName.trim()}`,
        order.id
      );

      // 4. Redirigir DIRECTAMENTE al menú con los parámetros necesarios
      router.push(
        `/customer/menu?table=${table.id}&user=${order.id}&order=${order.id}`
      );
    } catch (err) {
      setError("Error al crear la orden");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatusText = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "disabled":
        return "Deshabilitado";
      default:
        return status;
    }
  };

  // Encontrar la mesa seleccionada para mostrar su estado
  const selectedTableData = tables.find((t) => t.number === selectedTable);

  // Mostrar loading mientras se cargan las mesas
  if (loadingTables) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="text-3xl text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cargando...</h1>
          <p className="text-gray-600">Verificando información de la mesa</p>
        </div>
      </div>
    );
  }

  // Verificar si hay parámetro de mesa
  if (!tableFromParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-3xl text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Mesa no especificada
          </h1>
          <p className="text-gray-600 mb-4">
            Para acceder a esta página necesitas escanear el código QR de una
            mesa.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaQrcode className="text-3xl text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido a FoodHub
          </h1>
          <p className="text-gray-600">Ingresa tu nombre para comenzar</p>
        </div>

        {/* Información de mesa */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">
                Mesa {selectedTable}
              </h3>
              <p className="text-sm text-blue-600">
                Escaneaste el código QR de la mesa {selectedTable}
              </p>
              {selectedTableData && (
                <p
                  className={`text-sm font-medium mt-1 ${
                    selectedTableData.status === "available"
                      ? "text-green-600"
                      : selectedTableData.status === "occupied"
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  Estado: {getTableStatusText(selectedTableData.status)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mostrar error general */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Nombre obligatorio del cliente */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu nombre *
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (nameError && e.target.value.trim().length >= 2) {
                setNameError("");
              }
            }}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              nameError ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {nameError && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <FaExclamationTriangle className="text-xs" />
              {nameError}
            </p>
          )}
        </div>

        {/* Botón de continuar */}
        <button
          onClick={handleRegisterAndRedirect}
          disabled={loading || !customerName.trim() || !selectedTableData}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              customerName.trim() && !loading && selectedTableData
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creando tu orden...
            </>
          ) : customerName.trim() ? (
            <>
              <FaCheck />
              Continuar al Menú
            </>
          ) : (
            "Ingresa tu nombre"
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Podrás agregar más personas después desde el menú
          </p>
          <p className="text-xs text-blue-600 text-center mt-2">
            * Campo obligatorio: Nombre
          </p>
        </div>
      </div>
    </div>
  );
}
