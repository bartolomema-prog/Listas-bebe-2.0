import { useState, useEffect } from 'react';
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
import { ShoppingList, CreateListData } from '@/hooks/useShoppingLists';

interface EditListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    list: ShoppingList | null;
    onUpdateList: (listId: string, data: CreateListData) => Promise<boolean>;
}

export function EditListDialog({ open, onOpenChange, list, onUpdateList }: EditListDialogProps) {
    const [babyName, setBabyName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [motherName, setMotherName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (list && open) {
            setBabyName(list.baby_name || '');
            setFatherName(list.father_name || '');
            setMotherName(list.mother_name || '');
            setPhone(list.phone || '');
        }
    }, [list, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!babyName.trim() || !list) return;

        setIsLoading(true);
        const success = await onUpdateList(list.id, {
            babyName: babyName.trim(),
            fatherName: fatherName.trim(),
            motherName: motherName.trim(),
            phone: phone.trim(),
        });
        setIsLoading(false);

        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Lista</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la lista.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-baby-name">Nombre del Bebé *</Label>
                            <Input
                                id="edit-baby-name"
                                placeholder="Ej: Lucía"
                                value={babyName}
                                onChange={(e) => setBabyName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-father-name">Nombre del Papá</Label>
                            <Input
                                id="edit-father-name"
                                placeholder="Ej: Carlos"
                                value={fatherName}
                                onChange={(e) => setFatherName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-mother-name">Nombre de la Mamá</Label>
                            <Input
                                id="edit-mother-name"
                                placeholder="Ej: María"
                                value={motherName}
                                onChange={(e) => setMotherName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Teléfono</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                placeholder="Ej: 612 345 678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!babyName.trim() || isLoading}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
