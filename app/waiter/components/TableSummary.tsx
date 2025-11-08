interface TableSummaryProps {
  tableTotal: number;
  customerCount: number;
  orderCount: number;
}

export default function TableSummary({
  tableTotal,
  customerCount,
  orderCount,
}: TableSummaryProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-300">
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg text-gray-800">TOTAL A PAGAR:</span>
        <span className="text-xl font-bold text-green-600">
          ${tableTotal.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        {customerCount} comensal{customerCount > 1 ? "es" : ""} • {orderCount}{" "}
        pedido{orderCount > 1 ? "s" : ""} enviado
        {orderCount > 1 ? "s" : ""}
      </p>
    </div>
  );
}
