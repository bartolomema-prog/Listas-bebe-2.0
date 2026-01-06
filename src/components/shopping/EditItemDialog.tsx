
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface EditItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, price: number, brand?: string, model?: string, purchaserName?: string, purchaserPhone?: string, purchaseDate?: string, isPickedUp?: boolean, isPaid?: boolean, amountPaid?: number) => Promise<void>;
    initialData: {
        name: string;
        price: number;
        brand: string | null;
        model: string | null;
        purchaserName: string | null;
        purchaserPhone: string | null;
        purchaseDate: string | null;
        isPickedUp: boolean;
        isPurchased: boolean;
        isPaid: boolean;
        amountPaid: number | null;
    };
}

export function EditItemDialog({ open, onOpenChange, onSave, initialData }: EditItemDialogProps) {
    const [name, setName] = useState(initialData.name);
    const [price, setPrice] = useState(initialData.price.toString());
    const [brand, setBrand] = useState(initialData.brand || '');
    const [model, setModel] = useState(initialData.model || '');
    const [purchaserName, setPurchaserName] = useState(initialData.purchaserName || '');
    const [purchaserPhone, setPurchaserPhone] = useState(initialData.purchaserPhone || '');
    const [purchaseDate, setPurchaseDate] = useState(initialData.purchaseDate || '');
    const [isPickedUp, setIsPickedUp] = useState(initialData.isPickedUp);
    const [isPaid, setIsPaid] = useState(initialData.isPaid);
    const [amountPaid, setAmountPaid] = useState(initialData.amountPaid?.toString() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state when initialData changes or dialog opens
    useEffect(() => {
        if (open) {
            setName(initialData.name);
            setPrice(initialData.price.toString());
            setBrand(initialData.brand || '');
            setModel(initialData.model || '');
            setPurchaserName(initialData.purchaserName || '');
            setPurchaserPhone(initialData.purchaserPhone || '');
            setPurchaseDate(initialData.purchaseDate ? new Date(initialData.purchaseDate).toISOString().slice(0, 16) : '');
            setIsPickedUp(initialData.isPickedUp);
            setIsPaid(initialData.isPaid);
            setAmountPaid(initialData.amountPaid?.toString() || '');
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await onSave(
                name.trim(),
                parseFloat(price) || 0,
                brand.trim() || undefined,
                model.trim() || undefined,
                purchaserName.trim() || undefined,
                purchaserPhone.trim() || undefined,
                purchaseDate || undefined,
                isPickedUp,
                isPaid,
                amountPaid ? parseFloat(amountPaid) : undefined
            );
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Producto</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del producto aquí. Haz clic en guardar cuando termines.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-price" className="text-right">
                            Precio (€)
                        </Label>
                        <Input
                            id="edit-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-brand" className="text-right">
                            Marca
                        </Label>
                        <Input
                            id="edit-brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="col-span-3"
                            placeholder="Opcional"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-model" className="text-right">
                            Modelo
                        </Label>
                        <Input
                            id="edit-model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="col-span-3"
                            placeholder="Opcional"
                        />
                    </div>

                    {initialData.isPurchased && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-4">Datos del comprador</h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-purchaser-name" className="text-right">
                                        Comprador
                                    </Label>
                                    <Input
                                        id="edit-purchaser-name"
                                        value={purchaserName}
                                        onChange={(e) => setPurchaserName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Nombre del comprador"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-purchaser-phone" className="text-right">
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="edit-purchaser-phone"
                                        value={purchaserPhone}
                                        onChange={(e) => setPurchaserPhone(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Teléfono (opcional)"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-purchase-date" className="text-right">
                                        Fecha
                                    </Label>
                                    <Input
                                        id="edit-purchase-date"
                                        type="datetime-local"
                                        value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit-paid"
                                        checked={isPaid}
                                        onChange={(e) => setIsPaid(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="edit-paid">
                                        Pagado
                                    </Label>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-amount-paid" className="text-right">
                                        Entrega a cuenta (€)
                                    </Label>
                                    <Input
                                        id="edit-amount-paid"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        className="col-span-3"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit-picked-up"
                                        checked={isPickedUp}
                                        onChange={(e) => setIsPickedUp(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="edit-picked-up">
                                        ¿Producto recogido?
                                    </Label>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !name.trim()}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
