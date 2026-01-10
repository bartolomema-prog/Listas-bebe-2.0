import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ShoppingList {
  id: string;
  name: string | null;
  baby_name: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  share_code: string;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateListData {
  babyName: string;
  fatherName: string;
  motherName: string;
  phone: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  price: number;
  brand: string | null;
  model: string | null;
  is_purchased: boolean;
  is_reserved: boolean;
  is_green_checked: boolean;
  is_picked_up: boolean;
  is_paid: boolean;
  purchaser_name: string | null;
  purchaser_phone: string | null;
  purchase_date: string | null;
  amount_paid: number | null;
  color_status: number;
  is_ordered: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaserInfo {
  purchaser_name: string;
  purchaser_phone: string;
  purchase_date: string;
  is_picked_up: boolean;
  is_paid: boolean;
  amount_paid?: number;
}

export function useShoppingLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lists:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las listas', variant: 'destructive' });
    } else {
      setLists((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchLists();
    } else {
      setLoading(false);
    }
  }, [user]);

  const createList = async (listData: CreateListData) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        name: listData.babyName,
        baby_name: listData.babyName,
        father_name: listData.fatherName,
        mother_name: listData.motherName,
        phone: listData.phone,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear la lista', variant: 'destructive' });
      return null;
    }

    setLists(prev => [data, ...prev]);
    toast({ title: 'Lista creada', description: `Lista de "${listData.babyName}" ha sido creada` });
    return data;
  };

  const deleteList = async (listId: string) => {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la lista', variant: 'destructive' });
    } else {
      setLists(prev => prev.filter(l => l.id !== listId));
      toast({ title: 'Lista eliminada' });
    }
  };

  const updateListName = async (listId: string, name: string) => {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ name, baby_name: name })
      .eq('id', listId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    } else {
      setLists(prev => prev.map(l => l.id === listId ? { ...l, name, baby_name: name } : l));
    }
  };

  const updateList = async (listId: string, data: CreateListData) => {
    const { error } = await supabase
      .from('shopping_lists')
      .update({
        name: data.babyName,
        baby_name: data.babyName,
        father_name: data.fatherName,
        mother_name: data.motherName,
        phone: data.phone
      })
      .eq('id', listId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la lista', variant: 'destructive' });
      return false;
    } else {
      setLists(prev => prev.map(l => l.id === listId ? {
        ...l,
        name: data.babyName,
        baby_name: data.babyName,
        father_name: data.fatherName,
        mother_name: data.motherName,
        phone: data.phone
      } : l));
      toast({ title: 'Lista actualizada' });
      return true;
    }
  };

  const toggleArchiveList = async (listId: string, isArchived: boolean) => {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ is_archived: isArchived })
      .eq('id', listId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo realizar la acción', variant: 'destructive' });
    } else {
      setLists(prev => prev.map(l => l.id === listId ? { ...l, is_archived: isArchived } : l));
      toast({
        title: isArchived ? 'Lista archivada' : 'Lista desarchivada',
        description: isArchived ? 'La lista se ha movido a archivadas' : 'La lista se ha movido a tus listas'
      });
    }
  };

  return { lists, loading, createList, deleteList, updateListName, updateList, toggleArchiveList, refetch: fetchLists };
}

// UpdateItemData interface
export interface UpdateItemData {
  name: string;
  price: number;
  brand?: string;
  model?: string;
  purchaser_name?: string | null;
  purchaser_phone?: string | null;
  purchase_date?: string | null;
  is_picked_up?: boolean;
  is_reserved?: boolean;
  is_paid?: boolean;
  amount_paid?: number | null;
}

export function useListItems(listId: string | null) {
  const { toast } = useToast();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los productos', variant: 'destructive' });
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    if (!listId) return;

    const channel = supabase
      .channel(`list-items-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as ListItem]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(item =>
              item.id === (payload.new as ListItem).id ? payload.new as ListItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId]);

  const addItem = async (name: string, price: number, brand?: string, model?: string) => {
    if (!listId) return;

    const { error } = await supabase
      .from('list_items')
      .insert({
        list_id: listId,
        name,
        price,
        brand: brand || null,
        model: model || null
      });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el producto', variant: 'destructive' });
    }
  };

  const updateItem = async (itemId: string, data: UpdateItemData) => {
    const { error } = await supabase
      .from('list_items')
      .update({
        name: data.name,
        price: data.price,
        brand: data.brand || null,
        model: data.model || null,
        purchaser_name: data.purchaser_name || null,
        purchaser_phone: data.purchaser_phone || null,
        purchase_date: data.purchase_date || null,
        is_picked_up: data.is_picked_up ?? false,
        is_reserved: data.is_reserved ?? false,
        is_paid: data.is_paid ?? false,
        amount_paid: data.amount_paid !== undefined ? data.amount_paid : null
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el producto', variant: 'destructive' });
    } else {
      toast({ title: 'Producto actualizado' });
    }
  };

  const togglePurchased = async (itemId: string, isPurchased: boolean, purchaserInfo?: PurchaserInfo) => {
    const updateData: Record<string, unknown> = { is_purchased: isPurchased };

    if (isPurchased && purchaserInfo) {
      updateData.purchaser_name = purchaserInfo.purchaser_name;
      updateData.purchaser_phone = purchaserInfo.purchaser_phone;
      updateData.purchase_date = purchaserInfo.purchase_date;
      updateData.is_picked_up = purchaserInfo.is_picked_up;
      updateData.is_paid = purchaserInfo.is_paid;
      updateData.amount_paid = purchaserInfo.amount_paid !== undefined ? purchaserInfo.amount_paid : null;
      updateData.is_reserved = false; // Usually not reserved if purchased
    } else if (!isPurchased) {
      updateData.purchaser_name = null;
      updateData.purchaser_phone = null;
      updateData.purchase_date = null;
      updateData.is_picked_up = false;
      updateData.is_paid = false;
      updateData.amount_paid = null;
    }

    const { error } = await supabase
      .from('list_items')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const toggleReserved = async (itemId: string, isReserved: boolean, purchaserInfo?: PurchaserInfo) => {
    const updateData: Record<string, unknown> = { is_reserved: isReserved };

    if (isReserved) {
      // If reserving, ensure it's NOT purchased
      updateData.is_purchased = false;

      if (purchaserInfo) {
        updateData.purchaser_name = purchaserInfo.purchaser_name;
        updateData.purchaser_phone = purchaserInfo.purchaser_phone;
        updateData.purchase_date = purchaserInfo.purchase_date;
        updateData.is_picked_up = purchaserInfo.is_picked_up;
      }
    } else {
      // If un-reserving
      updateData.purchaser_name = null;
      updateData.purchaser_phone = null;
      updateData.purchase_date = null;
      updateData.is_picked_up = false;
    }

    const { error } = await supabase
      .from('list_items')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const toggleColorStatus = async (itemId: string, newStatus: number) => {
    const { error } = await supabase
      .from('list_items')
      .update({ color_status: newStatus })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update
    const previousItems = [...items];
    setItems(items.filter(item => item.id !== itemId));

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      // Revert if failed
      setItems(previousItems);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    } else {
      toast({ title: 'Producto eliminado', description: 'El producto ha sido eliminado de la lista', duration: 2000 });
    }
  };

  const total = items.reduce((sum, item) => sum + (item.is_purchased ? 0 : Number(item.price)), 0);
  const purchasedTotal = items.reduce((sum, item) => sum + (item.is_purchased ? Number(item.price) : 0), 0);

  const bulkTogglePurchased = async (itemIds: string[], isPurchased: boolean, purchaserInfo?: PurchaserInfo) => {
    const updateData: Record<string, unknown> = { is_purchased: isPurchased };

    if (isPurchased && purchaserInfo) {
      updateData.purchaser_name = purchaserInfo.purchaser_name;
      updateData.purchaser_phone = purchaserInfo.purchaser_phone;
      updateData.purchase_date = purchaserInfo.purchase_date;
      updateData.is_picked_up = purchaserInfo.is_picked_up;
      updateData.is_paid = purchaserInfo.is_paid;
      updateData.amount_paid = purchaserInfo.amount_paid !== undefined ? purchaserInfo.amount_paid : null;
      updateData.is_reserved = false;
    } else if (!isPurchased) {
      updateData.purchaser_name = null;
      updateData.purchaser_phone = null;
      updateData.purchase_date = null;
      updateData.is_picked_up = false;
      updateData.is_paid = false;
      updateData.amount_paid = null;
    }

    const { error } = await supabase
      .from('list_items')
      .update(updateData)
      .in('id', itemIds);

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron actualizar los productos', variant: 'destructive' });
      return false;
    } else {
      toast({ title: 'Productos actualizados', description: `${itemIds.length} productos actualizados con éxito` });
      return true;
    }
  };

  return { items, loading, addItem, updateItem, togglePurchased, toggleReserved, toggleColorStatus, bulkTogglePurchased, deleteItem, total, purchasedTotal, refetch: fetchItems };
}
