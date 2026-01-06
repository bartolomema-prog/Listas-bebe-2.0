import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface PurchaseInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (info: { purchaser_name: string; purchaser_phone: string; purchase_date: string; is_picked_up: boolean; is_paid: boolean; amount_paid?: number }) => void;
  itemName: string;
}

export function PurchaseInfoDialog({ open, onOpenChange, onConfirm, itemName }: PurchaseInfoDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;

    onConfirm({
      purchaser_name: name.trim(),
      purchaser_phone: phone.trim(),
      purchase_date: new Date(dateTime).toISOString(),
      is_picked_up: isPickedUp,
      is_paid: isPaid,
      amount_paid: amountPaid ? parseFloat(amountPaid) : undefined,
    });

    setName('');
    setPhone('');
    setDateTime(() => {
      const now = new Date();
      return now.toISOString().slice(0, 16);
    });
    setIsPickedUp(false);
    setIsPaid(false);
    setAmountPaid('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Producto: <span className="font-medium text-foreground">{itemName}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="purchaser-name">Nombre del comprador (opcional)</Label>
            <Input
              id="purchaser-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaser-phone">Teléfono (opcional)</Label>
            <Input
              id="purchaser-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Número de teléfono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-datetime">Fecha y hora de compra</Label>
            <Input
              id="purchase-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-paid"
              checked={isPaid}
              onCheckedChange={(checked) => setIsPaid(checked as boolean)}
            />
            <Label htmlFor="is-paid" className="cursor-pointer font-medium">Pagado</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-paid">Entrega a cuenta (€)</Label>
            <Input
              id="amount-paid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-picked-up"
              checked={isPickedUp}
              onCheckedChange={(checked) => setIsPickedUp(checked as boolean)}
            />
            <Label htmlFor="is-picked-up" className="cursor-pointer">¿Producto recogido?</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Compra</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
