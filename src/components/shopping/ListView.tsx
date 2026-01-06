import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingList, useListItems } from '@/hooks/useShoppingLists';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShoppingBasket, Loader2, Phone, User, Search, CheckSquare, X } from 'lucide-react';
import { AddItemForm } from './AddItemForm';
import { ListItemRow } from './ListItemRow';
import { PurchaseInfoDialog } from './PurchaseInfoDialog';
import { PurchaserInfo } from '@/hooks/useShoppingLists';

interface ListViewProps {
  list: ShoppingList;
  onBack: () => void;
}

export function ListView({ list, onBack }: ListViewProps) {
  const { user } = useAuth();
  const { items, loading, addItem, updateItem, togglePurchased, toggleReserved, toggleColorStatus, bulkTogglePurchased, deleteItem, total, purchasedTotal } = useListItems(list.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkPurchaseDialog, setShowBulkPurchaseDialog] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.purchaser_name && item.purchaser_name.toLowerCase().includes(query)) ||
      (item.purchaser_phone && item.purchaser_phone.includes(query))
    );
  }, [items, searchQuery]);

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkPurchaseConfirm = async (info: PurchaserInfo) => {
    const success = await bulkTogglePurchased(selectedIds, true, info);
    if (success) {
      setSelectedIds([]);
      setShowBulkPurchaseDialog(false);
    }
  };

  const pendingItems = filteredItems.filter(item => !item.is_purchased);
  const purchasedItems = filteredItems
    .filter(item => item.is_purchased)
    .sort((a, b) => {
      // Sort order: unpaid first, then paid but not picked up, then picked up
      // Priority: 1 = unpaid, 2 = paid but not picked up, 3 = picked up
      const getPriority = (item: typeof a) => {
        if (!item.is_paid) return 1; // Unpaid (yellow)
        if (!item.is_picked_up) return 2; // Paid but not picked up (gray/strikethrough)
        return 3; // Picked up (red)
      };

      return getPriority(a) - getPriority(b);
    });

  // Calculate totals
  const pendingTotal = pendingItems.reduce((sum, item) => sum + Number(item.price), 0);

  const displayName = list.baby_name || list.name || 'Lista sin nombre';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-display font-semibold truncate">👶 {displayName}</h1>
              {(list.father_name || list.mother_name || list.phone) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  {list.father_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Papá: {list.father_name}
                    </span>
                  )}
                  {list.mother_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Mamá: {list.mother_name}
                    </span>
                  )}
                  {list.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {list.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="gap-2 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpiar ({selectedIds.length})</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Add Item Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <AddItemForm onAddItem={addItem} />
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, comprador o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBasket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay productos en esta lista</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Añade productos usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Sin reservar ({pendingItems.length})
                  </h2>
                  <span className="text-sm font-semibold">
                    {pendingTotal.toFixed(2)} €
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingItems.map(item => (
                    <ListItemRow
                      key={item.id}
                      item={item}
                      onToggle={togglePurchased}
                      onToggleReserved={toggleReserved}
                      onToggleColorStatus={toggleColorStatus}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                      isBulkMode={true}
                      isSelected={selectedIds.includes(item.id)}
                      onSelect={(selected) => handleSelect(item.id, selected)}
                    />
                  ))}
                </div>
              </div>
            )}


            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Reservados ({purchasedItems.length})
                  </h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {purchasedTotal.toFixed(2)} €
                  </span>
                </div>
                <div className="space-y-2">
                  {purchasedItems.map(item => (
                    <ListItemRow
                      key={item.id}
                      item={item}
                      onToggle={togglePurchased}
                      onToggleReserved={toggleReserved}
                      onToggleColorStatus={toggleColorStatus}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                      isBulkMode={false}
                      isSelected={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Total Summary */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de la lista</span>
                  <span className="text-xl font-bold">
                    {(pendingTotal + purchasedTotal).toFixed(2)} €
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 px-4 py-3 min-w-[300px]">
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">Listos para reservar</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds([])} className="h-9">
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                  <Button size="sm" onClick={() => setShowBulkPurchaseDialog(true)} className="h-9 shadow-lg shadow-primary/20">
                    <CheckSquare className="h-4 w-4 mr-1.5" />
                    Reservar ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PurchaseInfoDialog
        open={showBulkPurchaseDialog}
        onOpenChange={setShowBulkPurchaseDialog}
        onConfirm={handleBulkPurchaseConfirm}
        itemName={`${selectedIds.length} productos seleccionados`}
      />
    </div>
  );
}
