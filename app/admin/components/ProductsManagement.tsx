"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { FaPlus, FaEdit, FaSpinner, FaStar } from "react-icons/fa";
import { Product } from "../types";
import ProductForm from "./ProductForm";
import StarRating from "./StarRating";

interface ProductsManagementProps {
  onError: (error: string) => void;
}

interface ProductUpdate {
  is_available?: boolean;
  is_favorite?: boolean;
}

export default function ProductsManagement({
  onError,
}: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    preparation_time: "",
    is_available: true,
    is_favorite: false,
    rating: "0",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("is_favorite", { ascending: false }) // Favoritos primero
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

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      if (productForm.image_url && typeof productForm.image_url !== "string") {
        imageUrl = await uploadImage(productForm.image_url as File);
      } else {
        imageUrl = productForm.image_url as string;
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseInt(productForm.price),
        category: productForm.category,
        image_url: imageUrl,
        preparation_time: parseInt(productForm.preparation_time) || null,
        is_available: productForm.is_available,
        is_favorite: productForm.is_favorite,
        rating: parseFloat(productForm.rating) || 0,
        rating_count: 0,
      };

      const { error } = await supabase
        .from("products")
        .insert([productData as never]);
      if (error) throw error;

      setShowProductForm(false);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        preparation_time: "",
        is_available: true,
        is_favorite: false,
        rating: "0",
      });
      await loadProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      onError("Error creando el producto");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      let imageUrl = productForm.image_url as string | File;
      if (productForm.image_url && typeof productForm.image_url !== "string") {
        imageUrl = await uploadImage(productForm.image_url as File);
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseInt(productForm.price),
        category: productForm.category,
        image_url: typeof imageUrl === "string" ? imageUrl : "",
        preparation_time: parseInt(productForm.preparation_time) || null,
        is_available: productForm.is_available,
        is_favorite: productForm.is_favorite,
        rating: parseFloat(productForm.rating) || 0,
      };

      const { error } = await supabase
        .from("products")
        .update(productData as never)
        .eq("id", editingProduct.id);
      if (error) throw error;

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        preparation_time: "",
        is_available: true,
        is_favorite: false,
        rating: "0",
      });
      await loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      onError("Error actualizando el producto");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || "",
      preparation_time: product.preparation_time?.toString() || "",
      is_available: product.is_available,
      is_favorite: product.is_favorite,
      rating: product.rating.toString(),
    });
    setShowProductForm(true);
  };

  const toggleProductAvailability = async (product: Product) => {
    try {
      const updateData: ProductUpdate = {
        is_available: !product.is_available,
      };
      const { error } = await supabase
        .from("products")
        .update(updateData as never)
        .eq("id", product.id);
      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error("Error updating product availability:", error);
      onError("Error actualizando la disponibilidad del producto");
    }
  };

  const toggleProductFavorite = async (product: Product) => {
    try {
      const updateData: ProductUpdate = {
        is_favorite: !product.is_favorite,
      };
      const { error } = await supabase
        .from("products")
        .update(updateData as never)
        .eq("id", product.id);
      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error("Error updating product favorite status:", error);
      onError("Error actualizando el estado de favorito del producto");
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
        <button
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              name: "",
              description: "",
              price: "",
              category: "",
              image_url: "",
              preparation_time: "",
              is_available: true,
              is_favorite: false,
              rating: "0",
            });
            setShowProductForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus />
          Nuevo Producto
        </button>
      </div>

      {showProductForm && (
        <ProductForm
          editingProduct={editingProduct}
          productForm={productForm}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onFormChange={setProductForm}
        />
      )}

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
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favorito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${
                      product.is_favorite
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {product.name}
                            {product.is_favorite && (
                              <FaStar className="text-yellow-500 text-xs" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StarRating
                        rating={product.rating}
                        readonly={true}
                        size={14}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductFavorite(product)}
                        className={`p-1 rounded-full transition-colors ${
                          product.is_favorite
                            ? "text-yellow-500 hover:text-yellow-600 bg-yellow-100"
                            : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                        }`}
                        title={
                          product.is_favorite
                            ? "Quitar de favoritos"
                            : "Marcar como favorito"
                        }
                      >
                        <FaStar size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.preparation_time
                        ? `${product.preparation_time} min`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductAvailability(product)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          product.is_available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.is_available ? "Disponible" : "No Disponible"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
