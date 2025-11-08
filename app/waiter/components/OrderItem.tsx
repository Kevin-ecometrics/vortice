import { FaSpinner } from "react-icons/fa";

interface OrderItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  processing: string | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
}

export default function OrderItem({
  item,
  processing,
  onUpdateStatus,
}: OrderItemProps) {
  // Función para obtener el siguiente estado
  const getNextStatus = (currentStatus: string): string => {
    const statusFlow = {
      ordered: "preparing",
      preparing: "served",
      served: "served", // Ya no puede avanzar más
    };
    return (
      statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus
    );
  };

  // Función para obtener el texto del botón según el estado
  const getButtonText = (status: string): string => {
    const statusText = {
      ordered: "Ordenado",
      preparing: "En Preparación",
      served: "Servido",
    };
    return statusText[status as keyof typeof statusText] || status;
  };

  // Función para obtener los estilos del botón según el estado
  const getButtonStyles = (status: string): string => {
    const baseStyles =
      "text-xs px-3 py-2 rounded font-medium transition-all duration-200";

    const statusStyles = {
      ordered: "bg-red-500 text-white hover:bg-red-600",
      preparing: "bg-yellow-500 text-white hover:bg-yellow-600",
      served: "bg-green-500 text-white cursor-default",
    };

    return `${baseStyles} ${
      statusStyles[status as keyof typeof statusStyles] ||
      "bg-gray-500 text-white"
    }`;
  };

  // Función para manejar el click en el botón
  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Prevenir propagación

    if (item.status === "served") return;

    const nextStatus = getNextStatus(item.status);
    onUpdateStatus(item.id, nextStatus);
  };
  return (
    <div className="flex justify-between items-start text-sm bg-gray-50 p-3 rounded-lg border">
      <div className="flex-1">
        <div className="flex justify-between">
          {item.product_name} × {item.quantity}
          <button
            onClick={handleStatusClick}
            disabled={processing === item.id || item.status === "served"}
            className={getButtonStyles(item.status)}
          >
            {processing === item.id ? (
              <FaSpinner className="animate-spin" />
            ) : (
              getButtonText(item.status)
            )}
          </button>
          {/* <span className="font-semibold text-green-600">
            ${(item.price * item.quantity).toFixed(2)}
          </span> */}
        </div>
        <div className="flex justify-between items-center mt-2">
          {/* <span className="text-xs text-gray-500">
            ${item.price.toFixed(2)} c/u
          </span> */}
          <div className="flex items-center gap-3">
            {/* Botón de estado clickeable */}
          </div>
        </div>
        {item.notes && (
          <p className="text-xs text-gray-600 mt-2">
            <strong>Nota:</strong> {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
