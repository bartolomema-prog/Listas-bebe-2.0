import { ShoppingList } from '@/hooks/useShoppingLists';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Pencil, MoreVertical, Copy, Check, Archive, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ListCardProps {
  list: ShoppingList;
  onSelect: (list: ShoppingList) => void;
  onEdit: (list: ShoppingList) => void;
  onArchive?: (listId: string, isArchived: boolean) => void;
}

export function ListCard({ list, onSelect, onEdit, onArchive }: ListCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(list.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  const displayName = list.baby_name || list.name || 'Lista sin nombre';
  const parentInfo = [list.father_name, list.mother_name].filter(Boolean).join(' y ');

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(list.share_code);
    setCopied(true);
    toast({ title: 'Código copiado', description: list.share_code });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
      onClick={() => onSelect(list)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">👶 {displayName}</h3>
          {parentInfo && (
            <p className="text-sm text-muted-foreground truncate">Padres: {parentInfo}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground/70">{formattedDate}</span>
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{list.share_code}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={copyCode}
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(list.id, !list.is_archived);
                  }}
                >
                  {list.is_archived ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Desarchivar
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(list);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
