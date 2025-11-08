/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  is_favorite: boolean
  preparation_time: number | null
  rating: number
}

export const productsService = {
  // Obtener todos los productos disponibles
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_favorite', { ascending: false })
      .order('category')
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0, // Convertir a número
    })) as Product[]
    
    return products
  },

  // Obtener productos por categoría
  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('is_favorite', { ascending: false }) 
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0,
    })) as Product[]
    
    return products
  },

  // Obtener productos favoritos
  async getFavoriteProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_favorite', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0,
    })) as Product[]
    
    return products
  },

  // Obtener categorías únicas
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_available', true)
      .order('category')
    
    if (error) throw error
    
    const categoriesData = data as { category: string }[] | null
    const uniqueCategories = [...new Set(categoriesData?.map(item => item.category) || [])]
    return uniqueCategories
  }
}