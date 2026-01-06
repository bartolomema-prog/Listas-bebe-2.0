import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateListData } from '@/hooks/useShoppingLists';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateList: (data: CreateListData) => Promise<unknown>;
}

export function CreateListDialog({ open, onOpenChange, onCreateList }: CreateListDialogProps) {
  const [babyName, setBabyName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim()) return;
    
    setIsLoading(true);
    await onCreateList({
      babyName: babyName.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      phone: phone.trim(),
    });
    setIsLoading(false);
    setBabyName('');
    setFatherName('');
    setMotherName('');
    setPhone('');
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setBabyName('');
      setFatherName('');
      setMotherName('');
      setPhone('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Lista de Bebé</DialogTitle>
          <DialogDescription>
            Crea una nueva lista de compras para tu bebé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="baby-name">Nombre del Bebé *</Label>
              <Input
                id="baby-name"
                placeholder="Ej: Lucía"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father-name">Nombre del Papá</Label>
              <Input
                id="father-name"
                placeholder="Ej: Carlos"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother-name">Nombre de la Mamá</Label>
              <Input
                id="mother-name"
                placeholder="Ej: María"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 612 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!babyName.trim() || isLoading}>
              Crear Lista
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
