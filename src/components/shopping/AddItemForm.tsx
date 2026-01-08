import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useSavedProducts, SavedProduct } from '@/hooks/useSavedProducts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AddItemFormProps {
  onAddItem: (name: string, price: number, brand?: string, model?: string) => Promise<void>;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const { searchProducts, saveProduct, updateProduct, products } = useSavedProducts();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [suggestions, setSuggestions] = useState<SavedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictingProduct, setConflictingProduct] = useState<SavedProduct | null>(null);
  const [pendingAdd, setPendingAdd] = useState<{ name: string, price: number, brand?: string, model?: string } | null>(null);

  useEffect(() => {
    // Don't show suggestions if we just selected a product
    if (justSelected) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (name.trim().length >= 2) {
      const results = searchProducts(name);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [name, justSelected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (product: SavedProduct) => {
    setJustSelected(true);
    setName(product.name);
    if (product.default_price) {
      setPrice(product.default_price.toString());
    }
    if (product.brand) {
      setBrand(product.brand);
    }
    if (product.model) {
      setModel(product.model);
    }
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setBrand('');
    setModel('');
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseFloat(price) || 0;
    const finalName = name.trim();
    const finalBrand = brand.trim() || undefined;
    const finalModel = model.trim() || undefined;

    // 1. Añadir el artículo a la lista actual inmediatamente
    await onAddItem(finalName, priceNum, finalBrand, finalModel);

    // 2. Comprobar si ya existe en saved_products para decidir si guardar/actualizar/preguntar
    const existingProduct = products.find(p => p.name.toLowerCase() === finalName.toLowerCase());

    if (existingProduct) {
      // Comprobar si los detalles son diferentes
      const isDifferent =
        (existingProduct.brand || '') !== (finalBrand || '') ||
        (existingProduct.model || '') !== (finalModel || '') ||
        (existingProduct.default_price || 0) !== priceNum;

      if (isDifferent) {
        // Son diferentes -> Preguntar al usuario
        setConflictingProduct(existingProduct);
        setPendingAdd({ name: finalName, price: priceNum, brand: finalBrand, model: finalModel });
        setShowConfirmDialog(true);
        return; // No reseteamos el formulario todavía para que el usuario vea qué está guardando o resetear después? 
        // En realidad la acción de añadir a la lista ya se hizo.
      } else {
        // Son iguales -> No hace falta hacer nada, ya está guardado
      }
    } else {
      // No existe -> Guardar como nuevo automáticamente
      await saveProduct(finalName, priceNum, finalBrand, finalModel);
    }

    resetForm();
    inputRef.current?.focus();
  };

  const handleUpdateExisting = async () => {
    if (conflictingProduct && pendingAdd) {
      await updateProduct(
        conflictingProduct.id,
        pendingAdd.name,
        pendingAdd.price,
        pendingAdd.brand,
        pendingAdd.model
      );
      setShowConfirmDialog(false);
      resetForm();
      inputRef.current?.focus();
    }
  };

  const handleAddNew = async () => {
    if (pendingAdd) {
      await saveProduct(
        pendingAdd.name,
        pendingAdd.price,
        pendingAdd.brand,
        pendingAdd.model
      );
      setShowConfirmDialog(false);
      resetForm();
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 relative" ref={suggestionsRef}>
          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setJustSelected(false); // Reset flag when user types
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 && !justSelected) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding to allow click events on suggestions to trigger
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              tabIndex={1}
            />
          </div>

          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-20 overflow-hidden">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  onClick={() => selectSuggestion(product)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{product.name}</span>
                      {(product.brand || product.model) && (
                        <span className="text-xs text-muted-foreground block truncate">
                          {[product.brand, product.model].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>
                    {product.default_price && (
                      <span className="text-muted-foreground ml-2 shrink-0">
                        {product.default_price.toFixed(2)} €
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio"
            className="w-24"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            tabIndex={4}
          />

          <Button type="submit" size="icon" disabled={!name.trim()} tabIndex={5}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Marca (opcional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="flex-1"
            tabIndex={2}
          />
          <Input
            placeholder="Modelo (opcional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex-1"
            tabIndex={3}
          />
        </div>
      </form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Producto ya guardado</AlertDialogTitle>
            <AlertDialogDescription>
              Ya tienes un artículo llamado "{conflictingProduct?.name}" guardado con otros detalles.
              <br /><br />
              <strong>Guardado:</strong> {conflictingProduct?.brand} {conflictingProduct?.model} ({conflictingProduct?.default_price}€)
              <br />
              <strong>Nuevo:</strong> {pendingAdd?.brand} {pendingAdd?.model} ({pendingAdd?.price}€)
              <br /><br />
              ¿Qué quieres hacer con tu base de datos de artículos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleAddNew}
              className="bg-primary"
              autoFocus
            >
              Añadir como nuevo
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleUpdateExisting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Modificar el guardado
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => { setShowConfirmDialog(false); resetForm(); inputRef.current?.focus(); }}>
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
