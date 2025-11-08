// app/page.tsx
"use client";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function HomePage() {
  const handleViewLocation = () => {
    // Por el momento redirige a un anchor, puedes cambiar esto después
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header con Logo */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              FoodHub Restaurant
            </h1>
            <p className="text-gray-600 text-lg">
              Sabores que enamoran, servicio que inspira
            </p>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Bienvenido a FoodHub
            </h2>
            <p className="text-gray-600 mb-8">
              Disfruta de una experiencia culinaria única con nuestro menú
              digital
            </p>

            {/* Botones de Acción */}
            <div className="space-y-4">
              {/* Botón Seleccionar Mesa */}
              {/* <button
                onClick={handleSelectTable}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
              >
                <FaUtensils className="text-xl" />
                Seleccionar Mesa
              </button> */}

              {/* Botón Ver Sucursal */}
              <button
                onClick={handleViewLocation}
                className="w-full bg-green-800 text-white py-4 px-6 rounded-2xl hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
              >
                <FaMapMarkerAlt className="text-xl" />
                Entrar
              </button>
            </div>
          </div>

          {/* Información Adicional */}
          {/* <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Horarios de Atención
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>🏪 Lunes a Viernes: 8:00 AM - 10:00 PM</p>
              <p>🏪 Sábados y Domingos: 9:00 AM - 11:00 PM</p>
            </div>
          </div> */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} FoodHub Restaurant. Todos los derechos
            reservados by{" "}
            <a
              className="text-green-500 hover:text-green-700"
              href="https://e-commetrics.com"
              target="_blank"
            >
              e-commetrics
            </a>{" "}
            .
          </p>
          <p className="text-gray-500 text-sm mt-2"></p>
        </div>
      </footer>

      {/* Sección de Ubicación (placeholder para el anchor) */}
      <div id="location" className="hidden">
        {/* Esta sección estará oculta hasta que implementes la página de sucursal */}
      </div>
    </div>
  );
}
