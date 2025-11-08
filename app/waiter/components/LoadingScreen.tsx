import { FaSpinner } from "react-icons/fa";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando panel del mesero...</p>
      </div>
    </div>
  );
}
