import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useSavedProducts, SavedProduct } from '@/hooks/useSavedProducts';

interface AddItemFormProps {
  onAddItem: (name: string, price: number, brand?: string, model?: string) => Promise<void>;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const { searchProducts, saveProduct } = useSavedProducts();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseFloat(price) || 0;
    await onAddItem(name.trim(), priceNum, brand.trim() || undefined, model.trim() || undefined);

    // Save to product database for future autocomplete
    saveProduct(name.trim(), priceNum, brand.trim() || undefined, model.trim() || undefined);

    setName('');
    setPrice('');
    setBrand('');
    setModel('');
    setShowSuggestions(false);
  };

  return (
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
  );
}
