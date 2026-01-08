import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingLists, ShoppingList } from '@/hooks/useShoppingLists';
import { Header } from '@/components/shopping/Header';
import { ListCard } from '@/components/shopping/ListCard';
import { CreateListDialog } from '@/components/shopping/CreateListDialog';
import { ListView } from '@/components/shopping/ListView';
import { CodeAccessForm } from '@/components/shopping/CodeAccessForm';
import { ProductsManager } from '@/components/shopping/ProductsManager';
import { OrderManager } from '@/components/shopping/OrderManager';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingBag, Loader2, LogIn, Package, Download, Archive, Search, X, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import logoKitaYPon from '@/assets/logo-kita-y-pon.png';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lists, loading: listsLoading, createList, deleteList, toggleArchiveList } = useShoppingLists();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [listSearchQuery, setListSearchQuery] = useState('');

  const filteredLists = useMemo(() => {
    if (!listSearchQuery.trim()) return lists;
    const query = listSearchQuery.toLowerCase().trim();
    return lists.filter(list =>
      (list.baby_name && list.baby_name.toLowerCase().includes(query)) ||
      (list.name && list.name.toLowerCase().includes(query)) ||
      (list.father_name && list.father_name.toLowerCase().includes(query)) ||
      (list.mother_name && list.mother_name.toLowerCase().includes(query)) ||
      (list.phone && list.phone.includes(query))
    );
  }, [lists, listSearchQuery]);

  // If user is logged in and viewing a list
  if (selectedList) {
    return (
      <ListView
        list={selectedList}
        onBack={() => setSelectedList(null)}
      />
    );
  }

  // If user is logged in, show tabs with lists and products
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {/* List Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lista (bebé, padres, teléfono)..."
              value={listSearchQuery}
              onChange={(e) => setListSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {listSearchQuery && (
              <button
                onClick={() => setListSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Tabs defaultValue="listas" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="listas" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Listas
              </TabsTrigger>
              <TabsTrigger value="archivadas" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivadas
              </TabsTrigger>
              <TabsTrigger value="pedir" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedir
              </TabsTrigger>
              <TabsTrigger value="articulos" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Artículos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listas">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Tus Listas</h2>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Lista
                </Button>
              </div>

              {listsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLists.filter(l => !l.is_archived).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No se encontraron listas con ese nombre</p>
                  <Button variant="link" onClick={() => setListSearchQuery('')} className="mt-2 text-primary">
                    Ver todas las listas
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {filteredLists.filter(l => !l.is_archived).map(list => (
                      <ListCard
                        key={list.id}
                        list={list}
                        onSelect={setSelectedList}
                        onDelete={deleteList}
                        onArchive={toggleArchiveList}
                      />
                    ))}
                  </div>
                  <CodeAccessForm />

                  <div className="pt-8 border-t mt-8">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto flex items-center gap-2 mx-auto"
                      onClick={async () => {
                        try {
                          const { data: allLists, error: listsError } = await supabase
                            .from('shopping_lists')
                            .select('*')
                            .eq('owner_id', user.id);

                          if (listsError) throw listsError;

                          const listIds = allLists.map(l => l.id);
                          if (listIds.length === 0) {
                            toast({ title: "Sin datos", description: "No hay listas para exportar" });
                            return;
                          }

                          const { data: allItems, error: itemsError } = await supabase
                            .from('list_items')
                            .select('*')
                            .in('list_id', listIds);

                          if (itemsError) throw itemsError;

                          // Format CSV
                          const headers = [
                            'Lista',
                            'Producto',
                            'Precio',
                            'Marca',
                            'Modelo',
                            'Estado',
                            'Comprador',
                            'Teléfono Comprador',
                            'Fecha Compra',
                            'Recogido',
                            'Pagado',
                            'Cantidad Pagada',
                            'Reservado',
                            'Visto (Verde)',
                            'Color Estado',
                            'Fecha Creación'
                          ];

                          const rows = allItems.map((item: any) => {
                            const list = allLists.find(l => l.id === item.list_id);
                            const status = item.is_purchased ? 'Comprado' : 'Pendiente';
                            const pickedUp = item.is_picked_up ? 'Sí' : 'No';
                            const paid = item.is_paid ? 'Sí' : 'No';
                            const reserved = item.is_reserved ? 'Sí' : 'No';
                            const greenChecked = item.is_green_checked ? 'Sí' : 'No';

                            // Map color status to text
                            let colorText = 'Blanco';
                            if (item.color_status === 1) colorText = 'Verde';
                            if (item.color_status === 2) colorText = 'Amarillo';
                            if (item.color_status === 3) colorText = 'Rojo';

                            return [
                              `"${list?.name || 'Desconocida'}"`,
                              `"${item.name}"`,
                              item.price,
                              `"${item.brand || ''}"`,
                              `"${item.model || ''}"`,
                              status,
                              `"${item.purchaser_name || ''}"`,
                              `"${item.purchaser_phone || ''}"`,
                              `"${item.purchase_date || ''}"`,
                              pickedUp,
                              paid,
                              item.amount_paid || 0,
                              reserved,
                              greenChecked,
                              colorText,
                              `"${item.created_at || ''}"`
                            ].join(',');
                          });

                          const csvContent = [headers.join(','), ...rows].join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.setAttribute('href', url);
                          link.setAttribute('download', `backup_listas_bebe_${new Date().toISOString().slice(0, 10)}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          toast({ title: "Éxito", description: "Copia de seguridad descargada" });
                        } catch (e: any) {
                          console.error(e);
                          toast({
                            title: "Error",
                            description: `No se pudo generar la copia: ${e.message || 'Error desconocido'}`,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Descargar Copia de Seguridad
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="archivadas">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Listas Archivadas</h2>
              </div>

              {listsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLists.filter(l => l.is_archived).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No se encontraron listas archivadas</p>
                  {listSearchQuery && (
                    <Button variant="link" onClick={() => setListSearchQuery('')} className="mt-2 text-primary">
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLists.filter(l => l.is_archived).map(list => (
                    <ListCard
                      key={list.id}
                      list={list}
                      onSelect={setSelectedList}
                      onDelete={deleteList}
                      onArchive={toggleArchiveList}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pedir">
              <OrderManager />
            </TabsContent>

            <TabsContent value="articulos">
              <ProductsManager />
            </TabsContent>
          </Tabs>
        </main>

        <CreateListDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateList={createList}
        />
      </div>
    );
  }

  // Public landing page - show title, code form, and login button
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with login button */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-2xl items-center justify-end px-4">
          <Button variant="outline" onClick={() => navigate('/auth')}>
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <img
            src={logoKitaYPon}
            alt="Logo de Kita y Pon"
            className="mx-auto mb-6 h-32 w-auto"
          />
          <h1 className="text-3xl font-bold font-display mb-2">Lista de bebé</h1>
          <p className="text-muted-foreground">
            Introduce el código para ver una lista compartida
          </p>
        </div>

        {/* Code access form */}
        <CodeAccessForm />
      </main>
    </div>
  );
}
