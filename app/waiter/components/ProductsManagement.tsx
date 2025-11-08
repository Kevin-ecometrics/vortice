// app/waiter/components/ProductsManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { FaSpinner } from "react-icons/fa";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  preparation_time: number | null;
  is_available: boolean;
  is_favorite: boolean;
  rating: number;
  rating_count: number;
}

interface ProductsManagementProps {
  onError: (error: string) => void;
}

export default function ProductsManagement({
  onError,
}: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("is_favorite", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      onError("Error cargando los productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    setUpdatingProduct(product.id);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_available: !product.is_available,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", product.id);

      if (error) throw error;

      // Actualizar el estado local inmediatamente
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, is_available: !product.is_available }
            : p
        )
      );
    } catch (error) {
      console.error("Error updating product availability:", error);
      onError("Error actualizando la disponibilidad del producto");
    } finally {
      setUpdatingProduct(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Productos
        </h2>
        <div className="text-sm text-gray-500">
          {products.filter((p) => p.is_available).length} de {products.length}{" "}
          productos disponibles
        </div>
      </div>

      {productsLoading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${
                      !product.is_available ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatCurrency(product.price)}
                            {product.preparation_time &&
                              ` • ${product.preparation_time} min`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductAvailability(product)}
                        disabled={updatingProduct === product.id}
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                          product.is_available
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingProduct === product.id ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : null}
                        {product.is_available ? "Disponible" : "No Disponible"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && !productsLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay productos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Información para el mesero */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Información</h3>
        <p className="text-sm text-blue-700">
          • Haz clic en el estado del producto para cambiar entre Disponible y
          No Disponible
        </p>
        <p className="text-sm text-blue-700">
          • Los productos marcados como No Disponible no aparecerán en el menú
          de los clientes
        </p>
      </div>
    </div>
  );
}
