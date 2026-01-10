import { useState } from 'react';
import { ListItem, PurchaserInfo } from '@/hooks/useShoppingLists';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PurchaseInfoDialog } from './PurchaseInfoDialog';
import { EditItemDialog } from './EditItemDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ListItemRowProps {
  item: ListItem;
  onToggle: (itemId: string, isPurchased: boolean, purchaserInfo?: PurchaserInfo) => void;
  onToggleReserved: (itemId: string, isReserved: boolean, purchaserInfo?: PurchaserInfo) => void;
  onToggleColorStatus: (itemId: string, newStatus: number) => void;
  onUpdate: (itemId: string, data: { name: string, price: number, brand?: string, model?: string, purchaser_name?: string | null, purchaser_phone?: string | null, purchase_date?: string | null, is_picked_up?: boolean, is_reserved?: boolean, is_paid?: boolean, amount_paid?: number | null }) => Promise<void>;
  onDelete: (itemId: string) => void;
  showPrivateInfo?: boolean;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function ListItemRow({
  item,
  onToggle,
  onToggleReserved,
  onToggleColorStatus,
  onUpdate,
  onDelete,
  showPrivateInfo = true,
  isBulkMode = false,
  isSelected = false,
  onSelect
}: ListItemRowProps) {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const hasBrandOrModel = item.brand || item.model;
  const hasPurchaserInfo = item.purchaser_name || item.purchaser_phone || item.purchase_date;

  const handlePurchaseClick = (checked: boolean) => {
    if (isBulkMode && onSelect) {
      onSelect(checked);
      return;
    }

    if (checked) {
      setShowPurchaseDialog(true);
    } else {
      onToggle(item.id, false);
    }
  };

  const handlePurchaseConfirm = (info: PurchaserInfo) => {
    // Simplified: Just toggle purchased with the info
    onToggle(item.id, true, info);
    setShowPurchaseDialog(false);
  };

  const handleStatusClick = () => {
    // Cycle through 4 states: 0 (white) -> 2 (yellow) -> 1 (green) -> 3 (red) -> 0
    const currentStatus = item.color_status || 0;
    let nextStatus = 0;
    if (currentStatus === 0) nextStatus = 2;
    else if (currentStatus === 2) nextStatus = 1;
    else if (currentStatus === 1) nextStatus = 3;
    else nextStatus = 0;

    onToggleColorStatus(item.id, nextStatus);
  };

  const getStatusColor = () => {
    const status = item.color_status || 0;
    switch (status) {
      case 1: return "border-green-500 bg-green-500"; // green
      case 2: return "border-yellow-500 bg-yellow-500"; // yellow
      case 3: return "border-red-500 bg-red-500"; // red
      default: return "border-border bg-background"; // white
    }
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-start gap-3 p-3 rounded-lg border transition-all animate-slide-in",
          item.is_purchased
            ? "bg-muted/50 border-muted"
            : "bg-card hover:shadow-sm hover:border-primary/20"
        )}
      >
        {/* Simple status toggle - visual only */}
        <button
          onClick={handleStatusClick}
          className={cn(
            "h-5 w-5 mt-0.5 rounded border-2 transition-colors cursor-pointer flex-shrink-0",
            getStatusColor()
          )}
          aria-label="Cambiar estado"
        />

        {/* Separator */}
        <div className="w-px h-6 bg-border mt-0.5 flex-shrink-0" />

        {/* Purchased checkbox */}
        <Checkbox
          checked={isBulkMode ? isSelected : item.is_purchased}
          onCheckedChange={(checked) => handlePurchaseClick(checked as boolean)}
          className={cn(
            "h-5 w-5 mt-0.5 transition-all duration-300",
            isBulkMode && isSelected && "ring-2 ring-primary ring-offset-2"
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-x-3">
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "block break-words text-sm transition-all",
                  item.is_purchased && item.is_paid && !item.is_picked_up && "line-through text-muted-foreground",
                  item.is_purchased && !item.is_paid && "text-yellow-600 font-medium",
                  item.is_purchased && item.is_picked_up && "text-red-600 font-medium"
                )}
              >
                {item.name}
              </span>
              {showPrivateInfo && hasBrandOrModel && (
                <span className="text-xs text-muted-foreground block">
                  {[item.brand, item.model].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 md:mt-0 md:ml-auto gap-3 shrink-0">
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  item.is_purchased ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {Number(item.price).toFixed(2)} €
              </span>

              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-7 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary mt-0.5"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-7 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará el producto "{item.name}" de la lista permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {showPrivateInfo && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.is_purchased && !item.is_paid && (
                <span className="text-[10px] uppercase font-bold tracking-tight bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200 shadow-sm">
                  sin pagar
                </span>
              )}
              {item.is_purchased && item.is_picked_up && (
                <span className="text-[10px] uppercase font-bold tracking-tight bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200 shadow-sm">
                  recogido
                </span>
              )}
              {item.amount_paid !== null && item.amount_paid > 0 && (
                <span className="text-[10px] uppercase font-bold tracking-tight bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200 shadow-sm">
                  A cuenta: {Number(item.amount_paid).toFixed(2)} €
                </span>
              )}
            </div>
          )}
          {showPrivateInfo && hasPurchaserInfo && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium">Comprador:</span>{' '}
              {[
                item.purchaser_name,
                item.purchaser_phone,
                item.purchase_date && new Date(item.purchase_date).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
              ].filter(Boolean).join(' - ')}
            </p>
          )}
        </div>

      </div>

      <PurchaseInfoDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onConfirm={handlePurchaseConfirm}
        itemName={item.name}
      />

      <EditItemDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={(name, price, brand, model, purchaserName, purchaserPhone, purchaseDate, isPickedUp, isPaid, amountPaid) =>
          onUpdate(item.id, {
            name,
            price,
            brand: brand || undefined,
            model: model || undefined,
            purchaser_name: purchaserName || null,
            purchaser_phone: purchaserPhone || null,
            purchase_date: purchaseDate || null,
            is_picked_up: isPickedUp,
            is_paid: isPaid,
            amount_paid: amountPaid
          })
        }
        initialData={{
          name: item.name,
          price: item.price,
          brand: item.brand,
          model: item.model,
          purchaserName: item.purchaser_name,
          purchaserPhone: item.purchaser_phone,
          purchaseDate: item.purchase_date,
          isPickedUp: item.is_picked_up,
          isPurchased: item.is_purchased,
          isPaid: item.is_paid || false,
          amountPaid: item.amount_paid
        }}
      />
    </>
  );
}
