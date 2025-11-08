/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaQrcode, FaUtensils, FaHistory } from "react-icons/fa";

export default function QRSharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // Obtener todos los parámetros necesarios
  const tableNumber = searchParams.get("table");
  const userId = searchParams.get("user");
  const orderId = searchParams.get("order");

  useEffect(() => {
    if (tableNumber) {
      const baseUrl = "https://foodhub-software.vercel.app";
      // Incluir todos los parámetros en el QR
      const url = `${baseUrl}/customer?table=${tableNumber}`;
      setCurrentUrl(url);
    }
  }, [tableNumber, userId, orderId]);

  const handleCopyLink = async () => {
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!currentUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a mi mesa - FoodHub",
          text: "Únete a mi mesa en FoodHub Restaurant",
          url: currentUrl,
        });
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Generar QR usando un servicio externo
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    currentUrl
  )}`;

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <FaQrcode className="text-6xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Mesa no especificada
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo identificar la mesa. Por favor, regresa al menú
            principal.
          </p>
          <button
            onClick={() => router.push("/customer")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black pb-20">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-30 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Compartir Mesa</h1>
            <p className="text-sm">Mesa {tableNumber}</p>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 text-center">
          {/* Título y Descripción */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Invita a tu Mesa
          </h2>
          <p className="text-gray-600 mb-8">
            Comparte este código QR con tus acompañantes para que puedan unirse
            a la misma orden
          </p>

          {/* Código QR */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-xl inline-block">
              <img
                src={qrCodeUrl}
                alt="Código QR para unirse a la mesa"
                className="w-64 h-64 mx-auto"
                onError={(e) => {
                  // Fallback si la imagen del QR falla
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                Mesa: <span className="font-bold text-lg">{tableNumber}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Escanea para unirte a la orden
              </p>
            </div>
          </div>

          {/* Botón de compartir */}
          <button
            onClick={handleShare}
            disabled={!currentUrl}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? "¡Enlace Copiado!" : "Compartir Mesa"}
          </button>

          {/* Enlace de texto */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-left mb-2">
              Enlace de la mesa:
            </p>
            <p className="text-xs text-gray-800 break-all bg-white p-2 rounded border">
              {currentUrl || "Generando enlace..."}
            </p>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            ¿Cómo funciona?
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 text-left">
            <li>• Comparte el QR con tus acompañantes</li>
            <li>• Escaneen el código para unirse a la mesa {tableNumber}</li>
            <li>• Todos podrán ver y modificar la misma orden</li>
            <li>• Perfecto para pedidos grupales</li>
          </ul>
        </div>
      </main>

      {/* Navegación Inferior - MANTENIENDO LA MISMA ESTRUCTURA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${tableNumber}&user=${userId}&order=${orderId}`
              )
            }
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaUtensils className="text-2xl mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>

          <button
            onClick={() =>
              router.push(
                `/customer/history?table=${tableNumber}&user=${userId}&order=${orderId}`
              )
            }
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Historial</span>
          </button>

          <button className="flex flex-col items-center text-blue-600">
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-medium">Mi QR</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
