import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SavedProduct {
  id: string;
  user_id: string;
  name: string;
  default_price: number | null;
  brand: string | null;
  model: string | null;
  created_at: string;
}

export function useSavedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('saved_products')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const saveProduct = async (name: string, price: number, brand?: string, model?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_products')
      .insert({
        user_id: user.id,
        name: name.trim(),
        default_price: price,
        brand: brand?.trim() || null,
        model: model?.trim() || null
      });

    if (!error) {
      fetchProducts();
    }
  };

  const updateProduct = async (id: string, name: string, price: number, brand?: string, model?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_products')
      .update({
        name: name.trim(),
        default_price: price,
        brand: brand?.trim() || null,
        model: model?.trim() || null
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      fetchProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      fetchProducts();
    }
  };

  const searchProducts = (query: string): SavedProduct[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.brand && p.brand.toLowerCase().includes(lowerQuery)) ||
      (p.model && p.model.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);
  };

  return { products, loading, saveProduct, updateProduct, deleteProduct, searchProducts };
}
