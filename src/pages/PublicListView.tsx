import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
// PublicListView: Optimized for color_status and h-2 squares
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ShoppingBasket, Loader2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
interface PublicList {
  id: string;
  name: string | null;
  baby_name: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  share_code: string;
}
interface PublicListItem {
  id: string;
  list_id: string;
  name: string;
  price: number;
  is_purchased: boolean;
  is_reserved: boolean;
  is_green_checked: boolean;
  color_status: number;
}
const getStatusInfo = (item: PublicListItem) => {
  const status = item.color_status ?? (item.is_green_checked ? 1 : (item.is_reserved ? 2 : 0));

  switch (Number(status)) {
    case 1: return { color: "#22c55e", label: "Green" };
    case 2: return { color: "#eab308", label: "Yellow" };
    case 3: return { color: "#ef4444", label: "Red" };
    default: return { color: "transparent", label: "None" };
  }
};

export default function PublicListView() {
  const {
    code
  } = useParams<{
    code: string;
  }>();
  const navigate = useNavigate();
  const [list, setList] = useState<PublicList | null>(null);
  const [items, setItems] = useState<PublicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublicListItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleItemClick = (item: PublicListItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };
  useEffect(() => {
    const fetchList = async () => {
      if (!code) {
        setError('Código no proporcionado');
        setLoading(false);
        return;
      }

      // Fetch list by code
      const {
        data: listData,
        error: listError
      } = await supabase.rpc('get_list_by_code', {
        _code: code
      });
      if (listError || !listData || listData.length === 0) {
        setError('Lista no encontrada. Verifica el código.');
        setLoading(false);
        return;
      }
      setList(listData[0] as PublicList);

      // Fetch items
      const {
        data: itemsData,
        error: itemsError
      } = await supabase.rpc('get_list_items_by_code', {
        _code: code
      });
      if (!itemsError && itemsData) {
        if (itemsData.length > 0) {
          console.log('DEBUG - Campos disponibles:', Object.keys(itemsData[0]));
          console.log('DEBUG - Primer item:', itemsData[0]);
        }
        setItems(itemsData as any as PublicListItem[]);
      } else if (itemsError) {
        console.error('Error fetching public items:', itemsError);
      }
      setLoading(false);
    };
    fetchList();
  }, [code]);
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }
  if (error || !list) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <ShoppingBasket className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h1 className="text-xl font-semibold mb-2">Lista no encontrada</h1>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={() => navigate('/')}>Volver al inicio</Button>
    </div>;
  }
  const displayName = list.baby_name || list.name || 'Lista sin nombre';
  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);
  const total = pendingItems.reduce((sum, item) => sum + Number(item.price), 0);
  const purchasedTotal = purchasedItems.reduce((sum, item) => sum + Number(item.price), 0);
  return <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/')} title="Volver al inicio">
          <Home className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-semibold truncate">👶 {displayName}</h1>
        </div>
      </div>
    </header>

    {/* Baby Info Card */}
    {(list.father_name || list.mother_name) && <div className="container mx-auto px-4 pt-4 max-w-2xl">
      <Card className="bg-muted/50">
        <CardContent className="py-3 flex flex-wrap gap-4 text-sm">
          {list.father_name && <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span><strong>Papá:</strong> {list.father_name}</span>
          </div>}
          {list.mother_name && <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span><strong>Mamá:</strong> {list.mother_name}</span>
          </div>}
        </CardContent>
      </Card>
    </div>}

    <main className="container mx-auto px-4 py-6 max-w-2xl shadow-none opacity-100">
      style={{
    backgroundImage: 'url("public/corazones.png")', // Cambia por el nombre de tu archivo
    backgroundSize: 'cover',                 // Cubre toda la pantalla
    backgroundPosition: 'center',            // Centra la imagen
    backgroundAttachment: 'fixed',           // El fondo se queda quieto al hacer scroll
    backgroundRepeat: 'no-repeat'
  }}
      {items.length === 0 ? <div className="text-center py-12">
        <ShoppingBasket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">No hay productos en esta lista</p>
      </div> : <div className="space-y-6">
        {/* Pending Items */}
        {pendingItems.length > 0 && <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Sin reservar ({pendingItems.length})
            </h2>

          </div>
          <div className="space-y-1">
            {pendingItems.map(item => {
              const info = getStatusInfo(item);
              return (
                <Card
                  key={item.id}
                  className="animate-fade-in hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded border flex-shrink-0"
                      style={{ backgroundColor: info.color, borderColor: info.color === 'transparent' ? undefined : info.color }}
                    />
                    <span className="font-medium flex-1 text-sm">{item.name}</span>
                    <span className="text-muted-foreground text-sm font-medium">{Number(item.price).toFixed(2)} €</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>}

        {/* Purchased Items */}
        {purchasedItems.length > 0 && <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Reservados ({purchasedItems.length})
            </h2>

          </div>
          <div className="space-y-1">
            {purchasedItems.map(item => {
              const info = getStatusInfo(item);
              return (
                <Card
                  key={item.id}
                  className="opacity-60 animate-fade-in hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded border flex-shrink-0"
                      style={{ backgroundColor: info.color, borderColor: info.color === 'transparent' ? undefined : info.color }}
                    />
                    <span className="font-medium line-through text-muted-foreground flex-1 text-sm">{item.name}</span>
                    <span className="text-muted-foreground line-through text-sm font-medium">{Number(item.price).toFixed(2)} €</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>}

        {/* Color Legend */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Leyenda de colores</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded border border-green-500 bg-green-500 flex-shrink-0" />
                <span>Disponible en tienda</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded border border-yellow-500 bg-yellow-500 flex-shrink-0" />
                <span>Pedido, esperando recibir</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded border border-red-500 bg-red-500 flex-shrink-0" />
                <span>Solo bajo pedido</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>}
    </main>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left pr-6">Detalles del Producto</DialogTitle>
          <DialogDescription className="text-left">
            Viendo información completa del artículo.
          </DialogDescription>
        </DialogHeader>
        {selectedItem && (
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</h4>
              <p className="text-base font-medium break-words leading-relaxed">{selectedItem.name}</p>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio</h4>
                <p className="text-2xl font-bold text-primary">{Number(selectedItem.price).toFixed(2)} €</p>
              </div>
              <div className="text-right space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</h4>
                <div className="flex items-center gap-2 justify-end">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getStatusInfo(selectedItem).color }}
                  />
                  <span className="text-sm font-medium">
                    {selectedItem.is_purchased ? 'Reservado' : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button onClick={() => setIsDialogOpen(false)} variant="secondary" className="w-full sm:w-auto">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <footer className="py-8 text-center text-[10px] text-muted-foreground/30">
      v1.0.7
    </footer>
  </div>;
}