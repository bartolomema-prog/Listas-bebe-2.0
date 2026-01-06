import { useState, useMemo } from 'react';
import { useSavedProducts, SavedProduct } from '@/hooks/useSavedProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsManager() {
  const { products, loading, saveProduct, deleteProduct, updateProduct } = useSavedProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SavedProduct | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.model && p.model.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormBrand('');
    setFormModel('');
  };

  const openAddDialog = () => {
    resetForm();
    setEditingProduct(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (product: SavedProduct) => {
    setFormName(product.name);
    setFormPrice(product.default_price?.toString() || '');
    setFormBrand(product.brand || '');
    setFormModel(product.model || '');
    setEditingProduct(product);
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const priceNum = parseFloat(formPrice) || 0;

    if (editingProduct) {
      await updateProduct(editingProduct.id, formName.trim(), priceNum, formBrand.trim() || undefined, formModel.trim() || undefined);
      toast.success('Artículo actualizado');
    } else {
      await saveProduct(formName.trim(), priceNum, formBrand.trim() || undefined, formModel.trim() || undefined);
      toast.success('Artículo añadido');
    }

    setShowAddDialog(false);
    resetForm();
  };

  const handleDelete = async (product: SavedProduct) => {
    if (confirm(`¿Eliminar "${product.name}"?`)) {
      await deleteProduct(product.id);
      toast.success('Artículo eliminado');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir
        </Button>
      </div>

      {/* Products list */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No hay artículos guardados</h3>
          <p className="text-muted-foreground mb-4">
            Los artículos que añadas a tus listas se guardarán aquí
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Primer Artículo
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontraron artículos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  {(product.brand || product.model) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {[product.brand, product.model].filter(Boolean).join(' - ')}
                    </p>
                  )}
                </div>
                {product.default_price !== null && product.default_price > 0 && (
                  <span className="text-sm font-medium shrink-0">
                    {product.default_price.toFixed(2)} €
                  </span>
                )}
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre del artículo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                placeholder="Marca (opcional)"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                placeholder="Modelo (opcional)"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? 'Guardar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
