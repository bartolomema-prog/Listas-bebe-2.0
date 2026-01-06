import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingLists, ShoppingList } from '@/hooks/useShoppingLists';
import { Header } from '@/components/shopping/Header';
import { ListCard } from '@/components/shopping/ListCard';
import { CreateListDialog } from '@/components/shopping/CreateListDialog';
import { ListView } from '@/components/shopping/ListView';
import { CodeAccessForm } from '@/components/shopping/CodeAccessForm';
import { ProductsManager } from '@/components/shopping/ProductsManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingBag, Loader2, LogIn, Package, Download, Archive } from 'lucide-react';
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
          <Tabs defaultValue="listas" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="listas" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Listas
              </TabsTrigger>
              <TabsTrigger value="archivadas" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivadas
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
              ) : lists.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No tienes listas todavía</h3>
                    <p className="text-muted-foreground mb-4">
                      Crea tu primera lista de compras para empezar
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Lista
                    </Button>
                  </div>
                  <CodeAccessForm />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {lists.filter(l => !l.is_archived).map(list => (
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
                          const headers = ['Lista', 'Producto', 'Precio', 'Marca', 'Modelo', 'Estado', 'Comprador', 'Teléfono Comprador', 'Fecha Compra', 'Recogido'];
                          const rows = allItems.map(item => {
                            const list = allLists.find(l => l.id === item.list_id);
                            const status = item.is_purchased ? 'Comprado' : 'Pendiente';
                            const pickedUp = item.is_picked_up ? 'Sí' : 'No';

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
                              pickedUp
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
              ) : lists.filter(l => l.is_archived).length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No hay listas archivadas</h3>
                  <p className="text-muted-foreground">
                    Las listas que archives aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lists.filter(l => l.is_archived).map(list => (
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
