import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ListItemWithList {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    price: number;
    color_status: number;
    is_ordered: boolean;
    shopping_lists: {
        name: string;
    } | null;
}

export function OrderManager() {
    const [items, setItems] = useState<ListItemWithList[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrderItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('list_items')
                .select('*, shopping_lists(name)')
                .eq('color_status', 2)
                .order('brand', { ascending: true })
                .order('name', { ascending: true }) as any;

            if (error) throw error;
            setItems((data as any) || []);
        } catch (error: any) {
            console.error('Error fetching order items:', error);
            toast.error('Error al cargar los productos para pedir');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderItems();
    }, []);

    const handleToggleColorStatus = async (itemId: string, currentStatus: number) => {
        // Cycle: 0 -> 2 -> 1 -> 3 -> 0
        let nextStatus = 0;
        if (currentStatus === 0) nextStatus = 2;
        else if (currentStatus === 2) nextStatus = 1;
        else if (currentStatus === 1) nextStatus = 3;
        else nextStatus = 0;

        try {
            const { error } = await supabase
                .from('list_items')
                .update({ color_status: nextStatus } as any)
                .eq('id', itemId);

            if (error) throw error;

            // Optimistic update
            if (nextStatus !== 2) {
                setItems(prev => prev.filter(item => item.id !== itemId));
            } else {
                setItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, color_status: nextStatus } : item
                ));
            }
            toast.success('Estado actualizado');
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error('No se pudo actualizar el estado');
        }
    };

    const handleToggleOrdered = async (itemId: string, isOrdered: boolean) => {
        try {
            const { error } = await supabase
                .from('list_items')
                .update({ is_ordered: isOrdered } as any)
                .eq('id', itemId);

            if (error) throw error;

            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, is_ordered: isOrdered } : item
            ));
            toast.success(isOrdered ? 'Marcado como pedido' : 'Marcado como no pedido');
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast.error('No se pudo actualizar el estado del pedido');
        }
    };

    const groupedItems = useMemo(() => {
        const groups: Record<string, ListItemWithList[]> = {};
        items.forEach(item => {
            const brand = item.brand || 'Sin Marca';
            if (!groups[brand]) groups[brand] = [];
            groups[brand].push(item);
        });
        return groups;
    }, [items]);

    const getStatusColor = (status: number) => {
        switch (status) {
            case 1: return "border-green-500 bg-green-500";
            case 2: return "border-yellow-500 bg-yellow-500";
            case 3: return "border-red-500 bg-red-500";
            default: return "border-border bg-background";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">No hay productos marcados para pedir (amarillo)</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedItems).map(([brand, products]) => (
                <div key={brand} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        {brand}
                    </h3>
                    <div className="space-y-2">
                        {products.map(item => (
                            <Card key={item.id} className="overflow-hidden shadow-none border-muted/60">
                                <CardContent className="p-2 flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleColorStatus(item.id, item.color_status)}
                                        className={cn(
                                            "h-4 w-4 rounded border transition-colors cursor-pointer flex-shrink-0",
                                            getStatusColor(item.color_status)
                                        )}
                                        aria-label="Cambiar estado"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium truncate leading-tight">{item.name}</p>
                                            <div className="flex items-center gap-1.5 shrink-0 px-1.5 py-0.5 rounded">
                                                <Checkbox
                                                    id={`ordered-${item.id}`}
                                                    checked={item.is_ordered}
                                                    onCheckedChange={(checked) => handleToggleOrdered(item.id, !!checked)}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label
                                                    htmlFor={`ordered-${item.id}`}
                                                    className="text-[10px] font-semibold cursor-pointer uppercase tracking-tighter"
                                                >
                                                    Pedido
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] font-normal px-1 py-0 bg-background/50 h-4 min-h-0 border-muted">
                                                {item.shopping_lists?.name || 'Varios'}
                                            </Badge>
                                            {item.model && (
                                                <span className="text-[10px] text-muted-foreground truncate italic">
                                                    {item.model}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
