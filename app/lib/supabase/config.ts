/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

// Funciones de configuración inicial
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('tables').select('count').limit(1)
    
    if (error) {
      console.error('Error conectando a Supabase:', error)
      return false
    }
    
    console.log('✅ Conexión a Supabase establecida')
    return true
  } catch (error) {
    console.error('Error inesperado:', error)
    return false
  }
}

// Datos de ejemplo para desarrollo
export const seedInitialData = async (): Promise<void> => {
  try {
    // Insertar mesas si no existen
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
    
    if (tablesError) throw tablesError
    
    if (!tables || tables.length === 0) {
      const tablesData = Array.from({ length: 15 }, (_, i) => ({
        number: i + 1,
        status: 'available',
        capacity: 4,
        location: i < 5 ? 'interior' : i < 10 ? 'terraza' : 'vip'
      }))

      const { error: insertTablesError } = await supabase
        .from('tables')
        .insert(tablesData as any) // Solución temporal
      
      if (insertTablesError) throw insertTablesError
      console.log('✅ Mesas creadas')
    }

    // Insertar productos si no existen
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
    
    if (productsError) throw productsError
    
    if (!products || products.length === 0) {
      const productsData = [
        // Breakfast
        { name: 'Pancake Breakfast', description: 'Fluffy pancakes with syrup', price: 6.5, category: 'Breakfast', preparation_time: 10 },
        { name: 'Breakfast Combo', description: 'Complete breakfast set', price: 8.99, category: 'Breakfast', preparation_time: 15 },
        
        // Lunch
        { name: 'Chicken Bowl', description: 'Grilled chicken with rice and vegetables', price: 12.99, category: 'Lunch', preparation_time: 20 },
        { name: 'Business Lunch', description: 'Professional lunch option', price: 15.5, category: 'Lunch', preparation_time: 25 },
        { name: 'Veggie Wrap', description: 'Fresh vegetable wrap', price: 7.99, category: 'Lunch', preparation_time: 10 },
        
        // Dinner
        { name: 'Beef Burger', description: 'Juicy beef burger with cheese and veggies', price: 9.5, category: 'Dinner', preparation_time: 15 },
        { name: 'Steak Dinner', description: 'Premium steak dinner', price: 18.75, category: 'Dinner', preparation_time: 30 },
        
        // Combos
        { name: 'Family Combo', description: 'Perfect for family dinner', price: 24.99, category: 'Combos', preparation_time: 35 },
        
        // Refill
        { name: 'Soda Refill', description: 'Refill your favorite soda', price: 1.0, category: 'Refill', preparation_time: 2 },
        { name: 'Coffee Refill', description: 'Hot coffee refill', price: 1.5, category: 'Refill', preparation_time: 3 }
      ]

      const { error: insertProductsError } = await supabase
        .from('products')
        .insert(productsData as any) // Solución temporal
      
      if (insertProductsError) throw insertProductsError
      console.log('✅ Productos creados')
    }
  } catch (error) {
    console.error('Error en seedInitialData:', error)
  }
}